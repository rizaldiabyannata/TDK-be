const redisClient = require("../config/redisConfig");
const logger = require("../utils/logger");
const Blog = require("../models/blogModel");
const Porto = require("../models/portoModel");

// Map untuk memilih model berdasarkan tipe
const models = {
  Blog: Blog,
  Portfolio: Porto,
};

/**
 * Middleware untuk melacak total, unique, dan riwayat harian sebuah konten.
 * @param {'Blog' | 'Portfolio'} type - Tipe konten yang akan dilacak.
 */
const trackView = (type) => {
  return async (req, res, next) => {
    const Model = models[type];
    if (!Model) {
      logger.warn(`Tipe model tidak valid di viewTracker: ${type}`);
      return next();
    }

    const { slug } = req.params;
    const ip = req.headers["x-forwarded-for"] || req.ip;

    // --- LOGIKA YANG DIPERBAIKI UNTUK RIWAYAT HARIAN & TOTAL VIEW ---
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set waktu ke tengah malam untuk mewakili satu hari

    try {
      // Langkah 1: Coba perbarui riwayat untuk hari ini jika sudah ada.
      // Operasi ini juga akan menambah 'views.total'.
      const updateResult = await Model.updateOne(
        { slug: slug, "viewHistory.date": today },
        {
          $inc: {
            "views.total": 1,
            "viewHistory.$.count": 1,
          },
        }
      );

      // Langkah 2: Jika tidak ada riwayat untuk hari ini yang diperbarui (modifiedCount === 0),
      // maka tambahkan entri baru untuk hari ini. Ini akan dijalankan jika slug ada
      // tapi entri tanggal untuk hari ini tidak ada.
      // Kondisi 'viewHistory.date': { $ne: today } mencegah race condition.
      if (updateResult.modifiedCount === 0) {
        await Model.updateOne(
          { slug: slug, "viewHistory.date": { $ne: today } },
          {
            $inc: { "views.total": 1 }, // Tambah total view di sini
            $push: {
              viewHistory: { date: today, count: 1 },
            },
          }
        );
      }
    } catch (error) {
      logger.error(
        `Gagal memperbarui riwayat penayangan untuk ${slug}: ${error.message}`
      );
    }

    // --- Logika untuk Unique View (dijalankan secara terpisah dan tidak berubah) ---
    if (!redisClient.isReady) {
      logger.warn(
        `Redis client tidak siap, pelacakan unique view untuk ${slug} dilewati.`
      );
      return next();
    }

    const redisKey = `view:${type}:${slug}:${ip}`;

    try {
      const keyExists = await redisClient.get(redisKey);
      if (!keyExists) {
        // Jika ini unique view, tambah 'views.unique' dan set Redis.
        await Model.updateOne({ slug }, { $inc: { "views.unique": 1 } });
        await redisClient.set(redisKey, "1", { EX: 86400 }); // 24 jam
        logger.info(`Unique view dicatat untuk ${type} ${slug} dari IP ${ip}`);
      }
    } catch (error) {
      logger.error(
        `Error saat melacak unique view di Redis untuk ${slug}: ${error.message}`
      );
    }

    next();
  };
};

module.exports = { trackView };
