import "./config/env.js";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import fs from "fs";
import path from "path";
// import helmet from "helmet";
import mongoose from "mongoose";
import { fileURLToPath } from "url";

// Menyesuaikan __dirname untuk ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import logger from "./utils/logger.js";

// Pastikan folder logs di utils/logs
const logsDir = path.join(__dirname, "utils", "logs");
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

// Pastikan folder public/uploads/images
const uploadsDir = path.join(__dirname, "public", "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
const imagesDir = path.join(uploadsDir, "images");
if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });

import seedAdmin from "./seeder/seedAdmin.js";
import connectDB from "./config/db.js";
import routes from "./routers/index.js";
import { initializeBucket } from "./services/minioService.js";

const app = express();

// Trust the first proxy in front of the app
app.set("trust proxy", 1);

app.get("/api/runtime", (req, res) => {
  const uptime = process.uptime();
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);
  res.json({
    message: "Backend runtime",
    uptime: `${hours}h ${minutes}m ${seconds}s`,
  });
});

const ORIGIN_WHITELIST = process.env.ORIGIN_WHITELIST
  ? process.env.ORIGIN_WHITELIST.split(",").map((origin) => origin.trim())
  : [];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc)
    if (!origin) return callback(null, true);

    // In development, allow localhost with any port and common development origins
    if (process.env.BUN_ENV === "development") {
      const allowedPatterns = [
        /^http:\/\/localhost:\d+$/, // localhost:any-port
        /^http:\/\/127\.0\.0\.1:\d+$/, // 127.0.0.1:any-port
        /^http:\/\/192\.168\.\d+\.\d+:\d+$/, // local network IPs
        /^http:\/\/10\.\d+\.\d+\.\d+:\d+$/, // private network IPs
        /^https:\/\/tdk\.frontend\..*\.dev$/, // production frontend domains
      ];

      const isAllowed =
        allowedPatterns.some((pattern) => pattern.test(origin)) ||
        ORIGIN_WHITELIST.includes(origin);

      if (isAllowed) {
        return callback(null, true);
      }
    }

    // In production, only allow whitelisted origins
    if (ORIGIN_WHITELIST.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error("Not allowed by CORS"), false);
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());

// [FIX] Membuat Content Security Policy (CSP) lebih fleksibel untuk development
const isDevelopment = process.env.BUN_ENV === "development";

// app.use(
//   helmet({
//     crossOriginResourcePolicy: {
//       policy: "cross-origin",
//     },
//     contentSecurityPolicy: {
//       directives: {
//         defaultSrc: ["'self'"],
//         scriptSrc: ["'self'"],
//         styleSrc: ["'self'", "'unsafe-inline'"],
//         imgSrc: ["'self'", "data:", "*"],
//         connectSrc: isDevelopment
//           ? ["*"]
//           : [
//               "'self'",
//               "http://localhost:3000",
//               "http://36.69.250.114:3000",
//               "http://36.85.101.180:3000",
//               "https://tdk.frontend.rizaldiabyannata.dev",
//             ],
//         fontSrc: ["'self'", "https:"],
//         objectSrc: ["'none'"],
//         scriptSrcAttr: ["'none'"],
//         upgradeInsecureRequests: [],
//       },
//     },
//   })
// );

if (isDevelopment) {
  app.use(morgan("dev"));
}
app.use(
  morgan("combined", {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  })
);
app.use("/uploads", express.static(path.join(__dirname, "public", "uploads")));

app.use("/api", routes);

const startServer = async () => {
  try {
    await connectDB();
    await seedAdmin();

    // Initialize MinIO bucket
    if (process.env.MINIO_ENDPOINT) {
      await initializeBucket();
    } else {
      logger.warn("MinIO not configured. Skipping bucket initialization.");
    }

    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, "0.0.0.0", () => {
      logger.info(`Server is running on port ${PORT}`);
    });
    const gracefulShutdown = () => {
      logger.warn("Received kill signal, shutting down gracefully.");
      server.close(() => {
        logger.info("HTTP server closed.");
        mongoose.connection.close(false, () => {
          logger.info("MongoDb connection closed.");
          process.exit(0);
        });
      });
    };
    process.on("SIGTERM", gracefulShutdown);
    process.on("SIGINT", gracefulShutdown);
  } catch (error) {
    logger.error("Failed to start the server:", error);
    process.exit(1);
  }
};

startServer();

export default app;
