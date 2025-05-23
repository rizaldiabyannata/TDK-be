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

router.get("/search", searchPortfolios);
router.get("/archived", authenticate, getArchivedPortfolios);
router.post("/", authenticate, createPortfolio);
router.get("/", getAllPortfolios);

router.get("/slug/:slug", trackView("portfolio"), getPortfolioBySlug);

router.put("/:id/archive", authenticate, archivePortfolio);
router.put("/:id/unarchive", authenticate, unarchivePortfolio);

router.get("/id/:id", trackView("portfolio"), getPortfolioById);
router.put("/id/:id", authenticate, updatePortfolio);
router.delete("/id/:id", authenticate, deletePortfolio);

module.exports = router;
