const mongoose = require("mongoose");
const logger = require("../utils/logger");

require("dotenv").config();

MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/mydatabase";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.warn(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
