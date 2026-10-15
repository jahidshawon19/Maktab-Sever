const express = require("express");
const jwt = require("jsonwebtoken");
const auth = require("../middleware/authmiddleware");
const requireRole = require("../middleware/role");
const Recording = require("../models/Recording");
const {
  uploadRecording,
  listRecordings,
  listMyRecordings,
  downloadRecording,
} = require("../controllers/recordingController");

const router = express.Router();

// Client uploads to Cloudinary directly, then POSTs metadata here
router.post("/", auth, requireRole("student"), uploadRecording);

router.get("/", auth, requireRole("teacher", "admin"), listRecordings);
router.get("/mine", auth, requireRole("student"), listMyRecordings);
router.get("/:id/download", auth, downloadRecording);

// Stream: auth-gate then redirect to Cloudinary URL
router.get("/:id/stream", async (req, res) => {
  try {
    let token = null;
    const header = req.headers.authorization || "";
    if (header.startsWith("Bearer ")) {
      token = header.slice(7);
    } else if (req.query.token) {
      token = req.query.token;
    }

    if (!token) return res.status(401).json({ message: "No token provided" });

    let userId, userRole;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.id;
      userRole = decoded.role;
    } catch {
      return res.status(401).json({ message: "Invalid token" });
    }

    const recording = await Recording.findById(req.params.id);
    if (!recording) return res.status(404).json({ message: "Recording not found" });

    const isOwner = recording.student.toString() === userId;
    const canView = isOwner || ["teacher", "admin"].includes(userRole);
    if (!canView) return res.status(403).json({ message: "Access denied" });

    res.redirect(recording.cloudinaryUrl);
  } catch (error) {
    if (!res.headersSent) res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
