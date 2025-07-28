# ==================================
#      Tahap 1: Builder
# ==================================
# Menggunakan base image resmi dari Bun
FROM oven/bun:1.1-debian AS builder

# Menetapkan direktori kerja
WORKDIR /usr/src/app

# Bun menggunakan bun.lockb secara default. Menyalin ini terlebih dahulu
# akan memanfaatkan layer caching.
COPY package.json bun.lockb ./

# Menginstal dependensi menggunakan 'bun install'.
# '--frozen-lockfile' disarankan untuk CI/builds agar memastikan versi yang sama persis.
RUN bun install --frozen-lockfile

# Menyalin sisa kode sumber aplikasi
COPY . .

# ==================================
#      Tahap 2: Produksi
# ==================================
# Memulai dari image Bun yang lebih ramping untuk produksi
FROM oven/bun:latest

WORKDIR /usr/src/app

# Membuat user dan group baru untuk keamanan
RUN addgroup --system appgroup && adduser --system --ingroup appgroup --no-create-home appuser

# Menyalin dependensi dan kode aplikasi dari tahap 'builder'
COPY --from=builder /usr/src/app .

# Membuat direktori untuk uploads dan logs
RUN mkdir -p uploads logs

# Mengubah kepemilikan direktori aplikasi, uploads, dan logs ke appuser
RUN chown -R appuser:appgroup /usr/src/app uploads logs

# Mengganti user ke non-root
USER appuser

# Memberi tahu Docker bahwa container akan listen di port 5000
EXPOSE 5000

# Instal PM2 secara global
RUN bun install -g pm2

# Perintah untuk menjalankan aplikasi menggunakan PM2
CMD ["pm2-runtime", "index.js"]