const Blog = require("../models/blogModel");
const logger = require("../utils/logger");
const { ViewCount, DailyView } = require("../models/viewTrackingModel");
const slugify = require("slugify");
const { deleteFile } = require("../middleware/multerMiddleware");
const redisClient = require("../config/redisConfig");

const CACHE_EXPIRY_SECONDS = 300;
const BLOG_ITEM_ID_CACHE_PREFIX = "blog_item_id:";
const BLOG_ITEM_SLUG_CACHE_PREFIX = "blog_item_slug:";
const BLOGS_LIST_ALL_CACHE_KEY = "blogs_list_all_active";
const BLOGS_LIST_ARCHIVED_CACHE_KEY = "blogs_list_archived";
const BLOGS_LIST_TAG_CACHE_PREFIX = "blogs_list_tag:";
const BLOGS_SEARCH_CACHE_PREFIX = "blogs_search:";
const BLOGS_QUERY_CACHE_PREFIX = "blogs_query:";

const clearListCaches = async (tags = []) => {
  try {
    await redisClient.delete(BLOGS_LIST_ALL_CACHE_KEY);
    await redisClient.delete(BLOGS_LIST_ARCHIVED_CACHE_KEY);
    if (tags && tags.length > 0) {
      const uniqueTags = [...new Set(tags)];
      const tagDeletePromises = uniqueTags.map((tag) =>
        redisClient.delete(`${BLOGS_LIST_TAG_CACHE_PREFIX}${tag}`)
      );
      await Promise.all(tagDeletePromises);
    }
    logger.info("Common list caches and relevant tag caches cleared.");
  } catch (error) {
    logger.error("Error clearing list/tag caches:", error);
  }
};

const createBlog = async (req, res) => {
  try {
    const { title, content, author, tags, summary } = req.body;

    if (!title || !content || !author) {
      if (req.fileUrl) {
        deleteFile(req.fileUrl.substring(1));
      }
      return res.status(400).json({
        success: false,
        message: "Required fields are missing",
      });
    }

    let processedTags = [];
    if (tags) {
      if (Array.isArray(tags)) {
        processedTags = tags;
      } else {
        try {
          processedTags = JSON.parse(tags);
        } catch (e) {
          processedTags = tags.split(",").map((tag) => tag.trim());
        }
      }
    }

    const blogData = {
      title,
      content,
      author,
      summary: summary || "",
      tags: processedTags,
    };

    if (req.fileUrl) {
      blogData.coverImage = req.fileUrl;
    }

    const newBlog = new Blog(blogData);
    const savedBlog = await newBlog.save();

    await clearListCaches(savedBlog.tags);

    logger.info(`Blog created: ${savedBlog.title} (${savedBlog._id})`);

    return res.status(201).json({
      success: true,
      data: savedBlog,
    });
  } catch (error) {
    if (req.fileUrl) {
      deleteFile(req.fileUrl.substring(1));
    }
    logger.error(`Error creating blog: ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      message: "Failed to create blog post",
      error: error.message,
    });
  }
};

const getAllBlogs = async (req, res) => {
  const cacheKey = BLOGS_LIST_ALL_CACHE_KEY;
  try {
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      logger.info(`Cache hit for getAllBlogs: ${cacheKey}`);
      const blogs = JSON.parse(cachedData);
      return res.status(200).json({
        success: true,
        count: blogs.length,
        data: blogs,
      });
    }

    logger.info(`Cache miss for getAllBlogs: ${cacheKey}. Fetching from DB.`);

    const blogs = await Blog.find({ isArchived: { $ne: true } })
      .sort({ createdAt: -1 })
      .lean();

    await redisClient.set(
      cacheKey,
      JSON.stringify(blogs),
      CACHE_EXPIRY_SECONDS
    );

    logger.info(`Retrieved ${blogs.length} active blog posts`);
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
  const { slug } = req.params;
  const cacheKey = `${BLOG_ITEM_SLUG_CACHE_PREFIX}${slug}`;

  try {
    if (!Blog || typeof Blog.findOne !== "function") {
      logger.error("Blog model is not properly imported");
      return res.status(500).json({
        success: false,
        message: "Server configuration error",
        error: "Model not available",
      });
    }

    let blogForProcessing;
    const cachedBlog = await redisClient.get(cacheKey);

    if (cachedBlog) {
      logger.info(`Cache hit for blog slug: ${slug}`);
      blogForProcessing = JSON.parse(cachedBlog);
    } else {
      logger.info(`Cache miss for blog slug: ${slug}. Fetching from DB.`);
      const dbBlog = await Blog.findOne({ slug }).lean();
      if (!dbBlog) {
        logger.info(`Blog with slug ${slug} not found`);
        return res.status(404).json({
          success: false,
          message: "Blog post not found",
        });
      }
      blogForProcessing = dbBlog;
      await redisClient.set(
        cacheKey,
        JSON.stringify(blogForProcessing),
        CACHE_EXPIRY_SECONDS
      );
    }

    let viewData = {
      total: blogForProcessing.views?.total || 0,
      unique: blogForProcessing.views?.unique || 0,
    };
    if (ViewCount && typeof ViewCount.findOne === "function") {
      const viewCount = await ViewCount.findOne({
        contentId: blogForProcessing._id,
        contentType: "blog",
      });
      if (viewCount) {
        viewData = { total: viewCount.total, unique: viewCount.unique };
      }
    }

    let viewHistory = blogForProcessing.viewHistory || [];
    if (DailyView && typeof DailyView.find === "function") {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentDailyViews = await DailyView.find({
        contentId: blogForProcessing._id,
        contentType: "blog",
        date: { $gte: thirtyDaysAgo },
      })
        .sort({ date: -1 })
        .lean();
      if (recentDailyViews && recentDailyViews.length > 0) {
        viewHistory = recentDailyViews.map((item) => ({
          date: item.date,
          count: item.count,
        }));
      }
    }

    logger.info(
      `Retrieved blog: ${blogForProcessing.title} (${blogForProcessing._id})`
    );

    const finalBlogData = {
      ...blogForProcessing,
      views: viewData,
      viewHistory: viewHistory,
    };

    return res.status(200).json({
      success: true,
      data: finalBlogData,
    });
  } catch (error) {
    logger.error(`Error fetching blog by slug: ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      message: "Failed to fetch blog post",
      error: error.message,
    });
  }
};

const getBlogById = async (req, res) => {
  const { id } = req.params;
  const cacheKey = `${BLOG_ITEM_ID_CACHE_PREFIX}${id}`;
  try {
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      logger.info(`Cache hit for getBlogById: ${id}`);
      const blog = JSON.parse(cachedData);
      return res.status(200).json({
        success: true,
        data: blog,
      });
    }

    logger.info(`Cache miss for getBlogById: ${id}. Fetching from DB.`);
    const blog = await Blog.findById(id).lean();

    if (!blog) {
      logger.info(`Blog with ID ${id} not found`);
      return res.status(404).json({
        success: false,
        message: "Blog post not found",
      });
    }

    await redisClient.set(cacheKey, JSON.stringify(blog), CACHE_EXPIRY_SECONDS);
    logger.info(`Retrieved blog: ${blog.title} (${blog._id})`);
    return res.status(200).json({
      success: true,
      data: blog,
    });
  } catch (error) {
    logger.error(`Error fetching blog by ID: ${error.message}`, { error });
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
    const { title, content, author, tags, summary } = req.body;

    const blogToUpdate = await Blog.findById(id);

    if (!blogToUpdate) {
      logger.info(`Blog with ID ${id} not found for update`);
      if (req.fileUrl) deleteFile(req.fileUrl.substring(1));
      return res.status(404).json({
        success: false,
        message: "Blog post not found",
      });
    }

    const oldSlug = blogToUpdate.slug;
    const oldTags = [...blogToUpdate.tags];
    const oldCoverImage = blogToUpdate.coverImage;

    blogToUpdate.title = title || blogToUpdate.title;
    blogToUpdate.content = content || blogToUpdate.content;
    blogToUpdate.author = author || blogToUpdate.author;
    blogToUpdate.summary =
      summary !== undefined ? summary : blogToUpdate.summary;

    if (title && title !== oldSlug) {
      blogToUpdate.slug = slugify(blogToUpdate.title, {
        lower: true,
        strict: true,
        trim: true,
      });
    }

    if (tags) {
      if (Array.isArray(tags)) {
        blogToUpdate.tags = tags;
      } else {
        try {
          blogToUpdate.tags = JSON.parse(tags);
        } catch (e) {
          blogToUpdate.tags = tags.split(",").map((tag) => tag.trim());
        }
      }
    }

    if (req.fileUrl) {
      blogToUpdate.coverImage = req.fileUrl;

      if (oldCoverImage && oldCoverImage !== req.fileUrl) {
        deleteFile(oldCoverImage.substring(1));
      }
    }

    blogToUpdate.updatedAt = Date.now();
    const updatedBlog = await blogToUpdate.save();

    await redisClient.delete(`${BLOG_ITEM_ID_CACHE_PREFIX}${updatedBlog._id}`);
    if (oldSlug !== updatedBlog.slug) {
      await redisClient.delete(`${BLOG_ITEM_SLUG_CACHE_PREFIX}${oldSlug}`);
    }
    await redisClient.delete(
      `${BLOG_ITEM_SLUG_CACHE_PREFIX}${updatedBlog.slug}`
    );

    const allAffectedTags = [...new Set([...oldTags, ...updatedBlog.tags])];
    await clearListCaches(allAffectedTags);

    logger.info(`Blog updated: ${updatedBlog.title} (${updatedBlog._id})`);
    return res.status(200).json({
      success: true,
      data: updatedBlog,
    });
  } catch (error) {
    logger.error(`Error updating blog: ${error.message}`, { error });

    if (req.fileUrl) {
      deleteFile(req.fileUrl.substring(1));
    }
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

    if (blog.coverImage) {
      deleteFile(blog.coverImage.substring(1));
    }

    await redisClient.delete(`${BLOG_ITEM_ID_CACHE_PREFIX}${blog._id}`);
    await redisClient.delete(`${BLOG_ITEM_SLUG_CACHE_PREFIX}${blog.slug}`);
    await clearListCaches(blog.tags);

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
  const { tag } = req.params;

  const normalizedTag = tag.toLowerCase();
  const cacheKey = `${BLOGS_LIST_TAG_CACHE_PREFIX}${normalizedTag}`;
  try {
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      logger.info(`Cache hit for getBlogsByTag: ${normalizedTag}`);
      const blogs = JSON.parse(cachedData);
      return res.status(200).json({
        success: true,
        count: blogs.length,
        data: blogs,
      });
    }

    logger.info(
      `Cache miss for getBlogsByTag: ${normalizedTag}. Fetching from DB.`
    );

    const blogs = await Blog.find({
      tags: { $regex: new RegExp(`^${normalizedTag}$`, "i") },
      isArchived: { $ne: true },
    })
      .sort({ createdAt: -1 })
      .lean();

    await redisClient.set(
      cacheKey,
      JSON.stringify(blogs),
      CACHE_EXPIRY_SECONDS
    );

    logger.info(`Retrieved ${blogs.length} blogs with tag: ${normalizedTag}`);
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

    if (blog.isArchived) {
      logger.info(`Blog ${blog.title} (${id}) is already archived.`);
      return res.status(200).json({
        success: true,
        message: "Blog post is already archived.",
        data: blog,
      });
    }

    blog.isArchived = true;
    blog.updatedAt = Date.now();
    const archivedBlog = await blog.save();

    await redisClient.delete(`${BLOG_ITEM_ID_CACHE_PREFIX}${archivedBlog._id}`);
    await redisClient.delete(
      `${BLOG_ITEM_SLUG_CACHE_PREFIX}${archivedBlog.slug}`
    );
    await clearListCaches(archivedBlog.tags);

    logger.info(`Blog archived: ${archivedBlog.title} (${archivedBlog._id})`);
    return res.status(200).json({
      success: true,
      message: "Blog post archived successfully",
      data: archivedBlog,
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

    if (!blog.isArchived) {
      logger.info(`Blog ${blog.title} (${id}) is not archived.`);
      return res.status(200).json({
        success: true,
        message: "Blog post is already not archived.",
        data: blog,
      });
    }

    blog.isArchived = false;
    blog.updatedAt = Date.now();
    const unarchivedBlog = await blog.save();

    await redisClient.delete(
      `${BLOG_ITEM_ID_CACHE_PREFIX}${unarchivedBlog._id}`
    );
    await redisClient.delete(
      `${BLOG_ITEM_SLUG_CACHE_PREFIX}${unarchivedBlog.slug}`
    );
    await clearListCaches(unarchivedBlog.tags);

    logger.info(
      `Blog unarchived: ${unarchivedBlog.title} (${unarchivedBlog._id})`
    );
    return res.status(200).json({
      success: true,
      message: "Blog post unarchived successfully",
      data: unarchivedBlog,
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
  const cacheKey = BLOGS_LIST_ARCHIVED_CACHE_KEY;
  try {
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      logger.info(`Cache hit for getArchivedBlogs: ${cacheKey}`);
      const archivedBlogs = JSON.parse(cachedData);
      return res.status(200).json({
        success: true,
        count: archivedBlogs.length,
        data: archivedBlogs,
      });
    }

    logger.info(
      `Cache miss for getArchivedBlogs: ${cacheKey}. Fetching from DB.`
    );
    const archivedBlogs = await Blog.find({ isArchived: true })
      .sort({ updatedAt: -1 })
      .lean();

    await redisClient.set(
      cacheKey,
      JSON.stringify(archivedBlogs),
      CACHE_EXPIRY_SECONDS
    );

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
      tags: queryTags,
      sortBy = "createdAt",
      sortOrder = -1,
      page = 1,
      limit = 10,
    } = req.query;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    let tagsForCacheKey = "";
    if (queryTags) {
      const tagArray = Array.isArray(queryTags)
        ? queryTags
        : queryTags.split(",").map((t) => t.trim().toLowerCase());
      tagsForCacheKey = tagArray.sort().join(",");
    }

    const cacheKey = `${BLOGS_SEARCH_CACHE_PREFIX}q=${
      query || ""
    }:tags=${tagsForCacheKey}:sortBy=${sortBy}:sortOrder=${sortOrder}:page=${pageNum}:limit=${limitNum}`;

    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      logger.info(`Cache hit for searchBlogs: ${cacheKey}`);
      return res.status(200).json({
        success: true,
        data: JSON.parse(cachedData),
      });
    }
    logger.info(`Cache miss for searchBlogs: ${cacheKey}. Fetching from DB.`);

    let baseQuery = { isArchived: false };
    let useTextSearch = false;
    let projection = {};

    if (query && query.trim() !== "") {
      try {
        await Blog.countDocuments({ $text: { $search: "test" } }).limit(1);
        useTextSearch = true;
      } catch (error) {
        useTextSearch = false;
        logger.info(
          "Text index not available or error checking for it, using regex search."
        );
      }

      const searchTerms = query.trim();
      if (useTextSearch) {
        baseQuery.$text = { $search: searchTerms };
        projection.score = { $meta: "textScore" };
      } else {
        const regex = { $regex: searchTerms, $options: "i" };
        baseQuery.$or = [
          { title: regex },
          { summary: regex },
          { content: regex },
        ];
      }
    }

    if (queryTags) {
      const tagArray = Array.isArray(queryTags)
        ? queryTags
        : queryTags.split(",").map((tag) => tag.trim());
      if (tagArray.length > 0) {
        baseQuery.tags = {
          $in: tagArray.map((tag) => new RegExp(`^${tag}$`, "i")),
        };
      }
    }

    const sortOptions = {};
    if (useTextSearch && query && sortBy === "relevance") {
      sortOptions.score = { $meta: "textScore" };
    } else {
      sortOptions[sortBy] = parseInt(sortOrder, 10) === 1 ? 1 : -1;
    }

    const blogs = await Blog.find(baseQuery, projection)
      .select(
        "title slug summary coverImage tags createdAt views likes isArchived"
      )
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await Blog.countDocuments(baseQuery);
    const responseData = {
      blogs,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    };

    await redisClient.set(
      cacheKey,
      JSON.stringify(responseData),
      CACHE_EXPIRY_SECONDS
    );

    return res.status(200).json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    logger.error(`Error searching blogs: ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      message: "Error searching blogs",
      error: error.message,
    });
  }
};

const queryBlogs = async (req, res) => {
  try {
    const { query } = req.params;
    const { page = 1, limit = 8 } = req.query;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 8;
    const skip = (pageNum - 1) * limitNum;

    const cacheKey = `${BLOGS_QUERY_CACHE_PREFIX}q=${
      query || ""
    }:page=${pageNum}:limit=${limitNum}`;
    const cachedData = await redisClient.get(cacheKey);

    if (cachedData) {
      logger.info(`Cache hit for queryBlogs: ${cacheKey}`);
      return res.status(200).json({
        success: true,
        data: JSON.parse(cachedData),
      });
    }
    logger.info(`Cache miss for queryBlogs: ${cacheKey}. Fetching from DB.`);

    const regexQuery = { $regex: query, $options: "i" };
    const baseQuery = {
      $or: [
        { title: regexQuery },
        { content: regexQuery },
        { summary: regexQuery },
      ],
      isArchived: { $ne: true },
    };

    const blogs = await Blog.find(baseQuery)
      .select("title slug summary coverImage tags createdAt views likes")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await Blog.countDocuments(baseQuery);
    const responseData = {
      blogs,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    };

    await redisClient.set(
      cacheKey,
      JSON.stringify(responseData),
      CACHE_EXPIRY_SECONDS
    );

    return res.status(200).json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    logger.error(`Error querying blogs: ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      message: "Failed to query blogs",
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
  queryBlogs,
};
