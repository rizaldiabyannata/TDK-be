const bcrypt = require("bcryptjs");
const User = require("../models/UserModel"); // Pastikan path ini benar
const logger = require("../utils/logger"); // Gunakan logger standar untuk konsistensi

// Konfigurasi Admin dari environment variables
const adminConfig = {
  name: process.env.ADMIN_USERNAME,
  password: process.env.ADMIN_PASSWORD,
};

const seedAdmin = async () => {
  try {
    // Validasi apakah konfigurasi admin ada
    if (!adminConfig.password || !adminConfig.name) {
      logger.warn(
        "Admin credentials are not set in .env file. Skipping admin seed."
      );
      return;
    }

    // Cek apakah admin dengan email tersebut sudah ada
    const existingAdmin = await User.findOne({ email: adminConfig.email });

    if (existingAdmin) {
      logger.info("Admin user already exists. Seeding skipped.");
      return; // Hentikan proses jika admin sudah ada
    }

    // Hash password admin
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminConfig.password, salt);

    // Buat pengguna admin baru
    await User.create({
      name: adminConfig.name,
      password: hashedPassword,
    });

    logger.info(`Admin account for ${adminConfig.email} created successfully.`);
  } catch (error) {
    logger.error(`Error during admin seeding: ${error.message}`);
    // Hentikan aplikasi jika proses seeding gagal, karena ini adalah langkah kritis
    process.exit(1);
  }
};

module.exports = seedAdmin;
