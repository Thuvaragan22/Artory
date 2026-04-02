const db = require("../config/db.js");

// ─── GET /api/subscriptions/plans — Get All Plans ──────────────────────────
exports.getPlans = async (req, res) => {
    try {
        const [plans] = await db.query("SELECT * FROM subscription_plans ORDER BY price ASC");
        res.status(200).json({ plans });
    } catch (error) {
        console.error("Get plans error:", error);
        res.status(500).json({ message: "Server error." });
    }
};

// ─── POST /api/subscriptions/subscribe — Upgrade/Change Plan ────────────────
exports.subscribe = async (req, res) => {
    try {
        const { plan_id } = req.body;
        const userId = req.user.id;

        // Verify plan exists
        const [plans] = await db.query("SELECT * FROM subscription_plans WHERE id = ?", [plan_id]);
        if (plans.length === 0) {
            return res.status(404).json({ message: "Plan not found." });
        }

        const plan = plans[0];

        // Mock payment verification (assuming success for now)
        // In production, integrate Stripe/PayPal here

        // Set expiry (e.g., 30 days from now for paid plans)
        const expiresAt = plan.price > 0 ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null;

        await db.query(
            "UPDATE users SET subscription_plan_id = ?, subscription_expires_at = ?, updated_at = NOW() WHERE id = ?",
            [plan_id, expiresAt, userId]
        );

        // Notify user (Optional: integrate notification system here)
        await db.query(
            "INSERT INTO notifications (user_id, type, message) VALUES (?, 'subscription_updated', ?)",
            [userId, `Your subscription has been updated to ${plan.name}.`]
        );

        res.status(200).json({
            message: `Successfully subscribed to ${plan.name}!`,
            subscription: {
                plan: plan.name,
                expires_at: expiresAt
            }
        });
    } catch (error) {
        console.error("Subscribe error:", error);
        res.status(500).json({ message: "Server error." });
    }
};

// ─── GET /api/subscriptions/my — Get My Subscription Status ────────────────
exports.getMySubscription = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT u.subscription_expires_at, p.name AS plan_name, p.features, p.price
             FROM users u
             JOIN subscription_plans p ON u.subscription_plan_id = p.id
             WHERE u.id = ?`,
            [req.user.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: "Subscription info not found." });
        }

        res.status(200).json({ subscription: rows[0] });
    } catch (error) {
        console.error("Get my subscription error:", error);
        res.status(500).json({ message: "Server error." });
    }
};
