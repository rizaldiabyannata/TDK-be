const redisClient = require('../config/redisConfig');
const logger = require('../utils/logger');

const cacheMiddleware = (duration) => async (req, res, next) => {
  if (req.user) {
    logger.info('[Admin Access] Bypassing cache');
    return next();
  }

  const key = `__express__${req.originalUrl || req.url}`;

  try {
    if (await redisClient.isConnected()) {
      const cachedData = await redisClient.get(key);
      if (cachedData) {
        logger.info(`Cache HIT for key: ${key}`);
        res.setHeader('X-Cache', 'HIT');
        res.send(cachedData);
        return;
      }
    } else {
      logger.warn('Redis client is not connected, skipping cache check.');
    }

    logger.info(`Cache MISS for key: ${key}.`);
    res.setHeader('X-Cache', 'MISS');

    const originalSend = res.send;
    res.send = (body) => {
      if (res.statusCode === 200) {
        if (redisClient.isConnected()) {
          redisClient.set(key, body, { EX: duration });
        }
      }
      originalSend.call(res, body);
    };
    next();
  } catch (error) {
    logger.error(`Cache middleware error: ${error.message}`);
    next();
  }
};

module.exports = cacheMiddleware;
