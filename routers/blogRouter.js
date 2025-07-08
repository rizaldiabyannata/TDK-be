const express = require("express");
const router = express.Router();

// Impor fungsi controller dan middleware yang diperlukan
const {
  getAllBlogs,
  getBlogArchive,
  getBlogBySlug,
  createBlog,
  updateBlog,
  deleteBlog,
  archiveBlog,
  unarchiveBlog,
} = require("../controllers/blogController"); // Pastikan path ini benar
const { protect, optionalAuth } = require("../middleware/authMiddleware");
const { trackView } = require("../middleware/viewTracker");
const {
  uploadSingleFile,
  convertToWebp,
  uploadSingleFileOptional,
} = require("../middleware/multerMiddleware");

/**
 * @route   GET /api/blogs
 * @desc    Dapatkan semua artikel blog dengan filter
 * @access  Publik
 */
router.get("/", getAllBlogs);

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
router.patch("/:slug/archive", protect, archiveBlog);

/**
 * @route   PATCH /api/blogs/:slug/unarchive
 * @desc    Mengembalikan artikel blog dari arsip
 * @access  Private (Admin)
 */
router.patch("/:slug/unarchive", protect, unarchiveBlog);

/**
 * @route   GET /api/blogs/:slug
 * @desc    Dapatkan satu artikel blog berdasarkan slug
 * @access  Publik
 */
router.get("/:slug", optionalAuth, trackView("Blog"), getBlogBySlug);

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
  updateBlog
);

/**
 * @route   DELETE /api/blogs/:slug
 * @desc    Hapus artikel blog
 * @access  Private (Admin)
 */
router.delete("/:slug", protect, deleteBlog);

module.exports = router;
