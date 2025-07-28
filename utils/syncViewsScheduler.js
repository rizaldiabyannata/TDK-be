const cron = require("node-cron");
const { ViewCount, DailyView } = require("../models/trackingModel");
const Blog = require("../models/BlogModel");
const Portfolio = require("../models/PortoModel");
const logger = require("./logger");

const getModelByType = (contentType) => {
  return contentType === "portfolio" ? Portfolio : Blog;
};

async function syncAllViewData() {
  try {
    await syncContentTypeViews("blog");
    await syncContentTypeViews("portfolio");
    logger.info("All view data synced successfully");
  } catch (error) {
    logger.error("Error syncing view data:", error);
  }
}

async function syncContentTypeViews(contentType) {
  try {
    // Pastikan hasil query tidak null atau undefined
    const viewCounts = await ViewCount.find({ contentType });

    if (!viewCounts || viewCounts.length === 0) {
      logger.warn(`No ${contentType} view records found to sync.`);
      return; // Tidak ada data yang perlu disinkronkan
    }

    logger.info(`Syncing ${viewCounts.length} ${contentType} view records`);

    for (const viewCount of viewCounts) {
      try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const dailyViews = await DailyView.find({
          contentId: viewCount.contentId,
          contentType: contentType,
          date: { $gte: thirtyDaysAgo },
        }).sort({ date: -1 });

        const viewHistoryData = dailyViews.map((item) => ({
          date: item.date,
          count: item.count,
        }));

        const ContentModel = getModelByType(contentType);
        await ContentModel.findByIdAndUpdate(viewCount.contentId, {
          $set: {
            "views.total": viewCount.total,
            "views.unique": viewCount.unique,
            viewHistory: viewHistoryData,
          },
        });

        await ViewCount.updateOne(
          { _id: viewCount._id },
          { $set: { lastSynced: new Date() } }
        );
      } catch (itemError) {
        logger.error(
          `Error syncing ${contentType} ID ${viewCount.contentId}:`,
          itemError
        );
      }
    }

    logger.info(`Successfully synced ${contentType} view data`);
  } catch (error) {
    logger.error(`Error syncing ${contentType} view data:`, error);
  }
}

function scheduleViewSync() {
  cron.schedule("0 * * * *", () => {
    logger.info("Running scheduled view data sync");
    syncAllViewData();
  });

  logger.info("View sync scheduler initialized");
}

module.exports = {
  syncAllViewData,
  scheduleViewSync,
};
