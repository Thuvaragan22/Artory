const express = require("express");
const router = express.Router();
const passport = require("../config/passport.js");
const {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
  googleCallback,
  getMe,
} = require("../controllers/authController.js");
const { verifyToken } = require("../middleware/authMiddleware.js");

// ── Public routes ─────────────────────────────────────────────────────────────
router.post("/register",         register);
router.post("/login",            login);
router.post("/logout",           logout);
router.post("/forgot-password",  forgotPassword);
router.post("/reset-password/:token", resetPassword);

// ── Protected route — get logged-in user info ─────────────────────────────────
router.get("/me", verifyToken, getMe);

// ── Google OAuth ──────────────────────────────────────────────────────────────
// Step 1: Redirect user to Google
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"], session: false })
);

// Step 2: Google redirects back here after login
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login", session: false }),
  googleCallback
);

module.exports = router;