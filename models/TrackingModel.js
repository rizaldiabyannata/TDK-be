import { Schema, model } from "mongoose";

const homePageContentSchema = new Schema({
  featuredBlogs: [
    {
      type: Schema.Types.ObjectId,
      ref: "Blog",
    },
  ],
  highlightedPortfolios: [
    {
      type: Schema.Types.ObjectId,
      ref: "Portfolio",
    },
  ],
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
});

const HomePageContent = model("PageContent", homePageContentSchema);
export default HomePageContent;
