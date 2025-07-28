const HomePageContent = require("../models/trackingModel");
const Blog = require("../models/blogModel");
const Portfolio = require("../models/portoModel");
const logger = require("../utils/logger");
const mongoose = require("mongoose");
const redisClient = require("../config/redisConfig");

const HOME_PAGE_CONTENT_CACHE_KEY = "home_page_content";
const CACHE_EXPIRY_SECONDS_HOME = 300;

const clearHomePageContentCache = async () => {
  try {
    await redisClient.delete(HOME_PAGE_CONTENT_CACHE_KEY);
    logger.info("Home page content cache cleared.");
  } catch (error) {
    logger.error("Error clearing home page content cache:", error);
  }
};

const getHomePageContent = async (req, res) => {
  try {
    const cachedData = await redisClient.get(HOME_PAGE_CONTENT_CACHE_KEY);
    if (cachedData) {
      logger.info(`Cache hit for: ${HOME_PAGE_CONTENT_CACHE_KEY}`);
      return res.status(200).json({
        success: true,
        data: {
          highlightedPortfolios: cachedData.highlightedPortfolios,
          featuredBlogs: cachedData.featuredBlogs,
          lastUpdated: cachedData.lastUpdated,
        },
      });
    }

    logger.info(
      `Cache miss for: ${HOME_PAGE_CONTENT_CACHE_KEY}. Fetching from DB.`
    );
    let homePageContent = await HomePageContent.findOne()
      .populate({
        path: "featuredBlogs",
        select: "title slug summary coverImage createdAt",
        match: { isArchived: { $ne: true } },
      })
      .populate({
        path: "highlightedPortfolios",
        select: "title slug coverImage shortDescription link",
        match: { isArchived: { $ne: true } },
      })
      .lean();

    if (!homePageContent) {
      const newContent = new HomePageContent({});
      homePageContent = await newContent.save();
      homePageContent = homePageContent.toObject();
      logger.info("Created new home page content as none existed");
    } else {
      if (homePageContent.featuredBlogs) {
        homePageContent.featuredBlogs = homePageContent.featuredBlogs.filter(
          (blog) => blog !== null
        );
      }
      if (homePageContent.highlightedPortfolios) {
        homePageContent.highlightedPortfolios =
          homePageContent.highlightedPortfolios.filter(
            (portfolio) => portfolio !== null
          );
      }
    }

    await redisClient.set(
      HOME_PAGE_CONTENT_CACHE_KEY,
      JSON.stringify(homePageContent),
      CACHE_EXPIRY_SECONDS_HOME
    );

    logger.info(`Retrieved home page content (${homePageContent._id})`);
    return res.status(200).json({
      data: {
        highlightedPortfolios: homePageContent.highlightedPortfolios || [],
        featuredBlogs: homePageContent.featuredBlogs || [],
        lastUpdated: homePageContent.lastUpdated || null,
      },
    });
  } catch (error) {
    logger.error(`Error fetching home page content: ${error.message}`, {
      error,
    });
    return res
      .status(500)
      .json({ message: "An internal server error occurred." });
  }
};

const updateFeaturedBlogs = async (req, res) => {
  try {
    const { blogIds } = req.body;

    if (!blogIds || !Array.isArray(blogIds)) {
      return res.status(400).json({
        message: "Blog IDs must be provided as an array",
      });
    }

    const objectIdBlogIds = blogIds.map(
      (id) => new mongoose.Types.ObjectId(id)
    );

    const existingBlogs = await Blog.find({
      _id: { $in: objectIdBlogIds },
      isArchived: { $ne: true },
    }).select("_id");

    if (existingBlogs.length !== objectIdBlogIds.length) {
      logger.info(
        "Some blogs were not found, are archived, or duplicates exist"
      );
      return res.status(404).json({
        message:
          "Some blogs were not found, are archived, or contain duplicates",
      });
    }

    let homePageContent = await HomePageContent.findOne();

    if (!homePageContent) {
      homePageContent = new HomePageContent();
    }

    homePageContent.featuredBlogs = objectIdBlogIds;
    homePageContent.lastUpdated = Date.now();
    await homePageContent.save();

    await clearHomePageContentCache();
    logger.info(
      `Updated featured blogs for home page content (${homePageContent._id})`
    );

    return res.status(200).json({
      message: "Featured blogs updated successfully",
      data: {
        featuredBlogs: homePageContent.featuredBlogs || [],
        highlightedPortfolios: homePageContent.highlightedPortfolios || [],
        lastUpdated: homePageContent.lastUpdated || null,
      },
    });
  } catch (error) {
    logger.error(`Error updating featured blogs: ${error.message}`, { error });

    if (error instanceof mongoose.Error.CastError) {
      return res.status(400).json({
        message: "Some provided blog IDs are invalid",
      });
    }
    return res
      .status(500)
      .json({ message: "An internal server error occurred." });
  }
};

const updateHighlightedPortfolios = async (req, res) => {
  try {
    const { portfolioIds } = req.body;

    if (!portfolioIds || !Array.isArray(portfolioIds)) {
      return res.status(400).json({
        message: "Portfolio IDs must be provided as an array",
      });
    }

    const objectIdPortfolioIds = portfolioIds.map(
      (id) => new mongoose.Types.ObjectId(id)
    );

    const existingPortfolios = await Portfolio.find({
      _id: { $in: objectIdPortfolioIds },
      isArchived: { $ne: true },
    }).select("_id");

    if (existingPortfolios.length !== objectIdPortfolioIds.length) {
      logger.info(
        "Some portfolios were not found, are archived, or duplicates exist"
      );
      return res.status(404).json({
        message:
          "Some portfolios were not found, are archived, or contain duplicates",
      });
    }

    let homePageContent = await HomePageContent.findOne();

    if (!homePageContent) {
      homePageContent = new HomePageContent();
    }

    homePageContent.highlightedPortfolios = objectIdPortfolioIds;
    homePageContent.lastUpdated = Date.now();
    await homePageContent.save();

    await clearHomePageContentCache();
    logger.info(
      `Updated highlighted portfolios for home page content (${homePageContent._id})`
    );

    return res.status(200).json({
      message: "Highlighted portfolios updated successfully",
      data: {
        featuredBlogs: homePageContent.featuredBlogs || [],
        highlightedPortfolios: homePageContent.highlightedPortfolios || [],
        lastUpdated: homePageContent.lastUpdated || null,
      },
    });
  } catch (error) {
    logger.error(`Error updating highlighted portfolios: ${error.message}`, {
      error,
    });
    if (error instanceof mongoose.Error.CastError) {
      return res.status(400).json({
        message: "Some provided portfolio IDs are invalid",
      });
    }
    return res
      .status(500)
      .json({ message: "An internal server error occurred." });
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

    await clearHomePageContentCache();

    return res.status(200).json({
      message: "Home page content reset successfully",
      data: {
        featuredBlogs: homePageContent.featuredBlogs || [],
        highlightedPortfolios: homePageContent.highlightedPortfolios || [],
        lastUpdated: homePageContent.lastUpdated || null,
      },
    });
  } catch (error) {
    logger.error(`Error resetting home page content: ${error.message}`, {
      error,
    });
    return res
      .status(500)
      .json({ message: "An internal server error occurred." });
  }
};

const addFeaturedBlog = async (req, res) => {
  try {
    const { blogId } = req.body;

    if (!blogId || !mongoose.Types.ObjectId.isValid(blogId)) {
      logger.info(`Invalid blogId provided: ${blogId}`);
      return res.status(400).json({
        message: "Valid blog ID is required",
      });
    }

    const objectIdBlogId = new mongoose.Types.ObjectId(blogId);

    const blog = await Blog.findOne({
      _id: objectIdBlogId,
      isArchived: { $ne: true },
    });
    if (!blog) {
      logger.info(`Blog with ID ${blogId} not found or is archived`);
      return res.status(404).json({
        message: "Blog not found or is archived",
      });
    }

    let homePageContent = await HomePageContent.findOne();

    if (!homePageContent) {
      homePageContent = await HomePageContent.create({
        featuredBlogs: [objectIdBlogId],
      });
      logger.info(`Created new home page content with featured blog ${blogId}`);
    } else {
      if (
        homePageContent.featuredBlogs.some((id) => id.equals(objectIdBlogId))
      ) {
        logger.info(`Blog ${blogId} is already featured`);
        return res.status(400).json({
          message: "Blog is already featured",
        });
      }

      homePageContent.featuredBlogs.push(objectIdBlogId);
      homePageContent.lastUpdated = Date.now();
      await homePageContent.save();
      logger.info(`Added blog ${blogId} to featured blogs`);
    }

    await clearHomePageContentCache();

    return res.status(200).json({
      success: true,
      message: "Blog added to featured blogs successfully",
      data: {
        featuredBlogs: homePageContent.featuredBlogs || [],
        highlightedPortfolios: homePageContent.highlightedPortfolios || [],
        lastUpdated: homePageContent.lastUpdated || null,
      },
    });
  } catch (error) {
    logger.error(`Error adding featured blog: ${error.message}`, { error });
    return res
      .status(500)
      .json({ message: "An internal server error occurred." });
  }
};

const removeFeaturedBlog = async (req, res) => {
  try {
    const { blogId } = req.params;

    if (!blogId || !mongoose.Types.ObjectId.isValid(blogId)) {
      logger.info(`Invalid blogId provided: ${blogId}`);
      return res.status(400).json({
        message: "Valid blog ID is required",
      });
    }

    const objectIdBlogId = new mongoose.Types.ObjectId(blogId);
    let homePageContent = await HomePageContent.findOne();

    if (!homePageContent) {
      logger.info("No home page content found to remove blog from");
      return res.status(404).json({
        message: "Home page content not found",
      });
    }

    if (
      !homePageContent.featuredBlogs.some((id) => id.equals(objectIdBlogId))
    ) {
      logger.info(`Blog ${blogId} is not featured`);
      return res.status(400).json({
        message: "Blog is not featured",
      });
    }

    homePageContent.featuredBlogs = homePageContent.featuredBlogs.filter(
      (id) => !id.equals(objectIdBlogId)
    );
    homePageContent.lastUpdated = Date.now();
    await homePageContent.save();

    await clearHomePageContentCache();
    logger.info(`Removed blog ${blogId} from featured blogs`);

    return res.status(200).json({
      message: "Blog removed from featured blogs successfully",
      data: {
        featuredBlogs: homePageContent.featuredBlogs || [],
        highlightedPortfolios: homePageContent.highlightedPortfolios || [],
        lastUpdated: homePageContent.lastUpdated || null,
      },
    });
  } catch (error) {
    logger.error(`Error removing featured blog: ${error.message}`, { error });
    return res
      .status(500)
      .json({ message: "An internal server error occurred." });
  }
};

const addHighlightedPortfolio = async (req, res) => {
  try {
    const { portfolioId } = req.body;

    if (!portfolioId || !mongoose.Types.ObjectId.isValid(portfolioId)) {
      logger.info(`Invalid portfolioId provided: ${portfolioId}`);
      return res.status(400).json({
        message: "Valid portfolio ID is required",
      });
    }

    const objectIdPortfolioId = new mongoose.Types.ObjectId(portfolioId);

    const portfolio = await Portfolio.findOne({
      _id: objectIdPortfolioId,
      isArchived: { $ne: true },
    });
    if (!portfolio) {
      logger.info(`Portfolio with ID ${portfolioId} not found or is archived`);
      return res.status(404).json({
        message: "Portfolio not found or is archived",
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
      if (
        homePageContent.highlightedPortfolios.some((id) =>
          id.equals(objectIdPortfolioId)
        )
      ) {
        logger.info(`Portfolio ${portfolioId} is already highlighted`);
        return res.status(400).json({
          message: "Portfolio is already highlighted",
        });
      }

      homePageContent.highlightedPortfolios.push(objectIdPortfolioId);
      homePageContent.lastUpdated = Date.now();
      await homePageContent.save();
      logger.info(`Added portfolio ${portfolioId} to highlighted portfolios`);
    }

    await clearHomePageContentCache();

    return res.status(200).json({
      message: "Portfolio added to highlighted portfolios successfully",
      data: {
        featuredBlogs: homePageContent.featuredBlogs || [],
        highlightedPortfolios: homePageContent.highlightedPortfolios || [],
        lastUpdated: homePageContent.lastUpdated || null,
      },
    });
  } catch (error) {
    logger.error(`Error adding highlighted portfolio: ${error.message}`, {
      error,
    });
    return res
      .status(500)
      .json({ message: "An internal server error occurred." });
  }
};

const removeHighlightedPortfolio = async (req, res) => {
  try {
    const { portfolioId } = req.params;

    if (!portfolioId || !mongoose.Types.ObjectId.isValid(portfolioId)) {
      logger.info(`Invalid portfolioId provided: ${portfolioId}`);
      return res.status(400).json({
        message: "Valid portfolio ID is required",
      });
    }
    const objectIdPortfolioId = new mongoose.Types.ObjectId(portfolioId);
    let homePageContent = await HomePageContent.findOne();

    if (!homePageContent) {
      logger.info("No home page content found to remove portfolio from");
      return res.status(404).json({
        message: "Home page content not found",
      });
    }

    if (
      !homePageContent.highlightedPortfolios.some((id) =>
        id.equals(objectIdPortfolioId)
      )
    ) {
      logger.info(`Portfolio ${portfolioId} is not highlighted`);
      return res.status(400).json({
        message: "Portfolio is not highlighted",
      });
    }

    homePageContent.highlightedPortfolios =
      homePageContent.highlightedPortfolios.filter(
        (id) => !id.equals(objectIdPortfolioId)
      );
    homePageContent.lastUpdated = Date.now();
    await homePageContent.save();

    await clearHomePageContentCache();
    logger.info(`Removed portfolio ${portfolioId} from highlighted portfolios`);

    return res.status(200).json({
      success: true,
      message: "Portfolio removed from highlighted portfolios successfully",
      data: {
        featuredBlogs: homePageContent.featuredBlogs || [],
        highlightedPortfolios: homePageContent.highlightedPortfolios || [],
        lastUpdated: homePageContent.lastUpdated || null,
      },
    });
  } catch (error) {
    logger.error(`Error removing highlighted portfolio: ${error.message}`, {
      error,
    });
    return res
      .status(500)
      .json({ message: "An internal server error occurred." });
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
