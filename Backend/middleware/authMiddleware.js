const jwt = require("jsonwebtoken");

/**
 * Reads JWT from:
 *   1. HttpOnly cookie  →  req.cookies.token
 *   2. Authorization header  →  Bearer <token>
 *
 * Supports both Postman (header) and browser (cookie) clients.
 */
exports.verifyToken = (req, res, next) => {
  // 1. Try cookie first
  let token = req.cookies?.token;

  // 2. Fall back to Authorization header
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
  }

  if (!token) {
    return res.status(401).json({ message: "No token provided. Please login." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role, username, email }
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token. Please login again." });
  }
};