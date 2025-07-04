const express = require("express");
const router = express.Router();

// Impor fungsi controller dan middleware yang diperlukan
const {
  getAllPortos,
  getPortoArchive,
  getPortoBySlug,
  createPorto,
  updatePorto,
  deletePorto,
  archivePorto,
  unarchivePorto,
} = require("../controllers/portoController"); // Pastikan path ini benar
const { authenticate } = require("../middleware/authMiddleware");
const { trackView } = require("../middleware/viewTracker");

/**
 * @route   GET /api/portos
 * @desc    Dapatkan semua item portofolio dengan filter
 * @access  Publik
 */
router.get("/", getAllPortos);

/**
 * @route   GET /api/portos/archives
 * @desc    Dapatkan data arsip portofolio
 * @access  Publik
 */
router.get("/archives", getPortoArchive);

/**
 * @route   POST /api/portos
 * @desc    Buat item portofolio baru
 * @access  Private (Admin)
 */
router.post("/", authenticate, createPorto);

/**
 * @route   PATCH /api/portos/:slug/archive
 * @desc    Mengarsipkan item portofolio
 * @access  Private (Admin)
 */
router.patch("/:slug/archive", authenticate, archivePorto);

/**
 * @route   PATCH /api/portos/:slug/unarchive
 * @desc    Mengembalikan item portofolio dari arsip
 * @access  Private (Admin)
 */
router.patch("/:slug/unarchive", authenticate, unarchivePorto);

/**
 * @route   GET /api/portos/:slug
 * @desc    Dapatkan satu item portofolio berdasarkan slug
 * @access  Publik
 */
router.get("/:slug", trackView("Portfolio"), getPortoBySlug);

/**
 * @route   PUT /api/portos/:slug
 * @desc    Perbarui item portofolio
 * @access  Private (Admin)
 */
router.put("/:slug", authenticate, updatePorto);

/**
 * @route   DELETE /api/portos/:slug
 * @desc    Hapus item portofolio
 * @access  Private (Admin)
 */
router.delete("/:slug", authenticate, deletePorto);

module.exports = router;
