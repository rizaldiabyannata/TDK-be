const User = require("../models/userModel");
const logger = require("../utils/logger"); // Mengimpor logger

// Controller untuk registrasi user
const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Membuat user baru
    const newUser = new User({ name, email, password });
    await newUser.save();

    // Log sukses
    logger.info(`New user registered: ${name} (${email})`);

    res
      .status(201)
      .json({ message: "User registered successfully", user: newUser });
  } catch (error) {
    logger.error(`Error registering user: ${error.message}`);
    res.status(500).json({ message: "Error registering user", error });
  }
};

// Controller untuk login user
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email, password });
    if (!user) {
      logger.warn(`Failed login attempt: Invalid credentials for ${email}`);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Log sukses login
    logger.info(`User logged in: ${email}`);

    res.cookie("userId", user._id, { httpOnly: true, secure: false }); // Set secure ke true pada HTTPS
    res.status(200).json({ message: "Login successful", user });
  } catch (error) {
    logger.error(`Error logging in user: ${error.message}`);
    res.status(500).json({ message: "Error logging in", error });
  }
};

// Controller untuk mengambil profil user
const getUserProfile = async (req, res) => {
  const userId = req.cookies.userId;

  if (!userId) {
    logger.warn("Unauthorized access attempt");
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      logger.warn(`User not found: ${userId}`);
      return res.status(404).json({ message: "User not found" });
    }

    logger.info(`User profile fetched: ${userId}`);
    res.json({ user });
  } catch (error) {
    logger.error(`Error fetching user profile: ${error.message}`);
    res.status(500).json({ message: "Error fetching user profile", error });
  }
};

module.exports = { registerUser, loginUser, getUserProfile };
