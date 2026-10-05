const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const SELF_REGISTERABLE_ROLES = ["student", "teacher"];

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

function toSafeUser(user) {
  return {
    id: user._id,
    fullName: user.fullName,
    phone: user.phone,
    role: user.role,
  };
}

const register = async (req, res) => {
  try {
    const { fullName, phone, password, role } = req.body;

    // Check required fields
    if (!fullName || !phone || !password) {
      return res.status(400).json({
        message: "Full name, phone number and password are required",
      });
    }

    // Check password length
    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    // Only student/teacher can self-register; admins are seeded separately
    if (role && !SELF_REGISTERABLE_ROLES.includes(role)) {
      return res.status(400).json({
        message: "Invalid role",
      });
    }

    // Check existing phone
    const existingUser = await User.findOne({ phone });

    if (existingUser) {
      return res.status(400).json({
        message: "Phone number already registered",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      fullName,
      phone,
      password: hashedPassword,
      role: role || "student",
    });

    const token = signToken(user);

    res.status(201).json({
      message: "Registration successful",
      token,
      user: toSafeUser(user),
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

const login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({
        message: "Phone number and password are required",
      });
    }

    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(401).json({
        message: "Invalid phone number or password",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid phone number or password",
      });
    }

    const token = signToken(user);

    res.status(200).json({
      message: "Login successful",
      token,
      user: toSafeUser(user),
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
};