const express = require("express");
const router = express.Router();
const db = require("../config/db.js");

// GET /api/search?q=...
router.get("/", async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.status(200).json({ artworks: [], courses: [], guides: [] });
        }

        const searchTerm = `%${q}%`;

        // Search Artworks
        const [artworks] = await db.query(
            `SELECT a.*, u.username AS guide_name, u.profile_image_url AS guide_profile_image_url 
             FROM artworks a 
             JOIN users u ON u.id = a.guide_id 
             WHERE a.title LIKE ? OR a.category LIKE ?`,
            [searchTerm, searchTerm]
        );

        // Search Courses
        const [courses] = await db.query(
            "SELECT c.*, u.username AS guide_name FROM courses c JOIN users u ON u.id = c.guide_id WHERE c.title LIKE ? OR c.description LIKE ?",
            [searchTerm, searchTerm]
        );

        // Search Guides
        const [guides] = await db.query(
            "SELECT id, username, profile_image_url, bio FROM users WHERE (username LIKE ? OR bio LIKE ?) AND role = 'guide'",
            [searchTerm, searchTerm]
        );

        res.status(200).json({ artworks, courses, guides });
    } catch (error) {
        console.error("Search error:", error);
        res.status(500).json({ message: "Server error during search." });
    }
});

module.exports = router;
