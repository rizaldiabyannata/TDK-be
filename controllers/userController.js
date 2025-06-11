const User = require("../models/userModel");
const logger = require("../utils/logger");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const otpService = require("../utils/otpService");

const generateToken = (user) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
  return token;
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

    const token = generateToken(admin);

    logger.info(`Admin logged in: ${name}`);

    res
      .cookie("token", token, { httpOnly: true, secure: false })
      .status(200)
      .json({
        message: "Login successful",
        user: {
          _id: admin._id,
          name: admin.name,
          email: admin.email || null,
        },
      });
  } catch (error) {
    logger.error(`Error logging in admin: ${error.message}`);
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const user = req.user;

    logger.info(`Admin profile fetched: ${user._id}`);
    res.json({
      user: {
        _id: user._id,
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
      user: updatedUser,
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

const logoutUser = async (req, res) => {
  try {
    const userId = req.user?._id;
    const userName = req.user?.name;

    res.clearCookie("token");

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

module.exports = {
  loginUser,
  getUserProfile,
  updateUser,
  requestPasswordResetOTP,
  verifyOTPAndResetPassword,
  logoutUser,
};
