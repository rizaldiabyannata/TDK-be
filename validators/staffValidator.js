import { body } from "express-validator";
import { validationMiddleware } from "../middleware/validationMiddleware.js";

export const createStaffValidator = [
  body("name").isString().notEmpty().withMessage("Nama wajib diisi"),
  body("position").isString().notEmpty().withMessage("Posisi wajib diisi"),
  body("short_description")
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
  body("parent")
    .optional()
    .isMongoId()
    .withMessage("ID parent tidak valid"),
  validationMiddleware,
];

export const updateStaffValidator = [
  body("name")
    .optional()
    .isString()
    .notEmpty()
    .withMessage("Nama wajib diisi"),
  body("position")
    .optional()
    .isString()
    .notEmpty()
    .withMessage("Posisi wajib diisi"),
  body("short_description")
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
  body("parent")
    .optional()
    .isMongoId()
    .withMessage("ID parent tidak valid"),
  validationMiddleware,
];
