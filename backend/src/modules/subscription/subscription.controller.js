const db = require("../../config/db.js");
const stripe = require("../../config/stripe.js");
const { getPriceIdByPlan } = require("../../services/plan.service");

/**
 * GET /api/subscriptions/plans
 * Public — returns all plans from DB
 */
exports.getPlans = async (req, res) => {
    try {
        const [plans] = await db.query("SELECT * FROM subscription_plans ORDER BY id ASC");
        res.json({ success: true, plans });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch plans.", error: error.message });
    }
};

/**
 * POST /api/subscriptions/activate-free
 * Private — set user to free plan
 */
exports.activateFreePlan = async (req, res) => {
    const userId = req.user.id;
    try {
        // Update base columns (always exist)
        await db.query(
            `UPDATE users SET subscription_plan_id = 1, subscription_expires_at = NULL, updated_at = NOW() WHERE id = ?`,
            [userId]
        );
        // Update migration columns if they exist
        try {
            await db.query(
                `UPDATE users SET plan_type = 'free', subscription_status = 'inactive',
                 stripe_subscription_id = NULL, current_period_start = NULL, current_period_end = NULL
                 WHERE id = ?`,
                [userId]
            );
        } catch (_) { /* migration not run yet */ }

        res.json({ success: true, message: "Free plan activated." });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to activate free plan.", error: error.message });
    }
};

/**
 * POST /api/subscriptions/create-checkout-session
 * Private — create Stripe checkout for trial or premium
 */
exports.createCheckoutSession = async (req, res) => {
    const { planType } = req.body; // 'trial' or 'premium'
    const user = req.user;

    if (!["trial", "premium"].includes(planType)) {
        return res.status(400).json({ success: false, message: "Invalid plan type. Use 'trial' or 'premium'." });
    }

    try {
        const priceId = getPriceIdByPlan(planType);

        if (!priceId || priceId.startsWith("prod_") || priceId.includes("REPLACE") || priceId.includes("xxx")) {
            return res.status(400).json({
                success: false,
                message: `Stripe Price ID for '${planType}' is not configured correctly. You have a product ID (prod_...) — please use the price ID (price_...) from Stripe Dashboard > Products > ${planType} > Pricing section.`,
            });
        }

        // Get or create Stripe customer
        let stripeCustomerId = null;
        try {
            const [users] = await db.query(`SELECT stripe_customer_id FROM users WHERE id = ? LIMIT 1`, [user.id]);
            stripeCustomerId = users[0]?.stripe_customer_id;
        } catch (_) { /* migration not run */ }

        if (!stripeCustomerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                metadata: { userId: String(user.id), role: user.role },
            });
            stripeCustomerId = customer.id;
            try {
                await db.query(`UPDATE users SET stripe_customer_id = ? WHERE id = ?`, [stripeCustomerId, user.id]);
            } catch (_) { /* migration not run */ }
        }

        const clientUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || "http://localhost:3000";

        const session = await stripe.checkout.sessions.create({
            mode: "subscription",
            customer: stripeCustomerId,
            payment_method_types: ["card"],
            line_items: [{ price: priceId, quantity: 1 }],
            metadata: {
                userId: String(user.id),
                planType,
                role: user.role,
            },
            success_url: `${clientUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${clientUrl}/payment/cancel`,
        });

        res.json({ success: true, checkoutUrl: session.url });
    } catch (error) {
        console.error("createCheckoutSession error:", error);
        res.status(500).json({ success: false, message: "Failed to create checkout session.", error: error.message });
    }
};

/**
 * GET /api/subscriptions/me
 * Private — get current user's subscription info
 */
exports.getMySubscription = async (req, res) => {
    const userId = req.user.id;
    try {
        const [rows] = await db.query(
            `SELECT u.subscription_plan_id, u.subscription_expires_at,
                    p.name AS plan_name, p.price
             FROM users u
             LEFT JOIN subscription_plans p ON u.subscription_plan_id = p.id
             WHERE u.id = ?`,
            [userId]
        );

        if (!rows.length) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        const sub = rows[0];

        // Try migration columns
        try {
            const [extra] = await db.query(
                `SELECT plan_type, subscription_status, current_period_end FROM users WHERE id = ?`,
                [userId]
            );
            sub.plan_type = extra[0]?.plan_type || 'free';
            sub.subscription_status = extra[0]?.subscription_status || 'inactive';
            sub.current_period_end = extra[0]?.current_period_end || null;
        } catch (_) {
            sub.plan_type = 'free';
            sub.subscription_status = 'inactive';
            sub.current_period_end = null;
        }

        res.json({ success: true, subscription: sub });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch subscription.", error: error.message });
    }
};

/**
 * POST /api/subscriptions/cancel
 * Private — cancel subscription at period end
 */
exports.cancelSubscription = async (req, res) => {
    const userId = req.user.id;
    try {
        let subId = null;
        try {
            const [users] = await db.query(
                `SELECT stripe_subscription_id FROM users WHERE id = ? LIMIT 1`,
                [userId]
            );
            subId = users[0]?.stripe_subscription_id;
        } catch (_) { /* migration not run */ }

        if (!subId) {
            return res.status(400).json({ success: false, message: "No active subscription found." });
        }

        await stripe.subscriptions.update(subId, { cancel_at_period_end: true });

        res.json({ success: true, message: "Subscription will cancel at the end of the billing period." });
    } catch (error) {
        console.error("cancelSubscription error:", error);
        res.status(500).json({ success: false, message: "Failed to cancel subscription.", error: error.message });
    }
};
