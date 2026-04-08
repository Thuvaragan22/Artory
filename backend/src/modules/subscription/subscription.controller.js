const db = require("../../config/db.js");

/**
 * @desc    Get all subscription plans
 * @route   GET /api/subscriptions/plans
 * @access  Public
 */
exports.getPlans = async (req, res) => {
    try {
        const [plans] = await db.query("SELECT * FROM subscription_plans");
        res.json({ plans });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch plans.", error: error.message });
    }
};

/**
 * @desc    Subscribe to a plan
 * @route   POST /api/subscriptions/subscribe
 * @access  Private (Learner/Guide)
 */
exports.subscribe = async (req, res) => {
    const { plan_id } = req.body;
    const user_id = req.user.id;

    try {
        // Basic logic: update user's plan and set expiration to 30 days from now
        const expires_at = new Date();
        expires_at.setDate(expires_at.getDate() + 30);

        await db.query(
            "UPDATE users SET subscription_plan_id = ?, subscription_expires_at = ?, updated_at = NOW() WHERE id = ?",
            [plan_id, expires_at, user_id]
        );

        res.json({ message: "Subscribed successfully.", plan_id, expires_at });
    } catch (error) {
        res.status(500).json({ message: "Subscription failed.", error: error.message });
    }
};
