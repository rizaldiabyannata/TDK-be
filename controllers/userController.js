const User = require("../models/UserModel");
const logger = require("../utils/logger");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const otpService = require("../utils/otpService");
const redisClient = require("../config/redisConfig");

const generateTokens = (user) => {
  const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });

  const refreshToken = jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: "7d",
    }
  );

  console.log("\nRefresh Token:", refreshToken);

  return { accessToken, refreshToken };
};

const loginUser = async (req, res) => {
  const { name, password } = req.body;
  const ip = req.ip;
  const key = `login_attempts:${ip}`;
  const blockKey = `blocked:${ip}`;

  try {
    const admin = await User.findOne();

    if (
      !admin ||
      admin.name !== name ||
      !(await bcrypt.compare(password, admin.password))
    ) {
      logger.warn(
        `Failed admin login attempt: Invalid credentials for ${name} from IP ${ip}`
      );
      const attempts = await redisClient.incr(key);
      await redisClient.expire(key, 15 * 60); // Expire in 15 minutes

      if (attempts >= 3) {
        await redisClient.set(blockKey, "true", { EX: 60 * 60 });
        logger.warn(`IP ${ip} has been blocked for 1 hour.`);
      }
      return res.status(401).json({ message: "Invalid credentials" });
    }

    await redisClient.delete(key);

    const { accessToken, refreshToken } = generateTokens(admin);

    logger.info(`Admin logged in: ${name}`);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      message: "Login successful",
      accessToken,
      refreshToken,
      user: {
        name: admin.name,
        email: admin.email || null,
      },
    });
  } catch (error) {
    logger.error(`Error logging in admin: ${error.message}`);
    res.status(500).json({
      message:
        process.env.NODE_ENV === "production"
          ? "An internal server error occurred."
          : "Error logging in",
    });
  }
};

const refreshToken = async (req, res) => {
  const oldRefreshToken = req.cookies.refreshToken;

  if (!oldRefreshToken) {
    return res.status(401).json({ message: "Refresh token not found." });
  }

  try {
    // Periksa apakah refresh token lama ada di denylist
    const isRevoked = await redisClient.get(`denylist:${oldRefreshToken}`);
    if (isRevoked) {
      logger.warn(`Attempt to use a revoked refresh token.`);
      return res.status(403).json({ message: "Invalid refresh token." });
    }

    const decoded = jwt.verify(oldRefreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(403).json({ message: "Invalid refresh token." });
    }

    // Hasilkan token baru
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

    // Tambahkan refresh token lama ke denylist untuk mencegah penggunaan kembali
    const oldTokenDecoded = jwt.decode(oldRefreshToken);
    if (oldTokenDecoded && oldTokenDecoded.exp) {
      const expiresIn = oldTokenDecoded.exp - Math.floor(Date.now() / 1000);
      if (expiresIn > 0) {
        await redisClient.set(`denylist:${oldRefreshToken}`, "revoked", {
          EX: expiresIn,
        });
      }
    }

    // Atur refresh token baru di cookie
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.BUN_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({ accessToken });
  } catch (error) {
    logger.error(`Error refreshing token: ${error.message}`);
    return res.status(403).json({
      message:
        process.env.BUN_ENV === "production"
          ? "An internal server error occurred."
          : "Invalid refresh token.",
    });
  }
};

const logoutUser = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.decode(token);

      if (decoded && decoded.exp) {
        const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
        if (expiresIn > 0) {
          await redisClient.set(`denylist:${token}`, "revoked", {
            EX: expiresIn,
          });
          logger.info(
            `Token untuk user ${req.user?.name} ditambahkan ke denylist.`
          );
        }
      }
    }

    res.clearCookie("refreshToken");

    logger.info(`Admin logged out: ${req.user?.name} (ID: ${req.user?._id})`);

    res.status(200).json({
      message: "Logout successful",
    });
  } catch (error) {
    logger.error(`Error during logout: ${error.message}`);
    res.status(500).json({
      message:
        process.env.BUN_ENV === "production"
          ? "An internal server error occurred."
          : "Error during logout",
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
      message:
        process.env.BUN_ENV === "production"
          ? "An internal server error occurred."
          : "An internal server error occurred.",
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const userId = req.user._id;
    const { email } = req.body;

    const updateData = {};
    if (email) {
      updateData.email = email;
    } else {
      return res.status(400).json({ message: "No updatable fields provided." });
    }

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

    res.status(500).json({
      message:
        process.env.BUN_ENV === "production"
          ? "An internal server error occurred."
          : "An internal server error occurred.",
    });
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
      message:
        process.env.BUN_ENV === "production"
          ? "An internal server error occurred."
          : "An internal server error occurred.",
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
      message:
        process.env.BUN_ENV === "production"
          ? "An internal server error occurred."
          : "An internal server error occurred.",
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
