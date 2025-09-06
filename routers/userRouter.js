import { Router } from "express";
const router = Router();
import rateLimit from "express-rate-limit";

import userController from "../controllers/userController.js";
const {
  loginUser, refreshToken, getUserProfile, updateUser, requestPasswordResetOTP, verifyOTPAndResetPassword, logoutUser,
} = userController;
import _default from "../middleware/authMiddleware.js";
const { protect } = _default;
import __default from "../middleware/validationMiddleware.js";
const { validate } = __default;
import { loginRules, resetPasswordRules, updateUserRules } from "../validators/userValidators.js";

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
