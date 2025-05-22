const { v4: uuidv4 } = require("uuid");
const logger = require("../utils/logger");
const {
  Visitor,
  ViewCount,
  DailyView,
} = require("../models/viewTrackingModel");
const Blog = require("../models/blogModel");
const Portfolio = require("../models/portoModel");

const getModelByType = (contentType) => {
  return contentType === "portfolio" ? Portfolio : Blog;
};

const trackView = (contentType) => {
  return async (req, res, next) => {
    try {
      const requestData = {
        contentId: req.params.id || req.params.slug,
        visitorId: req.cookies.visitor_id,
        ip: req.ip,
        userAgent: req.headers["user-agent"],
        referrer: req.headers.referer || "direct",
        path: req.originalUrl,
        isId: !!req.params.id,
      };

      if (!requestData.visitorId) {
        const newVisitorId = uuidv4();
        res.cookie("visitor_id", newVisitorId, {
          maxAge: 365 * 24 * 60 * 60 * 1000,
          httpOnly: true,
        });
        requestData.visitorId = newVisitorId;
      }

      next();

      processViewTracking(contentType, requestData).catch((error) => {
        logger.error(`View tracking error for ${contentType}:`, error);
      });
    } catch (error) {
      logger.error(`Error in view tracking middleware: ${error.message}`);
      next();
    }
  };
};

async function processViewTracking(contentType, requestData) {
  try {
    const { contentId, visitorId, isId } = requestData;
    if (!contentId) return;

    const ContentModel = getModelByType(contentType);
    const query = isId ? { _id: contentId } : { slug: contentId };
    const contentDoc = await ContentModel.findOne(query);

    if (!contentDoc) {
      logger.warn(`${contentType} not found for tracking: ${contentId}`);
      return;
    }

    const documentId = contentDoc._id;

    const existingVisit = await Visitor.findOne({
      contentId: documentId,
      contentType: contentType,
      visitorId: visitorId,
    });

    const isUniqueVisit = !existingVisit;

    if (isUniqueVisit) {
      await Visitor.create({
        contentId: documentId,
        contentType: contentType,
        visitorId: visitorId,
        lastVisit: new Date(),
      });
    } else {
      await Visitor.updateOne(
        { _id: existingVisit._id },
        { $set: { lastVisit: new Date() } }
      );
    }

    const viewCountUpdate = await ViewCount.findOneAndUpdate(
      { contentId: documentId, contentType: contentType },
      {
        $inc: { total: 1 },
        ...(isUniqueVisit ? { $inc: { unique: 1 } } : {}),
      },
      { upsert: true, new: true }
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await DailyView.findOneAndUpdate(
      { contentId: documentId, contentType: contentType, date: today },
      { $inc: { count: 1 } },
      { upsert: true }
    );

    logger.info(
      `View tracked for ${contentType} ${
        contentDoc.title || documentId
      }: Total=${viewCountUpdate.total}, Unique=${viewCountUpdate.unique}`
    );

    if (viewCountUpdate.total % 10 === 0 || isUniqueVisit) {
      syncViewsToMainModel(contentType, documentId);
    }
  } catch (error) {
    logger.error(`Error tracking view: ${error.message}`, { error });
  }
}

async function syncViewsToMainModel(contentType, documentId) {
  try {
    const viewCount = await ViewCount.findOne({
      contentId: documentId,
      contentType: contentType,
    });

    if (!viewCount) return;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyViews = await DailyView.find({
      contentId: documentId,
      contentType: contentType,
      date: { $gte: thirtyDaysAgo },
    }).sort({ date: -1 });

    const viewHistoryData = dailyViews.map((item) => ({
      date: item.date,
      count: item.count,
    }));

    const ContentModel = getModelByType(contentType);
    await ContentModel.findByIdAndUpdate(documentId, {
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

    logger.info(
      `Synced view data for ${contentType} ${documentId} to main model`
    );
  } catch (error) {
    logger.error(`Error syncing view data: ${error.message}`, { error });
  }
}

module.exports = { trackView };
