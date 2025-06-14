// maintain/fix-data.js
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Blog = require("../models/blogModel"); // Sesuaikan path ke model Anda
const logger = require("../utils/logger"); // Gunakan logger untuk melacak progres

// Muat environment variables dari file .env
dotenv.config();

// Fungsi untuk mengubah string menjadi Title Case
const toTitleCase = (str) => {
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

const fixBlogTitles = async () => {
  if (!process.env.MONGO_URI) {
    logger.error("MONGO_URI tidak ditemukan di file .env");
    process.exit(1);
  }

  try {
    // 1. Hubungkan ke database
    await mongoose.connect(process.env.MONGO_URI);
    logger.info("Berhasil terhubung ke MongoDB");

    // 2. Ambil semua blog yang ingin diperbaiki
    const blogsToFix = await Blog.find({}); // Anda bisa menambahkan filter jika perlu
    logger.info(`Menemukan ${blogsToFix.length} blog untuk diperbaiki.`);

    if (blogsToFix.length === 0) {
      logger.info("Tidak ada blog yang perlu diperbaiki. Keluar.");
      return;
    }

    let fixedCount = 0;
    // 3. Iterasi dan perbaiki setiap dokumen
    for (const blog of blogsToFix) {
      const originalTitle = blog.title;
      const newTitle = toTitleCase(originalTitle);

      // Hanya perbarui jika ada perubahan
      if (originalTitle !== newTitle) {
        blog.title = newTitle;
        // Jika slug juga perlu diperbarui berdasarkan judul baru
        // blog.slug = slugify(newTitle, { lower: true, strict: true });
        await blog.save();
        logger.info(`Memperbaiki judul: "${originalTitle}" -> "${newTitle}"`);
        fixedCount++;
      }
    }

    logger.info(`Selesai! Berhasil memperbaiki ${fixedCount} dari ${blogsToFix.length} judul blog.`);

  } catch (error) {
    logger.error("Terjadi kesalahan saat menjalankan skrip perbaikan:", error);
  } finally {
    // 4. Putuskan koneksi database
    await mongoose.disconnect();
    logger.info("Koneksi MongoDB ditutup.");
  }
};

// Jalankan fungsi perbaikan
fixBlogTitles();