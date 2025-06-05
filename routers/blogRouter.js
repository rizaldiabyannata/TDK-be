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
  searchBlogs,
} = require("../controllers/blogController");
const { trackView } = require("../middleware/viewTracker");
const { authenticate } = require("../middleware/authMiddleware");
const { uploadSingleFile } = require("../middleware/multerMiddleware");

const router = express.Router();

router.get("/search", searchBlogs);
router.get("/archived", authenticate, getArchivedBlogs);
router.post("/", authenticate, uploadSingleFile("coverImage"), createBlog);
router.get("/", getAllBlogs);

router.get("/slug/:slug", trackView("blog"), getBlogBySlug); // Ini akan menangani /api/blog/slug/test5
router.get("/tag/:tag", trackView("blog"), getBlogsByTag);

router.get("/query/:query");

router.put("/id/:id/archive", authenticate, archiveBlog);
router.put("/id/:id/unarchive", authenticate, unarchiveBlog);

router.get("/id/:id", trackView("blog"), getBlogById); // Ini akan menangani /api/blog/id/someObjectId
router.put("/id/:id", authenticate, updateBlog);
router.delete("/id/:id", authenticate, deleteBlog);

module.exports = router;
