import Blog, { find, countDocuments, aggregate, findOne, findOneAndUpdate, deleteOne } from "../models/BlogModel.js";
import { isConnected, get, set, del } from "../config/redisConfig.js";
import { info, warn, error as _error } from "../utils/logger.js";
import { deleteFile } from "../services/imageService.js";
import { sanitizeRichText } from "../services/sanitizerService.js";
import { default as slugify } from "slugify";

const CACHE_KEY_PREFIX_BLOG = "blog:";
const CACHE_KEY_ARCHIVE = "blogArchive";

const getFromDbOrCache = async (cacheKey, dbQuery) => {
  if (await isConnected()) {
    const cachedData = await get(cacheKey);
    if (cachedData) {
      info(`Cache HIT for key: ${cacheKey}`);

      return cachedData;
    }
  } else {
    warn("Redis client is not connected, skipping cache check.");
  }

  info(`Cache MISS for key: ${cacheKey}. Getting data from DB.`);
  const dbData = await dbQuery();

  if ((await isConnected()) && dbData) {
    const expiry = cacheKey.includes("Archive") ? 21600 : 3600;

    await set(cacheKey, dbData, { EX: expiry });
  }

  return dbData;
};

const invalidateBlogCache = async (slug = null) => {
  if (!isConnected()) {
    warn("Redis client is not connected, cache invalidation skipped.");
    return;
  }
  try {
    await del(CACHE_KEY_ARCHIVE);
    info(`Cache deleted for key: ${CACHE_KEY_ARCHIVE}`);

    if (slug) {
      await del(`${CACHE_KEY_PREFIX_BLOG}${slug}`);
      info(`Cache deleted for key: ${CACHE_KEY_PREFIX_BLOG}${slug}`);
    }
  } catch (error) {
    _error(`Failed to delete: ${error.message}`);
  }
};

const getAllBlogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 5;

    const searchTerm = req.query.search || "";
    let status = req.query.status || "active";
    const skip = (page - 1) * limit;

    // Jika pengguna tidak terotentikasi, paksa status menjadi 'active'
    if (!req.user) {
      status = "active";
    }
    
    const filter = {};
    if (status === "active") {
      filter.isArchived = false;
    } else if (status === "archived") {
      filter.isArchived = true;
    }

    if (searchTerm) {
      filter.$text = { $search: searchTerm };
    }

    const [blogs, totalBlogs] = await Promise.all([
      find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      countDocuments(filter),
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
    _error(`Error di getAllBlogs: ${error.message}`);
    res.status(500).json({ message: "An internal server error occurred." });
  }
};

const getBlogArchive = async (req, res) => {
  try {
    const archives = await getFromDbOrCache(CACHE_KEY_ARCHIVE, () =>
      aggregate([
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
    _error(`Error di getBlogArchive: ${error.message}`);
    res.status(500).json({ message: "An internal server error occurred." });
  }
};

const getBlogBySlug = async (req, res) => {
  const { slug } = req.params;
  try {
    let blog;

    if (req.user) {
      info(`[Admin Access] Bypass cache for slug: ${slug}`);
      blog = await findOne({ slug });
    } else {
      const cacheKey = `${CACHE_KEY_PREFIX_BLOG}${slug}`;
      blog = await getFromDbOrCache(cacheKey, () => findOne({ slug }));
    }

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    if (req.user) {
      res.json({
        message: "Blog retrieved successfully",
        data: blog,
      });
    } else {
      res.json({
        message: "Blog retrieved successfully",
        data: {
          slug: blog.slug,
          title: blog.title,
          content: blog.content,
          coverImage: blog.coverImage,
          createdAt: blog.createdAt,
        },
      });
    }
  } catch (error) {
    _error(`Error in getBlogBySlug: ${error.message}`, { error });
    res.status(500).json({ message: "An internal server error occurred." });
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
    _error(`Error in createBlog: ${error.message}`);
    if (req.fileUrl) {
      await deleteFile(req.fileUrl);
    }
    res.status(400).json({ message: "Failed Create Article" });
  }
};

const updateBlog = async (req, res) => {
  const { slug } = req.params;

  try {
    const existingBlog = await findOne({ slug });
    if (!existingBlog) {
      if (req.fileUrl) await deleteFile(req.fileUrl);
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

    const updatedBlog = await findOneAndUpdate({ slug }, sanitizedData, {
      new: true,
      runValidators: true,
    });

    if (req.fileUrl && existingBlog.coverImage) {
      await deleteFile(existingBlog.coverImage);
    }

    await invalidateBlogCache("blogArchive", "blog:", slug);
    if (updatedBlog.slug !== slug) {
      await invalidateBlogCache("blogArchive", "blog:", updatedBlog.slug);
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
    _error(`Error in updateBlog: ${error.message}`);
    if (req.fileUrl) await deleteFile(req.fileUrl);
    res.status(400).json({ message: error.message });
  }
};

const deleteBlog = async (req, res) => {
  const { slug } = req.params;
  try {
    const blog = await findOne({ slug });
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    if (blog.coverImage) {
      await deleteFile(blog.coverImage);
    }
    await deleteOne({ slug });
    await invalidateBlogCache(slug);
    res.json({ message: "Blog deleted successfully" });
  } catch (error) {
    _error(`Error in deleteBlog: ${error.message}`);
    res.status(500).json({ message: "An internal server error occurred." });
  }
};

const archiveBlog = async (req, res) => {
  const { slug } = req.params;
  try {
    const updatedBlog = await findOneAndUpdate(
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
    _error(`Error archiving blog: ${error.message}`);
    res.status(500).json({ message: "An internal server error occurred." });
  }
};

const unarchiveBlog = async (req, res) => {
  const { slug } = req.params;
  try {
    const updatedBlog = await findOneAndUpdate(
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
    _error(`Error unarchiving blog: ${error.message}`);
    res.status(500).json({ message: "An internal server error occurred." });
  }
};

export default {
  getAllBlogs,
  getBlogArchive,
  getBlogBySlug,
  createBlog,
  updateBlog,
  deleteBlog,
  archiveBlog,
  unarchiveBlog,
};
