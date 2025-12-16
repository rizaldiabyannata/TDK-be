import { body } from "express-validator";
import { validate } from "../middleware/validationMiddleware.js";

export const createSponsorshipValidator = [
  body("name").isString().trim().notEmpty().withMessage("name wajib diisi"),
  body("websiteLink")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("websiteLink wajib diisi"),
  validate,
];

export const updateSponsorshipValidator = [
  body("name").optional().isString().trim(),
  body("websiteLink").optional().isString().trim(),
  validate,
];
