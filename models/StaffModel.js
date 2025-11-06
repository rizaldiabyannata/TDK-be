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
    level: {
      type: Number,
      default: 1,
      min: [1, "Level minimal adalah 1"],
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
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

// Method untuk menghitung level berdasarkan parent
staffSchema.methods.calculateLevel = async function () {
  if (!this.parent) {
    this.level = 1;
    return this.level;
  }

  const parent = await this.model("Staff").findById(this.parent);
  if (parent) {
    this.level = parent.level + 1;
  } else {
    this.level = 1;
  }
  return this.level;
};

// Pre-save middleware untuk menghitung level otomatis
staffSchema.pre("save", async function (next) {
  if (this.isNew || this.isModified("parent")) {
    await this.calculateLevel();
  }
  next();
});

// Index untuk performa
staffSchema.index({ parent: 1, level: 1, order: 1, isActive: 1 });
staffSchema.index({ level: 1, order: 1 });

const Staff = mongoose.model("Staff", staffSchema);

export default Staff;
