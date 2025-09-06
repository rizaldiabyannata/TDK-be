import mongoose from "mongoose";
import logger, { warn, info } from "../utils/logger.js";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/mydatabase";
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGO_URI);
  info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
  warn(`Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
