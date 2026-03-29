const db = require('../config/db.js');

// ─── POST /api/orders — Create Order (Artwork or Course) ──────────────────────
exports.createOrder = async (req, res) => {
    try {
        const { artwork_id, course_id, amount } = req.body;
        const learner_id = req.user.id;

        if (!artwork_id && !course_id) {
            return res.status(400).json({ message: "Artwork ID or Course ID is required." });
        }

        const [result] = await db.query(
            `INSERT INTO orders (learner_id, artwork_id, course_id, amount, status, created_at, updated_at)
             VALUES (?, ?, ?, ?, 'pending', NOW(), NOW())`,
            [learner_id, artwork_id || null, course_id || null, amount]
        );

        const [order] = await db.query("SELECT * FROM orders WHERE id = ?", [result.insertId]);

        res.status(201).json({ message: "Order placed successfully.", order: order[0] });
    } catch (error) {
        console.error("Create order error:", error);
        res.status(500).json({ message: "Server error." });
    }
};

// ─── GET /api/orders — Get user's orders (Learner/Auth) ───────────────────────
exports.getOrders = async (req, res) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;

        let query = "";
        let params = [];

        if (role === 'admin') {
            query = `SELECT o.*, u.username AS learner_name, a.title AS artwork_title, c.title AS course_title
                     FROM orders o
                     JOIN users u ON u.id = o.learner_id
                     LEFT JOIN artworks a ON a.id = o.artwork_id
                     LEFT JOIN courses c ON c.id = o.course_id
                     ORDER BY o.created_at DESC`;
        } else if (role === 'guide') {
            query = `SELECT o.*, u.username AS learner_name, a.title AS artwork_title, c.title AS course_title
                     FROM orders o
                     JOIN users u ON u.id = o.learner_id
                     LEFT JOIN artworks a ON a.id = o.artwork_id
                     LEFT JOIN courses c ON c.id = o.course_id
                     WHERE a.guide_id = ? OR c.guide_id = ?
                     ORDER BY o.created_at DESC`;
            params = [userId, userId];
        } else {
            query = `SELECT o.*, a.title AS artwork_title, c.title AS course_title
                     FROM orders o
                     LEFT JOIN artworks a ON a.id = o.artwork_id
                     LEFT JOIN courses c ON c.id = o.course_id
                     WHERE o.learner_id = ?
                     ORDER BY o.created_at DESC`;
            params = [userId];
        }

        const [orders] = await db.query(query, params);
        res.status(200).json({ message: "List of orders.", orders });
    } catch (error) {
        console.error("Get orders error:", error);
        res.status(500).json({ message: "Server error." });
    }
};

// ─── PUT /api/orders/:id/status — Update order status (Guide/Admin) ────────────
exports.updateOrderStatus = async (req, res) => {
    try {
        const orderId = req.params.id;
        const { status } = req.body; // 'completed', 'cancelled'
        const userId = req.user.id;
        const role = req.user.role;

        if (!['completed', 'cancelled'].includes(status)) {
            return res.status(400).json({ message: "Invalid status." });
        }

        const [order] = await db.query(
            `SELECT o.*, a.guide_id AS art_guide_id, c.guide_id AS course_guide_id
             FROM orders o
             LEFT JOIN artworks a ON a.id = o.artwork_id
             LEFT JOIN courses c ON c.id = o.course_id
             WHERE o.id = ?`,
            [orderId]
        );

        if (order.length === 0) {
            return res.status(404).json({ message: "Order not found." });
        }

        // Verify ownership/permissions
        const isOwner = (order[0].art_guide_id === userId || order[0].course_guide_id === userId);
        if (role !== 'admin' && !isOwner) {
            return res.status(403).json({ message: "Forbidden. Not authorized." });
        }

        await db.query(
            "UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?",
            [status, orderId]
        );

        res.status(200).json({ message: `Order status updated to ${status}.` });
    } catch (error) {
        console.error("Update order status error:", error);
        res.status(500).json({ message: "Server error." });
    }
};
