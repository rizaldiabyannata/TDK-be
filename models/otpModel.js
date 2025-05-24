const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  purpose: {
    type: String,
    default: "password",
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: { expires: "1h" }, // Auto delete after 1 hour as backup
  },
});

// Index for faster lookups
otpSchema.index({ email: 1 });

module.exports = mongoose.model("Otp", otpSchema);
