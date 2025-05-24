// create-indexes.js
require("dotenv").config(); // If you use environment variables
const mongoose = require("mongoose");
const Blog = require("../models/blogModel");

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("Connected to MongoDB");
    try {
      await Blog.collection.createIndex(
        { title: "text", summary: "text", content: "text" },
        { name: "blog_text_index" }
      );
      console.log("Text index created successfully");
    } catch (error) {
      console.error("Error creating text index:", error);
    } finally {
      mongoose.disconnect();
    }
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });
