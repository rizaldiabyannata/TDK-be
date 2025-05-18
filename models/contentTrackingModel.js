const mongoose = require("mongoose");

const homePageContentSchema = new mongoose.Schema({
  featuredBlogs: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Blog",
    },
  ],
  highlightedPortfolios: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Porto",
    },
  ],
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
});

const HomePageContent = mongoose.model("PageContent", homePageContentSchema);
module.exports = HomePageContent;
