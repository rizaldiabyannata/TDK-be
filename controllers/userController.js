const User = require("../models/userModel");
const logger = require("../utils/logger");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const otpService = require("../utils/otpService");
const { findById } = require("../models/blogModel");

const generateTokens = (user) => {
  // Access token berumur pendek (misal: 15 menit)
  const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });

  // Refresh token berumur panjang (misal: 7 hari)
  const refreshToken = jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: "7d",
    }
  );

  return { accessToken, refreshToken };
};

const loginUser = async (req, res) => {
  const { name, password } = req.body;

  try {
    const admin = await User.findOne();

    if (
      !admin ||
      admin.name !== name ||
      !(await bcrypt.compare(password, admin.password))
    ) {
      logger.warn(
        `Failed admin login attempt: Invalid credentials for ${name}`
      );
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const { accessToken, refreshToken } = generateTokens(admin);

    logger.info(`Admin logged in: ${name}`);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 hari
    });

    res.status(200).json({
      message: "Login successful",
      accessToken,
      user: {
        name: admin.name,
        email: admin.email || null,
      },
    });
  } catch (error) {
    logger.error(`Error logging in admin: ${error.message}`);
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
};

const refreshToken = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token not found." });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(403).json({ message: "Invalid refresh token." });
    }

    // Buat access token baru
    const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });

    res.status(200).json({ accessToken });
  } catch (error) {
    logger.error(`Error refreshing token: ${error.message}`);
    return res.status(403).json({ message: "Invalid refresh token." });
  }
};

const logoutUser = async (req, res) => {
  try {
    const userId = req.user?._id;
    const userName = req.user?.name;

    res.clearCookie("refreshToken");

    logger.info(`Admin logged out: ${userName} (ID: ${userId})`);

    res.status(200).json({
      message: "Logout successful",
    });
  } catch (error) {
    logger.error(`Error during logout: ${error.message}`);
    res.status(500).json({
      message: "Error during logout",
      error: error.message,
    });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const user = req.user;

    logger.info(`Admin profile fetched: ${user._id}`);
    res.json({
      user: {
        username: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    logger.error(`Error in getAdminProfile: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Error fetching admin profile",
      error: error.message,
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const userId = req.user._id;
    const { email } = req.body;

    const updateData = {};

    if (email) updateData.email = email;

    const user = findById(userId);

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedUser) {
      logger.warn(`Update failed: Admin user not found with ID ${userId}`);
      return res.status(404).json({ message: "Admin user not found" });
    }

    logger.info(`Admin user updated successfully: ${userId}`);
    res.status(200).json({
      message: "Admin user updated successfully",
      user: {
        email: updatedUser.email,
        name: updatedUser.name,
      },
    });
  } catch (error) {
    logger.error(`Error updating admin user: ${error.message}`);
    res
      .status(500)
      .json({ message: "Error updating admin user", error: error.message });
  }
};

const requestPasswordResetOTP = async (req, res) => {
  try {
    const email = req.user.email;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const admin = await User.findOne({ email });
    if (!admin) {
      return res.status(200).json({
        message: "If this is the admin email, an OTP has been sent",
      });
    }

    const plainOTP = await otpService.createPasswordResetOTP(email);

    await otpService.sendPasswordResetOTP(email, plainOTP);

    logger.info(`Admin password reset OTP sent to: ${email}`);
    return res.status(200).json({
      message: "OTP has been sent to your email",
    });
  } catch (error) {
    logger.error(`Error in requestPasswordResetOTP: ${error.message}`);
    return res.status(500).json({
      message: "Error sending OTP",
      error: error.message,
    });
  }
};

const verifyOTPAndResetPassword = async (req, res) => {
  try {
    const email = req.user.email;
    const { otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        message: "Email, OTP, and new password are required",
      });
    }

    const otpRecord = await otpService.verifyPasswordResetOTP(email, otp);
    if (!otpRecord) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const admin = await User.findOne({ email });
    if (!admin) {
      return res.status(404).json({ message: "Admin user not found" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    admin.password = hashedPassword;
    await admin.save();

    await otpService.deleteOTP(otpRecord._id);

    logger.info(`Admin password reset successful for: ${email}`);
    return res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    logger.error(`Error in verifyOTPAndResetPassword: ${error.message}`);
    return res.status(500).json({
      message: "Error resetting password",
      error: error.message,
    });
  }
};

module.exports = {
  loginUser,
  getUserProfile,
  refreshToken,
  updateUser,
  requestPasswordResetOTP,
  verifyOTPAndResetPassword,
  logoutUser,
};
