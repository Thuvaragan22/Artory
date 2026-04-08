const db = require("../../config/db.js");
const { stripe } = require("../../services/stripe.service");

/**
 * Handle Stripe Webhook
 * @route   POST /api/payments/webhook
 */
exports.handleWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error('Webhook signature verification failed.', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const orderId = session.metadata.itemId;
        const amount = session.amount_total / 100;
        const transactionId = session.payment_intent;
        const paymentMethod = session.payment_method_types[0];

        try {
            // Update order status to completed
            await db.query("UPDATE orders SET status = 'completed', updated_at = NOW() WHERE id = ?", [orderId]);

            // Create payment record
            await db.query(
                "INSERT INTO payments (order_id, amount, payment_method, status, transaction_id, created_at) VALUES (?, ?, ?, 'success', ?, NOW())",
                [orderId, amount, paymentMethod, transactionId]
            );

            console.log(`Payment successful for order ${orderId}`);
        } catch (error) {
            console.error(`Failed to update order/payment for order ${orderId}:`, error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }

    res.json({ received: true });
};
