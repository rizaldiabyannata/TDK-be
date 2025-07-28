const mongoose = require("mongoose");
const slugify = require("slugify");

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  slug: {
    type: String,
    unique: true,
    required: true,
  },
  content: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  coverImage: {
    type: String,
    required: true,
  },
  summary: {
    type: mongoose.Schema.Types.Mixed,
  },
  author: {
    type: String,
    required: true,
    default: "PT.Total Desain Konsultan",
    trim: true,
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
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

blogSchema.pre("validate", function (next) {
  if (this.title && !this.slug) {
    this.slug = slugify(this.title, {
      lower: true,
      strict: true,
      locale: "id",
    });
  }
  next();
});

blogSchema.index({
  title: "text",
  summary: "text",
  content: "text",
});

blogSchema.index({ isArchived: 1, createdAt: -1 });

const Blog = mongoose.model("Blog", blogSchema);

module.exports = Blog;
