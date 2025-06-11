const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const fs = require("fs");
const path = require("path");

const logsDir = path.join(__dirname, "logs");
const uploadsDir = path.join(__dirname, "uploads");
const imagesDir = path.join(uploadsDir, "images");

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

const { scheduleViewSync } = require("./utils/syncViewsScheduler");
const seedAdmin = require("./seeder/seedAdmin");

const connectDB = require("./config/db");
const routes = require("./routers/index");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(cors("*"));

const accessLogStream = fs.createWriteStream(
  path.join(__dirname, "logs/access.log"),
  { flags: "a" }
);

app.use(morgan("dev"));
app.use(morgan("combined", { stream: accessLogStream }));

app.use("/uploads", express.static(path.join(__dirname, "x")));

// Connect to MongoDB
connectDB();

scheduleViewSync();

app.get("/seed-admin", async (req, res) => {
  const result = await seedAdmin();

  // Cek apakah admin sudah ada atau berhasil dibuat
  if (result.includes("already exists")) {
    res.status(200).json({ message: result });
  } else {
    res.status(201).json({ message: result });
  }
});

app.use("/api", routes);
app.get("/api/runtime", (req, res) => {
  const uptime = process.uptime(); // Get uptime in seconds
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);

  res.json({
    message: "Backend runtime",
    uptime: `${hours}h ${minutes}m ${seconds}s`,
  });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});

// Export the app for testing
module.exports = app;
