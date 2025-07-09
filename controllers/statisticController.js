const Portfolio = require("../models/portoModel");
const Blog = require("../models/blogModel");
const logger = require("../utils/logger");

const getDashboardStats = async (req, res) => {
  try {
    const days = parseInt(req.query.days || "7");

    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);

    const portfolioStatsPromise = Portfolio.aggregate([
      { $match: { isArchived: { $ne: true } } },
      {
        $group: {
          _id: null,
          totalViews: { $sum: "$views.total" },
          uniqueViews: { $sum: "$views.unique" },
        },
      },
    ]);

    const blogStatsPromise = Blog.aggregate([
      { $match: { isArchived: { $ne: true } } },
      {
        $group: {
          _id: null,
          totalViews: { $sum: "$views.total" },
          uniqueViews: { $sum: "$views.unique" },
        },
      },
    ]);

    const topPortfoliosPromise = Portfolio.find({ isArchived: { $ne: true } })
      .sort({ "views.total": -1 })
      .limit(5)
      .select("title slug views");

    const topBlogsPromise = Blog.find({ isArchived: { $ne: true } })
      .sort({ "views.total": -1 })
      .limit(5)
      .select("title slug views");

    const blogDailyViewsPromise = Blog.aggregate([
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

    const portfolioDailyViewsPromise = Portfolio.aggregate([
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

    return res.status(200).json({
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
    });
  } catch (error) {
    logger.error(`Error fetching dashboard stats: ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard statistics",
      error: error.message,
    });
  }
};

module.exports = {
  getDashboardStats,
};
