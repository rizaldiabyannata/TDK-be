import express from "express";
const router = express.Router();
import * as contentTrackingController from "../controllers/contentTrackingController.js";
import { protect } from "../middleware/authMiddleware.js";

router.get("/", contentTrackingController.getHomePageContent);

router.put(
  "/featured-blogs",
  protect,
  contentTrackingController.addFeaturedBlog
);

router.put(
  "/highlighted-portfolios",
  protect,
  contentTrackingController.addHighlightedPortfolio
);

router.post("/reset", protect, contentTrackingController.resetHomePageContent);

router.post(
  "/featured-blogs",
  protect,
  contentTrackingController.addFeaturedBlog
);

router.delete(
  "/featured-blogs/:blogId",
  protect,
  contentTrackingController.removeFeaturedBlog
);

router.post(
  "/highlighted-portfolios",
  protect,
  contentTrackingController.addHighlightedPortfolio
);
router.delete(
  "/highlighted-portfolios/:portfolioId",
  protect,
  contentTrackingController.removeHighlightedPortfolio
);

export default router;
