import { aggregate, find } from "../models/PortoModel.js";
import { aggregate as _aggregate, find as _find } from "../models/BlogModel.js";
import { info, error as _error } from "../utils/logger.js";
import { isConnected, get, set } from "../config/redisConfig.js";

const DASHBOARD_CACHE_KEY = "dashboard_stats";

const getDashboardStats = async (req, res) => {
  try {
    // 1. Check for cached data first
    if (await isConnected()) {
      const cachedData = await get(DASHBOARD_CACHE_KEY);
      if (cachedData) {
        info("Dashboard stats cache HIT.");
        return res.status(200).json(JSON.parse(cachedData));
      }
    }
    info("Dashboard stats cache MISS. Fetching from DB.");

    // 2. Fetch data from DB (with bug fix for date range)
    const days = parseInt(req.query.days || "7");

    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1)); // FIX: Correctly calculate start date
    startDate.setHours(0, 0, 0, 0);

    const portfolioStatsPromise = aggregate([
      { $match: { isArchived: { $ne: true } } },
      {
        $group: {
          _id: null,
          totalViews: { $sum: "$views.total" },
          uniqueViews: { $sum: "$views.unique" },
        },
      },
    ]);

    const blogStatsPromise = _aggregate([
      { $match: { isArchived: { $ne: true } } },
      {
        $group: {
          _id: null,
          totalViews: { $sum: "$views.total" },
          uniqueViews: { $sum: "$views.unique" },
        },
      },
    ]);

    const topPortfoliosPromise = find({ isArchived: { $ne: true } })
      .sort({ "views.total": -1 })
      .limit(5)
      .select("title slug views");

    const topBlogsPromise = _find({ isArchived: { $ne: true } })
      .sort({ "views.total": -1 })
      .limit(5)
      .select("title slug views");

    const blogDailyViewsPromise = _aggregate([
      { $unwind: "$viewHistory" },
      {
        $match: {
          "viewHistory.date": { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$viewHistory.date",
              timezone: "Asia/Makassar",
            },
          },
          views: { $sum: "$viewHistory.count" },
        },
      },
      { $project: { _id: 0, date: "$_id", views: 1 } },
    ]);

    const portfolioDailyViewsPromise = aggregate([
      { $unwind: "$viewHistory" },
      {
        $match: {
          "viewHistory.date": { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$viewHistory.date",
              timezone: "Asia/Makassar",
            },
          },
          views: { $sum: "$viewHistory.count" },
        },
      },
      { $project: { _id: 0, date: "$_id", views: 1 } },
    ]);

    const [
      portfolioStatsResult,
      blogStatsResult,
      topPortfolios,
      topBlogs,
      blogDailyViews,
      portfolioDailyViews,
    ] = await Promise.all([
      portfolioStatsPromise,
      blogStatsPromise,
      topPortfoliosPromise,
      topBlogsPromise,
      blogDailyViewsPromise,
      portfolioDailyViewsPromise,
    ]);

    const portfolioStats = portfolioStatsResult[0] || {};
    const blogStats = blogStatsResult[0] || {};

    const portfolioTotalViews = portfolioStats.totalViews || 0;
    const blogTotalViews = blogStats.totalViews || 0;
    const portfolioUniqueViews = portfolioStats.uniqueViews || 0;
    const blogUniqueViews = blogStats.uniqueViews || 0;

    const dailyDataMap = new Map();
    // Initialize map with all dates in the range
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateString = date.toISOString().split("T")[0];
      dailyDataMap.set(dateString, {
        date: dateString,
        portfolioViews: 0,
        blogViews: 0,
      });
    }

    blogDailyViews.forEach((item) => {
      if (dailyDataMap.has(item.date)) {
        dailyDataMap.get(item.date).blogViews = item.views;
      }
    });

    portfolioDailyViews.forEach((item) => {
      if (dailyDataMap.has(item.date)) {
        dailyDataMap.get(item.date).portfolioViews = item.views;
      }
    });

    const dailyData = Array.from(dailyDataMap.values()).map((item) => ({
      ...item,
      totalViews: item.portfolioViews + item.blogViews,
    }));

    const responseData = {
      success: true,
      data: {
        summary: {
          totalViews: portfolioTotalViews + blogTotalViews,
          uniqueViews: portfolioUniqueViews + blogUniqueViews,
          portfolioViews: portfolioTotalViews,
          blogViews: blogTotalViews,
          portfolioUniqueViews: portfolioUniqueViews,
          blogUniqueViews: blogUniqueViews,
        },
        topContent: {
          portfolios: topPortfolios,
          blogs: topBlogs,
        },
        dailyData,
      },
    };

    // 3. Set the data in cache before responding
    if (await isConnected()) {
      await set(DASHBOARD_CACHE_KEY, JSON.stringify(responseData), {
        EX: 600, // Cache for 10 minutes
      });
    }

    return res.status(200).json(responseData);
  } catch (error) {
    _error(`Error fetching dashboard stats: ${error.message}`, { error });
    return res
      .status(500)
      .json({ message: "An internal server error occurred." });
  }
};

export default {
  getDashboardStats,
};
