//TODO : fix bug: unique more biger than total views
//TODO : fix bug: daily view count not show in response

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

    // 1. Menggunakan Agregasi untuk mendapatkan total views
    const portfolioStatsPromise = Portfolio.aggregate([
      {
        $group: {
          _id: null,
          totalViews: { $sum: "$views.total" },
          uniqueViews: { $sum: "$views.unique" },
        },
      },
    ]);

    const blogStatsPromise = Blog.aggregate([
      {
        $group: {
          _id: null,
          totalViews: { $sum: "$views.total" },
          uniqueViews: { $sum: "$views.unique" },
        },
      },
    ]);

    // 2. Mengambil konten teratas secara paralel
    const topPortfoliosPromise = Portfolio.find()
      .sort({ "views.total": -1 })
      .limit(5)
      .select("title slug views");

    const topBlogsPromise = Blog.find()
      .sort({ "views.total": -1 })
      .limit(5)
      .select("title slug views");

    // 3. Agregasi untuk data harian
    const dailyPortfolioViewsPromise = Portfolio.aggregate([
      { $unwind: "$viewHistory" },
      {
        $match: {
          "viewHistory.date": { $gte: startDate, $lt: endDate },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$viewHistory.date" } },
          views: { $sum: "$viewHistory.count" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const dailyBlogViewsPromise = Blog.aggregate([
        { $unwind: "$viewHistory" },
        {
          $match: {
            "viewHistory.date": { $gte: startDate, $lt: endDate },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$viewHistory.date" } },
            views: { $sum: "$viewHistory.count" },
          },
        },
        { $sort: { _id: 1 } },
      ]);


    // Menjalankan semua promise secara bersamaan untuk efisiensi
    const [
      portfolioStats,
      blogStats,
      topPortfolios,
      topBlogs,
      dailyPortfolioViews,
      dailyBlogViews,
    ] = await Promise.all([
      portfolioStatsPromise,
      blogStatsPromise,
      topPortfoliosPromise,
      topBlogsPromise,
      dailyPortfolioViewsPromise,
      dailyBlogViewsPromise,
    ]);

    const portfolioTotalViews = portfolioStats[0]?.totalViews || 0;
    const portfolioUniqueViews = portfolioStats[0]?.uniqueViews || 0;
    const blogTotalViews = blogStats[0]?.totalViews || 0;
    const blogUniqueViews = blogStats[0]?.uniqueViews || 0;
    
    // Menggabungkan data harian dari blog dan portfolio
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

    dailyPortfolioViews.forEach(item => {
        if(dailyDataMap.has(item._id)) {
            dailyDataMap.get(item._id).portfolioViews = item.views;
        }
    });

    dailyBlogViews.forEach(item => {
        if(dailyDataMap.has(item._id)) {
            dailyDataMap.get(item._id).blogViews = item.views;
        }
    });

    const dailyData = Array.from(dailyDataMap.values()).map(item => ({
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