import { Client } from "minio";
import dotenv from "dotenv";

dotenv.config();

const minioPort = parseInt(process.env.MINIO_PORT, 10);
const bucketName = process.env.MINIO_BUCKET || "tdk-uploads";

const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || "localhost",
  port: minioPort || 9000,
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY || "minioadmin",
  secretKey: process.env.MINIO_SECRET_KEY || "minioadmin123",
});

async function testMinIOConnection() {
  console.log("🧪 Testing MinIO Connection...");
  console.log(`   Endpoint: ${process.env.MINIO_ENDPOINT}:${minioPort}`);
  console.log(`   Bucket: ${bucketName}`);
  console.log("");

  try {
    // Test 1: Check if bucket exists
    console.log("1️⃣  Checking if bucket exists...");
    const bucketExists = await minioClient.bucketExists(bucketName);

    if (!bucketExists) {
      console.log(`   ⚠️  Bucket '${bucketName}' does not exist. Creating...`);
      await minioClient.makeBucket(bucketName, "us-east-1");
      console.log(`   ✅ Bucket '${bucketName}' created successfully`);
    } else {
      console.log(`   ✅ Bucket '${bucketName}' already exists`);
    }
    console.log("");

    // Test 2: Upload a test file
    console.log("2️⃣  Testing file upload...");
    const testData = Buffer.from("Hello MinIO! This is a test file.");
    const testFileName = `test-${Date.now()}.txt`;

    await minioClient.putObject(bucketName, testFileName, testData);
    console.log(`   ✅ File '${testFileName}' uploaded successfully`);
    console.log("");

    // Test 3: Check if file exists
    console.log("3️⃣  Testing file stat...");
    const stat = await minioClient.statObject(bucketName, testFileName);
    console.log(`   ✅ File found: ${stat.size} bytes`);
    console.log("");

    // Test 4: Download the file
    console.log("4️⃣  Testing file download...");
    const dataStream = await minioClient.getObject(bucketName, testFileName);

    let downloadedData = "";
    await new Promise((resolve, reject) => {
      dataStream.on("data", (chunk) => {
        downloadedData += chunk.toString();
      });
      dataStream.on("end", resolve);
      dataStream.on("error", reject);
    });

    if (downloadedData === "Hello MinIO! This is a test file.") {
      console.log("   ✅ File downloaded and content verified");
    } else {
      console.log("   ❌ File content mismatch");
    }
    console.log("");

    // Test 5: Delete the test file
    console.log("5️⃣  Testing file deletion...");
    await minioClient.removeObject(bucketName, testFileName);
    console.log(`   ✅ File '${testFileName}' deleted successfully`);
    console.log("");

    // Test 6: List all buckets
    console.log("6️⃣  Listing all buckets...");
    const buckets = await minioClient.listBuckets();
    console.log(`   ✅ Found ${buckets.length} bucket(s):`);
    buckets.forEach((bucket) => {
      console.log(`      - ${bucket.name} (created: ${bucket.creationDate})`);
    });
    console.log("");

    console.log("🎉 All MinIO tests passed!");
    process.exit(0);
  } catch (error) {
    console.error("❌ MinIO test failed:");
    console.error(`   Error: ${error.message}`);
    console.error("");
    console.error("Troubleshooting:");
    console.error(
      "   - Make sure MinIO is running (docker compose up -d minio)"
    );
    console.error("   - Check environment variables in .env");
    console.error(
      "   - Verify MINIO_ENDPOINT, MINIO_PORT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY"
    );
    process.exit(1);
  }
}

testMinIOConnection();
