import multer, { memoryStorage } from "multer";
import { error as _error } from "../utils/logger.js";
import { processImageToWebp } from "../services/imageService.js";

const storage = memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new Error("Hanya file gambar yang diizinkan!"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

/**
 * Middleware untuk menangani upload satu file (wajib ada).
 * @param {string} fieldName - Nama field dari form-data.
 */
const uploadSingleFile = (fieldName) => (req, res, next) => {
  upload.single(fieldName)(req, res, (err) => {
    if (err) {
      _error(`Error upload file tunggal: ${err.message}`);
      return res.status(400).json({ message: `Error upload: ${err.message}` });
    }

    if (!req.file) {
      return res
        .status(400)
        .json({ message: `File wajib diisi untuk field: ${fieldName}` });
    }
    next();
  });
};

/**
 * Middleware untuk menangani upload satu file secara opsional.
 * Jika tidak ada file, middleware akan lanjut tanpa error.
 * @param {string} fieldName - Nama field dari form-data.
 */
const uploadSingleFileOptional = (fieldName) => (req, res, next) => {
  upload.single(fieldName)(req, res, (err) => {
    if (err) {
      _error(`Error upload file opsional: ${err.message}`);
      return res.status(400).json({ message: `Error upload: ${err.message}` });
    }

    next();
  });
};

/**
 * Middleware untuk menangani upload beberapa file.
 * @param {string} fieldName - Nama field dari form-data.
 * @param {number} maxCount - Jumlah maksimum file.
 */
const uploadMultipleFiles =
  (fieldName, maxCount = 5) =>
  (req, res, next) => {
    upload.array(fieldName, maxCount)(req, res, (err) => {
      if (err) {
        _error(`Error upload file ganda: ${err.message}`);
        return res
          .status(400)
          .json({ message: `Error upload: ${err.message}` });
      }
      next();
    });
  };

/**
 * Middleware untuk menangani upload file dari beberapa field.
 * @param {Array<object>} fields - Konfigurasi field [{ name: 'avatar', maxCount: 1 }, ...].
 */
const uploadFields = (fields) => (req, res, next) => {
  upload.fields(fields)(req, res, (err) => {
    if (err) {
      _error(`Error upload fields: ${err.message}`);
      return res.status(400).json({ message: `Error upload: ${err.message}` });
    }
    next();
  });
};

/**
 * Middleware untuk mengonversi gambar yang di-upload ke format WebP.
 * Dijalankan setelah middleware upload.
 */
const convertToWebp = async (req, res, next) => {
  if (!req.file && !req.files) {
    return next();
  }

  try {
    if (req.file) {
      req.fileUrl = await processImageToWebp(req.file);
    }

    if (req.files && Array.isArray(req.files)) {
      req.fileUrls = await Promise.all(
        req.files.map((file) => processImageToWebp(file))
      );
    }

    if (
      req.files &&
      !Array.isArray(req.files) &&
      Object.keys(req.files).length > 0
    ) {
      req.fieldFileUrls = {};
      for (const field in req.files) {
        req.fieldFileUrls[field] = await Promise.all(
          req.files[field].map((file) => processImageToWebp(file))
        );
      }
    }

    next();
  } catch (error) {
    _error(`Error di middleware convertToWebp: ${error.message}`);
    next(error);
  }
};

export default {
  uploadSingleFile,
  uploadSingleFileOptional,
  uploadMultipleFiles,
  uploadFields,
  convertToWebp,
};
