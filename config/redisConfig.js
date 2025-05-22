const redis = require("redis");
const logger = require("../utils/logger");

// Flag to track Redis availability
let redisAvailable = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
let reconnectTimer = null;

const localCache = new Map();

const createClient = async () => {
  const client = redis.createClient({
    url: `redis://${
      process.env.REDIS_PASSWORD ? `:${process.env.REDIS_PASSWORD}@` : ""
    }${process.env.REDIS_HOST || "localhost"}:${
      process.env.REDIS_PORT || 6379
    }/${process.env.REDIS_DB || 0}`,
    socket: {
      reconnectStrategy: (retries) => {
        reconnectAttempts = retries;
        if (retries > MAX_RECONNECT_ATTEMPTS) {
          redisAvailable = false;
          logger.warn(
            `Redis unavailable after ${MAX_RECONNECT_ATTEMPTS} attempts, using local cache fallback`
          );
          return false; // Stop reconnecting but don't throw error
        }
        return Math.min(retries * 100, 3000);
      },
    },
  });

  // Register event handlers
  client.on("connect", () => {
    logger.info("Redis connection established");
  });

  client.on("ready", () => {
    redisAvailable = true;
    reconnectAttempts = 0;
    logger.info("Redis client is ready to use");

    // Clear any scheduled reconnection attempt
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  });

  client.on("error", (err) => {
    if (redisAvailable) {
      logger.error(`Redis error: ${err.message}`, { error: err });
    }
    redisAvailable = false;
  });

  client.on("reconnecting", () => {
    logger.info("Redis client is reconnecting");
  });

  client.on("end", () => {
    redisAvailable = false;
    logger.info("Redis connection closed");

    // Schedule a reconnection attempt if not already scheduled
    if (!reconnectTimer && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      reconnectTimer = setTimeout(async () => {
        logger.info("Attempting to reconnect to Redis...");
        reconnectTimer = null;
        try {
          await client.connect();
        } catch (err) {
          logger.error(`Failed to reconnect to Redis: ${err.message}`);
        }
      }, 5000); // Try to reconnect after 5 seconds
    }
  });

  // Connect to Redis
  try {
    await client.connect();
    redisAvailable = true;
  } catch (err) {
    redisAvailable = false;
    logger.warn(
      `Failed to connect to Redis: ${err.message}. Using local cache fallback.`
    );
    // Don't throw error - allow application to continue
  }

  return client;
};

// Init client variable to be populated after connection
let clientPromise = createClient().catch((err) => {
  logger.warn(
    `Initial Redis connection failed: ${err.message}. Using local cache fallback.`
  );
  redisAvailable = false;
  return null; // Return null instead of throwing
});

// Set a local cache entry with optional expiration
const setLocalCache = (key, value, expiry = null) => {
  const item = {
    value: value,
    created: Date.now(),
  };

  if (expiry) {
    item.expires = Date.now() + expiry * 1000;
  }

  localCache.set(key, item);
  return "OK";
};

// Get from local cache
const getLocalCache = (key) => {
  const item = localCache.get(key);

  if (!item) return null;

  // Check if expired
  if (item.expires && item.expires < Date.now()) {
    localCache.delete(key);
    return null;
  }

  return item.value;
};

// Helper functions for Redis operations with fallback
const redisClient = {
  // Get the raw Redis client (async)
  getClient: async () => {
    try {
      return await clientPromise;
    } catch (error) {
      return null;
    }
  },

  // Check if Redis is connected
  isConnected: async () => {
    try {
      const client = await clientPromise;
      return client && client.isReady;
    } catch (error) {
      return false;
    }
  },

  // Set a key with optional expiration (in seconds)
  set: async (key, value, expiry = null) => {
    try {
      const client = await clientPromise;

      if (!client || !redisAvailable) {
        logger.debug(`Redis unavailable, using local cache for SET: ${key}`);
        return setLocalCache(key, value, expiry);
      }

      const stringValue =
        typeof value === "object" ? JSON.stringify(value) : String(value);

      if (expiry) {
        return await client.setEx(key, expiry, stringValue);
      } else {
        return await client.set(key, stringValue);
      }
    } catch (error) {
      logger.warn(`Redis SET error, using local cache: ${error.message}`);
      return setLocalCache(key, value, expiry);
    }
  },

  // Get a key (with JSON parsing attempt)
  get: async (key) => {
    try {
      const client = await clientPromise;

      if (!client || !redisAvailable) {
        logger.debug(`Redis unavailable, using local cache for GET: ${key}`);
        return getLocalCache(key);
      }

      const reply = await client.get(key);

      if (reply === null) {
        return null;
      }

      // Try to parse JSON, return original string if not JSON
      try {
        return JSON.parse(reply);
      } catch (e) {
        return reply;
      }
    } catch (error) {
      logger.warn(`Redis GET error, using local cache: ${error.message}`);
      return getLocalCache(key);
    }
  },

  // Delete a key
  delete: async (key) => {
    try {
      const client = await clientPromise;

      if (!client || !redisAvailable) {
        logger.debug(`Redis unavailable, using local cache for DELETE: ${key}`);
        return localCache.delete(key) ? 1 : 0;
      }

      return await client.del(key);
    } catch (error) {
      logger.warn(`Redis DELETE error, using local cache: ${error.message}`);
      return localCache.delete(key) ? 1 : 0;
    }
  },

  // Check if a key exists
  exists: async (key) => {
    try {
      const client = await clientPromise;

      if (!client || !redisAvailable) {
        logger.debug(`Redis unavailable, using local cache for EXISTS: ${key}`);
        return localCache.has(key);
      }

      const result = await client.exists(key);
      return result === 1;
    } catch (error) {
      logger.warn(`Redis EXISTS error, using local cache: ${error.message}`);
      return localCache.has(key);
    }
  },

  // Set expiration time on a key
  expire: async (key, seconds) => {
    try {
      const client = await clientPromise;

      if (!client || !redisAvailable) {
        logger.debug(`Redis unavailable, using local cache for EXPIRE: ${key}`);
        const item = localCache.get(key);
        if (!item) return false;

        item.expires = Date.now() + seconds * 1000;
        localCache.set(key, item);
        return true;
      }

      const result = await client.expire(key, seconds);
      return result === 1;
    } catch (error) {
      logger.warn(`Redis EXPIRE error, using local cache: ${error.message}`);
      const item = localCache.get(key);
      if (!item) return false;

      item.expires = Date.now() + seconds * 1000;
      localCache.set(key, item);
      return true;
    }
  },

  // Flush the database
  flushDb: async () => {
    try {
      const client = await clientPromise;

      if (!client || !redisAvailable) {
        logger.debug(`Redis unavailable, clearing local cache for FLUSHDB`);
        localCache.clear();
        return "OK";
      }

      return await client.flushDb();
    } catch (error) {
      logger.warn(
        `Redis FLUSHDB error, clearing local cache: ${error.message}`
      );
      localCache.clear();
      return "OK";
    }
  },

  // Close the Redis connection
  quit: async () => {
    try {
      const client = await clientPromise;
      if (client && redisAvailable) {
        await client.quit();
        logger.info("Redis connection closed gracefully");
      }

      // Clear local cache on quit
      localCache.clear();
      redisAvailable = false;
    } catch (error) {
      logger.warn(`Redis QUIT error: ${error.message}`);
      // Still clear the local cache
      localCache.clear();
      redisAvailable = false;
    }
  },

  // Test connection
  testConnection: async () => {
    try {
      const client = await clientPromise;
      if (!client || !redisAvailable) return false;

      await client.set("test-connection", "success");
      const result = await client.get("test-connection");
      return result === "success";
    } catch (error) {
      logger.warn(`Redis test connection failed: ${error.message}`);
      return false;
    }
  },

  // Force reconnection attempt to Redis
  reconnect: async () => {
    try {
      if (redisAvailable) {
        logger.info("Redis is already connected");
        return true;
      }

      logger.info("Forcing reconnection to Redis");
      clientPromise = createClient();
      const client = await clientPromise;
      return client && client.isReady;
    } catch (error) {
      logger.error(`Forced Redis reconnection failed: ${error.message}`);
      return false;
    }
  },

  // Get Redis status information
  getStatus: () => {
    return {
      available: redisAvailable,
      reconnectAttempts,
      localCacheSize: localCache.size,
      reconnecting: reconnectTimer !== null,
    };
  },
};

module.exports = redisClient;
