import winston from "winston";
import path from "path";
import { fileURLToPath } from "url";

// Menyesuaikan __dirname untuk ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mendapatkan environment
const ENV = process.env.BUN_ENV || "development";

// Fungsi untuk mendapatkan lokasi log
function getLogLocation() {
  const stack = new Error().stack;
  if (!stack) return '';
  const lines = stack.split('\n');
  for (let i = 2; i < lines.length; i++) {
    if (!lines[i].includes('logger.js')) {
      return lines[i].replace(/^\s*at\s*/, '');
    }
  }
  return '';
}

// Custom format untuk console
const consoleFormat = winston.format.printf(({ level, message, timestamp, stack, location }) => {
  return `${timestamp} [${level}]${location ? ` (${location})` : ''}: ${stack || message}`;
});

// Setup transport untuk development dan production
const logTransports = [];

if (ENV === "production") {
  logTransports.push(
    new winston.transports.File({
      filename: path.join(__dirname, "logs", "error.log"),
      level: "error",
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
    })
  );
} else {
  logTransports.push(
    new winston.transports.Console({
      level: "debug",
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format((info) => {
          info.location = getLogLocation();
          return info;
        })(),
        consoleFormat
      ),
    })
  );
}

// Membuat logger instance
const logger = winston.createLogger({
  level: "info",
  transports: logTransports,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
});

// Menambahkan log ke file jika environment production
if (ENV === "production") {
  logger.add(
    new winston.transports.File({
      filename: path.join(__dirname, "logs", "combined.log"),
      level: "info",
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    })
  );
}

// Helper agar lokasi log selalu tampil
export const warn = (...args) => {
  logger.warn(args.map(String).join(' '), { location: getLogLocation() });
};
export const info = (...args) => {
  logger.info(args.map(String).join(' '), { location: getLogLocation() });
};
export const error = (...args) => {
  logger.error(args.map(String).join(' '), { location: getLogLocation() });
};

export default logger;
