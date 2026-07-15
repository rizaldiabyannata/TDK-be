import { body } from "express-validator";
import { validationMiddleware } from "../middleware/validationMiddleware.js";

export const createStaffValidator = [
  body("name").isString().notEmpty().withMessage("Nama wajib diisi"),
  body("position").isString().notEmpty().withMessage("Posisi wajib diisi"),
  body("shortDescription")
    .isString()
    .notEmpty()
    .withMessage("Deskripsi singkat wajib diisi"),
  body("socialMedia")
    .optional()
    .isArray()
    .withMessage("Media sosial harus berupa array"),
  body("socialMedia.*.platform")
    .if(body("socialMedia").exists())
    .isString()
    .notEmpty()
    .withMessage("Platform media sosial wajib diisi"),
  body("socialMedia.*.url")
    .if(body("socialMedia").exists())
    .isURL()
    .withMessage("URL media sosial tidak valid"),
  body("level")
    .notEmpty()
    .withMessage("Level wajib diisi")
    .isInt({ min: 1 })
    .withMessage("Level harus berupa angka positif minimal 1")
    .toInt(), // Konversi string ke integer
  body("order")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Order harus berupa angka non-negatif"),
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("Status aktif harus berupa boolean"),
  validationMiddleware,
];

export const updateStaffValidator = [
  body("name").optional().isString().notEmpty().withMessage("Nama wajib diisi"),
  body("position")
    .optional()
    .isString()
    .notEmpty()
    .withMessage("Posisi wajib diisi"),
  body("shortDescription")
    .optional()
    .isString()
    .notEmpty()
    .withMessage("Deskripsi singkat wajib diisi"),
  body("socialMedia")
    .optional()
    .isArray()
    .withMessage("Media sosial harus berupa array"),
  body("socialMedia.*.platform")
    .if(body("socialMedia").exists())
    .isString()
    .notEmpty()
    .withMessage("Platform media sosial wajib diisi"),
  body("socialMedia.*.url")
    .if(body("socialMedia").exists())
    .isURL()
    .withMessage("URL media sosial tidak valid"),
  body("level")
    .optional()
    .notEmpty()
    .withMessage("Level tidak boleh kosong")
    .isInt({ min: 1 })
    .withMessage("Level harus berupa angka positif minimal 1")
    .toInt(), // Konversi string ke integer
  body("order")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Order harus berupa angka non-negatif"),
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("Status aktif harus berupa boolean"),
  validationMiddleware,
];

export const toggleStatusValidator = [
  body("isActive").isBoolean().withMessage("Status aktif harus berupa boolean"),
  validationMiddleware,
];
