import { Router } from "express";
import * as serviceController from "../controllers/serviceController.js";
import {
  createServiceValidator,
  updateServiceValidator,
} from "../validators/serviceValidator.js";
import {
  uploadSingleFile,
  uploadSingleFileOptional,
  convertToWebp,
} from "../middleware/multerMiddleware.js";

const router = Router();

router.post(
  "/",
  uploadSingleFile("image"),
  convertToWebp,
  createServiceValidator,
  serviceController.createService
);
router.get("/", serviceController.getAllServices);
router.get("/:id", serviceController.getServiceById);
router.put(
  "/:id",
  uploadSingleFileOptional("image"),
  convertToWebp,
  updateServiceValidator,
  serviceController.updateService
);
router.delete("/:id", serviceController.deleteService);

export default router;
