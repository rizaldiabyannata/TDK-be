const express = require("express");
const router = express.Router();

const {
  getAllPortos,
  getPortoArchive,
  getPortoBySlug,
  createPorto,
  updatePorto,
  deletePorto,
  archivePorto,
  unarchivePorto,
} = require("../controllers/portoController");

const { protect } = require("../middleware/authMiddleware");
const { trackView } = require("../middleware/viewTracker");
const {
  uploadSingleFile,
  uploadSingleFileOptional,
  convertToWebp,
} = require("../middleware/multerMiddleware");

/**
 * @route   GET /api/portos
 * @desc    Dapatkan semua item portofolio dengan filter (status, search, pagination)
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
router.post(
  "/",
  protect,
  uploadSingleFile("coverImage"),
  convertToWebp,
  createPorto
);

/**
 * @route   PATCH /api/portos/:slug/archive
 * @desc    Mengarsipkan item portofolio
 * @access  Private (Admin)
 */
router.patch("/:slug/archive", protect, archivePorto);

/**
 * @route   PATCH /api/portos/:slug/unarchive
 * @desc    Mengembalikan item portofolio dari arsip
 * @access  Private (Admin)
 */
router.patch("/:slug/unarchive", protect, unarchivePorto);

/**
 * @route   GET /api/portos/:slug
 * @desc    Dapatkan satu item portofolio berdasarkan slug
 * @access  Publik
 */
router.get("/:slug", trackView("Portfolio"), getPortoBySlug);

/**
 * @route   PUT /api/portos/:slug
 * @desc    Perbarui item portofolio (gambar opsional)
 * @access  Private (Admin)
 */
router.put(
  "/:slug",
  protect,
  uploadSingleFileOptional("coverImage"),
  convertToWebp,
  updatePorto
);

/**
 * @route   DELETE /api/portos/:slug
 * @desc    Hapus item portofolio
 * @access  Private (Admin)
 */
router.delete("/:slug", protect, deletePorto);

module.exports = router;
