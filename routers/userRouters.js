const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");

const {
  loginUser,
  getUserProfile,
  updateUser,
  requestPasswordResetOTP,
  verifyOTPAndResetPassword,
  logoutUser,
} = require("../controllers/userController");
const { authenticate } = require("../middleware/authMiddleware");


const { validate } = require("../middleware/validationMiddleware");
const { loginRules, resetPasswordRules, updateUserRules } = require("../validators/userValidators");

// Konfigurasi Rate Limiter yang Ketat
// Digunakan untuk endpoint yang rentan terhadap serangan brute-force atau spam
const strictLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 menit
	max: 10, // Batasi setiap IP hingga 10 permintaan per window
	message: "Terlalu banyak percobaan. Silakan coba lagi setelah 15 menit.",
	standardHeaders: true,
	legacyHeaders: false,
});

// Konfigurasi Rate Limiter yang Lebih Longgar
// Digunakan untuk endpoint terotentikasi untuk mencegah penyalahgunaan
const lenientLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 menit
	max: 100, // Batasi setiap IP hingga 100 permintaan per window
	message: "Terlalu banyak permintaan dari IP ini, silakan coba lagi nanti.",
	standardHeaders: true,
	legacyHeaders: false,
});


// Menerapkan limiter yang ketat pada rute login dan reset password
router.post("/login", strictLimiter, loginRules(), validate, loginUser);

router.post("/request-password-reset", strictLimiter, authenticate, requestPasswordResetOTP);

router.post("/reset-password", strictLimiter, resetPasswordRules(), validate, authenticate, verifyOTPAndResetPassword);

router.get("/profile", lenientLimiter, authenticate, getUserProfile);

router.put("/update", lenientLimiter, updateUserRules(), validate, authenticate, updateUser);

router.post("/logout", lenientLimiter, authenticate, logoutUser);

module.exports = router;