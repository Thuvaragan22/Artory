const db = require("../../config/db.js");
const stripe = require("../../config/stripe.js");

/**
 * Stripe Webhook Handler — handles all 3 payment flows:
 *   type=artwork  → complete order + payment record
 *   type=course   → complete order + payment record
 *   type=plan     → update user subscription
 *
 * Route: POST /api/payments/webhook
 * MUST be registered BEFORE express.json() in server.js
 */
exports.handleWebhook = async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error("❌ Webhook signature failed:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
        switch (event.type) {

            case "checkout.session.completed": {
                const session = event.data.object;
                const meta = session.metadata || {};
                const type = meta.type;

                console.log(`✅ checkout.session.completed — type: ${type}`);

                // ── Artwork purchase ──────────────────────────────────────────
                if (type === "artwork") {
                    const orderId = meta.orderId;
                    const amount = (session.amount_total || 0) / 100;
                    const txId = session.payment_intent;

                    await db.query(
                        "UPDATE orders SET status = 'completed', updated_at = NOW() WHERE id = ?",
                        [orderId]
                    );
                    await db.query(
                        `INSERT INTO payments (order_id, amount, payment_method, status, transaction_id, created_at)
                         VALUES (?, ?, 'card', 'success', ?, NOW())`,
                        [orderId, amount, txId]
                    );
                    console.log(`✅ Artwork order ${orderId} completed`);
                }

                // ── Course enrollment ─────────────────────────────────────────
                if (type === "course") {
                    const orderId = meta.orderId;
                    const amount = (session.amount_total || 0) / 100;
                    const txId = session.payment_intent;

                    await db.query(
                        "UPDATE orders SET status = 'completed', updated_at = NOW() WHERE id = ?",
                        [orderId]
                    );
                    await db.query(
                        `INSERT INTO payments (order_id, amount, payment_method, status, transaction_id, created_at)
                         VALUES (?, ?, 'card', 'success', ?, NOW())`,
                        [orderId, amount, txId]
                    );
                    console.log(`✅ Course order ${orderId} completed`);
                }

                // ── Plan subscription ─────────────────────────────────────────
                if (type === "plan" && session.mode === "subscription") {
                    const userId = parseInt(meta.userId);
                    const planType = (meta.planType || "trial").toLowerCase();
                    const subscriptionId = session.subscription;
                    const customerId = session.customer;

                    if (!userId) break;

                    const planIdMap = { trial: 2, premium: 3 };
                    const planId = planIdMap[planType] || 2;

                    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

                    await db.query(
                        `UPDATE users SET
                            subscription_plan_id = ?,
                            plan_type = ?,
                            subscription_status = 'active',
                            stripe_customer_id = ?,
                            stripe_subscription_id = ?,
                            current_period_start = FROM_UNIXTIME(?),
                            current_period_end = FROM_UNIXTIME(?),
                            updated_at = NOW()
                         WHERE id = ?`,
                        [
                            planId, planType, customerId, subscriptionId,
                            subscription.current_period_start,
                            subscription.current_period_end,
                            userId,
                        ]
                    );
                    console.log(`✅ Plan activated: user ${userId} → ${planType}`);
                }
                break;
            }

            // ── Subscription renewal ──────────────────────────────────────────
            case "invoice.paid": {
                const invoice = event.data.object;
                if (!invoice.subscription) break;
                const sub = await stripe.subscriptions.retrieve(invoice.subscription);
                await db.query(
                    `UPDATE users SET
                        subscription_status = 'active',
                        current_period_start = FROM_UNIXTIME(?),
                        current_period_end = FROM_UNIXTIME(?),
                        updated_at = NOW()
                     WHERE stripe_customer_id = ?`,
                    [sub.current_period_start, sub.current_period_end, invoice.customer]
                );
                break;
            }

            // ── Payment failed ────────────────────────────────────────────────
            case "invoice.payment_failed": {
                const invoice = event.data.object;
                await db.query(
                    "UPDATE users SET subscription_status = 'past_due', updated_at = NOW() WHERE stripe_customer_id = ?",
                    [invoice.customer]
                );
                console.log(`⚠️ Payment failed: ${invoice.customer}`);
                break;
            }

            // ── Subscription cancelled ────────────────────────────────────────
            case "customer.subscription.deleted": {
                const sub = event.data.object;
                await db.query(
                    `UPDATE users SET
                        plan_type = 'free', subscription_plan_id = 1,
                        subscription_status = 'canceled',
                        stripe_subscription_id = NULL,
                        current_period_start = NULL, current_period_end = NULL,
                        updated_at = NOW()
                     WHERE stripe_subscription_id = ?`,
                    [sub.id]
                );
                console.log(`🔴 Subscription cancelled: ${sub.id}`);
                break;
            }

            default:
                console.log(`Unhandled event: ${event.type}`);
        }

        res.json({ received: true });
    } catch (error) {
        console.error("Webhook handler error:", error);
        res.status(500).json({ error: "Webhook processing failed" });
    }
};
