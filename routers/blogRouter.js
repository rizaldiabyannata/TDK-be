const express = require("express");
const {
  createBlog,
  getAllBlogs,
  getBlogBySlug,
  getBlogById,
  updateBlog,
  deleteBlog,
  getBlogsByTag,
  getArchivedBlogs,
  archiveBlog,
  unarchiveBlog,
} = require("../controllers/blogController"); // Adjust path as needed
const { trackView } = require("../middleware/viewTracker");
const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

// CREATE - Create a new blog post
router.post("/", authenticate, createBlog);

// READ - Get all blog posts
router.get("/", getAllBlogs);

// READ - Get a single blog post by slug
router.get("/slug/:slug", trackView("blog"), getBlogBySlug);

// READ - Get a single blog post by ID
router.get("/:id", trackView("blog"), getBlogById);

// UPDATE - Update a blog post
router.put("/:id", authenticate, updateBlog);

// DELETE - Delete a blog post
router.delete("/:id", authenticate, deleteBlog);

// READ - Get blogs by tag
router.get("/tag/:tag", trackView("blog"), getBlogsByTag);

// READ - Get all archived blogs
router.get("/archived", authenticate, getArchivedBlogs);

// UPDATE - Archive a blog post
router.put("/:id/archive", authenticate, archiveBlog);

// UPDATE - Unarchive a blog post
router.put("/:id/unarchive", authenticate, unarchiveBlog);

module.exports = router;
