const User = require("../models/userModel");
const logger = require("../utils/logger");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    logger.warn("Registration failed: Missing required fields");
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    logger.info(`New user registered: ${name} (${email})`);

    res
      .status(201)
      .json({ message: "User registered successfully", user: newUser });
  } catch (error) {
    logger.error(`Error registering user: ${error.message}`);
    res.status(500).json({ message: "Error registering user", error });
  }
};

const generateToken = (user) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
  return token;
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      logger.warn(`Failed login attempt: Invalid credentials for ${email}`);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user);

    logger.info(`User logged in: ${email}`);

    res
      .cookie("token", token, { httpOnly: true, secure: false })
      .status(200)
      .json({ message: "Login successful", user });
  } catch (error) {
    logger.error(`Error logging in user: ${error.message}`);
    res.status(500).json({ message: "Error logging in", error });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const user = req.user;

    logger.info(`User profile fetched: ${user._id}`);
    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    logger.error(`Error in getUserProfile: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Error fetching user profile",
    });
  }
};
module.exports = { registerUser, loginUser, getUserProfile };
