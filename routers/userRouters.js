// TODO : ini akan di ubah lagi mungkin

const express = require("express");
const router = express.Router();
const { authenticate, authorize } = require("../middleware/authMiddleware");
const {
  registerUser,
  loginUser,
  getUserProfile,
} = require("../controllers/userController");

// Route untuk registrasi user dengan validasi input
router.post("/register", registerUser);

// Route untuk login user
router.post("/login", loginUser);

// Route untuk mendapatkan profil user
router.get("/profile", authenticate, getUserProfile);

module.exports = router;
