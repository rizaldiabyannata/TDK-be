const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const logger = require("../utils/logger");

/**
 * Memproses file gambar dari buffer memori, mengonversinya ke WebP, dan menyimpannya.
 * @param {object} file - Objek file dari Multer dengan memoryStorage (berisi file.buffer).
 * @returns {Promise<string>} Path relatif dari file WebP yang baru.
 */
const processImageToWebp = async (file) => {
  // Buat nama file unik berdasarkan nama asli dan timestamp
  const originalName = path.parse(file.originalname).name;
  const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
  const webpFilename = `${originalName}-${uniqueSuffix}.webp`;

  const outputDir = path.join(__dirname, "..", "public", "uploads", "images");
  fs.mkdirSync(outputDir, { recursive: true });

  const webpOutputPath = path.join(outputDir, webpFilename);

  // --- PERUBAHAN KUNCI: Gunakan file.buffer sebagai input untuk sharp ---
  await sharp(file.buffer).webp({ quality: 80 }).toFile(webpOutputPath);

  // Tidak ada lagi file sementara yang perlu dihapus!

  const relativePath = path
    .join("/uploads/images", webpFilename)
    .replace(/\\/g, "/");

  logger.info(`File berhasil dikonversi ke WebP: ${relativePath}`);
  return relativePath;
};

/**
 * Menghapus file dari sistem file berdasarkan URL relatifnya.
 * @param {string} fileUrl - Path relatif file yang akan dihapus (misal: /uploads/images/file.webp).
 */
const deleteFile = async (fileUrl) => {
  if (!fileUrl) return;

  try {
    const filePath = path.join(process.cwd(), "public", fileUrl);
    await fs.promises.unlink(filePath);
    logger.info(`File berhasil dihapus: ${filePath}`);
  } catch (error) {
    if (error.code !== "ENOENT") {
      logger.error(`Gagal menghapus file ${fileUrl}: ${error.message}`);
    }
  }
};

module.exports = {
  processImageToWebp,
  deleteFile,
};
