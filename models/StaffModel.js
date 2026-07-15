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
    shortDescription: {
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
    level: {
      type: Number,
      required: [true, "Level wajib diisi"],
      min: [1, "Level minimal adalah 1"],
    },
    order: {
      type: Number,
      default: 0,
      min: [0, "Order minimal adalah 0"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index untuk performa query berdasarkan level dan order
staffSchema.index({ level: 1, order: 1 });
staffSchema.index({ isActive: 1, level: 1, order: 1 });

const Staff = mongoose.model("Staff", staffSchema);

export default Staff;
