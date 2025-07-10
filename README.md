# Proyek Backend TDK (Template Express.js)

Ini adalah backend untuk aplikasi web portofolio dan blog, yang dibangun dengan Node.js, Express, dan MongoDB. Proyek ini mencakup fungsionalitas untuk mengelola konten, autentikasi pengguna, dan melacak statistik.

## ✨ Fitur

- **Manajemen Blog**: Operasi CRUD (Buat, Baca, Perbarui, Hapus) untuk artikel blog, dengan dukungan untuk pengarsipan dan pemulihan.
- **Manajemen Portofolio**: Operasi CRUD penuh untuk proyek portofolio.
- **Autentikasi & Otorisasi**: Sistem login yang aman untuk admin, menggunakan JWT (JSON Web Tokens) yang disimpan dalam _cookies_.
- **Reset Kata Sandi**: Fungsionalitas reset kata sandi berbasis OTP yang aman melalui email.
- **Pelacakan Penayangan**: Melacak total dan penayangan unik untuk artikel blog dan portofolio.
- **Agregasi Arsip**: Menghasilkan daftar arsip yang dikelompokkan berdasarkan tahun dan bulan untuk blog dan portofolio.
- **Pencarian**: Fungsionalitas pencarian di seluruh artikel blog dan portofolio.
- **Manajemen Konten Beranda**: API untuk mengelola konten unggulan di beranda.
- **Formulir Kontak**: Sebuah _endpoint_ untuk mengirimkan pertanyaan melalui formulir kontak.
- **Dasbor Statistik**: _Endpoint_ untuk mengambil statistik agregat untuk dasbor admin.
- **Penanganan Unggahan Gambar**: Mengunggah gambar, mengonversinya ke format WebP, dan mengoptimalkannya untuk web.
- **Caching**: Menggunakan Redis untuk _caching_ data yang sering diakses untuk mengurangi beban basis data dan meningkatkan waktu respons.
- **Keamanan**: Menggunakan Helmet untuk _header_ keamanan, _rate limiting_ untuk mencegah serangan _brute-force_, dan sanitasi input untuk mencegah serangan XSS.

---

## 🛠️ Tumpukan Teknologi

- **Backend**: Node.js, Express.js
- **Basis Data**: MongoDB dengan Mongoose ODM
- **Caching**: Redis
- **Autentikasi**: JSON Web Token (JWT), bcrypt
- **Penanganan Unggahan**: Multer
- **Pemrosesan Gambar**: Sharp
- **Validasi**: express-validator
- **Logging**: Winston, Morgan
- **Penjadwalan Tugas**: node-cron

---

## 🚀 Memulai

### Prasyarat

- Node.js (v18 atau lebih baru)
- Bun (opsional, untuk pengembangan)
- Docker dan Docker Compose (untuk menjalankan Redis & Mongo)

### Instalasi

1.  **Kloning repositori:**

    ```bash
    git clone [https://github.com/rizaldiabyannata/tdk-be.git](https://github.com/rizaldiabyannata/tdk-be.git)
    cd tdk-be
    ```

2.  **Instal dependensi:**

    ```bash
    npm install
    ```

3.  **Jalankan layanan dependen (Redis & MongoDB):**

    ```bash
    docker-compose up -d
    ```

    Perintah ini akan memulai kontainer Redis dan MongoDB di latar belakang.

4.  **Siapkan Variabel Lingkungan:**
    Buat file `.env.development` di direktori _root_. Anda dapat menyalin dari contoh di bawah ini.

### Variabel Lingkungan

Buat file `.env.development` dan isi dengan konfigurasi Anda.

```env
# Konfigurasi Server
PORT=5000
NODE_ENV=development

# Konfigurasi MongoDB
MONGO_URI=mongodb://localhost:27018/tdk-db

# Konfigurasi Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Kunci Rahasia JWT
JWT_SECRET=kunci-rahasia-yang-sangat-kuat

# Kredensial Admin Awal
ADMIN_USERNAME=admin
ADMIN_PASSWORD=password_admin_yang_aman

# Kredensial Email (untuk reset kata sandi)
EMAIL_USER=emailanda@gmail.com
EMAIL_PASSWORD=kata_sandi_aplikasi_anda
```

---

## 🏃 Menjalankan Aplikasi

- **Mode Pengembangan (dengan Bun & --hot):**

  ```bash
  npm run dev
  ```

  Server akan berjalan di `http://localhost:5000` dan akan secara otomatis me-restart saat ada perubahan file.

- **Mode Produksi:**

  ```bash
  npm run start
  ```

  Menjalankan server dalam mode produksi.

- **Membuat Indeks Teks MongoDB:**
  Untuk mengaktifkan fungsionalitas pencarian, Anda perlu membuat indeks teks di MongoDB.

  ```bash
  npm run create-index
  ```

  Jalankan skrip ini sekali setelah menyiapkan basis data Anda.

- **Menjalankan Seeder (Opsional):**
  Proyek ini berisi _seeder_ untuk mengisi basis data dengan data blog dan portofolio awal.
  ```bash
  node seeder/seedBlogs.js
  node seeder/seedPortfolio.js
  ```

---

## 📂 Struktur Proyek

```
/
├── config/             # File konfigurasi (DB, Redis)
├── controllers/        # Logika bisnis untuk setiap rute
├── middleware/         # Middleware Express (auth, error handling, dll.)
├── models/             # Skema Mongoose untuk MongoDB
├── routers/            # Definisi rute Express
├── seeder/             # Skrip untuk mengisi basis data
├── services/           # Layanan yang dapat digunakan kembali (mis. pemrosesan gambar)
├── test/               # Skrip pengujian (mis. k6)
├── utils/              # Fungsi utilitas (logger, scheduler)
├── .gitignore          # File dan folder yang diabaikan Git
├── docker-compose.yml  # Konfigurasi Docker untuk Redis & Mongo
├── index.js            # Titik masuk utama aplikasi
└── package.json        # Dependensi dan skrip proyek
```

---

## 🧪 Pengujian

Proyek ini menggunakan **k6** untuk pengujian beban. Skrip pengujian terletak di direktori `/test`.

- **Menjalankan tes tampilan artikel:**

  ```bash
  k6 run test/test-view-article.js
  ```

  Tes ini mensimulasikan beberapa pengguna yang mengakses _endpoint_ blog secara acak.

- **Menjalankan tes tampilan portofolio:**
  ```bash
  k6 run test/test-view-portfolio.js
  ```
  Tes ini mensimulasikan skenario pengguna yang lebih kompleks: melihat daftar, memilih satu item, dan kemudian mengunjungi halaman arsip.

---

## 📜 Lisensi

Proyek ini dilisensikan di bawah Lisensi ISC.
