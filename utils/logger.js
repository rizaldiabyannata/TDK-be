import winston from "winston";
import path from "path";

// Mendapatkan environment
const ENV = process.env.BUN_ENV || "development";

// Setup transport untuk development dan production
const logTransports = [];

if (ENV === "production") {
  // Pada production, simpan log ke file
  logTransports.push(
    new winston.transports.File({
      filename: path.join(__dirname, "logs", "error.log"),
      level: "error", // Menyimpan hanya log dengan level error ke file
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
    })
  );
} else {
  // Pada development, tampilkan log di console
  logTransports.push(
    new winston.transports.Console({
      level: "debug", // Tampilkan semua log, termasuk debug
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp(),
        winston.format.simple()
      ),
    })
  );
}

// Membuat logger instance
const logger = winston.createLogger({
  level: "info", // Default level
  transports: logTransports,
});

// Menambahkan log ke file jika environment production
if (ENV === "production") {
  logger.add(
    new winston.transports.File({
      filename: path.join(__dirname, "logs", "combined.log"),
      level: "info", // Simpan info dan level yang lebih tinggi ke file
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    })
  );
}

export const warn = logger.warn.bind(logger);
export const info = logger.info.bind(logger);
export const error = logger.error.bind(logger);
export default logger;
