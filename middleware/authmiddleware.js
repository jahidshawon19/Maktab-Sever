const jwt = require("jsonwebtoken");

function auth(req, res, next) {
  let token = null;

  // Check Authorization header first
  const header = req.headers.authorization || "";
  if (header.startsWith("Bearer ")) {
    token = header.slice(7);
  }

  // Fallback to query parameter for media streams
  if (!token && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

module.exports = auth;
