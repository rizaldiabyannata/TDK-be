import winston from "winston";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";

// Adjust __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get environment
const ENV = process.env.BUN_ENV || "development";

// Create a format to add a unique ID to each log
const addLogId = winston.format((info) => {
  info.logId = uuidv4();
  return info;
});

// Define a reusable format for both console and file transports
const logFormat = winston.format.printf(
  ({ level, message, timestamp, logId, stack }) => {
    return `${timestamp} [${level}] [${logId}]: ${stack || message}`;
  }
);

// Define transports
const transports = [
  // Console transport is always active
  new winston.transports.Console({
    level: "debug",
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      addLogId(),
      winston.format.errors({ stack: true }),
      logFormat
    ),
  }),
];

// In production, add file transports
if (ENV === "production") {
  transports.push(
    new winston.transports.File({
      filename: path.join(__dirname, "logs", "error.log"),
      level: "error",
      format: winston.format.combine(
        winston.format.timestamp(),
        addLogId(),
        winston.format.errors({ stack: true }),
        winston.format.json() // Use JSON format for files
      ),
    })
  );

  transports.push(
    new winston.transports.File({
      filename: path.join(__dirname, "logs", "combined.log"),
      level: "info",
      format: winston.format.combine(
        winston.format.timestamp(),
        addLogId(),
        winston.format.errors({ stack: true }),
        winston.format.json() // Use JSON format for files
      ),
    })
  );
}

// Create the logger instance
const logger = winston.createLogger({
  level: ENV === "production" ? "info" : "debug",
  transports: transports,
  exitOnError: false, // Do not exit on handled exceptions
});

export default logger;
