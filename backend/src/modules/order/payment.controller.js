const db = require("../../config/db.js");

/**
 * @desc    Create a new payment for an order
 * @route   POST /api/payments
 * @access  Private (Learner)
 */
exports.createPayment = async (req, res) => {
    const { order_id, amount, payment_method, transaction_id } = req.body;

    try {
        const [result] = await db.query(
            "INSERT INTO payments (order_id, amount, payment_method, status, transaction_id, created_at) VALUES (?, ?, ?, 'success', ?, NOW())",
            [order_id, amount, payment_method, transaction_id]
        );

        // Update order status to completed
        await db.query("UPDATE orders SET status = 'completed', updated_at = NOW() WHERE id = ?", [order_id]);

        res.status(201).json({
            message: "Payment successful.",
            paymentId: result.insertId,
        });
    } catch (error) {
        res.status(500).json({ message: "Payment failed.", error: error.message });
    }
};

/**
 * @desc    Get all payments (Admin only)
 * @route   GET /api/payments
 * @access  Private (Admin)
 */
exports.getPayments = async (req, res) => {
    try {
        const [payments] = await db.query(`
      SELECT p.*, o.learner_id, u.username as learner_name
      FROM payments p
      JOIN orders o ON p.order_id = o.id
      JOIN users u ON o.learner_id = u.id
      ORDER BY p.created_at DESC
    `);
        res.json({ payments });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch payments.", error: error.message });
    }
};
