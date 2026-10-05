const Recording = require("../models/Recording");
const { recordAttendance } = require("./attendanceController");

const uploadRecording = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "A recording file is required" });
    }

    const recording = await Recording.create({
      title: req.body.title?.trim() || req.file.originalname,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      student: req.userId,
    });

    // Mark student as present for today
    await recordAttendance(req.userId, recording._id);

    res.status(201).json({
      message: "Recording uploaded successfully",
      recording,
    });
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
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const listMyRecordings = async (req, res) => {
  try {
    const recordings = await Recording.find({ student: req.userId }).sort({
      createdAt: -1,
    });

    res.status(200).json({ recordings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const downloadRecording = async (req, res) => {
  try {
    const recording = await Recording.findById(req.params.id);

    if (!recording) {
      return res.status(404).json({ message: "Recording not found" });
    }

    const isOwner = recording.student.toString() === req.userId;
    const canView = isOwner || ["teacher", "admin"].includes(req.userRole);

    if (!canView) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.download(recording.path, recording.originalName);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  uploadRecording,
  listRecordings,
  listMyRecordings,
  downloadRecording,
};
