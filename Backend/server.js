const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const cookieParser = require("cookie-parser");
const passport = require("./config/passport.js");

dotenv.config();

const authRoutes = require("./routes/authRoutes.js");
const adminRoutes = require("./routes/adminRoutes.js");
const artworkRoutes = require("./routes/artworkRoutes.js");
const practiceRoutes = require("./routes/practiceRoutes.js");
const courseRoutes = require("./routes/courseRoutes.js");
const orderRoutes = require("./routes/orderRoutes.js");
const paymentRoutes = require("./routes/paymentRoutes.js");
const { verifyToken } = require("./middleware/authMiddleware.js");
const { authorizeRoles } = require("./middleware/roleMiddleware.js");

const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true, // required for cookies to be sent cross-origin
}));
app.use(express.json());
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(passport.initialize());

// ── Static file serving for uploads ────────────────────────────────────────
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/artworks", artworkRoutes);
app.use("/api/practice", practiceRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);

// ── Role Dashboards ───────────────────────────────────────────────────────────
app.get("/api/admin/dashboard",
  verifyToken, authorizeRoles("admin"),
  (req, res) => res.json({ message: `Welcome Admin, ${req.user.username}` })
);

app.get("/api/learner/dashboard",
  verifyToken, authorizeRoles("learner"),
  (req, res) => res.json({ message: `Welcome Learner, ${req.user.username}` })
);

app.get("/api/guide/dashboard",
  verifyToken, authorizeRoles("guide"),
  (req, res) => res.json({ message: `Welcome Guide, ${req.user.username}` })
);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: "Route not found." });
});

// ── Start Server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));