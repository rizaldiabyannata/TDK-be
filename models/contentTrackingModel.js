const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const VisitorSchema = new Schema({
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true,
  },
  contentType: {
    type: String,
    enum: ["blog", "portfolio"],
    required: true,
  },
  visitorId: {
    type: String,
    required: true,
  },
  lastVisit: {
    type: Date,
    default: Date.now,
  },

  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400,
  },
});

VisitorSchema.index(
  { contentId: 1, contentType: 1, visitorId: 1 },
  { unique: true }
);

const ViewCountSchema = new Schema({
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true,
  },
  contentType: {
    type: String,
    enum: ["blog", "portfolio"],
    required: true,
  },
  total: {
    type: Number,
    default: 0,
  },
  unique: {
    type: Number,
    default: 0,
  },

  lastSynced: {
    type: Date,
    default: null,
  },
});

ViewCountSchema.index({ contentId: 1, contentType: 1 }, { unique: true });

const DailyViewSchema = new Schema({
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true,
  },
  contentType: {
    type: String,
    enum: ["blog", "portfolio"],
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  count: {
    type: Number,
    default: 1,
  },
});

DailyViewSchema.index(
  { contentId: 1, contentType: 1, date: 1 },
  { unique: true }
);

module.exports = {
  Visitor: mongoose.model("Visitor", VisitorSchema),
  ViewCount: mongoose.model("ViewCount", ViewCountSchema),
  DailyView: mongoose.model("DailyView", DailyViewSchema),
};
