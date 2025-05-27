// TODO : belum di testing
const express = require("express");
const router = express.Router();
const {
  createPortfolio,
  getAllPortfolios,
  getPortfolioBySlug,
  getPortfolioById,
  updatePortfolio,
  deletePortfolio,
  getArchivedPortfolios,
  unarchivePortfolio,
  archivePortfolio,
  searchPortfolios,
} = require("../controllers/portoController");

const { authenticate } = require("../middleware/authMiddleware");
const { trackView } = require("../middleware/viewTracker");
const { uploadSingleFile } = require("../middleware/multerMiddleware");

router.get("/search", searchPortfolios);
router.get("/archived", authenticate, getArchivedPortfolios);
router.post("/", authenticate, uploadSingleFile("coverImage"), createPortfolio);
router.get("/", getAllPortfolios);

router.get("/slug/:slug", trackView("portfolio"), getPortfolioBySlug);

router.put("/:id/archive", authenticate, archivePortfolio);
router.put("/:id/unarchive", authenticate, unarchivePortfolio);

router.get("/id/:id", authenticate, getPortfolioById);
router.put(
  "/id/:id",
  authenticate,
  uploadSingleFile("coverImage"),
  updatePortfolio
);
router.delete("/id/:id", authenticate, deletePortfolio);

module.exports = router;
