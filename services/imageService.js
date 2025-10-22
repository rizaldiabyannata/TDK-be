import path from "path";
import sharp from "sharp";
import logger from "../utils/logger.js";
import * as minioService from "./minioService.js";

/**
 * Memproses file gambar dari buffer memori, mengonversinya ke WebP, dan menyimpannya.
 * @param {object} file - Objek file dari Multer dengan memoryStorage (berisi file.buffer).
 * @returns {Promise<string>} Path relatif dari file WebP yang baru.
 */
export const processImageToWebp = async (file) => {
  const originalName = path.parse(file.originalname).name;
  const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
  const webpFilename = `${originalName}-${uniqueSuffix}.webp`;

  const webpBuffer = await sharp(file.buffer).webp({ quality: 80 }).toBuffer();

  const fileUrl = await minioService.uploadFile(
    process.env.MINIO_BUCKET,
    webpFilename,
    webpBuffer
  );

  logger.info(`File berhasil dikonversi ke WebP dan diunggah ke MinIO: ${fileUrl}`);
  return fileUrl;
};

/**
 * Menghapus file dari sistem file berdasarkan URL relatifnya.
 * @param {string} fileUrl - Path relatif file yang akan dihapus (misal: /uploads/images/file.webp).
 */
export const deleteFile = async (fileUrl) => {
  if (!fileUrl) return;

  try {
    const bucketName = process.env.MINIO_BUCKET;
    const objectName = fileUrl.substring(fileUrl.lastIndexOf("/") + 1);
    await minioService.deleteFile(bucketName, objectName);
    logger.info(`File berhasil dihapus dari MinIO: ${objectName}`);
  } catch (error) {
    logger.error(`Gagal menghapus file dari MinIO ${fileUrl}: ${error.message}`);
  }
};
