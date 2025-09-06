import { validationResult } from "express-validator";
import logger from "../utils/logger.js";

// Middleware untuk menangani hasil dari aturan validasi express-validator
export const validate = (req, res, next) => {
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
