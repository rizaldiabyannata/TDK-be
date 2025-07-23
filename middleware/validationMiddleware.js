const { validationResult } = require("express-validator");
const logger = require("../utils/logger");

// Middleware untuk menangani hasil dari aturan validasi express-validator
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next(); // Tidak ada error, lanjutkan ke controller
  }

  // Jika ada error, format dan kirim respons
  const extractedErrors = [];
  errors.array().map((err) => extractedErrors.push({ [err.path]: err.msg }));

  logger.warn(`Validation failed for ${req.method} ${req.originalUrl}:`, {
    errors: extractedErrors,
    ip: req.ip,
  });

  return res.status(422).json({
    success: false,
    message: "Input validation failed",
    errors: extractedErrors,
  });
};

const sanitizeParams = (req, res, next) => {
  if (req.params.slug) {
    // Hanya izinkan huruf, angka, dan tanda hubung
    req.params.slug = req.params.slug.replace(/[^a-zA-Z0-9-]/g, "");
  }
  next();
};

module.exports = { validate, sanitizeParams };
