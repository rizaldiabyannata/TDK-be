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

      // If access token is expired, try to refresh it automatically
      if (error.name === "TokenExpiredError") {
        const refreshToken = req.cookies.refreshToken;

        if (refreshToken) {
          try {
            // Verify refresh token
            const refreshDecoded = jwt.verify(
              refreshToken,
              process.env.JWT_REFRESH_SECRET
            );

            // Check if refresh token is revoked
            const isRefreshRevoked = await redisClient.get(
              `denylist:${refreshToken}`
            );
            if (isRefreshRevoked) {
              return res.status(401).json({
                success: false,
                message: "Not authorized, refresh token has been revoked.",
              });
            }

            // Find user
            const user = await User.findById(refreshDecoded.id);
            if (!user) {
              return res.status(401).json({
                success: false,
                message: "Not authorized, user not found.",
              });
            }

            // Generate new access token
            const newAccessToken = jwt.sign(
              { id: user._id },
              process.env.JWT_SECRET,
              {
                expiresIn: "15m",
              }
            );

            // Set new access token cookie
            res.cookie("accessToken", newAccessToken, {
              httpOnly: true,
              secure: process.env.BUN_ENV === "production",
              sameSite: "none",
              maxAge: 15 * 60 * 1000, // 15 minutes
            });

            // Set user in request
            req.user = user;

            logger.info(
              `Access token refreshed automatically for user: ${user.name}`
            );
            return next();
          } catch (refreshError) {
            logger.error(`Refresh token error: ${refreshError.message}`);
            return res.status(401).json({
              success: false,
              message: "Not authorized, refresh token invalid.",
            });
          }
        }

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
    logger.info(
      `Optional auth: Invalid token, proceeding as guest. Error: ${error.message}`
    );
  }

  next();
};
