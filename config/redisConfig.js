import redis from "redis";
import logger from "../utils/logger.js";

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
          return false;
        }
        return Math.min(retries * 100, 3000);
      },
    },
  });

  client.on("connect", () => logger.info("Redis connection established"));
  client.on("ready", () => {
    redisAvailable = true;
    reconnectAttempts = 0;
    logger.info("Redis client is ready to use");
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
  client.on("reconnecting", () => logger.info("Redis client is reconnecting"));
  client.on("end", () => {
    redisAvailable = false;
    logger.info("Redis connection closed");
    if (!reconnectTimer && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      reconnectTimer = setTimeout(async () => {
        logger.info("Attempting to reconnect to Redis...");
        reconnectTimer = null;
        try {
          await client.connect();
        } catch (err) {
          logger.error(`Failed to reconnect to Redis: ${err.message}`);
        }
      }, 5000);
    }
  });

  try {
    await client.connect();
    redisAvailable = true;
  } catch (err) {
    redisAvailable = false;
    logger.warn(
      `Failed to connect to Redis: ${err.message}. Using local cache fallback.`
    );
  }

  return client;
};

let clientPromise = createClient().catch((err) => {
  logger.warn(
    `Initial Redis connection failed: ${err.message}. Using local cache fallback.`
  );
  redisAvailable = false;
  return null;
});

const setLocalCache = (key, value, expirySeconds = null) => {
  const item = { value: value, created: Date.now() };
  if (expirySeconds) {
    item.expires = Date.now() + expirySeconds * 1000;
  }
  localCache.set(key, item);
  return "OK";
};

const getLocalCache = (key) => {
  const item = localCache.get(key);
  if (!item) return null;
  if (item.expires && item.expires < Date.now()) {
    localCache.delete(key);
    return null;
  }
  return item.value;
};

const redisClient = {
  getClient: async () => {
    try {
      return await clientPromise;
    } catch (error) {
      logger.error(`Error getting Redis client: ${error.message}`);
      return null;
    }
  },

  isConnected: async () => {
    try {
      const client = await clientPromise;
      return client && client.isReady;
    } catch (error) {
      logger.error(`Error checking Redis connection: ${error.message}`);
      return false;
    }
  },

  /**
   * FIX: Fungsi 'set' sekarang menerima objek opsi (seperti { EX: seconds })
   * sebagai argumen ketiga agar kompatibel dengan node-redis v4.
   */
  set: async (key, value, options = null) => {
    try {
      const client = await clientPromise;

      if (!client || !redisAvailable) {
        logger.debug(`Redis unavailable, using local cache for SET: ${key}`);
        const expirySeconds = options && options.EX ? options.EX : null;
        return setLocalCache(key, value, expirySeconds);
      }

      const stringValue =
        typeof value === "object" ? JSON.stringify(value) : String(value);

      // Menggunakan client.set yang menerima objek 'options'
      return await client.set(key, stringValue, options || undefined);
    } catch (error) {
      logger.warn(`Redis SET error, using local cache: ${error.message}`);
      const expirySeconds = options && options.EX ? options.EX : null;
      return setLocalCache(key, value, expirySeconds);
    }
  },

  get: async (key) => {
    try {
      const client = await clientPromise;
      if (!client || !redisAvailable) {
        logger.debug(`Redis unavailable, using local cache for GET: ${key}`);
        return getLocalCache(key);
      }
      const reply = await client.get(key);
      if (reply === null) return null;
      try {
        return JSON.parse(reply);
      } catch (error) {
        logger.error(
          `Failed to parse JSON from Redis for key ${key}: ${error.message}`
        );
        return reply;
      }
    } catch (error) {
      logger.warn(`Redis GET error, using local cache: ${error.message}`);
      return getLocalCache(key);
    }
  },

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

  // ... sisa fungsi lainnya (exists, expire, dll.) tidak perlu diubah ...

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

  quit: async () => {
    try {
      const client = await clientPromise;
      if (client && redisAvailable) {
        await client.quit();
        logger.info("Redis connection closed gracefully");
      }

      localCache.clear();
      redisAvailable = false;
    } catch (error) {
      logger.warn(`Redis QUIT error: ${error.message}`);
      localCache.clear();
      redisAvailable = false;
    }
  },

  incr: async (key) => {
    try {
      const client = await clientPromise;
      if (!client || !redisAvailable) {
        logger.debug(`Redis unavailable, using local cache for INCR: ${key}`);
        let value = getLocalCache(key) || 0;
        value++;
        setLocalCache(key, value);
        return value;
      }
      return await client.incr(key);
    } catch (error) {
      logger.warn(`Redis INCR error, using local cache: ${error.message}`);
      let value = getLocalCache(key) || 0;
      value++;
      setLocalCache(key, value);
      return value;
    }
  },
};

export default redisClient;
