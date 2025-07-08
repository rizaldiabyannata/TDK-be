const { DailyView } = require("../models/viewTrackingModel");
const Portfolio = require("../models/portoModel");
const Blog = require("../models/blogModel");
const logger = require("../utils/logger");

const getDashboardStats = async (req, res) => {
  try {
    const days = parseInt(req.query.days || "7");
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // FIX 1: Mengambil statistik total langsung dari koleksi Blog dan Portfolio
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

    const dailyViewsPromise = DailyView.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lt: endDate },
        },
      },
      {
        $group: {
          _id: {
            // FIX 2: Menambahkan timezone agar konsisten dengan server
            date: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$date",
                timezone: "Asia/Makassar", // Sesuaikan dengan timezone server Anda
              },
            },
            contentType: "$contentType",
          },
          views: { $sum: "$count" },
        },
      },
      {
        $group: {
          _id: "$_id.date",
          portfolioViews: {
            $sum: {
              $cond: [{ $eq: ["$_id.contentType", "portfolio"] }, "$views", 0],
            },
          },
          blogViews: {
            $sum: {
              $cond: [{ $eq: ["$_id.contentType", "blog"] }, "$views", 0],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const [
      portfolioStatsResult,
      blogStatsResult,
      topPortfolios,
      topBlogs,
      dailyViews,
    ] = await Promise.all([
      portfolioStatsPromise,
      blogStatsPromise,
      topPortfoliosPromise,
      topBlogsPromise,
      dailyViewsPromise,
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

    dailyViews.forEach((item) => {
      if (dailyDataMap.has(item._id)) {
        const entry = dailyDataMap.get(item._id);
        entry.portfolioViews = item.portfolioViews;
        entry.blogViews = item.blogViews;
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
