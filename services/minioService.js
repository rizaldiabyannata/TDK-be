import { Client } from "minio";
import logger from "../utils/logger.js";
import stream from "stream";

const minioPort = parseInt(process.env.MINIO_PORT, 10);
if (isNaN(minioPort)) {
  throw new Error("MINIO_PORT is not a valid number");
}

const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT,
  port: minioPort,
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
});

export const uploadFile = async (bucketName, objectName, fileBuffer) => {
  try {
    const fileStream = new stream.PassThrough();
    fileStream.end(fileBuffer);

    await minioClient.putObject(bucketName, objectName, fileStream, {
      "Content-Type": "application/octet-stream",
    });

    logger.info(
      `File ${objectName} uploaded successfully to bucket ${bucketName}`
    );
    return `http://${process.env.MINIO_ENDPOINT}:${minioPort}/${bucketName}/${objectName}`;
  } catch (error) {
    logger.error(`Error uploading file to MinIO: ${error.message}`);
    throw new Error("Failed to upload file to MinIO");
  }
};

export const deleteFile = async (bucketName, objectName) => {
  try {
    await minioClient.removeObject(bucketName, objectName);
    logger.info(
      `File ${objectName} deleted successfully from bucket ${bucketName}`
    );
  } catch (error) {
    logger.error(`Error deleting file from MinIO: ${error.message}`);
    throw new Error("Failed to delete file from MinIO");
  }
};
