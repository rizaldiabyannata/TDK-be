const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const logger = require("../utils/logger");

const processImageToWebp = async (file) => {
  const originalName = path.parse(file.originalname).name;
  const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
  const webpFilename = `${originalName}-${uniqueSuffix}.webp`;

  const outputDir = path.join(__dirname, "..", "public", "uploads", "images");
  fs.mkdirSync(outputDir, { recursive: true });

  const outputPath = path.join(outputDir, webpFilename);

  // Resize and convert to WebP
  await sharp(file.buffer)
    .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(outputPath);

  // Create a thumbnail
  const thumbPath = path.join(outputDir, `thumb-${webpFilename}`);
  await sharp(file.buffer)
    .resize(300, 300, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 70 })
    .toFile(thumbPath);


  const relativePath = path
    .join("/uploads/images", webpFilename)
    .replace(/\\/g, "/");

  logger.info(`File berhasil dikonversi ke WebP: ${relativePath}`);
  return relativePath;
};

const deleteFile = async (fileUrl) => {
  if (!fileUrl) return;

  try {
    const filePath = path.join(process.cwd(), "public", fileUrl);
    await fs.promises.unlink(filePath);
    logger.info(`File berhasil dihapus: ${filePath}`);

    const thumbPath = path.join(process.cwd(), "public", "/uploads/images/", `thumb-${path.basename(fileUrl)}`);
    await fs.promises.unlink(thumbPath);
    logger.info(`Thumbnail berhasil dihapus: ${thumbPath}`);
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
