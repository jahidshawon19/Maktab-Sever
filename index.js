require("dotenv").config();

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const recordingRoutes = require("./routes/recordingRoutes");
const usersRoutes = require("./routes/usersRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");

const app = express();

app.use(cors());
app.options("*", cors());

app.use(express.json());

// Connect to DB before every request (cached — only opens once)
app.use(async (_req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("DB connection failed:", err.message);
    res.status(500).json({ message: "Database connection failed" });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/recordings", recordingRoutes);
app.use("/api/auth/users", usersRoutes);
app.use("/api/attendance", attendanceRoutes);

app.get("/", (_req, res) => res.json({ message: "API is running" }));

app.use((error, _req, res, _next) => {
  if (error instanceof multer.MulterError || error) {
    return res.status(400).json({ message: error.message });
  }
  res.status(500).json({ message: "Server error" });
});

if (require.main === module) {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () =>
    console.log(`Server running on http://localhost:${PORT}`)
  );
}

module.exports = app;
