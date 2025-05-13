// redisConfig.js
const redis = require("redis");
const logger = require("../utils/logger"); // Adjust the path as needed

const REDIS_CONFIG = {
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: process.env.REDIS_DB || 0,
  retry_strategy: function (options) {
    if (options.error && options.error.code === "ECONNREFUSED") {
      logger.error("Redis connection refused");
      return new Error("The Redis server refused the connection");
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
      logger.error("Redis retry time exhausted");
      return new Error("Retry time exhausted");
    }
    if (options.attempt > 10) {
      logger.error("Redis maximum retry attempts reached");
      return undefined; // Stop retrying
    }
    // Retry after increasing delay (exponential backoff)
    return Math.min(options.attempt * 100, 3000);
  },
};

// Create Redis client
const client = redis.createClient(REDIS_CONFIG);

// Handle connection events
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

// Helper functions for common Redis operations
const redisClient = {
  // Get the raw Redis client
  getClient: () => client,

  // Check if Redis is connected
  isConnected: () => client.connected,

  // Set a key with optional expiration (in seconds)
  set: (key, value, expiry = null) => {
    return new Promise((resolve, reject) => {
      try {
        const stringValue =
          typeof value === "object" ? JSON.stringify(value) : String(value);

        if (expiry) {
          client.setex(key, expiry, stringValue, (err, reply) => {
            if (err) return reject(err);
            resolve(reply);
          });
        } else {
          client.set(key, stringValue, (err, reply) => {
            if (err) return reject(err);
            resolve(reply);
          });
        }
      } catch (error) {
        reject(error);
      }
    });
  },

  // Get a key (with JSON parsing attempt)
  get: (key) => {
    return new Promise((resolve, reject) => {
      client.get(key, (err, reply) => {
        if (err) return reject(err);

        if (reply === null) {
          return resolve(null);
        }

        // Try to parse JSON, return original string if not JSON
        try {
          return resolve(JSON.parse(reply));
        } catch (e) {
          return resolve(reply);
        }
      });
    });
  },

  // Delete a key
  delete: (key) => {
    return new Promise((resolve, reject) => {
      client.del(key, (err, reply) => {
        if (err) return reject(err);
        resolve(reply);
      });
    });
  },

  // Check if a key exists
  exists: (key) => {
    return new Promise((resolve, reject) => {
      client.exists(key, (err, reply) => {
        if (err) return reject(err);
        resolve(reply === 1);
      });
    });
  },

  // Set expiration time on a key
  expire: (key, seconds) => {
    return new Promise((resolve, reject) => {
      client.expire(key, seconds, (err, reply) => {
        if (err) return reject(err);
        resolve(reply === 1);
      });
    });
  },

  // Flush the database
  flushDb: () => {
    return new Promise((resolve, reject) => {
      client.flushdb((err, reply) => {
        if (err) return reject(err);
        resolve(reply);
      });
    });
  },

  // Close the Redis connection
  quit: () => {
    return new Promise((resolve) => {
      client.quit(() => {
        logger.info("Redis connection closed gracefully");
        resolve();
      });
    });
  },
};

module.exports = redisClient;
