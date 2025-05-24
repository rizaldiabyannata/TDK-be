const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("../models/userModel");
require("dotenv").config();

// Admin configuration
const admin = {
  name: process.env.ADMIN_USERNAME || "admin",
  password: process.env.ADMIN_PASSWORD || "StrongPassword123!",
};

const seedAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Check if admin already exists
    const existingAdmin = await User.findOne();

    if (existingAdmin) {
      console.log("Admin already exists. Seed aborted.");
      process.exit(0);
    }

    // Hash the admin password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(admin.password, salt);

    // Create admin user
    const newAdmin = await User.create({
      name: admin.name,
      password: hashedPassword,
    });

    console.log(`Admin account created successfully: ${newAdmin.email}`);
    process.exit(0);
  } catch (error) {
    console.error("Error seeding admin:", error);
    process.exit(1);
  }
};

// Run the seed function
seedAdmin();
