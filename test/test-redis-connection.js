// test-redis-connection.js
const redisClient = require("../config/redisConfig");
const logger = require("../utils/logger"); // Adjust the path as needed

async function testRedisConnection() {
  try {
    // Set a test value
    await redisClient.set("test-connection", "success", 60); // 60 seconds expiry
    logger.info("Redis SET operation successful");

    // Get the test value
    const result = await redisClient.get("test-connection");
    logger.info(`Redis GET operation result: ${result}`);

    if (result === "success") {
      logger.info("✅ Redis connection is working properly!");
      return true;
    } else {
      logger.error(
        "❌ Redis connection test failed: unexpected value returned"
      );
      return false;
    }
  } catch (error) {
    logger.error(`❌ Redis connection test failed: ${error.message}`, {
      error,
    });
    return false;
  }
}

// Export for use in other files
module.exports = { testRedisConnection };

// Or run directly if this is a standalone script
if (require.main === module) {
  testRedisConnection()
    .then((success) => {
      console.log(`Redis test ${success ? "PASSED" : "FAILED"}`);
      process.exit(success ? 0 : 1);
    })
    .catch((err) => {
      console.error("Test error:", err);
      process.exit(1);
    });
}
