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

module.exports = { validate };
