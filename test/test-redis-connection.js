// test-redis-connection.js
import redisClient from "../config/redisConfig.js";
import logger from "../utils/logger.js"; // Adjust the path as needed
import { fileURLToPath } from "url";

export async function testRedisConnection() {
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

// Or run directly if this is a standalone script
const currentFileUrl = import.meta.url;
if (
  process.argv[1] === fileURLToPath(currentFileUrl) ||
  process.argv[1].endsWith("test/test-redis-connection.js")
) {
  testRedisConnection()
    .then((success) => {
      console.log(`Redis test ${success ? "PASSED" : "FAILED"}`);
      return redisClient.quit(); // Gracefully close connection
    })
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error("Test error:", err);
      redisClient.quit();
      process.exit(1);
    });
}
