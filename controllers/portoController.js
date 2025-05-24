const Portfolio = require("../models/portoModel");
const logger = require("../utils/logger");

const createPortfolio = async (req, res) => {
  try {
    const { title, description, image, link } = req.body;

    if (!title || !description || !image || !link) {
      return res.status(400).json({
        success: false,
        message: "All fields (title, description, image, link) are required",
      });
    }

    const newPortfolio = new Portfolio({
      title,
      description,
      image,
      link,
    });

    const savedPortfolio = await newPortfolio.save();

    logger.info(
      `Portfolio created: ${savedPortfolio.title} (${savedPortfolio._id})`
    );

    return res.status(201).json({
      success: true,
      data: savedPortfolio,
    });
  } catch (error) {
    logger.error(`Error creating portfolio: ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      message: "Failed to create portfolio",
      error: error.message,
    });
  }
};

const getAllPortfolios = async (req, res) => {
  try {
    const portfolios = await Portfolio.find().sort({ createdAt: -1 });

    logger.info(`Retrieved ${portfolios.length} portfolios`);

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
  try {
    const { slug } = req.params;

    const portfolio = await Portfolio.findOne({ slug });

    if (!portfolio) {
      logger.info(`Portfolio with slug ${slug} not found`);
      return res.status(404).json({
        success: false,
        message: "Portfolio not found",
      });
    }

    logger.info(`Retrieved portfolio: ${portfolio.title} (${portfolio._id})`);

    return res.status(200).json({
      success: true,
      data: portfolio,
    });
  } catch (error) {
    logger.error(`Error fetching portfolio: ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      message: "Failed to fetch portfolio",
      error: error.message,
    });
  }
};

const getPortfolioById = async (req, res) => {
  try {
    const { id } = req.params;

    const portfolio = await Portfolio.findById(id);

    if (!portfolio) {
      logger.info(`Portfolio with ID ${id} not found`);
      return res.status(404).json({
        success: false,
        message: "Portfolio not found",
      });
    }

    logger.info(`Retrieved portfolio: ${portfolio.title} (${portfolio._id})`);

    return res.status(200).json({
      success: true,
      data: portfolio,
    });
  } catch (error) {
    logger.error(`Error fetching portfolio: ${error.message}`, { error });
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
    const { title, description, image, link } = req.body;

    let portfolio = await Portfolio.findById(id);

    if (!portfolio) {
      logger.info(`Portfolio with ID ${id} not found for update`);
      return res.status(404).json({
        success: false,
        message: "Portfolio not found",
      });
    }

    portfolio.title = title || portfolio.title;
    portfolio.description = description || portfolio.description;
    portfolio.image = image || portfolio.image;
    portfolio.link = link || portfolio.link;
    portfolio.updatedAt = Date.now();

    const updatedPortfolio = await portfolio.save();

    logger.info(
      `Portfolio updated: ${updatedPortfolio.title} (${updatedPortfolio._id})`
    );

    return res.status(200).json({
      success: true,
      data: updatedPortfolio,
    });
  } catch (error) {
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

    portfolio.isArchived = true;
    portfolio.updatedAt = Date.now();
    await portfolio.save();

    logger.info(`Portfolio archived: ${portfolio.title} (${portfolio._id})`);

    return res.status(200).json({
      success: true,
      message: "Portfolio archived successfully",
      data: portfolio,
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

    portfolio.isArchived = false;
    portfolio.updatedAt = Date.now();
    await portfolio.save();

    logger.info(`Portfolio unarchived: ${portfolio.title} (${portfolio._id})`);

    return res.status(200).json({
      success: true,
      message: "Portfolio unarchived successfully",
      data: portfolio,
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
  try {
    const archivedPortfolios = await Portfolio.find({ isArchived: true }).sort({
      updatedAt: -1,
    });

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

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Base query always excludes archived portfolios
    let baseQuery = { isArchived: false };
    let useTextSearch = false;

    // Only test for text index if we have a search query
    if (query && query.trim() !== "") {
      try {
        // This is a lightweight way to check if text index exists
        await Portfolio.countDocuments({ $text: { $search: "test" } }).limit(1);
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
          { description: { $regex: searchTerms, $options: "i" } },
          { shortdDescription: { $regex: searchTerms, $options: "i" } },
        ];
      }
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
    const portfolios = await Portfolio.find(baseQuery, projection)
      .select(
        "title slug shortdDescription coverImage link views likes createdAt"
      )
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    const total = await Portfolio.countDocuments(baseQuery);

    return res.status(200).json({
      success: true,
      data: {
        portfolios,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error("Error searching portfolios:", error);
    return res.status(500).json({
      success: false,
      message: "Error searching portfolios",
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
};
