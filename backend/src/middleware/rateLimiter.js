const rateLimit = require("express-rate-limit");

// ─── General API limiter ──────────────────────────────────────────────────────
exports.apiLimiter = rateLimit({
  windowMs:       15 * 60 * 1000, // 15 minutes
  max:            100,
  standardHeaders: true,
  legacyHeaders:  false,
  message: { success: false, message: "Too many requests, please try again after 15 minutes" },
});

// ─── Auth routes (login / register) ──────────────────────────────────────────
exports.authLimiter = rateLimit({
  windowMs:       15 * 60 * 1000,
  max:            10,
  standardHeaders: true,
  legacyHeaders:  false,
  message: { success: false, message: "Too many auth attempts, please try again after 15 minutes" },
});

// ─── Forgot password ──────────────────────────────────────────────────────────
exports.forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max:      5,
  message:  { success: false, message: "Too many password reset requests, try again after 1 hour" },
});