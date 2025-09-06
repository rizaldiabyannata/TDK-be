import mongoose from "mongoose";

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
      ref: "Portfolio",
    },
  ],
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
});

const HomePageContent = mongoose.model("PageContent", homePageContentSchema);
export default HomePageContent;
