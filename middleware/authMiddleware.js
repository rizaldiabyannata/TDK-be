import jwt from "jsonwebtoken";
import User from "../models/UserModel.js";
import logger from "../utils/logger.js";
import redisClient from "../config/redisConfig.js";

export const protect = async (req, res, next) => {
  let token;

  if (req.cookies && req.cookies.accessToken) {
    try {
      token = req.cookies.accessToken;

      const isRevoked = await redisClient.get(`denylist:${token}`);
      if (isRevoked) {
        logger.warn(`Authentication failed: Token revoked for user.`);
        return res.status(401).json({
          success: false,
          message: "Not authorized, token has been revoked.",
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Not authorized, user not found.",
        });
      }

      next();
    } catch (error) {
      logger.error(`Authentication error: ${error.message}`);
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Not authorized, token expired.",
        });
      }
      return res.status(401).json({
        success: false,
        message: "Not authorized, token failed.",
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized, no token.",
    });
  }
};

export const authorize = () => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    next();
  };
};

export const optionalAuth = async (req, res, next) => {
  let token;
  if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (user) {
      req.user = user;
    }
  } catch (error) {
    logger.debug(
      `Optional auth: Invalid token, proceeding as guest. Error: ${error.message}`
    );
  }

  next();
};
