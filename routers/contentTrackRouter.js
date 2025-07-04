const express = require("express");
const router = express.Router();
const contentTrackingController = require("../controllers/contentTrackingController");
const { authenticate } = require("../middleware/authMiddleware");

router.get("/", contentTrackingController.getHomePageContent);

router.put(
  "/featured-blogs",
  authenticate,
  contentTrackingController.updateFeaturedBlogs
);

router.put(
  "/highlighted-portfolios",
  authenticate,
  contentTrackingController.updateHighlightedPortfolios
);

router.post(
  "/reset",
  authenticate,
  contentTrackingController.resetHomePageContent
);

router.post(
  "/featured-blogs",
  authenticate,
  contentTrackingController.addFeaturedBlog
);

router.delete(
  "/featured-blogs/:blogId",
  authenticate,
  contentTrackingController.removeFeaturedBlog
);

router.post(
  "/highlighted-portfolios",
  authenticate,
  contentTrackingController.addHighlightedPortfolio
);
router.delete(
  "/highlighted-portfolios/:portfolioId",
  authenticate,
  contentTrackingController.removeHighlightedPortfolio
);

module.exports = router;
