import mongoose from "mongoose";

const staffSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Nama wajib diisi"],
      trim: true,
    },
    position: {
      type: String,
      required: [true, "Posisi wajib diisi"],
      trim: true,
    },
    short_description: {
      type: String,
      required: [true, "Deskripsi singkat wajib diisi"],
      trim: true,
    },
    photoUrl: {
      type: String,
      required: [true, "URL foto wajib diisi"],
    },
    socialMedia: [
      {
        platform: {
          type: String,
          required: [true, "Platform media sosial wajib diisi"],
          trim: true,
        },
        url: {
          type: String,
          required: [true, "URL media sosial wajib diisi"],
          trim: true,
        },
      },
    ],
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

staffSchema.virtual("children", {
  ref: "Staff",
  localField: "_id",
  foreignField: "parent",
});

staffSchema.pre("find", function (next) {
  this.populate("children");
  next();
});

staffSchema.pre("findOne", function (next) {
  this.populate("children");
  next();
});

const Staff = mongoose.model("Staff", staffSchema);

export default Staff;
