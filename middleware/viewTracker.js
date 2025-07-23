const redisClient = require("../config/redisConfig");
const logger = require("../utils/logger");
const Blog = require("../models/BlogModel");
const Porto = require("../models/PortoModel");

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
    if (req.user) {
      logger.debug(
        `[Tracker] Akses oleh admin terdeteksi. Pelacakan view dilewati.`
      );
      return next();
    }

    const Model = models[type];
    if (!Model) {
      logger.warn(`Tipe model tidak valid di viewTracker: ${type}`);
      return next();
    }

    const { slug } = req.params;
    const ip = req.headers["x-forwarded-for"] || req.ip;

    logger.debug(
      `[Tracker] Memulai pelacakan untuk tipe: ${type}, slug: ${slug}, IP: ${ip}`
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      logger.debug(
        `[Tracker] Menggunakan tanggal untuk query: ${today.toISOString()}`
      );

      const updateResult = await Model.updateOne(
        { slug: slug, "viewHistory.date": today },
        {
          $inc: {
            "views.total": 1,
            "viewHistory.$.count": 1,
          },
        }
      );

      logger.debug(
        `[Tracker] Hasil update riwayat yang ada: modifiedCount = ${updateResult.modifiedCount}, matchedCount = ${updateResult.matchedCount}`
      );

      if (updateResult.modifiedCount === 0) {
        logger.debug(
          `[Tracker] Riwayat untuk hari ini tidak ditemukan, mencoba membuat entri baru.`
        );
        const pushResult = await Model.updateOne(
          { slug: slug, "viewHistory.date": { $ne: today } },
          {
            $inc: { "views.total": 1 },
            $push: {
              viewHistory: { date: today, count: 1 },
            },
          }
        );
        logger.debug(
          `[Tracker] Hasil pembuatan entri baru: modifiedCount = ${pushResult.modifiedCount}, matchedCount = ${pushResult.matchedCount}`
        );
      } else {
        logger.debug(
          `[Tracker] Berhasil memperbarui riwayat yang ada untuk slug: ${slug}`
        );
      }
    } catch (error) {
      logger.error(
        `[Tracker] Gagal memperbarui riwayat penayangan untuk ${slug}: ${error.message}`
      );
    }

    if (!(await redisClient.isConnected())) {
      logger.warn(
        `[Tracker] Redis client tidak siap, pelacakan unique view untuk ${slug} dilewati.`
      );
      return next();
    }

    const redisKey = `view:${type}:${slug}:${ip}`;
    logger.debug(
      `[Tracker] Menggunakan kunci Redis untuk unique view: ${redisKey}`
    );

    try {
      const keyExists = await redisClient.get(redisKey);
      logger.debug(
        `[Tracker] Apakah kunci '${redisKey}' ada di Redis? -> ${
          keyExists ? "Ya" : "Tidak"
        }`
      );

      if (!keyExists) {
        logger.info(
          `[Tracker] Unique view terdeteksi untuk ${type} ${slug}. Memperbarui database.`
        );
        await Model.updateOne({ slug }, { $inc: { "views.unique": 1 } });
        await redisClient.set(redisKey, "1", { EX: 86400 });
        logger.info(
          `[Tracker] Unique view berhasil dicatat untuk ${type} ${slug} dari IP ${ip}`
        );
      } else {
        logger.debug(
          `[Tracker] Bukan unique view untuk ${type} ${slug} dari IP ${ip}. Melanjutkan.`
        );
      }
    } catch (error) {
      logger.error(
        `[Tracker] Error saat melacak unique view di Redis untuk ${slug}: ${error.message}`
      );
    }

    next();
  };
};

module.exports = { trackView };
