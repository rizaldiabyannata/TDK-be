import { Router } from "express";
const router = Router();
import userRouters from "./userRouter.js";
import { testRedisConnection } from "../test/test-redis-connection.js";
import blogRouters from "./blogRouter.js";
import portfolioRouters from "./portoRouter.js";
import statisticRouter from "./statisticRouter.js";
import contentTrackRouter from "./contentTrackRouter.js";
import contactFormRouter from "./contactFormRouter.js";
import { error as _error } from "../utils/logger.js";
import multerMiddleware from "../middleware/multerMiddleware.js";
const { uploadSingleFile } = multerMiddleware;
import _default from "../middleware/authMiddleware.js";
const { protect } = _default;

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
    _error(`Redis health check failed: ${error.message}`);
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
