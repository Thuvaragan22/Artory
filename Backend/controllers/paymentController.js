const db = require('../config/db.js');

// ─── POST /api/payments — Process Payment (Learner) ──────────────────────────
exports.createPayment = async (req, res) => {
    try {
        const { order_id, amount, payment_method, transaction_id } = req.body;

        const [order] = await db.query("SELECT * FROM orders WHERE id = ?", [order_id]);
        if (order.length === 0) {
            return res.status(404).json({ message: "Order not found." });
        }

        // Processing payment (mock logic)
        const paymentStatus = 'success'; // Assuming payment is always successful for now

        const [result] = await db.query(
            `INSERT INTO payments (order_id, amount, payment_method, status, transaction_id, created_at)
             VALUES (?, ?, ?, ?, ?, NOW())`,
            [order_id, amount, payment_method, paymentStatus, transaction_id]
        );

        // Update order status if payment successful
        if (paymentStatus === 'success') {
            await db.query("UPDATE orders SET status = 'completed', updated_at = NOW() WHERE id = ?", [order_id]);
        }

        const [payment] = await db.query("SELECT * FROM payments WHERE id = ?", [result.insertId]);

        res.status(201).json({ message: "Payment processed.", payment: payment[0] });
    } catch (error) {
        console.error("Create payment error:", error);
        res.status(500).json({ message: "Server error." });
    }
};

// ─── GET /api/payments/:id — Get payment details (Admin) ─────────────────────
exports.getPaymentById = async (req, res) => {
    try {
        const { id } = req.params;
        const [payments] = await db.query(
            `SELECT p.*, o.learner_id, u.username AS learner_name
             FROM payments p
             JOIN orders o ON o.id = p.order_id
             JOIN users u ON u.id = o.learner_id
             WHERE p.id = ?`,
            [id]
        );

        if (payments.length === 0) {
            return res.status(404).json({ message: "Payment not found." });
        }

        res.status(200).json({ message: "Payment details.", payment: payments[0] });
    } catch (error) {
        console.error("Get payment by id error:", error);
        res.status(500).json({ message: "Server error." });
    }
};
