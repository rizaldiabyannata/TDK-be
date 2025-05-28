const express = require("express");
const router = express.Router();
const {
  loginUser,
  getUserProfile,
  updateUser,
  requestPasswordResetOTP,
  verifyOTPAndResetPassword,
  logoutUser,
} = require("../controllers/userController");
const { authenticate } = require("../middleware/authMiddleware");

router.post("/login", loginUser);
router.post("/request-password-reset", authenticate, requestPasswordResetOTP);
router.post("/reset-password", authenticate, verifyOTPAndResetPassword);

router.get("/profile", authenticate, getUserProfile);
router.put("/update", authenticate, updateUser);
router.post("/logout", authenticate, logoutUser);

module.exports = router;
