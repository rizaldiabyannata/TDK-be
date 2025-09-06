import { get, set } from "../config/redisConfig.js";
import { warn, error as _error } from "../utils/logger.js";

const FAILED_ATTEMPTS_LIMIT = 3;
const BLOCK_DURATION = 60 * 60; // 1 jam dalam detik

const ipBlockMiddleware = async (req, res, next) => {
  const ip = req.ip;
  const key = `login_attempts:${ip}`;
  const blockKey = `blocked:${ip}`;

  try {
    const blocked = await get(blockKey);
    if (blocked) {
      warn(`Blocked IP ${ip} tried to access the login endpoint.`);
      return res.status(429).json({
        message:
          "Terlalu banyak percobaan login. IP Anda telah diblokir sementara.",
      });
    }

    const attempts = await get(key);
    if (attempts && parseInt(attempts, 10) >= FAILED_ATTEMPTS_LIMIT) {
      await set(blockKey, "true", { EX: BLOCK_DURATION });
      warn(
        `IP ${ip} has been blocked for 1 hour due to too many failed login attempts.`
      );
      return res.status(429).json({
        message:
          "Terlalu banyak percobaan login. IP Anda telah diblokir sementara.",
      });
    }

    next();
  } catch (error) {
    _error(`Error in ipBlockMiddleware: ${error.message}`);
    next();
  }
};

export default ipBlockMiddleware;
