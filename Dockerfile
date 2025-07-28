# ==================================
#      Tahap 1: Builder
# ==================================
# Menggunakan base image resmi dari Bun
FROM oven/bun:1.0 AS builder

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
# Memulai dari image Bun yang sama untuk produksi
FROM oven/bun:1.0

WORKDIR /usr/src/app

# Menyalin dependensi dan kode aplikasi dari tahap 'builder'
COPY --from=builder /usr/src/app .

# Membuat user dan group baru untuk keamanan
RUN addgroup --system appgroup && adduser --system --ingroup appgroup --no-create-home appuser
RUN chown -R appuser:appgroup /usr/src/app
USER appuser

# Memberi tahu Docker bahwa container akan listen di port 5000
EXPOSE 5000

# Perintah untuk menjalankan aplikasi menggunakan Bun
# 'bun run' akan menjalankan skrip dari package.json, atau langsung 'bun index.js'
CMD ["bun", "index.js"]