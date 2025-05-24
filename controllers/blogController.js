const Blog = require("../models/blogModel");
const logger = require("../utils/logger");
const { ViewCount, DailyView } = require("../models/viewTrackingModel");
const slugify = require("slugify");

const createBlog = async (req, res) => {
  try {
    const { title, content, author, tags } = req.body;

    if (!title || !content || !author) {
      return res.status(400).json({
        success: false,
        message: "Required fields (title, content, author) are missing",
      });
    }

    const newBlog = new Blog({
      title,
      content,
      author,
      tags: tags || [],
    });

    const savedBlog = await newBlog.save();

    logger.info(`Blog created: ${savedBlog.title} (${savedBlog._id})`);

    return res.status(201).json({
      success: true,
      data: savedBlog,
    });
  } catch (error) {
    logger.error(`Error creating blog: ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      message: "Failed to create blog post",
      error: error.message,
    });
  }
};

const getAllBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });

    logger.info(`Retrieved ${blogs.length} blog posts`);

    return res.status(200).json({
      success: true,
      count: blogs.length,
      data: blogs,
    });
  } catch (error) {
    logger.error(`Error fetching blogs: ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      message: "Failed to fetch blog posts",
      error: error.message,
    });
  }
};

const getBlogBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    // Validasi bahwa model tersedia
    if (!Blog || typeof Blog.findOne !== "function") {
      logger.error("Blog model is not properly imported");
      return res.status(500).json({
        success: false,
        message: "Server configuration error",
        error: "Model not available",
      });
    }

    const blog = await Blog.findOne({ slug });

    if (!blog) {
      logger.info(`Blog with slug ${slug} not found`);
      return res.status(404).json({
        success: false,
        message: "Blog post not found",
      });
    }

    // Handle view count with appropriate validation
    let viewData = { total: blog.views.total, unique: blog.views.unique };
    if (ViewCount && typeof ViewCount.findOne === "function") {
      const viewCount = await ViewCount.findOne({
        contentId: blog._id,
        contentType: "blog",
      });

      if (viewCount) {
        viewData = {
          total: viewCount.total,
          unique: viewCount.unique,
        };
      }
    }

    // Handle view history with appropriate validation
    let viewHistory = blog.viewHistory || [];
    if (DailyView && typeof DailyView.find === "function") {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentDailyViews = await DailyView.find({
        contentId: blog._id,
        contentType: "blog",
        date: { $gte: thirtyDaysAgo },
      }).sort({ date: -1 });

      if (recentDailyViews && recentDailyViews.length > 0) {
        viewHistory = recentDailyViews.map((item) => ({
          date: item.date,
          count: item.count,
        }));
      }
    }

    logger.info(`Retrieved blog: ${blog.title} (${blog._id})`);

    const blogData = blog.toObject();
    blogData.views = viewData;
    blogData.viewHistory = viewHistory;

    return res.status(200).json({
      success: true,
      data: blogData,
    });
  } catch (error) {
    logger.error(`Error fetching blog: ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      message: "Failed to fetch blog post",
      error: error.message,
    });
  }
};

const getBlogById = async (req, res) => {
  try {
    const { id } = req.params;

    const blog = await Blog.findById(id);

    if (!blog) {
      logger.info(`Blog with ID ${id} not found`);
      return res.status(404).json({
        success: false,
        message: "Blog post not found",
      });
    }

    logger.info(`Retrieved blog: ${blog.title} (${blog._id})`);

    return res.status(200).json({
      success: true,
      data: blog,
    });
  } catch (error) {
    logger.error(`Error fetching blog: ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      message: "Failed to fetch blog post",
      error: error.message,
    });
  }
};

const updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, author, tags } = req.body;

    let blog = await Blog.findById(id);

    if (!blog) {
      logger.info(`Blog with ID ${id} not found for update`);
      return res.status(404).json({
        success: false,
        message: "Blog post not found",
      });
    }

    // Cek apakah title diubah
    const titleChanged = title && title !== blog.title;

    blog.title = title || blog.title;
    blog.content = content || blog.content;
    blog.author = author || blog.author;

    // Jika title diubah, update slug juga menggunakan slugify
    if (titleChanged) {
      blog.slug = slugify(blog.title, {
        lower: true, // Mengubah ke huruf kecil
        strict: true, // Menghapus karakter khusus
        trim: true, // Menghapus spasi di awal dan akhir
      });
    }

    if (tags) {
      blog.tags = tags;
    }

    blog.updatedAt = Date.now();

    const updatedBlog = await blog.save();

    logger.info(`Blog updated: ${updatedBlog.title} (${updatedBlog._id})`);

    return res.status(200).json({
      success: true,
      data: updatedBlog,
    });
  } catch (error) {
    logger.error(`Error updating blog: ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      message: "Failed to update blog post",
      error: error.message,
    });
  }
};

const deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;

    const blog = await Blog.findByIdAndDelete(id);

    if (!blog) {
      logger.info(`Blog with ID ${id} not found for deletion`);
      return res.status(404).json({
        success: false,
        message: "Blog post not found",
      });
    }

    logger.info(`Blog deleted: ${blog.title} (${blog._id})`);

    return res.status(200).json({
      success: true,
      message: "Blog post deleted successfully",
      data: blog,
    });
  } catch (error) {
    logger.error(`Error deleting blog: ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      message: "Failed to delete blog post",
      error: error.message,
    });
  }
};

const getBlogsByTag = async (req, res) => {
  try {
    const { tag } = req.params;

    const blogs = await Blog.find({ tags: tag }).sort({ createdAt: -1 });

    logger.info(`Retrieved ${blogs.length} blogs with tag: ${tag}`);

    return res.status(200).json({
      success: true,
      count: blogs.length,
      data: blogs,
    });
  } catch (error) {
    logger.error(`Error fetching blogs by tag: ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      message: "Failed to fetch blogs by tag",
      error: error.message,
    });
  }
};

const archiveBlog = async (req, res) => {
  try {
    const { id } = req.params;

    const blog = await Blog.findById(id);

    if (!blog) {
      logger.info(`Blog with ID ${id} not found for archiving`);
      return res.status(404).json({
        success: false,
        message: "Blog post not found",
      });
    }

    blog.isArchived = true;
    blog.updatedAt = Date.now();
    await blog.save();

    logger.info(`Blog archived: ${blog.title} (${blog._id})`);

    return res.status(200).json({
      success: true,
      message: "Blog post archived successfully",
      data: blog,
    });
  } catch (error) {
    logger.error(`Error archiving blog: ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      message: "Failed to archive blog post",
      error: error.message,
    });
  }
};

const unarchiveBlog = async (req, res) => {
  try {
    const { id } = req.params;

    const blog = await Blog.findById(id);

    if (!blog) {
      logger.info(`Blog with ID ${id} not found for unarchiving`);
      return res.status(404).json({
        success: false,
        message: "Blog post not found",
      });
    }

    blog.isArchived = false;
    blog.updatedAt = Date.now();
    await blog.save();

    logger.info(`Blog unarchived: ${blog.title} (${blog._id})`);

    return res.status(200).json({
      success: true,
      message: "Blog post unarchived successfully",
      data: blog,
    });
  } catch (error) {
    logger.error(`Error unarchiving blog: ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      message: "Failed to unarchive blog post",
      error: error.message,
    });
  }
};

const getArchivedBlogs = async (req, res) => {
  try {
    const archivedBlogs = await Blog.find({ isArchived: true }).sort({
      updatedAt: -1,
    });

    logger.info(`Retrieved ${archivedBlogs.length} archived blog posts`);

    return res.status(200).json({
      success: true,
      count: archivedBlogs.length,
      data: archivedBlogs,
    });
  } catch (error) {
    logger.error(`Error fetching archived blogs: ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      message: "Failed to fetch archived blog posts",
      error: error.message,
    });
  }
};

const searchBlogs = async (req, res) => {
  try {
    const {
      query,
      tags,
      sortBy = "createdAt",
      sortOrder = -1,
      page = 1,
      limit = 10,
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Base query always excludes archived blogs
    let baseQuery = { isArchived: false };
    let useTextSearch = false;

    // Only test for text index if we have a search query
    if (query && query.trim() !== "") {
      try {
        // This is a lightweight way to check if text index exists
        await Blog.countDocuments({ $text: { $search: "test" } }).limit(1);
        useTextSearch = true;
      } catch (error) {
        useTextSearch = false;
      }

      const searchTerms = query.trim();

      if (useTextSearch) {
        // Use text search if available
        baseQuery.$text = { $search: searchTerms };
      } else {
        // Otherwise use regex search
        baseQuery.$or = [
          { title: { $regex: searchTerms, $options: "i" } },
          { summary: { $regex: searchTerms, $options: "i" } },
          { content: { $regex: searchTerms, $options: "i" } },
        ];
      }
    }

    // Add tags filter if specified
    if (tags) {
      const tagArray = Array.isArray(tags)
        ? tags
        : tags.split(",").map((tag) => tag.trim());
      baseQuery.tags = { $in: tagArray };
    }

    // Set up sort options
    const sortOptions = {};

    if (useTextSearch && query && sortBy === "relevance") {
      // Sort by text score if using text search and relevance sorting
      sortOptions.score = { $meta: "textScore" };
    } else {
      // Otherwise sort by the specified field
      sortOptions[sortBy] = parseInt(sortOrder);
    }

    // Set up projection for text score if needed
    const projection =
      useTextSearch && query ? { score: { $meta: "textScore" } } : {};

    // Execute query
    const blogs = await Blog.find(baseQuery, projection)
      .select("title slug summary coverImage tags createdAt views likes")
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    const total = await Blog.countDocuments(baseQuery);

    return res.status(200).json({
      success: true,
      data: {
        blogs,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error("Error searching blogs:", error);
    return res.status(500).json({
      success: false,
      message: "Error searching blogs",
      error: error.message,
    });
  }
};

module.exports = {
  createBlog,
  getAllBlogs,
  getBlogBySlug,
  getBlogById,
  updateBlog,
  deleteBlog,
  getBlogsByTag,
  getArchivedBlogs,
  unarchiveBlog,
  archiveBlog,
  searchBlogs,
};
