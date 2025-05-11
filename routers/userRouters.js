const express = require("express");
const router = express.Router();
const validateUser = require("../middleware/simpleMiddleware"); // Middleware validasi
const {
  registerUser,
  loginUser,
  getUserProfile,
} = require("../controllers/userController"); // Mengimpor controller

// Route untuk registrasi user dengan validasi input
router.post("/register", validateUser, registerUser);

// Route untuk login user
router.post("/login", loginUser);

// Route untuk mendapatkan profil user
router.get("/profile", getUserProfile);

module.exports = router;
