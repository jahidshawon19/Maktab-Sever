const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "maktab/recordings",
    resource_type: "video", // Cloudinary uses "video" for both audio and video
  },
});

function fileFilter(_req, file, cb) {
  const isMedia =
    file.mimetype.startsWith("audio/") || file.mimetype.startsWith("video/");
  if (!isMedia) {
    return cb(new Error("Only audio or video recordings are allowed"));
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB (Cloudinary free tier limit)
});

module.exports = upload;
