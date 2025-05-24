const mongoose = require("mongoose");

// Membuat schema untuk model User
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    // TODO: ganti menjadi satu user aja dan tidak menggunakan email
    type: String,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
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
