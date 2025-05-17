const Blog = require("../models/blogModel");
const logger = require("../utils/logger");
const { ViewCount, DailyView } = require("../models/contentTrackingModel");

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
    const blog = await Blog.findOne({ slug });

    if (!blog) {
      logger.info(`Blog with slug ${slug} not found`);
      return res.status(404).json({
        success: false,
        message: "Blog post not found",
      });
    }

    const viewCount = await ViewCount.findOne({
      contentId: blog._id,
      contentType: "blog",
    });

    const viewData = {
      total: viewCount ? viewCount.total : blog.views.total,
      unique: viewCount ? viewCount.unique : blog.views.unique,
    };

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentDailyViews = await DailyView.find({
      contentId: blog._id,
      contentType: "blog",
      date: { $gte: thirtyDaysAgo },
    }).sort({ date: -1 });

    const viewHistory =
      recentDailyViews.length > 0
        ? recentDailyViews.map((item) => ({
            date: item.date,
            count: item.count,
          }))
        : blog.viewHistory;

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

    blog.title = title || blog.title;
    blog.content = content || blog.content;
    blog.author = author || blog.author;

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
};
