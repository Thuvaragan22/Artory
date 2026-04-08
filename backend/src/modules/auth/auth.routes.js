const express = require("express");
const router = express.Router();
const passport = require("../../config/passport.js");
const {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
  googleCallback,
  getMe,
} = require("./auth.controller.js");
const { verifyToken } = require("../../middleware/authMiddleware.js");

// ── Public routes ─────────────────────────────────────────────────────────────
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

// ── Protected route — get logged-in user info ─────────────────────────────────
router.get("/me", verifyToken, getMe);

// ── Google OAuth ──────────────────────────────────────────────────────────────
// Step 1: Redirect user to Google
router.get("/google", (req, res, next) => {
  const role = req.query.role || "learner";
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
    state: role // pass role as state
  })(req, res, next);
});

// Step 2: Google redirects back here after login
router.get(
  "/google/callback",
  (req, res, next) => {
    passport.authenticate("google", {
      failureRedirect: `${process.env.CLIENT_URL}/login?error=google_auth_failed`,
      session: false,
      state: req.query.state // pass state back to authenticate if needed, or handle in strategy
    })(req, res, next);
  },
  googleCallback
);

module.exports = router;