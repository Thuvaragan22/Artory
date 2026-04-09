const db = require("../../config/db.js");

// ─── POST /api/social/like/:artworkId — Toggle Like ──────────────────────────
exports.toggleLike = async (req, res) => {
    try {
        const { artworkId } = req.params;
        const userId = req.user.id;

        // Check if already liked
        const [existing] = await db.query(
            "SELECT * FROM likes WHERE user_id = ? AND artwork_id = ?",
            [userId, artworkId]
        );

        if (existing.length > 0) {
            // Unlike
            await db.query("DELETE FROM likes WHERE id = ?", [existing[0].id]);
            const [count] = await db.query("SELECT COUNT(*) as total FROM likes WHERE artwork_id = ?", [artworkId]);
            return res.status(200).json({ message: "Artwork unliked.", liked: false, count: count[0].total });
        } else {
            // Like
            await db.query(
                "INSERT INTO likes (user_id, artwork_id) VALUES (?, ?)",
                [userId, artworkId]
            );

            // Optional: Create notification for artwork owner
            const [art] = await db.query("SELECT guide_id, title FROM artworks WHERE id = ?", [artworkId]);
            if (art.length > 0 && String(art[0].guide_id) !== String(userId)) {
                await db.query(
                    "INSERT INTO notifications (user_id, type, message, link) VALUES (?, 'like', ?, ?)",
                    [art[0].guide_id, `Someone liked your artwork "${art[0].title}"`, `/artworks/${artworkId}`]
                );
            }

            const [count] = await db.query("SELECT COUNT(*) as total FROM likes WHERE artwork_id = ?", [artworkId]);
            return res.status(201).json({ message: "Artwork liked!", liked: true, count: count[0].total });
        }
    } catch (error) {
        console.error("Toggle like error:", error);
        res.status(500).json({ message: "Server error." });
    }
};

// ─── GET /api/social/like/:artworkId — Check if liked ────────────────────────
exports.getLikeStatus = async (req, res) => {
    try {
        const { artworkId } = req.params;
        const userId = req.user.id;

        const [existing] = await db.query(
            "SELECT id FROM likes WHERE user_id = ? AND artwork_id = ?",
            [userId, artworkId]
        );
        const [count] = await db.query(
            "SELECT COUNT(*) as total FROM likes WHERE artwork_id = ?",
            [artworkId]
        );

        res.status(200).json({ liked: existing.length > 0, count: count[0].total });
    } catch (error) {
        console.error("Get like status error:", error);
        res.status(500).json({ message: "Server error." });
    }
};
exports.addComment = async (req, res) => {
    try {
        const { artworkId } = req.params;
        const { content } = req.body;
        const userId = req.user.id;

        if (!content) return res.status(400).json({ message: "Comment cannot be empty." });

        const [result] = await db.query(
            "INSERT INTO comments (user_id, artwork_id, content) VALUES (?, ?, ?)",
            [userId, artworkId, content]
        );

        // Notify owner
        const [art] = await db.query("SELECT guide_id, title FROM artworks WHERE id = ?", [artworkId]);
        if (art.length > 0 && art[0].guide_id !== userId) {
            await db.query(
                "INSERT INTO notifications (user_id, type, message, link) VALUES (?, 'comment', ?, ?)",
                [art[0].guide_id, `New comment on "${art[0].title}"`, `/artworks/${artworkId}`]
            );
        }

        const [newComment] = await db.query(
            `SELECT c.*, u.username, u.profile_image_url 
             FROM comments c 
             JOIN users u ON c.user_id = u.id 
             WHERE c.id = ?`,
            [result.insertId]
        );

        res.status(201).json({ message: "Comment added.", comment: newComment[0] });
    } catch (error) {
        console.error("Add comment error:", error);
        res.status(500).json({ message: "Server error." });
    }
};

// ─── GET /api/social/comments/:artworkId — Get Comments ──────────────────────
exports.getComments = async (req, res) => {
    try {
        const { artworkId } = req.params;
        const [comments] = await db.query(
            `SELECT c.*, u.username, u.profile_image_url 
             FROM comments c 
             JOIN users u ON c.user_id = u.id 
             WHERE c.artwork_id = ? 
             ORDER BY c.created_at DESC`,
            [artworkId]
        );

        res.status(200).json({ comments });
    } catch (error) {
        console.error("Get comments error:", error);
        res.status(500).json({ message: "Server error." });
    }
};
