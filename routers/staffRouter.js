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
  toggleStatusValidator,
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
router.get("/structure", staffController.getOrganizationalStructure);
router.get("/level/:level", staffController.getStaffByLevel);
router.get("/:id", staffController.getStaffById);
router.put(
  "/:id",
  protect,
  uploadSingleFileOptional("photo"),
  convertToWebp,
  updateStaffValidator,
  staffController.updateStaff
);
router.patch(
  "/:staffId/status",
  protect,
  toggleStatusValidator,
  staffController.toggleStaffStatus
);
router.delete("/:id", protect, staffController.deleteStaff);

export default router;
