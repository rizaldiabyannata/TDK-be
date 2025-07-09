const Porto = require("../models/portoModel");
const redisClient = require("../config/redisConfig");
const logger = require("../utils/logger");
const imageService = require("../services/imageService");
const { sanitizeRichText } = require("../services/sanitizerService");
const { default: slugify } = require("slugify");

const CACHE_KEY_PREFIX_PORTO = "porto:";
const CACHE_KEY_ARCHIVE = "portoArchive";

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

const invalidatePortoCache = async (slug = null) => {
  if (!(await redisClient.isConnected())) {
    logger.warn("Redis client tidak siap, tidak dapat menghapus cache.");
    return;
  }
  try {
    await redisClient.delete(CACHE_KEY_ARCHIVE);
    logger.info(`Cache dihapus untuk kunci: ${CACHE_KEY_ARCHIVE}`);

    if (slug) {
      await redisClient.delete(`${CACHE_KEY_PREFIX_PORTO}${slug}`);
      logger.info(
        `Cache dihapus untuk kunci: ${CACHE_KEY_PREFIX_PORTO}${slug}`
      );
    }
  } catch (error) {
    logger.error(`Gagal menghapus cache portofolio: ${error.message}`);
  }
};

const getAllPortos = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
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
        { description: { $regex: searchTerm, $options: "i" } },
        { shortDescription: { $regex: searchTerm, $options: "i" } },
      ];
    }

    const [portos, totalPortos] = await Promise.all([
      Porto.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Porto.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalPortos / limit);

    res.json({
      data: portos,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalItems: totalPortos,
        limit: limit,
      },
    });
  } catch (error) {
    logger.error(`Error di getAllPortos: ${error.message}`);
    res.status(500).json({ message: "Server Error" });
  }
};

const getPortoBySlug = async (req, res) => {
  const { slug } = req.params;
  try {
    let porto;

    if (req.user) {
      logger.info(`[Admin Access] Bypass cache untuk slug: ${slug}`);
      porto = await Porto.findOne({ slug });
    } else {
      const cacheKey = `${CACHE_KEY_PREFIX_PORTO}${slug}`;
      porto = await getFromDbOrCache(cacheKey, () => Porto.findOne({ slug }));
    }

    if (!porto) {
      return res.status(404).json({ message: "Portofolio not found" });
    }
    if (req.user) {
      res.json({
        message: "Portfolio retrieved successfully",
        data: porto,
      });
    } else {
      res.json({
        message: "Portfolio retrieved successfully",
        data: {
          slug: porto.slug,
          title: porto.title,
          description: porto.description,
          shortDescription: porto.shortDescription,
          link: porto.link,
          coverImage: porto.coverImage,
          createdAt: porto.createdAt,
        },
      });
    }
  } catch (error) {
    logger.error(`Error di getPortoBySlug: ${error.message}`);
    res.status(500).json({ message: "Server Error" });
  }
};

const createPorto = async (req, res) => {
  const sanitizedData = sanitizeRichText(req.body);
  const { title, description, shortDescription } = sanitizedData;

  if (!title || !description || !shortDescription) {
    return res.status(400).json({
      message: "Title, description, and shortDescription are required",
    });
  }
  if (!req.fileUrl) {
    return res.status(400).json({ message: "Cover image is required" });
  }

  try {
    const newPorto = new Porto({
      ...sanitizedData,
      coverImage: req.fileUrl,
    });
    const savedPorto = await newPorto.save();

    await invalidatePortoCache();

    res.status(201).json({
      message: "Portfolio created successfully",
      data: {
        slug: savedPorto.slug,
        title: savedPorto.title,
        description: savedPorto.description,
        shortDescription: savedPorto.shortDescription,
        link: savedPorto.link,
        coverImage: savedPorto.coverImage,
        createdAt: savedPorto.createdAt,
      },
    });
  } catch (error) {
    logger.error(`Error di createPorto: ${error.message}`);
    if (req.fileUrl) {
      await imageService.deleteFile(req.fileUrl);
    }
    res.status(400).json({ message: error.message });
  }
};

const updatePorto = async (req, res) => {
  const { slug } = req.params;

  try {
    const existingPorto = await Porto.findOne({ slug });
    if (!existingPorto) {
      if (req.fileUrl) await imageService.deleteFile(req.fileUrl);
      return res.status(404).json({ message: "Portfolio not found" });
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

    const updatedPorto = await Porto.findOneAndUpdate({ slug }, sanitizedData, {
      new: true,
      runValidators: true,
    });

    if (req.fileUrl && existingPorto.coverImage) {
      await imageService.deleteFile(existingPorto.coverImage);
    }

    await invalidatePortoCache(slug);
    if (updatedPorto.slug !== slug) {
      await invalidatePortoCache(updatedPorto.slug);
    }

    res.json({
      message: "Portfolio updated successfully",
      data: {
        slug: updatedPorto.slug,
        title: updatedPorto.title,
        description: updatedPorto.description,
        shortDescription: updatedPorto.shortDescription,
        link: updatedPorto.link,
        coverImage: updatedPorto.coverImage,
        createdAt: updatedPorto.createdAt,
        isArchived: updatedPorto.isArchived,
      },
    });
  } catch (error) {
    logger.error(`Error di updatePorto: ${error.message}`);
    if (req.fileUrl) await imageService.deleteFile(req.fileUrl);
    res.status(400).json({ message: error.message });
  }
};

const deletePorto = async (req, res) => {
  const { slug } = req.params;
  try {
    const porto = await Porto.findOne({ slug });
    if (!porto) {
      return res.status(404).json({ message: "Portfolio not found" });
    }

    if (porto.coverImage) {
      await imageService.deleteFile(porto.coverImage);
    }

    await Porto.deleteOne({ slug });
    await invalidatePortoCache(slug);
    res.json({ message: "Portfolio deleted successfully" });
  } catch (error) {
    logger.error(`Error di deletePorto: ${error.message}`);
    res.status(500).json({ message: "Server Error" });
  }
};

const archivePorto = async (req, res) => {
  const { slug } = req.params;
  try {
    const updatedPorto = await Porto.findOneAndUpdate(
      { slug },
      { isArchived: true },
      { new: true }
    );
    if (!updatedPorto) {
      return res.status(404).json({ message: "Portfolio not found" });
    }
    await invalidatePortoCache(slug);
    res.json({
      message: "Portfolio archived successfully",
      data: {
        slug: updatedPorto.slug,
        title: updatedPorto.title,
        description: updatedPorto.description,
        shortDescription: updatedPorto.shortDescription,
        link: updatedPorto.link,
        coverImage: updatedPorto.coverImage,
        createdAt: updatedPorto.createdAt,
        isArchived: updatedPorto.isArchived,
      },
    });
  } catch (error) {
    logger.error(`Error archiving portfolio: ${error.message}`);
    res.status(500).json({ message: "Server Error" });
  }
};

const unarchivePorto = async (req, res) => {
  const { slug } = req.params;
  try {
    const updatedPorto = await Porto.findOneAndUpdate(
      { slug },
      { isArchived: false },
      { new: true }
    );
    if (!updatedPorto) {
      return res.status(404).json({ message: "Portfolio not found" });
    }
    await invalidatePortoCache(slug);
    res.json({
      message: "Portfolio unarchived successfully",
      data: {
        slug: updatedPorto.slug,
        title: updatedPorto.title,
        description: updatedPorto.description,
        shortDescription: updatedPorto.shortDescription,
        link: updatedPorto.link,
        coverImage: updatedPorto.coverImage,
        createdAt: updatedPorto.createdAt,
        isArchived: updatedPorto.isArchived,
      },
    });
  } catch (error) {
    logger.error(`Error unarchiving portfolio: ${error.message}`);
    res.status(500).json({ message: "Server Error" });
  }
};

const getPortoArchive = async (req, res) => {
  try {
    const archives = await getFromDbOrCache(CACHE_KEY_ARCHIVE, () =>
      Porto.aggregate([
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": -1, "_id.month": -1 } },
        {
          $group: {
            _id: "$_id.year",
            months: { $push: { month: "$_id.month", count: "$count" } },
          },
        },
        { $project: { _id: 0, year: "$_id", months: "$months" } },
        { $sort: { year: -1 } },
      ])
    );
    res.json(archives);
  } catch (error) {
    logger.error(`Error di getPortoArchive: ${error.message}`);
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = {
  getAllPortos,
  getPortoBySlug,
  createPorto,
  updatePorto,
  deletePorto,
  archivePorto,
  unarchivePorto,
  getPortoArchive,
};
