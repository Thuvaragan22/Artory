const db = require("../config/db.js");

// ─── POST /api/artworks — Upload artwork (Guide only) ──────────────────────────
exports.createArtwork = async (req, res) => {
  try {
    const { title, description, category } = req.body;
    const guideId = req.user.id;

    // Accept a real uploaded file OR a URL passed in the body (backward compat)
    let image_url = req.body.image_url || null;
    if (req.file) {
      image_url = `/uploads/artworks/${req.file.filename}`;
    }

    if (!title || !image_url) {
      return res.status(400).json({ message: "Title and an image file are required." });
    }

    const [result] = await db.query(
      `INSERT INTO artworks (guide_id, title, description, image_url, category, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      [guideId, title, description || null, image_url, category || null]
    );

    const [artwork] = await db.query("SELECT * FROM artworks WHERE id = ?", [result.insertId]);

    res.status(201).json({ message: "Artwork created.", artwork: artwork[0] });
  } catch (error) {
    console.error("Create artwork error:", error);
    res.status(500).json({ message: "Server error." });
  }
};


// ─── GET /api/artworks — Get all artworks (Public) ────────────────────────────
exports.getAllArtworks = async (req, res) => {
  try {
    const [artworks] = await db.query(
      `SELECT a.*, u.username AS guide_name
       FROM artworks a
       JOIN users u ON u.id = a.guide_id
       ORDER BY a.created_at DESC`
    );
    res.status(200).json({ message: "List of artworks.", total: artworks.length, artworks });
  } catch (error) {
    console.error("Get all artworks error:", error);
    res.status(500).json({ message: "Server error." });
  }
};

// ─── GET /api/artworks/:id — Get artwork details (Public) ─────────────────────
exports.getArtworkById = async (req, res) => {
  try {
    const { id } = req.params;
    const [artworks] = await db.query(
      `SELECT a.*, u.username AS guide_name
       FROM artworks a
       JOIN users u ON u.id = a.guide_id
       WHERE a.id = ?`,
      [id]
    );

    if (artworks.length === 0) {
      return res.status(404).json({ message: "Artwork not found." });
    }

    res.status(200).json({ message: "Artwork details.", artwork: artworks[0] });
  } catch (error) {
    console.error("Get artwork by id error:", error);
    res.status(500).json({ message: "Server error." });
  }
};

// ─── PUT /api/artworks/:id — Update artwork (Guide/Owner only) ─────────────────
exports.updateArtwork = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, image_url, category } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    const [existing] = await db.query("SELECT * FROM artworks WHERE id = ?", [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: "Artwork not found." });
    }

    // Only the owner guide (or admin) can update
    if (userRole !== "admin" && existing[0].guide_id !== userId) {
      return res.status(403).json({ message: "Not owner. Cannot update this artwork." });
    }

    const fields = [];
    const values = [];

    if (title) { fields.push("title = ?"); values.push(title); }
    if (description) { fields.push("description = ?"); values.push(description); }
    if (image_url) { fields.push("image_url = ?"); values.push(image_url); }
    if (category) { fields.push("category = ?"); values.push(category); }

    if (fields.length === 0) {
      return res.status(400).json({ message: "No fields provided to update." });
    }

    fields.push("updated_at = NOW()");
    values.push(id);

    await db.query(`UPDATE artworks SET ${fields.join(", ")} WHERE id = ?`, values);

    const [updated] = await db.query("SELECT * FROM artworks WHERE id = ?", [id]);
    res.status(200).json({ message: "Artwork updated.", artwork: updated[0] });
  } catch (error) {
    console.error("Update artwork error:", error);
    res.status(500).json({ message: "Server error." });
  }
};

// ─── DELETE /api/artworks/:id — Delete artwork (Guide/Admin) ──────────────────
exports.deleteArtwork = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const [existing] = await db.query("SELECT * FROM artworks WHERE id = ?", [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: "Artwork not found." });
    }

    // Guide can only delete their own; admin can delete any
    if (userRole !== "admin" && existing[0].guide_id !== userId) {
      return res.status(403).json({ message: "Not owner. Cannot delete this artwork." });
    }

    await db.query("DELETE FROM artworks WHERE id = ?", [id]);
    res.status(200).json({ message: "Artwork deleted." });
  } catch (error) {
    console.error("Delete artwork error:", error);
    res.status(500).json({ message: "Server error." });
  }
};
