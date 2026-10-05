const express = require("express");
const jwt = require("jsonwebtoken");
const auth = require("../middleware/authmiddleware");
const requireRole = require("../middleware/role");
const upload = require("../middleware/upload");
const Recording = require("../models/Recording");
const {
  uploadRecording,
  listRecordings,
  listMyRecordings,
  downloadRecording,
} = require("../controllers/recordingController");

const router = express.Router();

router.post(
  "/",
  auth,
  requireRole("student"),
  upload.single("file"),
  uploadRecording
);

router.get("/", auth, requireRole("teacher", "admin"), listRecordings);
router.get("/mine", auth, requireRole("student"), listMyRecordings);
router.get("/:id/download", auth, downloadRecording);

// Stream recording for playback
router.get("/:id/stream", async (req, res) => {
  try {
    const fs = require("fs");

    // Verify token from header or query param
    let token = null;
    const header = req.headers.authorization || "";
    if (header.startsWith("Bearer ")) {
      token = header.slice(7);
    } else if (req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
      return res.status(401).json({ message: "No token provided" });
    }

    let userId, userRole;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.id;
      userRole = decoded.role;
    } catch (error) {
      res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
      return res.status(401).json({ message: "Invalid token" });
    }

    const recording = await Recording.findById(req.params.id);
    if (!recording) {
      res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
      return res.status(404).json({ message: "Recording not found" });
    }

    // Check access permission
    const isOwner = recording.student.toString() === userId;
    const canView = isOwner || ["teacher", "admin"].includes(userRole);
    if (!canView) {
      res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
      return res.status(403).json({ message: "Access denied" });
    }

    // Check if file exists
    if (!fs.existsSync(recording.path)) {
      res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
      return res.status(404).json({ message: "File not found" });
    }

    const stat = fs.statSync(recording.path);
    const fileSize = stat.size;
    const range = req.headers.range;
    const origin = req.headers.origin || "*";

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;

      res.writeHead(206, {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Credentials": "true",
        "Accept-Ranges": "bytes",
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Content-Length": chunksize,
        "Content-Type": recording.mimeType || "application/octet-stream",
      });

      fs.createReadStream(recording.path, { start, end }).pipe(res);
    } else {
      res.writeHead(200, {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Credentials": "true",
        "Accept-Ranges": "bytes",
        "Content-Length": fileSize,
        "Content-Type": recording.mimeType || "application/octet-stream",
      });

      fs.createReadStream(recording.path).pipe(res);
    }
  } catch (error) {
    console.error("Stream error:", error.message);
    if (!res.headersSent) {
      res.status(500).json({ message: "Server error: " + error.message });
    }
  }
});

module.exports = router;
