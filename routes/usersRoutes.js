const express = require("express");
const auth = require("../middleware/authmiddleware");
const requireRole = require("../middleware/role");
const User = require("../models/User");

const router = express.Router();

router.get("/", auth, requireRole("teacher", "admin"), async (_req, res) => {
  try {
    const { role } = _req.query;
    const query = role ? { role } : {};
    const users = await User.find(query).select("-password").sort({ createdAt: -1 });
    res.status(200).json({ users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
