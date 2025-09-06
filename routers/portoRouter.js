import express from "express";
const router = express.Router();
import { param } from "express-validator";

import {
  getAllPortos,
  getPortoArchive,
  getPortoBySlug,
  createPorto,
  updatePorto,
  deletePorto,
  archivePorto,
  unarchivePorto,
} from "../controllers/portoController.js";

import { protect, optionalAuth } from "../middleware/authMiddleware.js";
import { trackView } from "../middleware/viewTracker.js";
import {
  uploadSingleFile,
  uploadSingleFileOptional,
  convertToWebp,
} from "../middleware/multerMiddleware.js";
import { validate } from "../middleware/validationMiddleware.js";

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
