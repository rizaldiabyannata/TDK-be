const mongoose = require("mongoose");

// Membuat schema untuk model User
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true, // Pastikan email unik
  },
  password: {
    type: String,
    required: true,
  },
  varificationCode: {
    type: Number,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Membuat instance method untuk mengubah data password, dsb.
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password; // Jangan sertakan password dalam response
  return user;
};

// Export model User
module.exports = mongoose.model("User", userSchema);
