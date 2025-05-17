const Portfolio = require("../models/portoModel");
const Blog = require("../models/blogModel");
const logger = require("../utils/logger");

const getDashboardStats = async (req, res) => {
  try {
    const days = parseInt(req.query.days || "7");
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const portfolios = await Portfolio.find();
    const portfolioTotalViews = portfolios.reduce(
      (sum, item) => sum + item.views.total,
      0
    );
    const portfolioUniqueViews = portfolios.reduce(
      (sum, item) => sum + item.views.unique,
      0
    );

    const blogs = await Blog.find();
    const blogTotalViews = blogs.reduce(
      (sum, item) => sum + item.views.total,
      0
    );
    const blogUniqueViews = blogs.reduce(
      (sum, item) => sum + item.views.unique,
      0
    );

    const topPortfolios = await Portfolio.find()
      .sort({ "views.total": -1 })
      .limit(5)
      .select("title slug views");

    const topBlogs = await Blog.find()
      .sort({ "views.total": -1 })
      .limit(5)
      .select("title slug views");

    const dailyData = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const portfolioDayViews = portfolios.reduce((sum, portfolio) => {
        const dayEntry = portfolio.viewHistory.find(
          (entry) =>
            new Date(entry.date).getTime() >= date.getTime() &&
            new Date(entry.date).getTime() < nextDate.getTime()
        );
        return sum + (dayEntry ? dayEntry.count : 0);
      }, 0);

      const blogDayViews = blogs.reduce((sum, blog) => {
        const dayEntry = blog.viewHistory.find(
          (entry) =>
            new Date(entry.date).getTime() >= date.getTime() &&
            new Date(entry.date).getTime() < nextDate.getTime()
        );
        return sum + (dayEntry ? dayEntry.count : 0);
      }, 0);

      dailyData.push({
        date: date.toISOString().split("T")[0],
        portfolioViews: portfolioDayViews,
        blogViews: blogDayViews,
        totalViews: portfolioDayViews + blogDayViews,
      });
    }

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
