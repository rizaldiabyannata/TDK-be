import HomePageContent, { findOne, create } from "../models/TrackingModel.js";
import { findOne as _findOne } from "../models/BlogModel.js";
import { findOne as __findOne } from "../models/PortoModel.js";
import { info, error as _error } from "../utils/logger.js";
import { Types } from "mongoose";
import { del, get, set } from "../config/redisConfig.js";

const HOME_PAGE_CONTENT_CACHE_KEY = "home_page_content";
const CACHE_EXPIRY_SECONDS_HOME = 300;

const clearHomePageContentCache = async () => {
  try {
    await del(HOME_PAGE_CONTENT_CACHE_KEY);
    info("Home page content cache cleared.");
  } catch (error) {
    _error("Error clearing home page content cache:", error);
  }
};

const getHomePageContent = async (req, res) => {
  try {
    const cachedData = await get(HOME_PAGE_CONTENT_CACHE_KEY);
    if (cachedData) {
      info(`Cache hit for: ${HOME_PAGE_CONTENT_CACHE_KEY}`);
      return res.status(200).json(cachedData); // Return cached data directly
    }

    info(
      `Cache miss for: ${HOME_PAGE_CONTENT_CACHE_KEY}. Fetching from DB.`
    );
    let homePageContent = await findOne()
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
      info("Created new home page content as none existed");
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

    await set(
      HOME_PAGE_CONTENT_CACHE_KEY,
      JSON.stringify(homePageContent),
      { EX: CACHE_EXPIRY_SECONDS_HOME }
    );

    info(`Retrieved home page content (${homePageContent._id})`);
    return res.status(200).json({
      data: {
        highlightedPortfolios: homePageContent.highlightedPortfolios || [],
        featuredBlogs: homePageContent.featuredBlogs || [],
        lastUpdated: homePageContent.lastUpdated || null,
      },
    });
  } catch (error) {
    _error(`Error fetching home page content: ${error.message}`, {
      error,
    });
    return res
      .status(500)
      .json({ message: "An internal server error occurred." });
  }
};

const resetHomePageContent = async (req, res) => {
  try {
    let homePageContent = await findOne();

    if (!homePageContent) {
      homePageContent = await create({});
      info("Created new empty home page content");
    } else {
      homePageContent.featuredBlogs = [];
      homePageContent.highlightedPortfolios = [];
      homePageContent.lastUpdated = Date.now();
      await homePageContent.save();
      info(`Reset home page content (${homePageContent._id})`);
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
    _error(`Error resetting home page content: ${error.message}`, {
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

    if (!blogId || !Types.ObjectId.isValid(blogId)) {
      info(`Invalid blogId provided: ${blogId}`);
      return res.status(400).json({
        message: "Valid blog ID is required",
      });
    }

    const objectIdBlogId = new Types.ObjectId(blogId);

    const blog = await _findOne({
      _id: objectIdBlogId,
      isArchived: { $ne: true },
    });
    if (!blog) {
      info(`Blog with ID ${blogId} not found or is archived`);
      return res.status(404).json({
        message: "Blog not found or is archived",
      });
    }

    let homePageContent = await findOne();

    if (!homePageContent) {
      homePageContent = await create({
        featuredBlogs: [objectIdBlogId],
      });
      info(`Created new home page content with featured blog ${blogId}`);
    } else {
      if (
        homePageContent.featuredBlogs.some((id) => id.equals(objectIdBlogId))
      ) {
        info(`Blog ${blogId} is already featured`);
        return res.status(400).json({
          message: "Blog is already featured",
        });
      }

      homePageContent.featuredBlogs.push(objectIdBlogId);
      homePageContent.lastUpdated = Date.now();
      await homePageContent.save();
      info(`Added blog ${blogId} to featured blogs`);
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
    _error(`Error adding featured blog: ${error.message}`, { error });
    return res
      .status(500)
      .json({ message: "An internal server error occurred." });
  }
};

const removeFeaturedBlog = async (req, res) => {
  try {
    const { blogId } = req.params;

    if (!blogId || !Types.ObjectId.isValid(blogId)) {
      info(`Invalid blogId provided: ${blogId}`);
      return res.status(400).json({
        message: "Valid blog ID is required",
      });
    }

    const objectIdBlogId = new Types.ObjectId(blogId);
    let homePageContent = await findOne();

    if (!homePageContent) {
      info("No home page content found to remove blog from");
      return res.status(404).json({
        message: "Home page content not found",
      });
    }

    if (
      !homePageContent.featuredBlogs.some((id) => id.equals(objectIdBlogId))
    ) {
      info(`Blog ${blogId} is not featured`);
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
    info(`Removed blog ${blogId} from featured blogs`);

    return res.status(200).json({
      message: "Blog removed from featured blogs successfully",
      data: {
        featuredBlogs: homePageContent.featuredBlogs || [],
        highlightedPortfolios: homePageContent.highlightedPortfolios || [],
        lastUpdated: homePageContent.lastUpdated || null,
      },
    });
  } catch (error) {
    _error(`Error removing featured blog: ${error.message}`, { error });
    return res
      .status(500)
      .json({ message: "An internal server error occurred." });
  }
};

const addHighlightedPortfolio = async (req, res) => {
  try {
    const { portfolioId } = req.body;

    if (!portfolioId || !Types.ObjectId.isValid(portfolioId)) {
      info(`Invalid portfolioId provided: ${portfolioId}`);
      return res.status(400).json({
        message: "Valid portfolio ID is required",
      });
    }

    const objectIdPortfolioId = new Types.ObjectId(portfolioId);

    const portfolio = await __findOne({
      _id: objectIdPortfolioId,
      isArchived: { $ne: true },
    });
    if (!portfolio) {
      info(`Portfolio with ID ${portfolioId} not found or is archived`);
      return res.status(404).json({
        message: "Portfolio not found or is archived",
      });
    }

    let homePageContent = await findOne();

    if (!homePageContent) {
      homePageContent = await create({
        highlightedPortfolios: [objectIdPortfolioId],
      });
      info(
        `Created new home page content with highlighted portfolio ${portfolioId}`
      );
    } else {
      if (
        homePageContent.highlightedPortfolios.some((id) =>
          id.equals(objectIdPortfolioId)
        )
      ) {
        info(`Portfolio ${portfolioId} is already highlighted`);
        return res.status(400).json({
          message: "Portfolio is already highlighted",
        });
      }

      homePageContent.highlightedPortfolios.push(objectIdPortfolioId);
      homePageContent.lastUpdated = Date.now();
      await homePageContent.save();
      info(`Added portfolio ${portfolioId} to highlighted portfolios`);
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
    _error(`Error adding highlighted portfolio: ${error.message}`, {
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

    if (!portfolioId || !Types.ObjectId.isValid(portfolioId)) {
      info(`Invalid portfolioId provided: ${portfolioId}`);
      return res.status(400).json({
        message: "Valid portfolio ID is required",
      });
    }
    const objectIdPortfolioId = new Types.ObjectId(portfolioId);
    let homePageContent = await findOne();

    if (!homePageContent) {
      info("No home page content found to remove portfolio from");
      return res.status(404).json({
        message: "Home page content not found",
      });
    }

    if (
      !homePageContent.highlightedPortfolios.some((id) =>
        id.equals(objectIdPortfolioId)
      )
    ) {
      info(`Portfolio ${portfolioId} is not highlighted`);
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
    info(`Removed portfolio ${portfolioId} from highlighted portfolios`);

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
    _error(`Error removing highlighted portfolio: ${error.message}`, {
      error,
    });
    return res
      .status(500)
      .json({ message: "An internal server error occurred." });
  }
};

export default {
  getHomePageContent,
  resetHomePageContent,
  addFeaturedBlog,
  removeFeaturedBlog,
  addHighlightedPortfolio,
  removeHighlightedPortfolio,
};
