require("dotenv").config(); // If you use environment variables
import { connect, disconnect } from "mongoose";
import { collection } from "../models/BlogModel.js";

connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("Connected to MongoDB");
    try {
      await collection.createIndex(
        { title: "text", summary: "text", content: "text" },
        { name: "blog_text_index" }
      );
      console.log("Text index created successfully");
    } catch (error) {
      console.error("Error creating text index:", error);
    } finally {
      disconnect();
    }
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });
