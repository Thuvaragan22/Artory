const db = require("../../config/db.js");

// ─── GET /api/notifications — Get User Notifications ────────────────────────
exports.getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const [notifications] = await db.query(
            "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50",
            [userId]
        );
        res.status(200).json({ notifications });
    } catch (error) {
        console.error("Get notifications error:", error);
        res.status(500).json({ message: "Server error." });
    }
};

// ─── PUT /api/notifications/:id/read — Mark as Read ──────────────────────────
exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        await db.query(
            "UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?",
            [id, userId]
        );

        res.status(200).json({ message: "Notification marked as read." });
    } catch (error) {
        console.error("Mark as read error:", error);
        res.status(500).json({ message: "Server error." });
    }
};

// ─── PUT /api/notifications/read-all — Mark All as Read ──────────────────────
exports.markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        await db.query(
            "UPDATE notifications SET is_read = TRUE WHERE user_id = ?",
            [userId]
        );
        res.status(200).json({ message: "All notifications marked as read." });
    } catch (error) {
        console.error("Mark all as read error:", error);
        res.status(500).json({ message: "Server error." });
    }
};
