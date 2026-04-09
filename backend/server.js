const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const cookieParser = require("cookie-parser");
const passport = require("./src/config/passport.js");

dotenv.config();

const app = express();

// ── Auto-migration: add subscription columns if missing ───────────────────────
(async () => {
    try {
        const db = require("./src/config/db.js");
        const cols = [
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_type ENUM('free','trial','premium') NOT NULL DEFAULT 'free'",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) NOT NULL DEFAULT 'inactive'",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255) NULL",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255) NULL",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS current_period_start DATETIME NULL",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS current_period_end DATETIME NULL",
        ];
        for (const sql of cols) {
            try { await db.query(sql); } catch (_) {}
        }

        // Add is_grandfathered column (MySQL <8 doesn't support IF NOT EXISTS on ALTER)
        const [gcols] = await db.query('SHOW COLUMNS FROM users LIKE "is_grandfathered"');
        if (gcols.length === 0) {
            await db.query('ALTER TABLE users ADD COLUMN is_grandfathered TINYINT(1) NOT NULL DEFAULT 0');
        }

        console.log("✅ Subscription columns ready");
    } catch (e) {
        console.log("⚠️  Migration skipped:", e.message);
    }
})();

// ── STEP 1: Stripe Webhook — raw body, BEFORE express.json() ─────────────────
const { handleWebhook } = require("./src/modules/order/payment.webhook.js");
app.post(
    "/api/payments/webhook",
    express.raw({ type: "application/json" }),
    handleWebhook
);

// ── STEP 2: Core middleware ───────────────────────────────────────────────────
app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(passport.initialize());

// ── Static uploads ────────────────────────────────────────────────────────────
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ── STEP 3: Routes ────────────────────────────────────────────────────────────
const authRoutes         = require("./src/modules/auth/auth.routes.js");
const adminRoutes        = require("./src/modules/admin/admin.routes.js");
const artworkRoutes      = require("./src/modules/artwork/artwork.routes.js");
const practiceRoutes     = require("./src/modules/practice/practice.routes.js");
const courseRoutes       = require("./src/modules/course/course.routes.js");
const orderRoutes        = require("./src/modules/order/order.routes.js");
const userRoutes         = require("./src/modules/user/user.routes.js");
const subscriptionRoutes = require("./src/modules/subscription/subscription.routes.js");
const paymentRoutes      = require("./src/modules/payment/payment.routes.js");
const socialRoutes       = require("./src/modules/social/social.routes.js");
const notificationRoutes = require("./src/modules/notification/notification.routes.js");
const searchRoutes       = require("./src/modules/search/search.routes.js");

app.use("/api/auth",          authRoutes);
app.use("/api/admin",         adminRoutes);
app.use("/api/artworks",      artworkRoutes);
app.use("/api/practice",      practiceRoutes);
app.use("/api/courses",       courseRoutes);
app.use("/api/orders",        orderRoutes);
app.use("/api/users",         userRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/payments",      paymentRoutes);   // artwork/course/plan checkout
app.use("/api/social",        socialRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/search",        searchRoutes);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ message: "Route not found." }));

// ── Global error handler — must be last, catches multer + all unhandled errors ─
app.use((err, req, res, next) => {
    console.error("💥 Unhandled error:", err.message || err);

    // Multer errors (file size, wrong type, etc.)
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: "File too large. Maximum size allowed is 30MB." });
    }
    if (err.code && err.code.startsWith('LIMIT_')) {
        return res.status(400).json({ message: `Upload error: ${err.message}` });
    }
    if (err.name === 'MulterError') {
        return res.status(400).json({ message: `Upload error: ${err.message}` });
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') return res.status(401).json({ message: "Invalid token." });
    if (err.name === 'TokenExpiredError') return res.status(401).json({ message: "Token expired." });

    // Cloudinary / general errors
    const status = err.statusCode || err.status || 500;
    return res.status(status).json({ message: err.message || "Internal server error." });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
