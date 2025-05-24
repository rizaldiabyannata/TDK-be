const multer = require("multer");
const path = require("path");
const fs = require("fs");
const logger = require("../utils/logger");

// Setup storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Tentukan folder upload berdasarkan type file
    let uploadPath = "uploads/";

    if (file.mimetype.startsWith("image/")) {
      uploadPath += "images/";
    } else if (file.mimetype === "application/pdf") {
      uploadPath += "documents/";
    } else {
      uploadPath += "others/";
    }

    // Buat direktori jika belum ada
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Buat nama file yang unik dengan timestamp
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const fileExt = path.extname(file.originalname);

    // Mengganti spasi dengan tanda hubung dan mengubah ke lowercase
    const fileName = file.originalname
      .replace(fileExt, "")
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w\-]+/g, "")
      .replace(/\-\-+/g, "-")
      .substring(0, 60); // Batasi panjang nama file

    cb(null, `${fileName}-${uniqueSuffix}${fileExt}`);
  },
});

// File filter untuk memvalidasi tipe file
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedFileTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "application/pdf",
  ];

  if (allowedFileTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `File type not allowed. Accepted types: ${allowedFileTypes.join(", ")}`
      ),
      false
    );
  }
};

// Konfigurasi Multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
});

// Middleware untuk upload satu file
const uploadSingleFile = (fieldName) => {
  return (req, res, next) => {
    const uploader = upload.single(fieldName);

    uploader(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          // Error dari Multer
          if (err.code === "LIMIT_FILE_SIZE") {
            logger.error(`File size limit exceeded: ${err.message}`);
            return res.status(400).json({
              success: false,
              message: "File size should not exceed 10MB",
            });
          }

          logger.error(`Multer error during file upload: ${err.message}`, {
            error: err,
          });
          return res.status(400).json({
            success: false,
            message: `File upload error: ${err.message}`,
          });
        }

        // Error lainnya
        logger.error(`Error during file upload: ${err.message}`, {
          error: err,
        });
        return res.status(500).json({
          success: false,
          message: err.message,
        });
      }

      // Jika tidak ada file yang diunggah
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: `No file uploaded for field: ${fieldName}`,
        });
      }

      // Log sukses
      logger.info(
        `File successfully uploaded: ${req.file.filename} (${req.file.size} bytes)`
      );

      // Tambahkan file URL ke objek request
      req.fileUrl = `/${req.file.path.replace(/\\/g, "/")}`;

      next();
    });
  };
};

// Middleware untuk upload banyak file
const uploadMultipleFiles = (fieldName, maxCount = 5) => {
  return (req, res, next) => {
    const uploader = upload.array(fieldName, maxCount);

    uploader(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          // Error dari Multer
          if (err.code === "LIMIT_FILE_SIZE") {
            logger.error(`File size limit exceeded: ${err.message}`);
            return res.status(400).json({
              success: false,
              message: "File size should not exceed 10MB",
            });
          }

          if (err.code === "LIMIT_UNEXPECTED_FILE") {
            logger.error(`Too many files uploaded: ${err.message}`);
            return res.status(400).json({
              success: false,
              message: `Maximum ${maxCount} files allowed`,
            });
          }

          logger.error(`Multer error during files upload: ${err.message}`, {
            error: err,
          });
          return res.status(400).json({
            success: false,
            message: `Files upload error: ${err.message}`,
          });
        }

        // Error lainnya
        logger.error(`Error during files upload: ${err.message}`, {
          error: err,
        });
        return res.status(500).json({
          success: false,
          message: err.message,
        });
      }

      // Jika tidak ada file yang diunggah
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: `No files uploaded for field: ${fieldName}`,
        });
      }

      // Log sukses
      logger.info(`${req.files.length} files successfully uploaded`);

      // Tambahkan file URLs ke objek request
      req.fileUrls = req.files.map((file) => {
        return `/${file.path.replace(/\\/g, "/")}`;
      });

      next();
    });
  };
};

// Helper untuk menghapus file yang sudah diupload
const deleteFile = (filePath) => {
  try {
    // Menghapus '/' di awal path jika ada
    const normalizedPath = filePath.startsWith("/")
      ? filePath.slice(1)
      : filePath;

    if (fs.existsSync(normalizedPath)) {
      fs.unlinkSync(normalizedPath);
      logger.info(`File deleted: ${normalizedPath}`);
      return true;
    } else {
      logger.warn(`File not found for deletion: ${normalizedPath}`);
      return false;
    }
  } catch (error) {
    logger.error(`Error deleting file ${filePath}: ${error.message}`, {
      error,
    });
    return false;
  }
};

// Middleware untuk upload berbagai jenis file (fields)
const uploadFields = (fields) => {
  return (req, res, next) => {
    const uploader = upload.fields(fields);

    uploader(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          // Error dari Multer
          if (err.code === "LIMIT_FILE_SIZE") {
            logger.error(`File size limit exceeded: ${err.message}`);
            return res.status(400).json({
              success: false,
              message: "File size should not exceed 10MB",
            });
          }

          if (err.code === "LIMIT_UNEXPECTED_FILE") {
            logger.error(`Unexpected field in upload: ${err.message}`);
            return res.status(400).json({
              success: false,
              message: `Unexpected field in upload form`,
            });
          }

          logger.error(`Multer error during files upload: ${err.message}`, {
            error: err,
          });
          return res.status(400).json({
            success: false,
            message: `Files upload error: ${err.message}`,
          });
        }

        // Error lainnya
        logger.error(`Error during files upload: ${err.message}`, {
          error: err,
        });
        return res.status(500).json({
          success: false,
          message: err.message,
        });
      }

      // Jika tidak ada file yang diunggah
      if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({
          success: false,
          message: `No files uploaded`,
        });
      }

      // Log sukses
      const totalFiles = Object.values(req.files).reduce(
        (sum, files) => sum + files.length,
        0
      );
      logger.info(
        `${totalFiles} files successfully uploaded across ${
          Object.keys(req.files).length
        } fields`
      );

      // Tambahkan file URLs ke objek request
      req.fieldFileUrls = {};

      for (const [fieldName, files] of Object.entries(req.files)) {
        req.fieldFileUrls[fieldName] = files.map(
          (file) => `/${file.path.replace(/\\/g, "/")}`
        );
      }

      next();
    });
  };
};

module.exports = {
  uploadSingleFile,
  uploadMultipleFiles,
  uploadFields,
  deleteFile,
};
