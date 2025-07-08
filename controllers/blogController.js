const Blog = require("../models/blogModel");
const redisClient = require("../config/redisConfig");
const logger = require("../utils/logger");
const imageService = require("../services/imageService");
const { sanitizeRichText } = require("../services/sanitizerService");
const { default: slugify } = require("slugify");

const CACHE_KEY_PREFIX_BLOG = "blog:";
const CACHE_KEY_ARCHIVE = "blogArchive";

const getFromDbOrCache = async (cacheKey, dbQuery) => {
  if (await redisClient.isConnected()) {
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      logger.info(`Cache HIT untuk kunci: ${cacheKey}`);

      return cachedData;
    }
  } else {
    logger.warn("Redis client tidak siap, cache dilewati.");
  }

  logger.info(`Cache MISS untuk kunci: ${cacheKey}. Mengambil dari DB.`);
  const dbData = await dbQuery();

  if ((await redisClient.isConnected()) && dbData) {
    const expiry = cacheKey.includes("Archive") ? 21600 : 3600;

    await redisClient.set(cacheKey, dbData, { EX: expiry });
  }

  return dbData;
};

const invalidateBlogCache = async (slug = null) => {
  if (!redisClient.isConnected()) {
    logger.warn("Redis client tidak siap, tidak dapat menghapus cache.");
    return;
  }
  try {
    await redisClient.del(CACHE_KEY_ARCHIVE);
    logger.info(`Cache dihapus untuk kunci: ${CACHE_KEY_ARCHIVE}`);

    if (slug) {
      await redisClient.del(`${CACHE_KEY_PREFIX_BLOG}${slug}`);
      logger.info(`Cache dihapus untuk kunci: ${CACHE_KEY_PREFIX_BLOG}${slug}`);
    }
  } catch (error) {
    logger.error(`Gagal menghapus cache: ${error.message}`);
  }
};

const getAllBlogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 5;
    const searchTerm = req.query.search || "";
    const status = req.query.status || "active";
    const skip = (page - 1) * limit;

    const filter = {};
    if (status === "active") {
      filter.isArchived = false;
    } else if (status === "archived") {
      filter.isArchived = true;
    }

    if (searchTerm) {
      filter.$or = [
        { title: { $regex: searchTerm, $options: "i" } },
        { content: { $regex: searchTerm, $options: "i" } },
      ];
    }

    const [blogs, totalBlogs] = await Promise.all([
      Blog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Blog.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalBlogs / limit);

    res.json({
      data: blogs,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalBlogs: totalBlogs,
        limit: limit,
      },
    });
  } catch (error) {
    logger.error(`Error di getAllBlogs: ${error.message}`);
    res.status(500).json({ message: "Server Error" });
  }
};

const getBlogArchive = async (req, res) => {
  try {
    const archives = await getFromDbOrCache(CACHE_KEY_ARCHIVE, () =>
      Blog.aggregate([
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        {
          $sort: {
            "_id.year": -1,
            "_id.month": -1,
          },
        },
        {
          $group: {
            _id: "$_id.year",
            months: {
              $push: {
                month: "$_id.month",
                count: "$count",
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            year: "$_id",
            months: "$months",
          },
        },
        {
          $sort: {
            year: -1,
          },
        },
      ])
    );
    res.json(archives);
  } catch (error) {
    logger.error(`Error di getBlogArchive: ${error.message}`);
    res.status(500).json({ message: "Server Error" });
  }
};

const getBlogBySlug = async (req, res) => {
  const { slug } = req.params;
  try {
    let blog;

    if (req.user) {
      logger.info(`[Admin Access] Bypass cache untuk slug: ${slug}`);
      blog = await Blog.findOne({ slug });
    } else {
      const cacheKey = `${CACHE_KEY_PREFIX_BLOG}${slug}`;
      blog = await getFromDbOrCache(cacheKey, () => Blog.findOne({ slug }));
    }

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    res.json({
      message: "Blog retrieved successfully",
      data: blog,
    });
  } catch (error) {
    logger.error(`Error di getBlogBySlug: ${error.message}`, { error });
    res.status(500).json({ message: "Server Error" });
  }
};

const createBlog = async (req, res) => {
  const sanitizedData = sanitizeRichText(req.body);
  const { title, content } = sanitizedData;

  if (!title || !content) {
    return res.status(400).json({ message: "Title and content are required" });
  }
  if (!req.fileUrl) {
    return res.status(400).json({ message: "Cover image is required" });
  }

  try {
    const newBlog = new Blog({
      ...sanitizedData,
      coverImage: req.fileUrl,
    });
    const savedBlog = await newBlog.save();

    await invalidateBlogCache();

    res.status(201).json({
      message: "Blog created successfully",
      data: {
        slug: savedBlog.slug,
        title: savedBlog.title,
        content: savedBlog.content,
        coverImage: savedBlog.coverImage,
        createdAt: savedBlog.createdAt,
      },
    });
  } catch (error) {
    logger.error(`Error di createBlog: ${error.message}`);
    if (req.fileUrl) {
      await imageService.deleteFile(req.fileUrl);
    }
    res.status(400).json({ message: error.message });
  }
};

const updateBlog = async (req, res) => {
  const { slug } = req.params;

  try {
    const existingBlog = await Blog.findOne({ slug });
    if (!existingBlog) {
      if (req.fileUrl) await imageService.deleteFile(req.fileUrl);
      return res.status(404).json({ message: "Blog not found" });
    }

    const sanitizedData = sanitizeRichText(req.body);

    if (sanitizedData.title) {
      sanitizedData.slug = slugify(sanitizedData.title, {
        lower: true,
        strict: true,
        locale: "id",
      });
    }
    if (req.fileUrl) {
      sanitizedData.coverImage = req.fileUrl;
    }

    const updatedBlog = await Blog.findOneAndUpdate({ slug }, sanitizedData, {
      new: true,
      runValidators: true,
    });

    if (req.fileUrl && existingBlog.coverImage) {
      await imageService.deleteFile(existingBlog.coverImage);
    }

    await invalidateCache("blogArchive", "blog:", slug);
    if (updatedBlog.slug !== slug) {
      await invalidateCache("blogArchive", "blog:", updatedBlog.slug);
    }

    res.json({
      message: "Blog updated successfully",
      data: {
        slug: updatedBlog.slug,
        title: updatedBlog.title,
        content: updatedBlog.content,
        coverImage: updatedBlog.coverImage,
        createdAt: updatedBlog.createdAt,
        isArchived: updatedBlog.isArchived,
      },
    });
  } catch (error) {
    logger.error(`Error di updateBlog: ${error.message}`);
    if (req.fileUrl) await imageService.deleteFile(req.fileUrl);
    res.status(400).json({ message: error.message });
  }
};

const deleteBlog = async (req, res) => {
  const { slug } = req.params;
  try {
    const blog = await Blog.findOne({ slug });
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    if (blog.coverImage) {
      await imageService.deleteFile(blog.coverImage);
    }
    await Blog.deleteOne({ slug });
    await invalidateBlogCache(slug);
    res.json({ message: "Blog deleted successfully" });
  } catch (error) {
    logger.error(`Error di deleteBlog: ${error.message}`);
    res.status(500).json({ message: "Server Error" });
  }
};

const archiveBlog = async (req, res) => {
  const { slug } = req.params;
  try {
    const updatedBlog = await Blog.findOneAndUpdate(
      { slug },
      { isArchived: true },
      { new: true }
    );

    if (!updatedBlog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    await invalidateBlogCache(slug);
    res.json({
      message: "Blog archived successfully",
      data: {
        slug: updatedBlog.slug,
        title: updatedBlog.title,
        content: updatedBlog.content,
        coverImage: updatedBlog.coverImage,
        createdAt: updatedBlog.createdAt,
        isArchived: updatedBlog.isArchived,
      },
    });
  } catch (error) {
    logger.error(`Error archiving blog: ${error.message}`);
    res.status(500).json({ message: "Server Error" });
  }
};

const unarchiveBlog = async (req, res) => {
  const { slug } = req.params;
  try {
    const updatedBlog = await Blog.findOneAndUpdate(
      { slug },
      { isArchived: false },
      { new: true }
    );

    if (!updatedBlog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    await invalidateBlogCache(slug);
    res.json({
      message: "Blog unarchived successfully",
      data: {
        slug: updatedBlog.slug,
        title: updatedBlog.title,
        content: updatedBlog.content,
        coverImage: updatedBlog.coverImage,
        createdAt: updatedBlog.createdAt,
        isArchived: updatedBlog.isArchived,
      },
    });
  } catch (error) {
    logger.error(`Error unarchiving blog: ${error.message}`);
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = {
  getAllBlogs,
  getBlogArchive,
  getBlogBySlug,
  createBlog,
  updateBlog,
  deleteBlog,
  archiveBlog,
  unarchiveBlog,
};
