const stripe = require("../../config/stripe");
const db = require("../../config/db");

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

// ─── FLOW 1: Artwork Buy (one-time payment) ───────────────────────────────────
exports.createArtworkCheckout = async (req, res) => {
    try {
        const { artworkId, title, price, imageUrl } = req.body;
        const buyerId = req.user.id;
        const buyerEmail = req.user.email;

        if (!artworkId || !title || !price) {
            return res.status(400).json({ message: "artworkId, title and price are required." });
        }

        // Fetch artwork to confirm it exists and get seller
        const [rows] = await db.query("SELECT * FROM artworks WHERE id = ? LIMIT 1", [artworkId]);
        if (!rows.length) return res.status(404).json({ message: "Artwork not found." });
        const artwork = rows[0];

        // Create pending order
        const [result] = await db.query(
            `INSERT INTO orders (learner_id, artwork_id, amount, status, created_at, updated_at)
             VALUES (?, ?, ?, 'pending', NOW(), NOW())`,
            [buyerId, artworkId, price]
        );
        const orderId = result.insertId;

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "payment",
            customer_email: buyerEmail,
            line_items: [{
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: title,
                        images: imageUrl ? [imageUrl] : [],
                    },
                    unit_amount: Math.round(parseFloat(price) * 100),
                },
                quantity: 1,
            }],
            success_url: `${CLIENT_URL}/checkout/success?orderId=${orderId}`,
            cancel_url: `${CLIENT_URL}/checkout/cancel?orderId=${orderId}`,
            metadata: {
                type: "artwork",
                orderId: String(orderId),
                artworkId: String(artworkId),
                buyerId: String(buyerId),
                sellerId: String(artwork.guide_id),
            },
        });

        res.json({ url: session.url, orderId });
    } catch (error) {
        console.error("Artwork checkout error:", error);
        res.status(500).json({ message: "Failed to create artwork checkout session.", error: error.message });
    }
};

// ─── FLOW 2: Course Enroll (one-time payment) ─────────────────────────────────
exports.createCourseCheckout = async (req, res) => {
    try {
        const { courseId, courseTitle, price, imageUrl } = req.body;
        const learnerId = req.user.id;
        const learnerEmail = req.user.email;

        if (!courseId || !courseTitle || price === undefined) {
            return res.status(400).json({ message: "courseId, courseTitle and price are required." });
        }

        const [rows] = await db.query("SELECT * FROM courses WHERE id = ? LIMIT 1", [courseId]);
        if (!rows.length) return res.status(404).json({ message: "Course not found." });
        const course = rows[0];

        // Create pending order
        const [result] = await db.query(
            `INSERT INTO orders (learner_id, course_id, amount, status, created_at, updated_at)
             VALUES (?, ?, ?, 'pending', NOW(), NOW())`,
            [learnerId, courseId, price]
        );
        const orderId = result.insertId;

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "payment",
            customer_email: learnerEmail,
            line_items: [{
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: courseTitle,
                        images: imageUrl ? [imageUrl] : [],
                    },
                    unit_amount: Math.round(parseFloat(price) * 100),
                },
                quantity: 1,
            }],
            success_url: `${CLIENT_URL}/checkout/success?orderId=${orderId}`,
            cancel_url: `${CLIENT_URL}/checkout/cancel?orderId=${orderId}`,
            metadata: {
                type: "course",
                orderId: String(orderId),
                courseId: String(courseId),
                learnerId: String(learnerId),
                guideId: String(course.guide_id),
            },
        });

        res.json({ url: session.url, orderId });
    } catch (error) {
        console.error("Course checkout error:", error);
        res.status(500).json({ message: "Failed to create course checkout session.", error: error.message });
    }
};

// ─── FLOW 3: Plan Subscription (Free / Trial / Premium) ──────────────────────
exports.createPlanCheckout = async (req, res) => {
    try {
        const { planType } = req.body; // 'free' | 'trial' | 'premium'
        const userId = req.user.id;
        const userEmail = req.user.email;

        if (!planType) {
            return res.status(400).json({ message: "planType is required." });
        }

        // Free plan — no Stripe needed, just update DB
        if (planType === "free") {
            await db.query(
                `UPDATE users SET subscription_plan_id = 1, plan_type = 'free',
                 subscription_status = 'active', updated_at = NOW() WHERE id = ?`,
                [userId]
            );
            return res.json({ success: true, freePlan: true, message: "Free plan activated." });
        }

        if (!["trial", "premium"].includes(planType)) {
            return res.status(400).json({ message: "Invalid plan. Use free, trial, or premium." });
        }

        const PLAN_PRICE_IDS = {
            trial: process.env.STRIPE_PRICE_TRIAL,
            premium: process.env.STRIPE_PRICE_PREMIUM,
        };

        const priceId = PLAN_PRICE_IDS[planType];

        if (!priceId || priceId.startsWith("prod_") || priceId.includes("PASTE") || priceId.includes("HERE")) {
            return res.status(400).json({
                message: `Stripe Price ID for '${planType}' is not set. Go to Stripe Dashboard → Products → click your product → copy the price_... ID and paste it in backend/.env as STRIPE_PRICE_${planType.toUpperCase()}.`,
            });
        }

        // Get or create Stripe customer
        const [userRows] = await db.query(
            "SELECT stripe_customer_id FROM users WHERE id = ? LIMIT 1", [userId]
        );
        let customerId = userRows[0]?.stripe_customer_id;

        if (!customerId) {
            const customer = await stripe.customers.create({
                email: userEmail,
                metadata: { userId: String(userId) },
            });
            customerId = customer.id;
            await db.query("UPDATE users SET stripe_customer_id = ? WHERE id = ?", [customerId, userId]);
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "subscription",
            customer: customerId,
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: `${CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${CLIENT_URL}/payment/cancel`,
            metadata: {
                type: "plan",
                userId: String(userId),
                planType,
                role: req.user.role,
            },
        });

        res.json({ url: session.url });
    } catch (error) {
        console.error("Plan checkout error:", error);
        res.status(500).json({ message: "Failed to create plan checkout session.", error: error.message });
    }
};
