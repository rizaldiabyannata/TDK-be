import { Router } from "express";
const router = Router();
import { param } from "express-validator";

// Impor fungsi controller dan middleware yang diperlukan
import blogController from "../controllers/blogController.js";
const {
  getAllBlogs, getBlogArchive, getBlogBySlug, createBlog, updateBlog, deleteBlog, archiveBlog, unarchiveBlog,
} = blogController;
import _default from "../middleware/authMiddleware.js";
const { protect, optionalAuth } = _default;
import __default from "../middleware/viewTracker.js";
const { trackView } = __default;
import ___default from "../middleware/multerMiddleware.js";
const {
  uploadSingleFile, convertToWebp, uploadSingleFileOptional,
} = ___default;
import ____default from "../middleware/validationMiddleware.js";
const { validate } = ____default;

const slugValidation = [param("slug").isSlug(), validate];

/**
 * @route   GET /api/blogs
 * @desc    Dapatkan semua artikel blog dengan filter
 * @access  Publik
 */
router.get("/", optionalAuth, getAllBlogs);

/**
 * @route   GET /api/blogs/archives
 * @desc    Dapatkan data arsip blog
 * @access  Publik
 */
router.get("/archives", getBlogArchive);

/**
 * @route   POST /api/blogs
 * @desc    Buat artikel blog baru
 * @access  Private (Admin)
 */
router.post(
  "/",
  protect,
  uploadSingleFile("coverImage"),
  convertToWebp,
  createBlog
);

/**
 * @route   PATCH /api/blogs/:slug/archive
 * @desc    Mengarsipkan artikel blog
 * @access  Private (Admin)
 */
router.patch("/:slug/archive", protect, slugValidation, archiveBlog);

/**
 * @route   PATCH /api/blogs/:slug/unarchive
 * @desc    Mengembalikan artikel blog dari arsip
 * @access  Private (Admin)
 */
router.patch("/:slug/unarchive", protect, slugValidation, unarchiveBlog);

/**
 * @route   GET /api/blogs/:slug
 * @desc    Dapatkan satu artikel blog berdasarkan slug
 * @access  Publik
 */
router.get(
  "/:slug",
  optionalAuth,
  slugValidation,
  trackView("Blog"),
  getBlogBySlug
);

/**
 * @route   PUT /api/blogs/:slug
 * @desc    Perbarui artikel blog
 * @access  Private (Admin)
 */
router.put(
  "/:slug",
  protect,
  uploadSingleFileOptional("coverImage"),
  convertToWebp,
  slugValidation,
  updateBlog
);

/**
 * @route   DELETE /api/blogs/:slug
 * @desc    Hapus artikel blog
 * @access  Private (Admin)
 */
router.delete("/:slug", protect, slugValidation, deleteBlog);

export default router;
