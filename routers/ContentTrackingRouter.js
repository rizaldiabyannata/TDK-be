const express = require("express");
const router = express.Router();
const homePageController = require("../controllers/contentTrackingController");
const { authenticate } = require("../middleware/authMiddleware");

router.get("/", homePageController.getHomePageContent);

router.put(
  "/featured-blogs",
  authenticate,
  homePageController.updateFeaturedBlogs
);
router.put(
  "/highlighted-portfolios",
  authenticate,
  homePageController.updateHighlightedPortfolios
);
router.post("/reset", authenticate, homePageController.resetHomePageContent);

router.post(
  "/featured-blogs",
  authenticate,
  homePageController.addFeaturedBlog
);
router.delete(
  "/featured-blogs/:blogId",
  authenticate,
  homePageController.removeFeaturedBlog
);

router.post(
  "/highlighted-portfolios",
  authenticate,
  homePageController.addHighlightedPortfolio
);
router.delete(
  "/highlighted-portfolios/:portfolioId",
  authenticate,
  homePageController.removeHighlightedPortfolio
);

module.exports = router;
