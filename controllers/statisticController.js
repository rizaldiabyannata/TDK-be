const { ViewCount, DailyView } = require("../models/viewTrackingModel");
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

    // 1. Get total and unique views directly from the ViewCount collection
    const viewCountPromise = ViewCount.aggregate([
      {
        $group: {
          _id: "$contentType", // Group by 'blog' or 'portfolio'
          totalViews: { $sum: "$total" },
          uniqueViews: { $sum: "$unique" },
        },
      },
    ]);

    // 2. Get top content (this part remains the same)
    const topPortfoliosPromise = Portfolio.find({ isArchived: { $ne: true } })
      .sort({ "views.total": -1 })
      .limit(5)
      .select("title slug views");

    const topBlogsPromise = Blog.find({ isArchived: { $ne: true } })
      .sort({ "views.total": -1 })
      .limit(5)
      .select("title slug views");

    // 3. Get daily view data directly from the DailyView collection for accuracy
    const dailyViewsPromise = DailyView.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lt: endDate },
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
            contentType: "$contentType",
          },
          views: { $sum: "$count" },
        },
      },
      // Pivot the data to have portfolio and blog views as separate fields
      {
        $group: {
          _id: "$_id.date",
          portfolioViews: {
            $sum: {
              $cond: [
                { $eq: ["$_id.contentType", "portfolio"] },
                "$views",
                0,
              ],
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

    // Run all promises in parallel for efficiency
    const [viewCounts, topPortfolios, topBlogs, dailyViews] =
      await Promise.all([
        viewCountPromise,
        topPortfoliosPromise,
        topBlogsPromise,
        dailyViewsPromise,
      ]);

    // Process view count results
    const portfolioStats = viewCounts.find((item) => item._id === "portfolio") || {};
    const blogStats = viewCounts.find((item) => item._id === "blog") || {};

    const portfolioTotalViews = portfolioStats.totalViews || 0;
    const blogTotalViews = blogStats.totalViews || 0;
    
    // NOTE: Summing unique views per item is not a true measure of site-wide unique visitors.
    // This value represents the sum of unique viewers for each individual content item.
    const portfolioUniqueViews = portfolioStats.uniqueViews || 0;
    const blogUniqueViews = blogStats.uniqueViews || 0;

    // Process daily data results
    const dailyDataMap = new Map();
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateString = date.toISOString().split("T")[0];
      dailyDataMap.set(dateString, {
        date: dateString,
        portfolioViews: 0,
        blogViews: 0,
        totalViews: 0,
      });
    }

    dailyViews.forEach((item) => {
      // item._id is the date string from aggregation
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