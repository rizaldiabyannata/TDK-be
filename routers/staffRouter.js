import { Router } from "express";
import * as staffController from "../controllers/staffController.js";
import {
  uploadSingleFile,
  uploadSingleFileOptional,
  convertToWebp,
} from "../middleware/multerMiddleware.js";
import { protect } from "../middleware/authMiddleware.js";
import {
  createStaffValidator,
  updateStaffValidator,
} from "../validators/staffValidator.js";

const router = Router();

router.post(
  "/",
  protect,
  uploadSingleFile("photo"),
  convertToWebp,
  createStaffValidator,
  staffController.createStaff
);
router.get("/", staffController.getAllStaff);
router.get("/:id", staffController.getStaffById);
router.put(
  "/:id",
  protect,
  uploadSingleFileOptional("photo"),
  convertToWebp,
  updateStaffValidator,
  staffController.updateStaff
);
router.delete("/:id", protect, staffController.deleteStaff);

export default router;
