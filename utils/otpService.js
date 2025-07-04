const nodemailer = require("nodemailer");
const OtpModel = require("../models/otpModel");
const logger = require("./logger");
const bcrypt = require("bcryptjs");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendPasswordResetOTP = async (email, otp) => {
  const subject = "Permintaan Reset Password Admin";

  // --- TEMPLATE HTML BARU ---
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          background-color: #f4f4f7;
          margin: 0;
          padding: 0;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background-color: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        .header {
          background-color: #4A90E2; /* Warna biru yang bagus */
          color: #ffffff;
          padding: 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
        }
        .content {
          padding: 40px 30px;
          line-height: 1.6;
        }
        .otp-code {
          background-color: #eef4ff;
          border: 1px dashed #4A90E2;
          color: #4A90E2;
          font-size: 36px;
          font-weight: bold;
          text-align: center;
          padding: 20px;
          margin: 30px 0;
          border-radius: 8px;
          letter-spacing: 5px;
        }
        .footer {
          background-color: #f4f4f7;
          padding: 20px 30px;
          font-size: 12px;
          color: #777;
          text-align: center;
        }
        .footer p {
          margin: 5px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Reset Password Anda</h1>
        </div>
        <div class="content">
          <p>Halo,</p>
          <p>Kami menerima permintaan untuk mereset password akun admin Anda. Gunakan kode One-Time Password (OTP) di bawah ini untuk melanjutkan.</p>
          <div class="otp-code">${otp}</div>
          <p>Kode ini hanya berlaku selama <strong>10 menit</strong>.</p>
          <p>Jika Anda tidak merasa meminta ini, mohon abaikan email ini dan segera amankan akun Anda.</p>
          <p>Terima kasih,<br>Tim Admin</p>
        </div>
        <div class="footer">
          <p>Ini adalah email otomatis. Mohon untuk tidak membalas email ini (no-reply).</p>
          <p>&copy; ${new Date().getFullYear()} Nama Perusahaan Anda. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    // Pengirim email sekarang menyertakan nama untuk tampilan yang lebih baik
    await transporter.sendMail({
      from: `"Admin Panel" <${process.env.EMAIL_USER}>`,
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

const createPasswordResetOTP = async (email) => {
  try {
    const plainOTP = generateOTP();

    const salt = await bcrypt.genSalt(10);
    const hashedOTP = await bcrypt.hash(plainOTP, salt);

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

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

    return plainOTP;
  } catch (error) {
    logger.error(`Error creating password reset OTP: ${error.message}`);
    throw new Error(`Error creating OTP: ${error.message}`);
  }
};

const verifyPasswordResetOTP = async (email, plainOTP) => {
  try {
    const otpRecords = await OtpModel.find({
      email,
      purpose: "password",
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecords || otpRecords.length === 0) {
      logger.warn(`No valid OTP found for admin email: ${email}`);
      return null;
    }

    for (const record of otpRecords) {
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
