import express from "express";
const router = express.Router();
import rateLimit from "express-rate-limit";

import {
  loginUser,
  refreshToken,
  getUserProfile,
  updateUser,
  requestPasswordResetOTP,
  verifyOTPAndResetPassword,
  logoutUser,
} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validationMiddleware.js";
import {
  loginRules,
  resetPasswordRules,
  updateUserRules,
} from "../validators/userValidators.js";

import ipBlockMiddleware from "../middleware/ipBlockMiddleware.js";

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Terlalu banyak percobaan. Silakan coba lagi setelah 15 menit.",
  standardHeaders: true,
  legacyHeaders: false,
});

const lenientLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Terlalu banyak permintaan dari IP ini, silakan coba lagi nanti.",
  standardHeaders: true,
  legacyHeaders: false,
});

router.post(
  "/login",
  ipBlockMiddleware,
  strictLimiter,
  loginRules(),
  validate,
  loginUser
);

router.post("/refresh-token", lenientLimiter, refreshToken);

router.post(
  "/request-password-reset",
  strictLimiter,
  protect,
  requestPasswordResetOTP
);

router.post(
  "/reset-password",
  strictLimiter,
  resetPasswordRules(),
  validate,
  protect,
  verifyOTPAndResetPassword
);

router.get("/profile", lenientLimiter, protect, getUserProfile);

router.put(
  "/update",
  lenientLimiter,
  updateUserRules(),
  validate,
  protect,
  updateUser
);

router.post("/logout", lenientLimiter, protect, logoutUser);

export default router;
