const express = require("express");
const router = express.Router();
const userRouters = require("./userRouter");
const { testRedisConnection } = require("../test/test-redis-connection");
const blogRouters = require("./blogRouter");
const portfolioRouters = require("./portoRouter");
const statisticRouter = require("./statisticRouter");
const contentTrackRouter = require("./contentTrackRouter");
const contactFormRouter = require("./contactFormRouter");
const logger = require("../utils/logger");

router.use("/test", (req, res) => {
  res.send("Test route is working");
});

router.use("/user", userRouters);
router.use("/blogs", blogRouters);
router.use("/portfolios", portfolioRouters);
router.use("/statistic", statisticRouter);
router.use("/content-tracking", contentTrackRouter);
router.use("/contact-form", contactFormRouter);

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

module.exports = router;
