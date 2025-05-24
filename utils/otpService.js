const nodemailer = require("nodemailer");
const OtpModel = require("../models/otpModel");
const logger = require("./logger");
const bcrypt = require("bcrypt");

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: "gmail", // or another email service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Generate a random 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP via email for password reset
const sendPasswordResetOTP = async (email, otp) => {
  const subject = "Admin Password Reset OTP";

  const htmlContent = `
    <h1>Password Reset - One-Time Password</h1>
    <p>Your OTP for password reset is: <strong>${otp}</strong></p>
    <p>This code will expire in 10 minutes.</p>
    <p>If you didn't request this, please secure your account immediately.</p>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject,
      html: htmlContent,
    });
    logger.info(`Password reset OTP sent to admin email: ${email}`);
    return true;
  } catch (error) {
    logger.error(`Failed to send OTP email: ${error.message}`);
    throw new Error(`Failed to send OTP: ${error.message}`);
  }
};

// Create and store OTP for admin password reset
const createPasswordResetOTP = async (email) => {
  try {
    const plainOTP = generateOTP();

    // Hash the OTP using bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedOTP = await bcrypt.hash(plainOTP, salt);

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    // Save OTP to database
    await OtpModel.findOneAndUpdate(
      { email, purpose: "password" },
      {
        email,
        otp: hashedOTP,
        purpose: "password",
        expiresAt,
      },
      { upsert: true, new: true }
    );

    return plainOTP; // Return the plain OTP to be sent via email
  } catch (error) {
    logger.error(`Error creating password reset OTP: ${error.message}`);
    throw new Error(`Error creating OTP: ${error.message}`);
  }
};

// Verify OTP for password reset
const verifyPasswordResetOTP = async (email, plainOTP) => {
  try {
    // Find OTP records that match email and purpose and haven't expired
    const otpRecords = await OtpModel.find({
      email,
      purpose: "password",
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecords || otpRecords.length === 0) {
      logger.warn(`No valid OTP found for admin email: ${email}`);
      return null;
    }

    // Check each record to find a matching OTP
    for (const record of otpRecords) {
      // Compare the plain OTP with the hashed OTP
      const isMatch = await bcrypt.compare(plainOTP, record.otp);
      if (isMatch) {
        return record;
      }
    }

    logger.warn(`Invalid OTP attempt for admin email: ${email}`);
    return null;
  } catch (error) {
    logger.error(`Error verifying OTP: ${error.message}`);
    throw new Error(`Error verifying OTP: ${error.message}`);
  }
};

// Delete OTP
const deleteOTP = async (otpId) => {
  try {
    await OtpModel.deleteOne({ _id: otpId });
    return true;
  } catch (error) {
    logger.error(`Error deleting OTP: ${error.message}`);
    throw new Error(`Error deleting OTP: ${error.message}`);
  }
};

module.exports = {
  generateOTP,
  sendPasswordResetOTP,
  createPasswordResetOTP,
  verifyPasswordResetOTP,
  deleteOTP,
};
