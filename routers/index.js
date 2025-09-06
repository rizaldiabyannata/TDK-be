import express from "express";
const router = express.Router();
import userRouters from "./userRouter.js";
import { testRedisConnection } from "../test/test-redis-connection.js";
import blogRouters from "./blogRouter.js";
import portfolioRouters from "./portoRouter.js";
import statisticRouter from "./statisticRouter.js";
import contentTrackRouter from "./contentTrackRouter.js";
import contactFormRouter from "./contactFormRouter.js";
import logger from "../utils/logger.js";
import { uploadSingleFile } from "../middleware/multerMiddleware.js";
import { protect } from "../middleware/authMiddleware.js";

router.use("/test", (req, res) => {
  res.send("Test route is working");
});

router.use("/user", userRouters);
router.use("/blogs", blogRouters);
router.use("/portfolios", portfolioRouters);
router.use("/statistic", statisticRouter);
router.use("/content-tracking", contentTrackRouter);
router.use("/contact-form", contactFormRouter);
router.use("/upload/image/", protect, uploadSingleFile("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No image file uploaded." });
  }
  res.status(200).json({
    message: "Image uploaded successfully.",
    url: req.fileUrl,
  });
});

router.get("/health/redis", async (req, res) => {
  try {
    const redisConnected = await testRedisConnection();
    if (redisConnected) {
      return res.status(200).json({
        status: "ok",
        message: "Redis connection is working properly",
      });
    } else {
      return res.status(500).json({
        status: "error",
        message:
          process.env.BUN_ENV === "production"
            ? "An unexpected error occurred."
            : "Redis connection test failed",
      });
    }
  } catch (error) {
    logger.error(`Redis health check failed: ${error.message}`);
    return res.status(500).json({
      status: "error",
      message:
        process.env.BUN_ENV === "production"
          ? "An unexpected error occurred."
          : "Redis connection test error",
    });
  }
});

export default router;
