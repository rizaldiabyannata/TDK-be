import mongoose from "mongoose";
import logger from "../utils/logger.js";
import dotenv from "dotenv";
dotenv.config();

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/mydatabase";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGO_URI);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.warn(`Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
