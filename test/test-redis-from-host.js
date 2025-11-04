import redis from "redis";
import dotenv from "dotenv";

dotenv.config();

const redisClient = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT) || 6379,
  },
  username: process.env.REDIS_USERNAME || "default",
  password: process.env.REDIS_PASSWORD,
  database: parseInt(process.env.REDIS_DB) || 0,
});

async function testRedisConnection() {
  console.log("🧪 Testing Redis Connection from Host...");
  console.log(
    `   Host: ${process.env.REDIS_HOST || "localhost"}:${
      process.env.REDIS_PORT || 6379
    }`
  );
  console.log("");

  try {
    await redisClient.connect();
    console.log("✅ Redis connected successfully!");
    console.log("");

    // Test 1: SET
    console.log("1️⃣  Testing SET operation...");
    await redisClient.set("test:key", "Hello Redis from Host!");
    console.log("   ✅ Key set successfully");
    console.log("");

    // Test 2: GET
    console.log("2️⃣  Testing GET operation...");
    const value = await redisClient.get("test:key");
    console.log(`   ✅ Retrieved value: "${value}"`);
    console.log("");

    // Test 3: DEL
    console.log("3️⃣  Testing DEL operation...");
    await redisClient.del("test:key");
    console.log("   ✅ Key deleted successfully");
    console.log("");

    // Test 4: PING
    console.log("4️⃣  Testing PING operation...");
    const pong = await redisClient.ping();
    console.log(`   ✅ PING response: ${pong}`);
    console.log("");

    console.log("🎉 All Redis tests passed!");
    await redisClient.quit();
    process.exit(0);
  } catch (error) {
    console.error("❌ Redis test failed:");
    console.error(`   Error: ${error.message}`);
    console.error("");
    console.error("Troubleshooting:");
    console.error(
      "   - Make sure Redis is running (docker compose up -d redis)"
    );
    console.error("   - Check REDIS_HOST and REDIS_PORT in .env");
    console.error("   - Verify Redis password matches redis.conf");
    console.error("   - Ensure port 6379 is forwarded in docker-compose.yml");
    await redisClient.quit().catch(() => {});
    process.exit(1);
  }
}

testRedisConnection();
