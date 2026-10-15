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

app.use(
  cors({
    origin: (origin, callback) => callback(null, origin || "*"),
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

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

// Connect to DB and start server only when run directly (local dev)
if (require.main === module) {
  const PORT = process.env.PORT || 4000;
  connectDB()
    .then(() => {
      app.listen(PORT, () =>
        console.log(`Server running on http://localhost:${PORT}`)
      );
    })
    .catch((err) => {
      console.error("MongoDB connection error:", err.message);
      process.exit(1);
    });
} else {
  // Vercel: connect once at cold start (no listen)
  connectDB().catch((err) =>
    console.error("MongoDB connection error:", err.message)
  );
}

module.exports = app;
