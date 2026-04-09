const db = require("../../config/db.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { generateToken, generateResetToken } = require("../../utils/generateToken.js");
const { setTokenCookie, clearTokenCookie } = require("../../utils/cookieHelper.js");
const { sendResetEmail } = require("../../utils/sendEmail.js");

// ─── REGISTER ─────────────────────────────────────────────────────────────────
exports.register = async (req, res) => {
  try {
    const { username, email, password, confirmPassword, role } = req.body;

    // Validation
    if (!username || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required." });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match." });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    // Email uniqueness check
    const [existing] = await db.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: "Email already registered." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const allowedRoles = ["learner", "guide", "admin"];
    const assignedRole = allowedRoles.includes(role) ? role : "learner";

    const [result] = await db.query(
      "INSERT INTO users (username, email, password, role, is_verified) VALUES (?, ?, ?, ?, ?)",
      [username, email, hashedPassword, assignedRole, true]
    );

    const [rows] = await db.query("SELECT * FROM users WHERE id = ?", [result.insertId]);
    const user = rows[0];
    const token = generateToken(user);
    setTokenCookie(res, token);

    res.status(201).json({
      message: "Registration successful.",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        profile_image_url: user.profile_image_url,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Server error." });
  }
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const [users] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (users.length === 0) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const user = users[0];

    // Google-only accounts have no password
    if (!user.password) {
      return res.status(400).json({
        message: "This account uses Google login. Please sign in with Google.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const token = generateToken(user);

    // Set cookie AND return token (supports both browser & Postman)
    setTokenCookie(res, token);

    res.status(200).json({
      message: "Login successful.",
      token, // for Postman / mobile clients
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        profile_image_url: user.profile_image_url,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error." });
  }
};

// ─── LOGOUT ───────────────────────────────────────────────────────────────────
exports.logout = (req, res) => {
  clearTokenCookie(res);
  res.status(200).json({ message: "Logged out successfully." });
};

// ─── FORGOT PASSWORD ──────────────────────────────────────────────────────────
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const [users] = await db.query("SELECT * FROM users WHERE email = ?", [email]);

    // Always return success to prevent email enumeration attacks
    if (users.length === 0) {
      return res.status(200).json({
        message: "If that email is registered, a reset link has been sent.",
      });
    }

    const user = users[0];
    const resetToken = generateResetToken(user.id);
    const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Save hashed reset token in DB
    const hashedResetToken = await bcrypt.hash(resetToken, 10);
    await db.query(
      "UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?",
      [hashedResetToken, resetTokenExpiry, user.id]
    );

    // Send email with raw token (not the hash)
    await sendResetEmail(user.email, resetToken);

    res.status(200).json({
      message: "If that email is registered, a reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Server error." });
  }
};

// ─── RESET PASSWORD ───────────────────────────────────────────────────────────
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    if (!password || !confirmPassword) {
      return res.status(400).json({ message: "Both password fields are required." });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match." });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    // Verify the JWT reset token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ message: "Reset link is invalid or has expired." });
    }

    // Find user and check reset token hasn't been used / expired in DB
    const [users] = await db.query(
      "SELECT * FROM users WHERE id = ? AND reset_token IS NOT NULL AND reset_token_expires > NOW()",
      [decoded.id]
    );

    if (users.length === 0) {
      return res.status(400).json({ message: "Reset link is invalid or has already been used." });
    }

    const user = users[0];

    // Validate the stored hashed token matches the incoming token
    const isTokenValid = await bcrypt.compare(token, user.reset_token);
    if (!isTokenValid) {
      return res.status(400).json({ message: "Reset link is invalid or has expired." });
    }

    // Update password and clear reset token
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query(
      "UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?",
      [hashedPassword, user.id]
    );

    // Clear cookie if they had one
    clearTokenCookie(res);

    res.status(200).json({ message: "Password reset successful. Please login with your new password." });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Server error." });
  }
};

// ─── GOOGLE AUTH CALLBACK ─────────────────────────────────────────────────────
// Called by Passport after Google verifies the user.
exports.googleCallback = (req, res) => {
  try {
    const user = req.user; // set by Passport strategy

    if (!user) {
      return res.redirect(`${process.env.CLIENT_URL}/login?error=google_auth_failed`);
    }

    const token = generateToken(user);
    setTokenCookie(res, token);

    // Redirect to frontend with token in query (frontend can store it)
    res.redirect(`${process.env.CLIENT_URL}/auth/success?token=${token}`);
  } catch (error) {
    console.error("Google callback error:", error);
    res.redirect(`${process.env.CLIENT_URL}/login?error=server_error`);
  }
};

// ─── GET CURRENT USER (me) ────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  try {
    // Base columns — always exist
    const [users] = await db.query(
      `SELECT id, username, email, role, profile_image_url, is_verified, created_at,
              subscription_plan_id
       FROM users WHERE id = ?`,
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    const user = users[0];

    // Migration columns — only exist after migrate_subscription.js is run
    try {
      const [extra] = await db.query(
        `SELECT plan_type, subscription_status FROM users WHERE id = ?`,
        [req.user.id]
      );
      user.plan_type = extra[0]?.plan_type || 'free';
      user.subscription_status = extra[0]?.subscription_status || 'inactive';
    } catch (_) {
      // Columns not yet added — migration pending
      user.plan_type = 'free';
      user.subscription_status = 'inactive';
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error("Get me error:", error);
    res.status(500).json({ message: "Server error." });
  }
};