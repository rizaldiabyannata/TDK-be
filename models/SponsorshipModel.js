import mongoose from "mongoose";

const sponsorshipSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    websiteLink: {
      type: String,
      required: true,
      trim: true,
    },
    logoUrl: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

sponsorshipSchema.index({ name: 1 });

const Sponsorship = mongoose.model("Sponsorship", sponsorshipSchema);

export default Sponsorship;
