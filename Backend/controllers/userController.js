const db = require("../config/db.js");

// ─── GET /api/users/profile — Get My Profile ───────────────────────────────
exports.getProfile = async (req, res) => {
    try {
        const [users] = await db.query(
            "SELECT id, username, email, role, profile_image_url, bio, phone, address, created_at FROM users WHERE id = ?",
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: "User not found." });
        }

        res.status(200).json({ user: users[0] });
    } catch (error) {
        console.error("Get profile error:", error);
        res.status(500).json({ message: "Server error." });
    }
};

// ─── PUT /api/users/profile — Update My Profile ──────────────────────────────
exports.updateProfile = async (req, res) => {
    try {
        const { username, bio, phone, address } = req.body;
        const userId = req.user.id;

        let profile_image_url = undefined;
        if (req.file) {
            profile_image_url = `/uploads/profiles/${req.file.filename}`;
        }

        const fields = [];
        const values = [];

        if (username) { fields.push("username = ?"); values.push(username); }
        if (bio !== undefined) { fields.push("bio = ?"); values.push(bio); }
        if (phone !== undefined) { fields.push("phone = ?"); values.push(phone); }
        if (address !== undefined) { fields.push("address = ?"); values.push(address); }
        if (profile_image_url) { fields.push("profile_image_url = ?"); values.push(profile_image_url); }

        if (fields.length === 0) {
            return res.status(400).json({ message: "No fields provided to update." });
        }

        fields.push("updated_at = NOW()");
        values.push(userId);

        await db.query(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`, values);

        const [updated] = await db.query(
            "SELECT id, username, email, role, profile_image_url, bio, phone, address, created_at FROM users WHERE id = ?",
            [userId]
        );

        res.status(200).json({ message: "Profile updated successfully.", user: updated[0] });
    } catch (error) {
        console.error("Update profile error:", error);
        res.status(500).json({ message: "Server error." });
    }
};

// ─── GET /api/users/guides — Get All Guides (for landing page) ──────────────
exports.getGuides = async (req, res) => {
    try {
        const [guides] = await db.query(`
            SELECT 
                u.id, u.username, u.profile_image_url, u.bio,
                (SELECT COUNT(*) FROM artworks WHERE guide_id = u.id) as artwork_count,
                (SELECT COUNT(*) FROM courses WHERE guide_id = u.id) as course_count
            FROM users u
            WHERE u.role = 'guide'
            LIMIT 8
        `);
        res.status(200).json({ guides });
    } catch (error) {
        console.error("Get guides error:", error);
        res.status(500).json({ message: "Server error." });
    }
};

// ─── GET /api/users/public-profile/:id — Get Public Profile ──────────────────
exports.getPublicProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const [users] = await db.query(
            "SELECT id, username, profile_image_url, bio, created_at FROM users WHERE id = ?",
            [id]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: "User not found." });
        }

        const [artworks] = await db.query(
            `SELECT a.*, 
                    (SELECT COUNT(*) FROM likes WHERE artwork_id = a.id) as likes_count
             FROM artworks a 
             WHERE a.guide_id = ?`,
            [id]
        );

        const [courses] = await db.query(
            "SELECT id, title, description, thumbnail_url, price, level FROM courses WHERE guide_id = ?",
            [id]
        );

        res.status(200).json({
            user: users[0],
            artworks,
            courses
        });
    } catch (error) {
        console.error("Get public profile error:", error);
        res.status(500).json({ message: "Server error." });
    }
};
