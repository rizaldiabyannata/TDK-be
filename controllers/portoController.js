const Portfolio = require("../models/portoModel"); // Adjust path as needed
const logger = require("../utils/logger"); // Adjust path as needed

// CREATE - Create a new portfolio
const createPortfolio = async (req, res) => {
  try {
    const { title, description, image, link } = req.body;

    // Validate required fields
    if (!title || !description || !image || !link) {
      return res.status(400).json({
        success: false,
        message: "All fields (title, description, image, link) are required",
      });
    }

    // Create new portfolio
    const newPortfolio = new Portfolio({
      title,
      description,
      image,
      link,
      // slug will be auto-generated in the pre-save hook
    });

    // Save to database
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

// READ - Get all portfolio items
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

// READ - Get a single portfolio item by slug
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

// READ - Get a single portfolio item by ID
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

// UPDATE - Update a portfolio item
const updatePortfolio = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, image, link } = req.body;

    // Find portfolio to update
    let portfolio = await Portfolio.findById(id);

    if (!portfolio) {
      logger.info(`Portfolio with ID ${id} not found for update`);
      return res.status(404).json({
        success: false,
        message: "Portfolio not found",
      });
    }

    // Update fields
    portfolio.title = title || portfolio.title;
    portfolio.description = description || portfolio.description;
    portfolio.image = image || portfolio.image;
    portfolio.link = link || portfolio.link;
    portfolio.updatedAt = Date.now();

    // Save updated portfolio
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

// DELETE - Delete a portfolio item
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

// Archive a portfolio item
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

// Unarchive a portfolio item
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

// Get all archived portfolios
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
};
