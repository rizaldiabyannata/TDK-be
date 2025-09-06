import { Router } from "express";
const router = Router();
import { param } from "express-validator";

import portoController from "../controllers/portoController.js";
const {
  getAllPortos, getPortoArchive, getPortoBySlug, createPorto, updatePorto, deletePorto, archivePorto, unarchivePorto,
} = portoController;

import _default from "../middleware/authMiddleware.js";
const { protect, optionalAuth } = _default;
import __default from "../middleware/viewTracker.js";
const { trackView } = __default;
import ___default from "../middleware/multerMiddleware.js";
const {
  uploadSingleFile, uploadSingleFileOptional, convertToWebp,
} = ___default;
import ____default from "../middleware/validationMiddleware.js";
const { validate } = ____default;

const slugValidation = [param("slug").isSlug(), validate];

/**
 * @route   GET /api/portos
 * @desc    Dapatkan semua item portofolio dengan filter (status, search, pagination)
 * @access  Publik
 */
router.get("/", optionalAuth, getAllPortos);

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
router.patch("/:slug/archive", protect, slugValidation, archivePorto);

/**
 * @route   PATCH /api/portos/:slug/unarchive
 * @desc    Mengembalikan item portofolio dari arsip
 * @access  Private (Admin)
 */
router.patch("/:slug/unarchive", protect, slugValidation, unarchivePorto);

/**
 * @route   GET /api/portos/:slug
 * @desc    Dapatkan satu item portofolio berdasarkan slug
 * @access  Publik
 */
router.get(
  "/:slug",
  optionalAuth,
  slugValidation,
  trackView("Portfolio"),
  getPortoBySlug
);

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
  slugValidation,
  updatePorto
);

/**
 * @route   DELETE /api/portos/:slug
 * @desc    Hapus item portofolio
 * @access  Private (Admin)
 */
router.delete("/:slug", protect, slugValidation, deletePorto);

export default router;
