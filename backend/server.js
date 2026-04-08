const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const cookieParser = require("cookie-parser");
const passport = require("./src/config/passport.js");

dotenv.config();

const authRoutes = require("./src/modules/auth/auth.routes.js");
const adminRoutes = require("./src/modules/admin/admin.routes.js");
const artworkRoutes = require("./src/modules/artwork/artwork.routes.js");
const practiceRoutes = require("./src/modules/practice/practice.routes.js");
const courseRoutes = require("./src/modules/course/course.routes.js");
const orderRoutes = require("./src/modules/order/order.routes.js");
// Re-using orderRoutes as it now includes payments
const paymentRoutes = orderRoutes;
const userRoutes = require("./src/modules/user/user.routes.js");
const subscriptionRoutes = require("./src/modules/subscription/subscription.routes.js");
const socialRoutes = require("./src/modules/social/social.routes.js");
const notificationRoutes = require("./src/modules/notification/notification.routes.js");
const searchRoutes = require("./src/modules/search/search.routes.js");

const { verifyToken } = require("./src/middleware/authMiddleware.js");
const { authorizeRoles } = require("./src/middleware/roleMiddleware.js");

const app = express();

// ── Stripe Webhook (MUST be before express.json) ──────────────────────────────
const paymentWebhook = require("./src/modules/order/payment.webhook.js");
app.post("/api/payments/webhook", express.raw({ type: 'application/json' }), paymentWebhook.handleWebhook);

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
app.use("/api/users", userRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/social", socialRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/search", searchRoutes);

app.get("/api/debug-users", async (req, res) => {
    try {
        const db = require("./src/config/db.js");
        const [users] = await db.query("SELECT id, username, profile_image_url, role FROM users");
        res.json({ users });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

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
