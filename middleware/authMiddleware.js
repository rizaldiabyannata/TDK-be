const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const logger = require("../utils/logger");

const protect = async (req, res, next) => {
  try {
    let token;

    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid token. User not found.",
        });
      }

      req.user = user;
      next();
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Token expired. Please log in again.",
        });
      }

      return res.status(401).json({
        success: false,
        message: "Invalid token.",
      });
    }
  } catch (error) {
    logger.error(`Authentication error: ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      message: "Authentication failed due to server error.",
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

module.exports = { protect, authorize };
