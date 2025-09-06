import mongoose from "mongoose";

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
    enum: ["password", "emailVerification", "accountRecovery"],
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: { expires: "1h" },
  },
});

otpSchema.index({ email: 1 });

export default mongoose.model("Otp", otpSchema);
