const Recording = require("../models/Recording");
const { recordAttendance } = require("./attendanceController");

// Client uploads file directly to Cloudinary, then sends metadata here
const uploadRecording = async (req, res) => {
  try {
    const { title, originalName, mimeType, size, cloudinaryUrl, cloudinaryPublicId } = req.body;

    if (!cloudinaryUrl || !cloudinaryPublicId) {
      return res.status(400).json({ message: "Missing Cloudinary upload data" });
    }

    const recording = await Recording.create({
      title: title?.trim() || originalName || "Recording",
      fileName: cloudinaryPublicId,
      originalName: originalName || "recording",
      mimeType: mimeType || "audio/mpeg",
      size: size || 0,
      cloudinaryUrl,
      cloudinaryPublicId,
      student: req.userId,
    });

    await recordAttendance(req.userId, recording._id);

    res.status(201).json({ message: "Recording uploaded successfully", recording });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const listRecordings = async (_req, res) => {
  try {
    const recordings = await Recording.find()
      .populate("student", "fullName phone")
      .sort({ createdAt: -1 });
    res.status(200).json({ recordings });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const listMyRecordings = async (req, res) => {
  try {
    const recordings = await Recording.find({ student: req.userId }).sort({ createdAt: -1 });
    res.status(200).json({ recordings });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const downloadRecording = async (req, res) => {
  try {
    const recording = await Recording.findById(req.params.id);
    if (!recording) return res.status(404).json({ message: "Recording not found" });

    const isOwner = recording.student.toString() === req.userId;
    const canView = isOwner || ["teacher", "admin"].includes(req.userRole);
    if (!canView) return res.status(403).json({ message: "Access denied" });

    res.redirect(recording.cloudinaryUrl);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { uploadRecording, listRecordings, listMyRecordings, downloadRecording };
