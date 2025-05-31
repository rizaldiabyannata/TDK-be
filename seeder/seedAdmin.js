const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("../models/userModel"); // Pastikan path ini benar

// Admin configuration
const admin = {
  name: process.env.ADMIN_USERNAME,
  password: process.env.ADMIN_PASSWORD,
};

const seedAdmin = async () => {
  try {
    // Connect to MongoDB (gunakan MONGO_URI yang sudah didefinisikan di .env)
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Check if admin already exists
    const existingAdmin = await User.findOne();

    if (existingAdmin) {
      console.log("Admin already exists. Seed aborted.");
      return "Admin already exists.";
    }

    // Hash the admin password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(admin.password, salt);

    // Create admin user
    const newAdmin = await User.create({
      name: admin.name,
      password: hashedPassword,
    });

    console.log(`Admin account created successfully: ${newAdmin.name}`);
    return `Admin account created successfully: ${newAdmin.name}`;
  } catch (error) {
    console.error("Error seeding admin:", error);
    return "Error while creating admin";
  }
};

module.exports = seedAdmin;
