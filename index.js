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
const PORT = process.env.PORT || 4000;

// Apply CORS to all routes except /stream endpoints
app.use((req, res, next) => {
  if (!req.path.includes('/stream')) {
    cors({
      origin: (origin, callback) => {
        callback(null, origin || '*');
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      exposedHeaders: ['Content-Range', 'Content-Length', 'Content-Type'],
    })(req, res, next);
  } else {
    next();
  }
});

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/recordings", recordingRoutes);
app.use("/api/auth/users", usersRoutes);
app.use("/api/attendance", attendanceRoutes);

app.get("/", (_req, res) => {
  res.json({ message: "API is running" });
});

app.use((error, _req, res, _next) => {
  if (error instanceof multer.MulterError || error) {
    return res.status(400).json({ message: error.message });
  }
  res.status(500).json({ message: "Server error" });
});

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  });
