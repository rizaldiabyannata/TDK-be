import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import fs from "fs";
import path from "path";
import helmet from "helmet";
import mongoose from "mongoose";
import { fileURLToPath } from "url";

// Menyesuaikan __dirname untuk ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

if (process.env.BUN_ENV === "production") {
  console.log = () => {};
}

import logger from "./utils/logger.js";

const logsDir = path.join(__dirname, "logs");
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

import seedAdmin from "./seeder/seedAdmin.js";
import connectDB from "./config/db.js";
import routes from "./routers/index.js";

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
  origin: ORIGIN_WHITELIST,
  credentials: true,
};

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());

// [FIX] Membuat Content Security Policy (CSP) lebih fleksibel untuk development
const isDevelopment = process.env.BUN_ENV === "development";

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: isDevelopment ? "cross-origin" : "same-origin",
    },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "http://localhost:5000"],
        // Jika development, izinkan koneksi dari mana saja.
        // Jika production, batasi hanya ke domain yang diizinkan.
        connectSrc: isDevelopment
          ? ["*"]
          : ["'self'", "http://localhost:3000", "http://36.69.250.114:3000"],
        fontSrc: ["'self'", "https:"],
        objectSrc: ["'none'"],
        scriptSrcAttr: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
  })
);

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
