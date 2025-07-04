const Porto = require("../models/portoModel");
const redisClient = require("../config/redisConfig");
const logger = require("../utils/logger");

// Konstanta untuk kunci cache
const CACHE_KEY_PREFIX_PORTO = "porto:";
const CACHE_KEY_ARCHIVE = "portoArchive";

// --- Helper Functions ---
const getFromDbOrCache = async (cacheKey, dbQuery) => {
  if (redisClient.isReady) {
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      logger.info(`Cache HIT untuk kunci: ${cacheKey}`);
      return JSON.parse(cachedData);
    }
  }
  const dbData = await dbQuery();
  if (redisClient.isReady && dbData) {
    const expiry = cacheKey.includes("Archive") ? 21600 : 3600;
    await redisClient.set(cacheKey, JSON.stringify(dbData), { EX: expiry });
  }
  return dbData;
};

const invalidatePortoCache = async (slug = null) => {
  if (!redisClient.isReady) return;
  try {
    // Selalu hapus cache arsip dan daftar semua portofolio setiap ada perubahan
    await redisClient.del(CACHE_KEY_ARCHIVE);
    if (slug) {
      await redisClient.del(`${CACHE_KEY_PREFIX_PORTO}${slug}`);
    }
  } catch (error) {
    logger.error(`Gagal menghapus cache portofolio: ${error.message}`);
  }
};

// --- Controller Functions ---

const getAllPortos = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const searchTerm = req.query.search || "";
    const status = req.query.status || "active"; // Opsi: 'active', 'archived', 'all'
    const skip = (page - 1) * limit;

    const filter = {};

    // Filter berdasarkan status arsip
    if (status === "active") {
      filter.isArchived = false;
    } else if (status === "archived") {
      filter.isArchived = true;
    }
    // Jika status 'all', tidak ada filter isArchived yang ditambahkan

    // Sesuaikan filter pencarian dengan model baru
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
  const cacheKey = `${CACHE_KEY_PREFIX_PORTO}${slug}`;
  try {
    const porto = await getFromDbOrCache(cacheKey, () =>
      Porto.findOne({ slug })
    );
    if (!porto) {
      return res.status(404).json({ message: "Portofolio not found" });
    }
    res.json(porto);
  } catch (error) {
    logger.error(`Error di getPortoBySlug: ${error.message}`);
    res.status(500).json({ message: "Server Error" });
  }
};

const createPorto = async (req, res) => {
  try {
    const newPorto = new Porto(req.body);
    const savedPorto = await newPorto.save();
    await invalidatePortoCache();
    res.status(201).json(savedPorto);
  } catch (error) {
    logger.error(`Error di createPorto: ${error.message}`);
    res.status(400).json({ message: error.message });
  }
};

const updatePorto = async (req, res) => {
  const { slug } = req.params;
  try {
    const updatedPorto = await Porto.findOneAndUpdate({ slug }, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updatedPorto) {
      return res.status(404).json({ message: "Portofolio not found" });
    }
    await invalidatePortoCache(slug);
    if (req.body.slug && req.body.slug !== slug) {
      await invalidatePortoCache(req.body.slug);
    }
    res.json(updatedPorto);
  } catch (error) {
    logger.error(`Error di updatePorto: ${error.message}`);
    res.status(400).json({ message: error.message });
  }
};

const deletePorto = async (req, res) => {
  const { slug } = req.params;
  try {
    const deletedPorto = await Porto.findOneAndDelete({ slug });
    if (!deletedPorto) {
      return res.status(404).json({ message: "Portofolio not found" });
    }
    await invalidatePortoCache(slug);
    res.json({ message: "Portofolio deleted successfully" });
  } catch (error) {
    logger.error(`Error di deletePorto: ${error.message}`);
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

/**
 * Mengarsipkan sebuah item portofolio.
 */
const archivePorto = async (req, res) => {
  const { slug } = req.params;
  try {
    const updatedPorto = await Porto.findOneAndUpdate(
      { slug },
      { isArchived: true },
      { new: true }
    );

    if (!updatedPorto) {
      return res.status(404).json({ message: "Portofolio not found" });
    }

    await invalidatePortoCache(slug);
    res.json({
      message: "Portofolio archived successfully",
      data: updatedPorto,
    });
  } catch (error) {
    logger.error(`Error archiving portfolio: ${error.message}`);
    res.status(500).json({ message: "Server Error" });
  }
};

/**
 * Mengembalikan item portofolio dari arsip.
 */
const unarchivePorto = async (req, res) => {
  const { slug } = req.params;
  try {
    const updatedPorto = await Porto.findOneAndUpdate(
      { slug },
      { isArchived: false },
      { new: true }
    );

    if (!updatedPorto) {
      return res.status(404).json({ message: "Portofolio not found" });
    }

    await invalidatePortoCache(slug);
    res.json({
      message: "Portofolio unarchived successfully",
      data: updatedPorto,
    });
  } catch (error) {
    logger.error(`Error unarchiving portfolio: ${error.message}`);
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = {
  getAllPortos,
  getPortoBySlug,
  createPorto,
  updatePorto,
  deletePorto,
  getPortoArchive,
  archivePorto,
  unarchivePorto,
};
