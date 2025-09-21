import dotenv from "dotenv";
import connectDB from "../config/db.js"; // Pastikan path ini benar
import Blog from "../models/BlogModel.js"; // Pastikan path ini benar

// Konfigurasi environment variables
dotenv.config();

// Hubungkan ke database
connectDB();

// Data Blog Palsu (Dummy Data)
const blogs = [
  {
    title: "Mengenal Node.js untuk Pemula",
    content:
      "Node.js adalah platform runtime JavaScript yang memungkinkan eksekusi kode JavaScript di sisi server. Artikel ini akan membahas dasar-dasar Node.js.",
    author: "Admin Keren",
    coverImage: "https://via.placeholder.com/800x400?text=Node.js+Tutorial",
  },
  {
    title: "Panduan Lengkap Belajar React Hooks",
    content:
      "React Hooks mengubah cara kita menulis komponen di React. Pelajari useState, useEffect, dan hook lainnya dalam panduan ini.",
    author: "Rizaldi",
    coverImage: "https://via.placeholder.com/800x400?text=React+Hooks+Guide",
  },
  {
    title: "Manajemen State dengan Redux vs Zustand",
    content:
      "Memilih library manajemen state yang tepat sangat penting. Mari kita bandingkan Redux yang populer dengan Zustand yang lebih modern dan simpel.",
    author: "Pengembang Web",
    coverImage: "https://via.placeholder.com/800x400?text=Redux+vs+Zustand",
  },
  {
    title: "Tips Optimasi Performa Website",
    content:
      "Website yang cepat memberikan pengalaman pengguna yang lebih baik. Berikut adalah 10 tips untuk meningkatkan kecepatan loading website Anda.",
    author: "Ahli SEO",
    coverImage: "https://via.placeholder.com/800x400?text=Website+Performance",
  },
  {
    title: "Pengenalan Docker untuk Developer",
    content:
      "Docker menyederhanakan proses deployment dengan kontainerisasi. Pahami konsep dasar Docker dan bagaimana cara kerjanya.",
    author: "DevOps Enthusiast",
    coverImage: "https://via.placeholder.com/800x400?text=Docker+Tutorial",
  },
  {
    title: "Membangun REST API dengan Express.js",
    content:
      "Express.js adalah framework minimalis untuk Node.js yang sangat populer untuk membangun REST API. Ikuti tutorial langkah demi langkah ini.",
    author: "Admin Keren",
    coverImage: "https://via.placeholder.com/800x400?text=Express.js+API",
  },
  {
    title: "Styling Komponen dengan Tailwind CSS",
    content:
      "Tailwind CSS adalah framework CSS utility-first yang mempercepat proses styling. Lihat bagaimana cara mengintegrasikannya dengan proyek Anda.",
    author: "Desainer Web",
    coverImage: "https://via.placeholder.com/800x400?text=Tailwind+CSS",
  },
  {
    title: "Testing Aplikasi dengan Jest dan k6",
    content:
      "Pengujian adalah bagian krusial dari pengembangan perangkat lunak. Pelajari cara melakukan unit testing dengan Jest dan load testing dengan k6.",
    author: "QA Engineer",
    coverImage: "https://via.placeholder.com/800x400?text=Testing+Jest+k6",
  },
  {
    title: "Keamanan Database: Mencegah SQL Injection",
    content:
      "SQL Injection adalah salah satu serangan paling umum. Pelajari cara kerjanya dan bagaimana cara melindunginya dengan prepared statements.",
    author: "Pakar Keamanan",
    coverImage: "https://via.placeholder.com/800x400?text=Database+Security",
  },
  {
    title: "Masa Depan Pengembangan Web: WebAssembly",
    content:
      "WebAssembly (Wasm) memungkinkan kode dari bahasa seperti C++ dan Rust berjalan di browser dengan performa mendekati native. Apa dampaknya bagi masa depan web?",
    author: "Futuris Teknologi",
    coverImage: "https://via.placeholder.com/800x400?text=WebAssembly+Future",
  },
];

// Fungsi untuk mengimpor data
const importData = async () => {
  try {
    // Hapus data lama
    await Blog.deleteMany();

    // Masukkan data baru
    await Blog.insertMany(blogs);

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
    await Blog.deleteMany();
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
