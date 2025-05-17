const redis = require("redis");
const logger = require("../utils/logger");

// Create Redis client with updated API
const createClient = async () => {
  // Configure Redis client
  const client = redis.createClient({
    url: `redis://${
      process.env.REDIS_PASSWORD ? `:${process.env.REDIS_PASSWORD}@` : ""
    }${process.env.REDIS_HOST || "localhost"}:${
      process.env.REDIS_PORT || 6379
    }/${process.env.REDIS_DB || 0}`,
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > 10) {
          logger.error("Redis maximum retry attempts reached");
          return new Error("Redis maximum retry attempts reached");
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
    logger.info("Redis client is ready to use");
  });

  client.on("error", (err) => {
    logger.error(`Redis error: ${err.message}`, { error: err });
  });

  client.on("reconnecting", () => {
    logger.info("Redis client is reconnecting");
  });

  client.on("end", () => {
    logger.info("Redis connection closed");
  });

  // Connect to Redis
  try {
    await client.connect();
  } catch (err) {
    logger.error(`Failed to connect to Redis: ${err.message}`, { error: err });
    throw err;
  }

  return client;
};

// Init client variable to be populated after connection
let clientPromise = createClient();

// Helper functions for Redis operations
const redisClient = {
  // Get the raw Redis client (async)
  getClient: async () => {
    return await clientPromise;
  },

  // Check if Redis is connected
  isConnected: async () => {
    try {
      const client = await clientPromise;
      return client.isReady;
    } catch (error) {
      return false;
    }
  },

  // Set a key with optional expiration (in seconds)
  set: async (key, value, expiry = null) => {
    try {
      const client = await clientPromise;
      const stringValue =
        typeof value === "object" ? JSON.stringify(value) : String(value);

      if (expiry) {
        return await client.setEx(key, expiry, stringValue);
      } else {
        return await client.set(key, stringValue);
      }
    } catch (error) {
      logger.error(`Redis SET error: ${error.message}`, { error });
      throw error;
    }
  },

  // Get a key (with JSON parsing attempt)
  get: async (key) => {
    try {
      const client = await clientPromise;
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
      logger.error(`Redis GET error: ${error.message}`, { error });
      throw error;
    }
  },

  // Delete a key
  delete: async (key) => {
    try {
      const client = await clientPromise;
      return await client.del(key);
    } catch (error) {
      logger.error(`Redis DELETE error: ${error.message}`, { error });
      throw error;
    }
  },

  // Check if a key exists
  exists: async (key) => {
    try {
      const client = await clientPromise;
      const result = await client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Redis EXISTS error: ${error.message}`, { error });
      throw error;
    }
  },

  // Set expiration time on a key
  expire: async (key, seconds) => {
    try {
      const client = await clientPromise;
      const result = await client.expire(key, seconds);
      return result === 1;
    } catch (error) {
      logger.error(`Redis EXPIRE error: ${error.message}`, { error });
      throw error;
    }
  },

  // Flush the database
  flushDb: async () => {
    try {
      const client = await clientPromise;
      return await client.flushDb();
    } catch (error) {
      logger.error(`Redis FLUSHDB error: ${error.message}`, { error });
      throw error;
    }
  },

  // Close the Redis connection
  quit: async () => {
    try {
      const client = await clientPromise;
      await client.quit();
      logger.info("Redis connection closed gracefully");
    } catch (error) {
      logger.error(`Redis QUIT error: ${error.message}`, { error });
      throw error;
    }
  },

  // Test connection
  testConnection: async () => {
    try {
      const client = await clientPromise;
      await client.set("test-connection", "success");
      const result = await client.get("test-connection");
      return result === "success";
    } catch (error) {
      logger.error(`Redis test connection failed: ${error.message}`, { error });
      return false;
    }
  },
};

module.exports = redisClient;
