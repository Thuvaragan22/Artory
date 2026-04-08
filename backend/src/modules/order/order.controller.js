const stripeService = require("../../services/stripe.service");
const db = require("../../config/db.js");

/**
 * @desc    Create a new order for an artwork or course
 * @route   POST /api/orders
 * @access  Private (Learner)
 */
exports.createOrder = async (req, res) => {
    const { artwork_id, course_id, amount } = req.body;
    const learner_id = req.user.id;
    const customerEmail = req.user.email;

    try {
        // Fetch item details for Stripe
        let itemName = "";
        let itemDescription = "";
        let itemType = "";

        if (artwork_id) {
            const [artworks] = await db.query("SELECT title, description FROM artworks WHERE id = ?", [artwork_id]);
            if (artworks.length === 0) return res.status(404).json({ message: "Artwork not found." });
            itemName = artworks[0].title;
            itemDescription = artworks[0].description;
            itemType = "artwork";
        } else if (course_id) {
            const [courses] = await db.query("SELECT title, description FROM courses WHERE id = ?", [course_id]);
            if (courses.length === 0) return res.status(404).json({ message: "Course not found." });
            itemName = courses[0].title;
            itemDescription = courses[0].description;
            itemType = "course";
        } else {
            return res.status(400).json({ message: "Artwork ID or Course ID is required." });
        }

        // Insert pending order
        const [result] = await db.query(
            "INSERT INTO orders (learner_id, artwork_id, course_id, amount, status, created_at, updated_at) VALUES (?, ?, ?, ?, 'pending', NOW(), NOW())",
            [learner_id, artwork_id || null, course_id || null, amount]
        );

        const orderId = result.insertId;

        // Create Stripe Checkout Session
        const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
        const session = await stripeService.createCheckoutSession(
            { id: orderId, name: itemName, description: itemDescription, amount, type: itemType },
            customerEmail,
            `${clientUrl}/checkout/success?orderId=${orderId}`,
            `${clientUrl}/checkout/cancel?orderId=${orderId}`
        );

        res.status(201).json({
            message: "Order initiated. Redirecting to payment.",
            orderId,
            checkoutUrl: session.url
        });
    } catch (error) {
        console.error("Create order error:", error);
        res.status(500).json({ message: "Failed to place order.", error: error.message });
    }
};

/**
 * @desc    Get all orders (Admin only)
 * @route   GET /api/orders
 * @access  Private (Admin)
 */
exports.getOrders = async (req, res) => {
    try {
        const [orders] = await db.query(`
      SELECT o.*, u.username as learner_name, a.title as artwork_title, c.title as course_title
      FROM orders o
      JOIN users u ON o.learner_id = u.id
      LEFT JOIN artworks a ON o.artwork_id = a.id
      LEFT JOIN courses c ON o.course_id = c.id
      ORDER BY o.created_at DESC
    `);
        res.json({ orders });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch orders.", error: error.message });
    }
};

/**
 * @desc    Get current user's orders
 * @route   GET /api/orders/me
 * @access  Private (Learner)
 */
exports.getMyOrders = async (req, res) => {
    const learner_id = req.user.id;

    try {
        const [orders] = await db.query(`
      SELECT o.*, a.title as artwork_title, c.title as course_title
      FROM orders o
      LEFT JOIN artworks a ON o.artwork_id = a.id
      LEFT JOIN courses c ON o.course_id = c.id
      WHERE o.learner_id = ?
      ORDER BY o.created_at DESC
    `, [learner_id]);
        res.json({ orders });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch your orders.", error: error.message });
    }
};

/**
 * @desc    Update order status
 * @route   PATCH /api/orders/:id
 * @access  Private (Admin)
 */
exports.updateOrderStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        await db.query(
            "UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?",
            [status, id]
        );
        res.json({ message: `Order ${id} updated to ${status}.` });
    } catch (error) {
        res.status(500).json({ message: "Failed to update order status.", error: error.message });
    }
};
