import http from "k6/http";
import { check, sleep, fail } from "k6";
import { Trend } from "k6/metrics";

// --- Konfigurasi ---
const BASE_URL = "http://localhost:5000/api"; // Ganti dengan URL API Anda

// Metrik kustom untuk melacak waktu respons setiap jenis endpoint
const listPortosTime = new Trend("list_portos_response_time");
const detailPortoTime = new Trend("detail_porto_response_time");
const archiveListTime = new Trend("archive_list_response_time");

// Opsi pengujian: 15 virtual user (VU) selama 1 menit
export const options = {
  vus: 15,
  duration: "1m",
  thresholds: {
    // 95% dari semua request harus selesai di bawah 800ms
    http_req_duration: ["p(95)<800"],
    // 99% request untuk daftar portofolio harus di bawah 1000ms
    list_portos_response_time: ["p(99)<1000"],
    // Semua 'check' yang kita definisikan harus memiliki tingkat keberhasilan di atas 99%
    checks: ["rate>0.99"],
  },
};

// Fungsi utama yang akan dijalankan oleh setiap virtual user
export default function () {
  // --- Skenario 1: Melihat Daftar Portofolio ---
  const listRes = http.get(`${BASE_URL}/portfolios?status=active`);

  // Verifikasi (check) respons dari endpoint daftar portofolio
  check(listRes, {
    "GET /portfolios - status is 200": (r) => r.status === 200,
    "GET /portfolios - response body is not empty": (r) => r.body.length > 0,
  });
  // Tambahkan durasi request ke metrik kustom kita
  listPortosTime.add(listRes.timings.duration);

  // Jika request pertama gagal, hentikan iterasi VU ini untuk menghindari error lanjutan
  if (listRes.status !== 200) {
    fail("Gagal mendapatkan daftar portofolio, iterasi dihentikan.");
    return;
  }

  // Ekstrak 'slug' dari respons untuk digunakan di langkah berikutnya
  let slugs = [];
  try {
    const responseBody = listRes.json();
    if (responseBody.data && responseBody.data.length > 0) {
      slugs = responseBody.data.map((porto) => porto.slug);
    }
  } catch (e) {
    fail("Gagal mem-parsing JSON dari daftar portofolio.");
    return;
  }

  if (slugs.length === 0) {
    // Jika tidak ada portofolio aktif, kita tidak bisa melanjutkan ke langkah berikutnya
    sleep(2); // Tunggu sebentar lalu coba lagi di iterasi berikutnya
    return;
  }

  // Jeda 1-3 detik untuk mensimulasikan pengguna melihat-lihat daftar
  sleep(Math.random() * 2 + 1);

  // --- Skenario 2: Melihat Detail Portofolio ---
  const randomSlug = slugs[Math.floor(Math.random() * slugs.length)];
  const detailRes = http.get(`${BASE_URL}/portfolios/${randomSlug}`);

  check(detailRes, {
    "GET portfolios/:slug - status is 200": (r) => r.status === 200,
    "GET portfolios/:slug - contains correct slug": (r) =>
      r.url.includes(randomSlug),
  });
  detailPortoTime.add(detailRes.timings.duration);

  // Jeda 2-4 detik seolah-olah pengguna sedang membaca detail proyek
  sleep(Math.random() * 2 + 2);

  // --- Skenario 3: Melihat Halaman Arsip ---
  const archiveRes = http.get(`${BASE_URL}/portfolios/archives`);

  check(archiveRes, {
    "GET portfolios/archives - status is 200": (r) => r.status === 200,
  });
  archiveListTime.add(archiveRes.timings.duration);

  // Jeda singkat sebelum iterasi VU dimulai lagi dari awal
  sleep(1);
}
