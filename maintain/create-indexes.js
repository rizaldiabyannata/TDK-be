require("dotenv").config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require("mongoose");
const Blog = require("../models/BlogModel");
const Porto = require("../models/PortoModel");
const logger = require("../utils/logger");

const createIndexes = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    logger.info("Connected to MongoDB for index creation.");

    // Blog indexes
    await Blog.collection.createIndex({ slug: 1 }, { unique: true });
    await Blog.collection.createIndex({ isArchived: 1, createdAt: -1 });
    await Blog.collection.createIndex({ title: "text", content: "text" });
    logger.info("Indexes for Blog model created successfully.");

    // Porto indexes
    await Porto.collection.createIndex({ slug: 1 }, { unique: true });
    await Porto.collection.createIndex({ isArchived: 1, createdAt: -1 });
    await Porto.collection.createIndex({ title: "text", description: "text", shortDescription: "text" });
    logger.info("Indexes for Porto model created successfully.");

  } catch (error) {
    logger.error("Error creating indexes:", error);
  } finally {
    await mongoose.disconnect();
    logger.info("Disconnected from MongoDB.");
  }
};

createIndexes();
