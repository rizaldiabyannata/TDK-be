const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const fs = require("fs");
const path = require("path");
const helmet = require("helmet");
const mongoose = require("mongoose");

dotenv.config();

const logger = require("./utils/logger");

const logsDir = path.join(__dirname, "logs");
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const seedAdmin = require("./seeder/seedAdmin");
const connectDB = require("./config/db");
const routes = require("./routers/index");

const app = express();

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

const corsOptions = {
  origin: [
    "http://36.69.250.114:3000",
    "http://localhost:3000",
    "http://127.0.0.1:3000/",
  ],
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

app.use(morgan("dev"));
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

module.exports = app;
