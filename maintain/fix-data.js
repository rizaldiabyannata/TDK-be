// maintain/fix-data.js
import { connect, disconnect } from "mongoose";
import { config } from "dotenv";
import { find } from "../models/BlogModel.js"; // Sesuaikan path ke model Anda
import { error as _error, info } from "../utils/logger.js"; // Gunakan logger untuk melacak progres

// Muat environment variables dari file .env
config();

// Fungsi untuk mengubah string menjadi Title Case
const toTitleCase = (str) => {
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

const fixBlogTitles = async () => {
  if (!process.env.MONGO_URI) {
    _error("MONGO_URI tidak ditemukan di file .env");
    process.exit(1);
  }

  try {
    // 1. Hubungkan ke database
    await connect(process.env.MONGO_URI);
    info("Berhasil terhubung ke MongoDB");

    // 2. Ambil semua blog yang ingin diperbaiki
    const blogsToFix = await find({}); // Anda bisa menambahkan filter jika perlu
    info(`Menemukan ${blogsToFix.length} blog untuk diperbaiki.`);

    if (blogsToFix.length === 0) {
      info("Tidak ada blog yang perlu diperbaiki. Keluar.");
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
        info(`Memperbaiki judul: "${originalTitle}" -> "${newTitle}"`);
        fixedCount++;
      }
    }

    info(
      `Selesai! Berhasil memperbaiki ${fixedCount} dari ${blogsToFix.length} judul blog.`
    );
  } catch (error) {
    _error("Terjadi kesalahan saat menjalankan skrip perbaikan:", error);
  } finally {
    // 4. Putuskan koneksi database
    await disconnect();
    info("Koneksi MongoDB ditutup.");
  }
};

// Jalankan fungsi perbaikan
fixBlogTitles();
