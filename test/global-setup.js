// Global setup for Jest tests
export default async function globalSetup() {
  // Set test-specific environment variables
  process.env.NODE_ENV = "test";
  process.env.BUN_ENV = "test";

  // Use a separate test database
  process.env.MONGO_URI =
    process.env.MONGO_URI_TEST || "mongodb://localhost:27017/tdk-test";

  // Disable Redis in tests unless explicitly needed
  process.env.REDIS_ENABLED = "false";

  // Use test-specific MinIO configuration
  process.env.MINIO_BUCKET = "tdk-test-bucket";

  console.log("🧪 Test environment initialized");
}
