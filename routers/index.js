const express = require("express");
const router = express.Router();
const userRouters = require("./userRouters");
const { testRedisConnection } = require("../test/test-redis-connection");
const blogRouters = require("./blogRouter");
const statisticRouter = require("./statisticRouter");
const contentTrackingRouter = require("./ContentTrackingRouter");

// import routes
router.use("/test", (req, res) => {
  res.send("Test route is working");
});

router.use("/users", userRouters);
router.use("/blogs", blogRouters);
router.use("/statistic", statisticRouter);

// In your Express routes
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
        message: "Redis connection test failed",
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Redis connection test error",
      error: error.message,
    });
  }
});
router.use("/content-tracking", contentTrackingRouter);

module.exports = router;
