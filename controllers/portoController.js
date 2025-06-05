const Portfolio = require("../models/portoModel");
const logger = require("../utils/logger");
const slugify = require("slugify");
const { deleteFile } = require("../middleware/multerMiddleware");
const redisClient = require("../config/redisConfig");

const CACHE_EXPIRY_SECONDS_PORTFOLIO = 300;
const PORTFOLIO_ITEM_ID_CACHE_PREFIX = "portfolio_item_id:";
const PORTFOLIO_ITEM_SLUG_CACHE_PREFIX = "portfolio_item_slug:";
const PORTFOLIOS_LIST_ALL_CACHE_KEY = "portfolios_list_all_active";
const PORTFOLIOS_LIST_ARCHIVED_CACHE_KEY = "portfolios_list_archived";
const PORTFOLIOS_SEARCH_CACHE_PREFIX = "portfolios_search:";
const PORTFOLIOS_QUERY_CACHE_PREFIX = "portfolios_query:";

const clearPortfolioListCaches = async () => {
  try {
    await redisClient.delete(PORTFOLIOS_LIST_ALL_CACHE_KEY);
    await redisClient.delete(PORTFOLIOS_LIST_ARCHIVED_CACHE_KEY);

    logger.info("Common portfolio list caches cleared.");
  } catch (error) {
    logger.error("Error clearing portfolio list caches:", error);
  }
};

const createPortfolio = async (req, res) => {
  try {
    const { title, description, shortDescription, link } = req.body;

    if (!title || !description || !shortDescription) {
      if (req.fileUrl) {
        deleteFile(
          req.fileUrl.startsWith("/") ? req.fileUrl.substring(1) : req.fileUrl
        );
      }
      return res.status(400).json({
        success: false,
        message: "Required fields are missing",
      });
    }

    const newPortfolio = new Portfolio({
      title,
      description,
      shortDescription,
      coverImage: req.fileUrl,
      link,
    });

    const savedPortfolio = await newPortfolio.save();

    await clearPortfolioListCaches();

    logger.info(
      `Portfolio created: ${savedPortfolio.title} (${savedPortfolio._id})`
    );

    return res.status(201).json({
      success: true,
      data: savedPortfolio,
    });
  } catch (error) {
    if (req.fileUrl) {
      deleteFile(
        req.fileUrl.startsWith("/") ? req.fileUrl.substring(1) : req.fileUrl
      );
    }
    logger.error(`Error creating portfolio: ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      message: "Failed to create portfolio",
      error: error.message,
    });
  }
};

const getAllPortfolios = async (req, res) => {
  const cacheKey = PORTFOLIOS_LIST_ALL_CACHE_KEY;
  try {
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      logger.info(`Cache hit for getAllPortfolios: ${cacheKey}`);
      const portfolios = JSON.parse(cachedData);
      return res.status(200).json({
        success: true,
        count: portfolios.length,
        data: portfolios,
      });
    }

    logger.info(
      `Cache miss for getAllPortfolios: ${cacheKey}. Fetching from DB.`
    );
    const portfolios = await Portfolio.find({ isArchived: { $ne: true } })
      .sort({ createdAt: -1 })
      .lean();

    await redisClient.set(
      cacheKey,
      JSON.stringify(portfolios),
      CACHE_EXPIRY_SECONDS_PORTFOLIO
    );

    logger.info(`Retrieved ${portfolios.length} active portfolios`);
    return res.status(200).json({
      success: true,
      count: portfolios.length,
      data: portfolios,
    });
  } catch (error) {
    logger.error(`Error fetching portfolios: ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      message: "Failed to fetch portfolios",
      error: error.message,
    });
  }
};

const getPortfolioBySlug = async (req, res) => {
  const { slug } = req.params;
  const cacheKey = `${PORTFOLIO_ITEM_SLUG_CACHE_PREFIX}${slug}`;
  try {
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      logger.info(`Cache hit for getPortfolioBySlug: ${slug}`);
      const portfolio = JSON.parse(cachedData);
      return res.status(200).json({
        success: true,
        data: portfolio,
      });
    }

    logger.info(
      `Cache miss for getPortfolioBySlug: ${slug}. Fetching from DB.`
    );
    const portfolio = await Portfolio.findOne({ slug }).lean();

    if (!portfolio) {
      logger.info(`Portfolio with slug ${slug} not found`);
      return res.status(404).json({
        success: false,
        message: "Portfolio not found",
      });
    }

    await redisClient.set(
      cacheKey,
      JSON.stringify(portfolio),
      CACHE_EXPIRY_SECONDS_PORTFOLIO
    );
    logger.info(`Retrieved portfolio: ${portfolio.title} (${portfolio._id})`);
    return res.status(200).json({
      success: true,
      data: portfolio,
    });
  } catch (error) {
    logger.error(`Error fetching portfolio by slug: ${error.message}`, {
      error,
    });
    return res.status(500).json({
      success: false,
      message: "Failed to fetch portfolio",
      error: error.message,
    });
  }
};

const getPortfolioById = async (req, res) => {
  const { id } = req.params;
  const cacheKey = `${PORTFOLIO_ITEM_ID_CACHE_PREFIX}${id}`;
  try {
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      logger.info(`Cache hit for getPortfolioById: ${id}`);
      const portfolio = JSON.parse(cachedData);
      return res.status(200).json({
        success: true,
        data: portfolio,
      });
    }

    logger.info(`Cache miss for getPortfolioById: ${id}. Fetching from DB.`);
    const portfolio = await Portfolio.findById(id).lean();

    if (!portfolio) {
      logger.info(`Portfolio with ID ${id} not found`);
      return res.status(404).json({
        success: false,
        message: "Portfolio not found",
      });
    }

    await redisClient.set(
      cacheKey,
      JSON.stringify(portfolio),
      CACHE_EXPIRY_SECONDS_PORTFOLIO
    );
    logger.info(`Retrieved portfolio: ${portfolio.title} (${portfolio._id})`);
    return res.status(200).json({
      success: true,
      data: portfolio,
    });
  } catch (error) {
    logger.error(`Error fetching portfolio by ID: ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      message: "Failed to fetch portfolio",
      error: error.message,
    });
  }
};

const updatePortfolio = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, shortDescription, link } = req.body || {};

    let portfolioToUpdate = await Portfolio.findById(id);

    if (!portfolioToUpdate) {
      logger.info(`Portfolio with ID ${id} not found for update`);
      if (req.fileUrl)
        deleteFile(
          req.fileUrl.startsWith("/") ? req.fileUrl.substring(1) : req.fileUrl
        );
      return res.status(404).json({
        success: false,
        message: "Portfolio not found",
      });
    }

    const oldSlug = portfolioToUpdate.slug;
    const oldCoverImage = portfolioToUpdate.coverImage;

    portfolioToUpdate.title = title || portfolioToUpdate.title;
    portfolioToUpdate.description =
      description || portfolioToUpdate.description;
    portfolioToUpdate.shortDescription =
      shortDescription || portfolioToUpdate.shortDescription;
    portfolioToUpdate.link = link || portfolioToUpdate.link;

    if (req.fileUrl) {
      portfolioToUpdate.coverImage = req.fileUrl;
      if (oldCoverImage && oldCoverImage !== req.fileUrl) {
        deleteFile(
          oldCoverImage.startsWith("/")
            ? oldCoverImage.substring(1)
            : oldCoverImage
        );
      }
    }

    const titleChanged = title && title !== portfolioToUpdate.title;
    if (titleChanged) {
      portfolioToUpdate.slug = slugify(portfolioToUpdate.title, {
        lower: true,
        strict: true,
        trim: true,
      });
    }

    portfolioToUpdate.updatedAt = Date.now();
    const updatedPortfolio = await portfolioToUpdate.save();

    await redisClient.delete(
      `${PORTFOLIO_ITEM_ID_CACHE_PREFIX}${updatedPortfolio._id}`
    );
    if (oldSlug !== updatedPortfolio.slug) {
      await redisClient.delete(`${PORTFOLIO_ITEM_SLUG_CACHE_PREFIX}${oldSlug}`);
    }
    await redisClient.delete(
      `${PORTFOLIO_ITEM_SLUG_CACHE_PREFIX}${updatedPortfolio.slug}`
    );
    await clearPortfolioListCaches();

    logger.info(
      `Portfolio updated: ${updatedPortfolio.title} (${updatedPortfolio._id})`
    );
    return res.status(200).json({
      success: true,
      data: updatedPortfolio,
    });
  } catch (error) {
    if (req.fileUrl) {
      deleteFile(
        req.fileUrl.startsWith("/") ? req.fileUrl.substring(1) : req.fileUrl
      );
    }
    logger.error(`Error updating portfolio: ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      message: "Failed to update portfolio",
      error: error.message,
    });
  }
};

const deletePortfolio = async (req, res) => {
  try {
    const { id } = req.params;
    const portfolio = await Portfolio.findByIdAndDelete(id);

    if (!portfolio) {
      logger.info(`Portfolio with ID ${id} not found for deletion`);
      return res.status(404).json({
        success: false,
        message: "Portfolio not found",
      });
    }

    if (portfolio.coverImage) {
      const imagePath = portfolio.coverImage.startsWith("/")
        ? portfolio.coverImage.substring(1)
        : portfolio.coverImage;
      const fileDeleted = deleteFile(imagePath);
      if (!fileDeleted) {
        logger.warn(
          `Failed to delete cover image ${imagePath} for portfolio ${portfolio._id}`
        );
      } else {
        logger.info(
          `Cover image ${imagePath} deleted for portfolio ${portfolio._id}`
        );
      }
    }

    await redisClient.delete(
      `${PORTFOLIO_ITEM_ID_CACHE_PREFIX}${portfolio._id}`
    );
    if (portfolio.slug) {
      await redisClient.delete(
        `${PORTFOLIO_ITEM_SLUG_CACHE_PREFIX}${portfolio.slug}`
      );
    }
    await clearPortfolioListCaches();

    logger.info(`Portfolio deleted: ${portfolio.title} (${portfolio._id})`);
    return res.status(200).json({
      success: true,
      message: "Portfolio deleted successfully",
      data: portfolio,
    });
  } catch (error) {
    logger.error(`Error deleting portfolio: ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      message: "Failed to delete portfolio",
      error: error.message,
    });
  }
};

const archivePortfolio = async (req, res) => {
  try {
    const { id } = req.params;
    const portfolio = await Portfolio.findById(id);

    if (!portfolio) {
      logger.info(`Portfolio with ID ${id} not found for archiving`);
      return res.status(404).json({
        success: false,
        message: "Portfolio not found",
      });
    }

    if (portfolio.isArchived) {
      logger.info(`Portfolio ${portfolio.title} (${id}) is already archived.`);
      return res.status(200).json({
        success: true,
        message: "Portfolio is already archived.",
        data: portfolio,
      });
    }

    portfolio.isArchived = true;
    portfolio.updatedAt = Date.now();
    const archivedPortfolio = await portfolio.save();

    await redisClient.delete(
      `${PORTFOLIO_ITEM_ID_CACHE_PREFIX}${archivedPortfolio._id}`
    );
    if (archivedPortfolio.slug) {
      await redisClient.delete(
        `${PORTFOLIO_ITEM_SLUG_CACHE_PREFIX}${archivedPortfolio.slug}`
      );
    }
    await clearPortfolioListCaches();

    logger.info(
      `Portfolio archived: ${archivedPortfolio.title} (${archivedPortfolio._id})`
    );
    return res.status(200).json({
      success: true,
      message: "Portfolio archived successfully",
      data: archivedPortfolio,
    });
  } catch (error) {
    logger.error(`Error archiving portfolio: ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      message: "Failed to archive portfolio",
      error: error.message,
    });
  }
};

const unarchivePortfolio = async (req, res) => {
  try {
    const { id } = req.params;
    const portfolio = await Portfolio.findById(id);

    if (!portfolio) {
      logger.info(`Portfolio with ID ${id} not found for unarchiving`);
      return res.status(404).json({
        success: false,
        message: "Portfolio not found",
      });
    }

    if (!portfolio.isArchived) {
      logger.info(`Portfolio ${portfolio.title} (${id}) is not archived.`);
      return res.status(200).json({
        success: true,
        message: "Portfolio is already not archived.",
        data: portfolio,
      });
    }

    portfolio.isArchived = false;
    portfolio.updatedAt = Date.now();
    const unarchivedPortfolio = await portfolio.save();

    await redisClient.delete(
      `${PORTFOLIO_ITEM_ID_CACHE_PREFIX}${unarchivedPortfolio._id}`
    );
    if (unarchivedPortfolio.slug) {
      await redisClient.delete(
        `${PORTFOLIO_ITEM_SLUG_CACHE_PREFIX}${unarchivedPortfolio.slug}`
      );
    }
    await clearPortfolioListCaches();

    logger.info(
      `Portfolio unarchived: ${unarchivedPortfolio.title} (${unarchivedPortfolio._id})`
    );
    return res.status(200).json({
      success: true,
      message: "Portfolio unarchived successfully",
      data: unarchivedPortfolio,
    });
  } catch (error) {
    logger.error(`Error unarchiving portfolio: ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      message: "Failed to unarchive portfolio",
      error: error.message,
    });
  }
};

const getArchivedPortfolios = async (req, res) => {
  const cacheKey = PORTFOLIOS_LIST_ARCHIVED_CACHE_KEY;
  try {
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      logger.info(`Cache hit for getArchivedPortfolios: ${cacheKey}`);
      const archivedPortfolios = JSON.parse(cachedData);
      return res.status(200).json({
        success: true,
        count: archivedPortfolios.length,
        data: archivedPortfolios,
      });
    }

    logger.info(
      `Cache miss for getArchivedPortfolios: ${cacheKey}. Fetching from DB.`
    );
    const archivedPortfolios = await Portfolio.find({ isArchived: true })
      .sort({
        updatedAt: -1,
      })
      .lean();

    await redisClient.set(
      cacheKey,
      JSON.stringify(archivedPortfolios),
      CACHE_EXPIRY_SECONDS_PORTFOLIO
    );

    logger.info(`Retrieved ${archivedPortfolios.length} archived portfolios`);
    return res.status(200).json({
      success: true,
      count: archivedPortfolios.length,
      data: archivedPortfolios,
    });
  } catch (error) {
    logger.error(`Error fetching archived portfolios: ${error.message}`, {
      error,
    });
    return res.status(500).json({
      success: false,
      message: "Failed to fetch archived portfolios",
      error: error.message,
    });
  }
};

const searchPortfolios = async (req, res) => {
  try {
    const {
      query,
      sortBy = "createdAt",
      sortOrder = -1,
      page = 1,
      limit = 10,
    } = req.query;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const cacheKey = `${PORTFOLIOS_SEARCH_CACHE_PREFIX}q=${
      query || ""
    }:sortBy=${sortBy}:sortOrder=${sortOrder}:page=${pageNum}:limit=${limitNum}`;

    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      logger.info(`Cache hit for searchPortfolios: ${cacheKey}`);
      return res.status(200).json({
        success: true,
        data: JSON.parse(cachedData),
      });
    }
    logger.info(
      `Cache miss for searchPortfolios: ${cacheKey}. Fetching from DB.`
    );

    let baseQuery = { isArchived: { $ne: true } };
    let useTextSearch = false;
    let projection = {};

    if (query && query.trim() !== "") {
      try {
        await Portfolio.countDocuments({ $text: { $search: "test" } }).limit(1);
        useTextSearch = true;
      } catch (error) {
        useTextSearch = false;
        logger.info(
          "Text index not available for Portfolios or error checking, using regex search."
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
          { description: regex },
          { shortDescription: regex },
        ];
      }
    }

    const sortOptions = {};
    if (useTextSearch && query && sortBy === "relevance") {
      sortOptions.score = { $meta: "textScore" };
    } else {
      sortOptions[sortBy] = parseInt(sortOrder, 10) === 1 ? 1 : -1;
    }

    const portfolios = await Portfolio.find(baseQuery, projection)
      .select(
        "title slug shortDescription coverImage link views likes createdAt isArchived"
      )
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await Portfolio.countDocuments(baseQuery);
    const responseData = {
      portfolios,
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
      CACHE_EXPIRY_SECONDS_PORTFOLIO
    );

    return res.status(200).json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    logger.error(`Error searching portfolios: ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      message: "Error searching portfolios",
      error: error.message,
    });
  }
};

const queryPortfolios = async (req, res) => {
  try {
    const { query } = req.params;
    const { page = 1, limit = 8 } = req.query;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 8;
    const skip = (pageNum - 1) * limitNum;

    const cacheKey = `${PORTFOLIOS_QUERY_CACHE_PREFIX}q=${
      query || ""
    }:page=${pageNum}:limit=${limitNum}`;
    const cachedData = await redisClient.get(cacheKey);

    if (cachedData) {
      logger.info(`Cache hit for queryPortfolios: ${cacheKey}`);
      return res.status(200).json({
        success: true,
        data: JSON.parse(cachedData),
      });
    }
    logger.info(
      `Cache miss for queryPortfolios: ${cacheKey}. Fetching from DB.`
    );

    const regexQuery = { $regex: query, $options: "i" };
    const baseQuery = {
      $or: [
        { title: regexQuery },
        { description: regexQuery },
        { shortDescription: regexQuery },
      ],
      isArchived: { $ne: true },
    };

    const portfolios = await Portfolio.find(baseQuery)
      .select(
        "title slug shortDescription coverImage link views likes createdAt"
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await Portfolio.countDocuments(baseQuery);

    const responseData = {
      portfolios,
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
      CACHE_EXPIRY_SECONDS_PORTFOLIO
    );

    return res.status(200).json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    logger.error(`Error querying portfolios: ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      message: "Failed to query portfolios",
      error: error.message,
    });
  }
};

module.exports = {
  createPortfolio,
  getAllPortfolios,
  getPortfolioBySlug,
  getPortfolioById,
  updatePortfolio,
  deletePortfolio,
  getArchivedPortfolios,
  unarchivePortfolio,
  archivePortfolio,
  searchPortfolios,
  queryPortfolios,
};
