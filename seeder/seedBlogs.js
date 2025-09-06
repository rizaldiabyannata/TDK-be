import { config } from "dotenv";
import connectDB from "../config/db"; // Pastikan path ini benar
import { deleteMany, insertMany } from "../models/BlogModel.js.js"; // Pastikan path ini benar

// Konfigurasi environment variables
config();

// Hubungkan ke database
connectDB();

// Data Blog Palsu (Dummy Data)
const blogs = [
  {
    title: "Mengenal Node.js untuk Pemula",
    content:
      "Node.js adalah platform runtime JavaScript yang memungkinkan eksekusi kode JavaScript di sisi server. Artikel ini akan membahas dasar-dasar Node.js.",
    author: "Admin Keren",
  },
  {
    title: "Panduan Lengkap Belajar React Hooks",
    content:
      "React Hooks mengubah cara kita menulis komponen di React. Pelajari useState, useEffect, dan hook lainnya dalam panduan ini.",
    author: "Rizaldi",
  },
  {
    title: "Manajemen State dengan Redux vs Zustand",
    content:
      "Memilih library manajemen state yang tepat sangat penting. Mari kita bandingkan Redux yang populer dengan Zustand yang lebih modern dan simpel.",
    author: "Pengembang Web",
  },
  {
    title: "Tips Optimasi Performa Website",
    content:
      "Website yang cepat memberikan pengalaman pengguna yang lebih baik. Berikut adalah 10 tips untuk meningkatkan kecepatan loading website Anda.",
    author: "Ahli SEO",
  },
  {
    title: "Pengenalan Docker untuk Developer",
    content:
      "Docker menyederhanakan proses deployment dengan kontainerisasi. Pahami konsep dasar Docker dan bagaimana cara kerjanya.",
    author: "DevOps Enthusiast",
  },
  {
    title: "Membangun REST API dengan Express.js",
    content:
      "Express.js adalah framework minimalis untuk Node.js yang sangat populer untuk membangun REST API. Ikuti tutorial langkah demi langkah ini.",
    author: "Admin Keren",
  },
  {
    title: "Styling Komponen dengan Tailwind CSS",
    content:
      "Tailwind CSS adalah framework CSS utility-first yang mempercepat proses styling. Lihat bagaimana cara mengintegrasikannya dengan proyek Anda.",
    author: "Desainer Web",
  },
  {
    title: "Testing Aplikasi dengan Jest dan k6",
    content:
      "Pengujian adalah bagian krusial dari pengembangan perangkat lunak. Pelajari cara melakukan unit testing dengan Jest dan load testing dengan k6.",
    author: "QA Engineer",
  },
  {
    title: "Keamanan Database: Mencegah SQL Injection",
    content:
      "SQL Injection adalah salah satu serangan paling umum. Pelajari cara kerjanya dan bagaimana cara melindunginya dengan prepared statements.",
    author: "Pakar Keamanan",
  },
  {
    title: "Masa Depan Pengembangan Web: WebAssembly",
    content:
      "WebAssembly (Wasm) memungkinkan kode dari bahasa seperti C++ dan Rust berjalan di browser dengan performa mendekati native. Apa dampaknya bagi masa depan web?",
    author: "Futuris Teknologi",
  },
];

// Fungsi untuk mengimpor data
const importData = async () => {
  try {
    // Hapus data lama
    await deleteMany();

    // Masukkan data baru
    await insertMany(blogs);

    console.log("Data Blog berhasil diimpor!");
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Fungsi untuk menghapus data
const destroyData = async () => {
  try {
    await deleteMany();
    console.log("Data Blog berhasil dihapus!");
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Logika untuk menjalankan fungsi berdasarkan argumen command line
if (process.argv[2] === "-d") {
  destroyData();
} else {
  importData();
}
