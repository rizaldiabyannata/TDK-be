import { Router } from "express";
import * as sponsorshipController from "../controllers/sponsorshipController.js";
import { protect } from "../middleware/authMiddleware.js";
import {
  uploadSingleFile,
  uploadSingleFileOptional,
  convertToWebp,
} from "../middleware/multerMiddleware.js";
import {
  createSponsorshipValidator,
  updateSponsorshipValidator,
} from "../validators/sponsorshipValidator.js";

const router = Router();

// Create sponsorship (requires image upload)
router.post(
  "/",
  protect,
  uploadSingleFile("logo"),
  convertToWebp,
  createSponsorshipValidator,
  sponsorshipController.createSponsorship
);

// Public read
router.get("/", sponsorshipController.getAllSponsorships);
router.get("/:id", sponsorshipController.getSponsorshipById);

// Update sponsorship (logo optional)
router.put(
  "/:id",
  protect,
  uploadSingleFileOptional("logo"),
  convertToWebp,
  updateSponsorshipValidator,
  sponsorshipController.updateSponsorship
);

// Delete sponsorship
router.delete("/:id", protect, sponsorshipController.deleteSponsorship);

export default router;
