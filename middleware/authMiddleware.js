import { verify } from "jsonwebtoken";
import { findById } from "../models/UserModel.js";
import { warn, error as _error, debug } from "../utils/logger.js";
import { get } from "../config/redisConfig.js";

const protect = async (req, res, next) => {
  let token;

  if (req.cookies && req.cookies.accessToken) {
    try {
      token = req.cookies.accessToken;

      const isRevoked = await get(`denylist:${token}`);
      if (isRevoked) {
        warn(`Authentication failed: Token revoked for user.`);
        return res.status(401).json({
          success: false,
          message: "Not authorized, token has been revoked.",
        });
      }

      const decoded = verify(token, process.env.JWT_SECRET);

      req.user = await findById(decoded.id).select("-password");

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Not authorized, user not found.",
        });
      }

      next();
    } catch (error) {
      _error(`Authentication error: ${error.message}`);
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

const authorize = () => {
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

const optionalAuth = async (req, res, next) => {
  let token;
  if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return next();
  }

  try {
    const decoded = verify(token, process.env.JWT_SECRET);
    const user = await findById(decoded.id).select("-password");
    if (user) {
      req.user = user;
    }
  } catch (error) {
    debug(
      `Optional auth: Invalid token, proceeding as guest. Error: ${error.message}`
    );
  }

  next();
};

export default { protect, authorize, optionalAuth };
