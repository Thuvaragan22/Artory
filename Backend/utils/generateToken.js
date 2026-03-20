const jwt = require("jsonwebtoken");

// Single auth token — contains id, role, username, email
exports.generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
      username: user.username,
      email: user.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

// Short-lived token for password reset (15 minutes only)
exports.generateResetToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );
};