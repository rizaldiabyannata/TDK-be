const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const fs = require("fs");
const path = require("path");

const connectDB = require("./config/db");
const routes = require("./routers/index");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());

const accessLogStream = fs.createWriteStream(
  path.join(__dirname, "logs/access.log"),
  { flags: "a" }
);

app.use(morgan("dev"));
app.use(morgan("combined", { stream: accessLogStream }));

// Connect to MongoDB
connectDB();

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
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Export the app for testing
module.exports = app;
