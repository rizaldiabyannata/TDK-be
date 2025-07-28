const mongoose = require("mongoose");
const slugify = require("slugify");

const portfolioSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  shortDescription: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  coverImage: {
    type: String,
    required: true,
  },
  link: {
    type: String,
  },
  slug: {
    type: String,
    unique: true,
    required: true,
  },
  isArchived: {
    type: Boolean,
    default: false,
    index: true,
  },
  views: {
    total: {
      type: Number,
      default: 0,
    },
    unique: {
      type: Number,
      default: 0,
    },
  },
  viewHistory: [
    {
      date: {
        type: Date,
        default: Date.now,
      },
      count: {
        type: Number,
        default: 0,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updateAt: {
    type: Date,
    default: Date.now,
  },
});

portfolioSchema.pre("validate", function (next) {
  if (this.title && !this.slug) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  next();
});

portfolioSchema.index({
  title: "text",
  description: "text",
  shortDescription: "text",
});

portfolioSchema.index({ isArchived: 1, createdAt: -1 });

const Portfolio = mongoose.model("Portfolio", portfolioSchema);

module.exports = Portfolio;
