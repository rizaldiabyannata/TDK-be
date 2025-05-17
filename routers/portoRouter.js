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
} = require("../controllers/portoController"); // Adjust path as needed

const { trackView } = require("../middleware/viewTracker");

// CREATE - Create a new portfolio
router.post("/", createPortfolio);

// READ - Get all portfolio items
router.get("/", getAllPortfolios);

// READ - Get a single portfolio item by slug
router.get("/slug/:slug", trackView, getPortfolioBySlug);

// READ - Get a single portfolio item by ID
router.get("/:id", getPortfolioById);

// UPDATE - Update a portfolio item
router.put("/:id", updatePortfolio);

// DELETE - Delete a portfolio item
router.delete("/:id", deletePortfolio);

// READ - Get all archived portfolios
router.get("/archived", getArchivedPortfolios);

// UPDATE - Archive a portfolio item
router.put("/:id/archive", archivePortfolio);

// UPDATE - Unarchive a portfolio item
router.put("/:id/unarchive", unarchivePortfolio);

module.exports = router;
