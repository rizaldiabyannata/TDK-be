import http from "k6/http";
import { check, sleep } from "k6";
import { Trend } from "k6/metrics";

// --- Konfigurasi ---
const BASE_URL = "http://localhost:5000/api"; // Ganti dengan URL API Anda

// Daftar slug yang diketahui dari file seeder/seedBlogs.js
// Ini harus diperbarui jika Anda mengubah judul di seeder.
const seededSlugs = [
  "mengenal-nodejs-untuk-pemula",
  "panduan-lengkap-belajar-react-hooks",
  "manajemen-state-dengan-redux-vs-zustand",
  "tips-optimasi-performa-website",
  "pengenalan-docker-untuk-developer",
  "membangun-rest-api-dengan-expressjs",
  "styling-komponen-dengan-tailwind-css",
  "testing-aplikasi-dengan-jest-dan-k6",
  "keamanan-database-mencegah-sql-injection",
  "masa-depan-pengembangan-web-webassembly",
];

// Metrik kustom untuk melacak waktu respons
const singleBlogTime = new Trend("single_blog_response_time");

// Opsi pengujian: 10 virtual user selama 30 detik
export const options = {
  vus: 10,
  duration: "30s",
  thresholds: {
    // 95% request harus selesai di bawah 500ms
    http_req_duration: ["p(95)<500"],
    // Semua check harus berhasil
    checks: ["rate>0.99"],
  },
};

export default function () {
  // 1. Memilih satu slug secara acak dari daftar yang sudah ada
  const randomSlug =
    seededSlugs[Math.floor(Math.random() * seededSlugs.length)];

  // 2. Mengakses halaman blog spesifik tersebut
  const res = http.get(`${BASE_URL}/blogs/${randomSlug}`);

  // Verifikasi respons dan tambahkan ke metrik
  check(res, {
    "GET /blogs/:slug - status is 200": (r) => r.status === 200,
    "GET /blogs/:slug - response contains correct slug": (r) => {
      try {
        return r.json("slug") === randomSlug;
      } catch (e) {
        return false;
      }
    },
  });

  singleBlogTime.add(res.timings.duration);

  // Jeda singkat sebelum iterasi berikutnya untuk mensimulasikan perilaku pengguna
  sleep(1);
}
