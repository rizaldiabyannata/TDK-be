const dotenv = require("dotenv");
const connectDB = require("../config/db"); // Pastikan path ini benar
const Porto = require("../models/PortoModel"); // Pastikan path ini benar

// Konfigurasi environment variables
dotenv.config();

// Hubungkan ke database
connectDB();

// Data Portofolio Palsu (Dummy Data) - Disesuaikan dengan Model Baru
const portfolios = [
  {
    title: 'Aplikasi E-Commerce "TokoKeren"',
    shortDescription:
      "Membangun aplikasi e-commerce full-stack menggunakan MERN Stack (MongoDB, Express, React, Node.js).",
    description:
      "Proyek ini mencakup fitur autentikasi pengguna, manajemen produk, keranjang belanja, dan proses checkout dengan integrasi payment gateway. Dibangun dengan arsitektur yang skalabel dan aman.",
    coverImage: "/uploads/images/tokokeren.png",
    link: "https://github.com/example/tokokeren",
  },
  {
    title: 'Website Company Profile "BuildIt Corp"',
    shortDescription:
      "Desain dan pengembangan website company profile yang modern dan responsif untuk perusahaan konstruksi.",
    description:
      "Menggunakan Next.js untuk performa Server-Side Rendering (SSR) dan Tailwind CSS untuk styling. Website ini menampilkan informasi perusahaan, layanan, dan portofolio proyek mereka.",
    coverImage: "/uploads/images/buildit.png",
    link: "https://buildit-corp-example.com",
  },
  {
    title: "Sistem Manajemen Konten (CMS) Kustom",
    shortDescription:
      "Pengembangan CMS dari awal untuk kebutuhan internal klien, memungkinkan manajemen konten blog dan halaman secara dinamis.",
    description:
      "Backend dibangun dengan Node.js/Express dan database PostgreSQL. Frontend admin panel menggunakan React dan Ant Design untuk antarmuka yang intuitif.",
    coverImage: "/uploads/images/custom-cms.png",
  },
  {
    title: 'Aplikasi Mobile "HealthTracker"',
    shortDescription:
      "Aplikasi cross-platform untuk melacak aktivitas kebugaran dan nutrisi harian pengguna.",
    description:
      "Dibangun menggunakan React Native, memungkinkan codebase yang sama untuk berjalan di iOS dan Android. Terhubung dengan REST API untuk sinkronisasi data pengguna.",
    coverImage: "/uploads/images/healthtracker.png",
    link: "https://play.google.com/store/apps/details?id=com.healthtracker.example",
  },
  {
    title: "Dasbor Analitik Data Penjualan",
    shortDescription:
      "Membuat dasbor interaktif untuk visualisasi data penjualan secara real-time.",
    description:
      "Menggunakan React dan D3.js untuk membuat berbagai jenis grafik (bar, line, pie) yang dapat difilter berdasarkan periode waktu dan kategori produk.",
    coverImage: "/uploads/images/dashboard.png",
  },
];

// Fungsi untuk mengimpor data
const importData = async () => {
  try {
    // Hapus data lama
    await Porto.deleteMany();

    // Masukkan data baru
    await Porto.insertMany(portfolios);

    console.log("Data Portofolio berhasil diimpor!");
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Fungsi untuk menghapus data
const destroyData = async () => {
  try {
    await Porto.deleteMany();
    console.log("Data Portofolio berhasil dihapus!");
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
