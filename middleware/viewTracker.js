import redisClient from "../config/redisConfig.js";
import logger from "../utils/logger.js";

/**
 * Middleware to track views using Redis for high performance.
 * This middleware no longer writes to MongoDB directly to avoid performance bottlenecks.
 * A separate background worker is required to periodically persist these counts from Redis to MongoDB.
 *
 * @param {'Blog' | 'Portfolio'} type - The type of content to track.
 */
export const trackView = (type) => {
  return async (req, res, next) => {
    // 1. Skip tracking for logged-in admins
    if (req.user) {
      return next();
    }

    const { slug } = req.params;
    if (!slug) {
      return next();
    }

    // 2. Check if Redis is available, if not, skip tracking
    if (!(await redisClient.isConnected())) {
      logger.warn(`[Tracker] Redis client not ready, view tracking for ${slug} skipped.`);
      return next();
    }

    const ip = req.headers["x-forwarded-for"] || req.ip;
    const dateStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    // --- Fire-and-forget Redis operations for performance ---

    // 3. Increment total view count
    redisClient.incr(`views:${type}:${slug}:total`).catch(err =>
      logger.error(`[Tracker] Failed to INCR total views for ${slug}: ${err.message}`)
    );

    // 4. Increment daily view count
    redisClient.incr(`views:${type}:${slug}:daily:${dateStr}`).catch(err =>
      logger.error(`[Tracker] Failed to INCR daily views for ${slug}: ${err.message}`)
    );

    // 5. Handle unique view tracking
    const uniqueIpKey = `unique_ip:${type}:${slug}:${ip}`;
    try {
      const alreadyViewed = await redisClient.get(uniqueIpKey);

      if (!alreadyViewed) {
        // This is a unique view for this IP in the last 24 hours.
        // Set the key to prevent another unique view count from this IP for 24 hours.
        redisClient.set(uniqueIpKey, "1", { EX: 86400 }); // 86400 seconds = 24 hours

        // Increment the unique view counter.
        redisClient.incr(`views:${type}:${slug}:unique`).catch(err =>
          logger.error(`[Tracker] Failed to INCR unique views for ${slug}: ${err.message}`)
        );
        logger.info(`[Tracker] Unique view recorded for ${type} ${slug} from IP ${ip}`);
      }
    } catch (error) {
      logger.error(`[Tracker] Error during unique view tracking for ${slug}: ${error.message}`);
    }

    next();
  };
};
