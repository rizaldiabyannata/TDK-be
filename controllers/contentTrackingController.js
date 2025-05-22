const HomePageContent = require("../models/contentTrackingModel");
const Blog = require("../models/blogModel");
const Portfolio = require("../models/portoModel"); // Sesuaikan dengan nama file model Anda
const logger = require("../utils/logger");
const mongoose = require("mongoose");

const getHomePageContent = async (req, res) => {
  try {
    let homePageContent = await HomePageContent.findOne()
      .populate({
        path: "featuredBlogs",
        select: "title slug summary coverImage tags createdAt",
      })
      .populate({
        path: "highlightedPortfolios",
        select: "title slug category",
      });

    if (!homePageContent) {
      homePageContent = await HomePageContent.create({});
      logger.info("Created new home page content as none existed");
    }

    logger.info(`Retrieved home page content (${homePageContent._id})`);

    return res.status(200).json({
      success: true,
      data: homePageContent,
    });
  } catch (error) {
    logger.error(`Error fetching home page content: ${error.message}`, {
      error,
    });
    return res.status(500).json({
      success: false,
      message: "Failed to fetch home page content",
      error: error.message,
    });
  }
};

const updateFeaturedBlogs = async (req, res) => {
  try {
    const { blogIds } = req.body;

    if (!blogIds || !Array.isArray(blogIds)) {
      logger.info("Invalid request: blogIds missing or not an array");
      return res.status(400).json({
        success: false,
        message: "Blog IDs must be provided as an array",
      });
    }

    // Validate that all IDs are valid ObjectIDs
    const validIds = blogIds.filter((id) =>
      mongoose.Types.ObjectId.isValid(id)
    );

    if (validIds.length !== blogIds.length) {
      logger.info("Some provided blog IDs are invalid");
      return res.status(400).json({
        success: false,
        message: "Some provided blog IDs are invalid",
      });
    }

    // Convert string IDs to ObjectIds
    const objectIdBlogIds = validIds.map(
      (id) => new mongoose.Types.ObjectId(id)
    );

    // Check that all blogs exist
    const existingBlogs = await Blog.find({ _id: { $in: objectIdBlogIds } });
    const existingBlogIds = existingBlogs.map((blog) => blog._id);

    if (existingBlogs.length !== validIds.length) {
      logger.info("Some blogs were not found in the database");
      return res.status(404).json({
        success: false,
        message: "Some blogs were not found",
      });
    }

    let homePageContent = await HomePageContent.findOne();

    if (!homePageContent) {
      homePageContent = await HomePageContent.create({
        featuredBlogs: existingBlogIds,
      });
      logger.info(`Created new home page content with featured blogs`);
    } else {
      homePageContent.featuredBlogs = existingBlogIds;
      homePageContent.lastUpdated = Date.now();
      await homePageContent.save();
      logger.info(
        `Updated featured blogs for home page content (${homePageContent._id})`
      );
    }

    return res.status(200).json({
      success: true,
      message: "Featured blogs updated successfully",
      data: homePageContent,
    });
  } catch (error) {
    logger.error(`Error updating featured blogs: ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      message: "Failed to update featured blogs",
      error: error.message,
    });
  }
};

const updateHighlightedPortfolios = async (req, res) => {
  try {
    const { portfolioIds } = req.body;

    if (!portfolioIds || !Array.isArray(portfolioIds)) {
      logger.info("Invalid request: portfolioIds missing or not an array");
      return res.status(400).json({
        success: false,
        message: "Portfolio IDs must be provided as an array",
      });
    }

    // Validate that all IDs are valid ObjectIDs
    const validIds = portfolioIds.filter((id) =>
      mongoose.Types.ObjectId.isValid(id)
    );

    if (validIds.length !== portfolioIds.length) {
      logger.info("Some provided portfolio IDs are invalid");
      return res.status(400).json({
        success: false,
        message: "Some provided portfolio IDs are invalid",
      });
    }

    // Convert string IDs to ObjectIds
    const objectIdPortfolioIds = validIds.map(
      (id) => new mongoose.Types.ObjectId(id)
    );

    // Check that all portfolios exist
    const existingPortfolios = await Portfolio.find({
      _id: { $in: objectIdPortfolioIds },
    });
    const existingPortfolioIds = existingPortfolios.map(
      (portfolio) => portfolio._id
    );

    if (existingPortfolios.length !== validIds.length) {
      logger.info("Some portfolios were not found in the database");
      return res.status(404).json({
        success: false,
        message: "Some portfolios were not found",
      });
    }

    let homePageContent = await HomePageContent.findOne();

    if (!homePageContent) {
      homePageContent = await HomePageContent.create({
        highlightedPortfolios: existingPortfolioIds,
      });
      logger.info(`Created new home page content with highlighted portfolios`);
    } else {
      homePageContent.highlightedPortfolios = existingPortfolioIds;
      homePageContent.lastUpdated = Date.now();
      await homePageContent.save();
      logger.info(
        `Updated highlighted portfolios for home page content (${homePageContent._id})`
      );
    }

    return res.status(200).json({
      success: true,
      message: "Highlighted portfolios updated successfully",
      data: homePageContent,
    });
  } catch (error) {
    logger.error(`Error updating highlighted portfolios: ${error.message}`, {
      error,
    });
    return res.status(500).json({
      success: false,
      message: "Failed to update highlighted portfolios",
      error: error.message,
    });
  }
};

const resetHomePageContent = async (req, res) => {
  try {
    let homePageContent = await HomePageContent.findOne();

    if (!homePageContent) {
      homePageContent = await HomePageContent.create({});
      logger.info("Created new empty home page content");
    } else {
      homePageContent.featuredBlogs = [];
      homePageContent.highlightedPortfolios = [];
      homePageContent.lastUpdated = Date.now();
      await homePageContent.save();
      logger.info(`Reset home page content (${homePageContent._id})`);
    }

    return res.status(200).json({
      success: true,
      message: "Home page content reset successfully",
      data: homePageContent,
    });
  } catch (error) {
    logger.error(`Error resetting home page content: ${error.message}`, {
      error,
    });
    return res.status(500).json({
      success: false,
      message: "Failed to reset home page content",
      error: error.message,
    });
  }
};

const addFeaturedBlog = async (req, res) => {
  try {
    const { blogId } = req.body;

    if (!blogId || !mongoose.Types.ObjectId.isValid(blogId)) {
      logger.info(`Invalid blogId provided: ${blogId}`);
      return res.status(400).json({
        success: false,
        message: "Valid blog ID is required",
      });
    }

    const objectIdBlogId = new mongoose.Types.ObjectId(blogId);

    const blog = await Blog.findById(objectIdBlogId);
    if (!blog) {
      logger.info(`Blog with ID ${blogId} not found`);
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    let homePageContent = await HomePageContent.findOne();

    if (!homePageContent) {
      homePageContent = await HomePageContent.create({
        featuredBlogs: [objectIdBlogId],
      });
      logger.info(`Created new home page content with featured blog ${blogId}`);
    } else {
      // Check if blog is already featured using proper ObjectId comparison
      if (
        homePageContent.featuredBlogs.some((id) => id.equals(objectIdBlogId))
      ) {
        logger.info(`Blog ${blogId} is already featured`);
        return res.status(400).json({
          success: false,
          message: "Blog is already featured",
        });
      }

      homePageContent.featuredBlogs.push(objectIdBlogId);
      homePageContent.lastUpdated = Date.now();
      await homePageContent.save();
      logger.info(`Added blog ${blogId} to featured blogs`);
    }

    return res.status(200).json({
      success: true,
      message: "Blog added to featured blogs successfully",
      data: homePageContent,
    });
  } catch (error) {
    logger.error(`Error adding featured blog: ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      message: "Failed to add featured blog",
      error: error.message,
    });
  }
};

const removeFeaturedBlog = async (req, res) => {
  try {
    const { blogId } = req.params;

    if (!blogId || !mongoose.Types.ObjectId.isValid(blogId)) {
      logger.info(`Invalid blogId provided: ${blogId}`);
      return res.status(400).json({
        success: false,
        message: "Valid blog ID is required",
      });
    }

    const objectIdBlogId = new mongoose.Types.ObjectId(blogId);

    let homePageContent = await HomePageContent.findOne();

    if (!homePageContent) {
      logger.info("No home page content found to remove blog from");
      return res.status(404).json({
        success: false,
        message: "Home page content not found",
      });
    }

    // Check if blog is featured using proper ObjectId comparison
    if (
      !homePageContent.featuredBlogs.some((id) => id.equals(objectIdBlogId))
    ) {
      logger.info(`Blog ${blogId} is not featured`);
      return res.status(400).json({
        success: false,
        message: "Blog is not featured",
      });
    }

    homePageContent.featuredBlogs = homePageContent.featuredBlogs.filter(
      (id) => !id.equals(objectIdBlogId)
    );
    homePageContent.lastUpdated = Date.now();
    await homePageContent.save();

    logger.info(`Removed blog ${blogId} from featured blogs`);

    return res.status(200).json({
      success: true,
      message: "Blog removed from featured blogs successfully",
      data: homePageContent,
    });
  } catch (error) {
    logger.error(`Error removing featured blog: ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      message: "Failed to remove featured blog",
      error: error.message,
    });
  }
};

const addHighlightedPortfolio = async (req, res) => {
  try {
    const { portfolioId } = req.body;

    if (!portfolioId || !mongoose.Types.ObjectId.isValid(portfolioId)) {
      logger.info(`Invalid portfolioId provided: ${portfolioId}`);
      return res.status(400).json({
        success: false,
        message: "Valid portfolio ID is required",
      });
    }

    const objectIdPortfolioId = new mongoose.Types.ObjectId(portfolioId);

    const portfolio = await Portfolio.findById(objectIdPortfolioId);
    if (!portfolio) {
      logger.info(`Portfolio with ID ${portfolioId} not found`);
      return res.status(404).json({
        success: false,
        message: "Portfolio not found",
      });
    }

    let homePageContent = await HomePageContent.findOne();

    if (!homePageContent) {
      homePageContent = await HomePageContent.create({
        highlightedPortfolios: [objectIdPortfolioId],
      });
      logger.info(
        `Created new home page content with highlighted portfolio ${portfolioId}`
      );
    } else {
      // Check if portfolio is already highlighted using proper ObjectId comparison
      if (
        homePageContent.highlightedPortfolios.some((id) =>
          id.equals(objectIdPortfolioId)
        )
      ) {
        logger.info(`Portfolio ${portfolioId} is already highlighted`);
        return res.status(400).json({
          success: false,
          message: "Portfolio is already highlighted",
        });
      }

      homePageContent.highlightedPortfolios.push(objectIdPortfolioId);
      homePageContent.lastUpdated = Date.now();
      await homePageContent.save();
      logger.info(`Added portfolio ${portfolioId} to highlighted portfolios`);
    }

    return res.status(200).json({
      success: true,
      message: "Portfolio added to highlighted portfolios successfully",
      data: homePageContent,
    });
  } catch (error) {
    logger.error(`Error adding highlighted portfolio: ${error.message}`, {
      error,
    });
    return res.status(500).json({
      success: false,
      message: "Failed to add highlighted portfolio",
      error: error.message,
    });
  }
};

const removeHighlightedPortfolio = async (req, res) => {
  try {
    const { portfolioId } = req.params;

    if (!portfolioId || !mongoose.Types.ObjectId.isValid(portfolioId)) {
      logger.info(`Invalid portfolioId provided: ${portfolioId}`);
      return res.status(400).json({
        success: false,
        message: "Valid portfolio ID is required",
      });
    }

    const objectIdPortfolioId = new mongoose.Types.ObjectId(portfolioId);

    let homePageContent = await HomePageContent.findOne();

    if (!homePageContent) {
      logger.info("No home page content found to remove portfolio from");
      return res.status(404).json({
        success: false,
        message: "Home page content not found",
      });
    }

    // Check if portfolio is highlighted using proper ObjectId comparison
    if (
      !homePageContent.highlightedPortfolios.some((id) =>
        id.equals(objectIdPortfolioId)
      )
    ) {
      logger.info(`Portfolio ${portfolioId} is not highlighted`);
      return res.status(400).json({
        success: false,
        message: "Portfolio is not highlighted",
      });
    }

    homePageContent.highlightedPortfolios =
      homePageContent.highlightedPortfolios.filter(
        (id) => !id.equals(objectIdPortfolioId)
      );
    homePageContent.lastUpdated = Date.now();
    await homePageContent.save();

    logger.info(`Removed portfolio ${portfolioId} from highlighted portfolios`);

    return res.status(200).json({
      success: true,
      message: "Portfolio removed from highlighted portfolios successfully",
      data: homePageContent,
    });
  } catch (error) {
    logger.error(`Error removing highlighted portfolio: ${error.message}`, {
      error,
    });
    return res.status(500).json({
      success: false,
      message: "Failed to remove highlighted portfolio",
      error: error.message,
    });
  }
};

module.exports = {
  getHomePageContent,
  updateFeaturedBlogs,
  updateHighlightedPortfolios,
  resetHomePageContent,
  addFeaturedBlog,
  removeFeaturedBlog,
  addHighlightedPortfolio,
  removeHighlightedPortfolio,
};
