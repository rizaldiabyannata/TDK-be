const mongoose = require("mongoose");
const slugify = require("slugify");

const portfolioSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  shortdDescription: {
    type: String,
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
  likes: {
    type: Number,
    default: 0,
  },
  isArchived: {
    type: Boolean,
    default: false,
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

portfolioSchema.pre("save", function (next) {
  if (this.isModified("title")) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  next();
});

const Portfolio = mongoose.model("Portfolio", portfolioSchema);

module.exports = Portfolio;
