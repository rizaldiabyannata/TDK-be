import { parse, join } from "path";
import { mkdirSync, promises } from "fs";
import sharp from "sharp";
import { info, error as _error } from "../utils/logger.js";

/**
 * Memproses file gambar dari buffer memori, mengonversinya ke WebP, dan menyimpannya.
 * @param {object} file - Objek file dari Multer dengan memoryStorage (berisi file.buffer).
 * @returns {Promise<string>} Path relatif dari file WebP yang baru.
 */
const processImageToWebp = async (file) => {
  // Buat nama file unik berdasarkan nama asli dan timestamp
  const originalName = parse(file.originalname).name;
  const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
  const webpFilename = `${originalName}-${uniqueSuffix}.webp`;

  const outputDir = join(__dirname, "..", "public", "uploads", "images");
  mkdirSync(outputDir, { recursive: true });

  const webpOutputPath = join(outputDir, webpFilename);

  // --- PERUBAHAN KUNCI: Gunakan file.buffer sebagai input untuk sharp ---
  await sharp(file.buffer).webp({ quality: 80 }).toFile(webpOutputPath);

  // Tidak ada lagi file sementara yang perlu dihapus!

  const relativePath = join("/uploads/images", webpFilename)
    .replace(/\\/g, "/");

  info(`File berhasil dikonversi ke WebP: ${relativePath}`);
  return relativePath;
};

/**
 * Menghapus file dari sistem file berdasarkan URL relatifnya.
 * @param {string} fileUrl - Path relatif file yang akan dihapus (misal: /uploads/images/file.webp).
 */
const deleteFile = async (fileUrl) => {
  if (!fileUrl) return;

  try {
    const filePath = join(process.cwd(), "public", fileUrl);
    await promises.unlink(filePath);
    info(`File berhasil dihapus: ${filePath}`);
  } catch (error) {
    if (error.code !== "ENOENT") {
      _error(`Gagal menghapus file ${fileUrl}: ${error.message}`);
    }
  }
};

export default {
  processImageToWebp,
  deleteFile,
};
