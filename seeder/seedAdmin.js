import { genSalt, hash } from "bcryptjs";
import User from "../models/UserModel.js"; // Pastikan path ini benar
import { warn, info, error as _error } from "../utils/logger.js"; // Gunakan logger standar untuk konsistensi

// Konfigurasi Admin dari environment variables
const adminConfig = {
  username: process.env.ADMIN_USERNAME,
  password: process.env.ADMIN_PASSWORD,
};

const seedAdmin = async () => {
  try {
    // Validasi apakah konfigurasi admin ada
    if (!adminConfig.password || !adminConfig.username) {
      warn(
        "Admin credentials are not set in .env file. Skipping admin seed."
      );
      return;
    }

    // Cek apakah admin dengan email tersebut sudah ada
    const existingAdmin = await User.findOne({ email: adminConfig.email });

    if (existingAdmin) {
      info("Admin user already exists. Seeding skipped.");
      return; // Hentikan proses jika admin sudah ada
    }

    // Hash password admin
    const salt = await genSalt(10);
    const hashedPassword = await hash(adminConfig.password, salt);

    // Buat pengguna admin baru
    await User.create({
      name: adminConfig.username,
      password: hashedPassword,
    });

    info(`Admin account for ${adminConfig.email} created successfully.`);
  } catch (error) {
    _error(`Error during admin seeding: ${error.message}`);
    // Hentikan aplikasi jika proses seeding gagal, karena ini adalah langkah kritis
    process.exit(1);
  }
};

export default seedAdmin;
