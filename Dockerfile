# Gunakan image dasar Bun.js
FROM oven/bun:latest

# Tentukan direktori kerja di dalam container
WORKDIR /app

# Salin file package.json dan .env ke dalam container
COPY package.json bun.lockb ./

# Install dependensi menggunakan Bun.js
RUN bun install

# Salin semua file aplikasi ke dalam container
COPY . .

# Expose port aplikasi (sesuaikan dengan PORT yang Anda gunakan di .env)
EXPOSE 5000

# Tentukan perintah untuk menjalankan aplikasi Bun.js
CMD ["bun", "run", "start"]
