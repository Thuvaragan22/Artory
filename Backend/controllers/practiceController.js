const db = require("../config/db.js");

// ─── POST /api/practice — Upload practice work (Learner only) ─────────────────
exports.createPractice = async (req, res) => {
  try {
    const { title, description } = req.body;
    const learnerId = req.user.id;

    // Accept a real uploaded file OR a URL passed in the body (backward compat)
    let image_url = req.body.image_url || null;
    if (req.file) {
      image_url = `/uploads/practice/${req.file.filename}`;
    }

    if (!title || !image_url) {
      return res.status(400).json({ message: "Title and an image file are required." });
    }

    const [result] = await db.query(
      `INSERT INTO practice_works (learner_id, title, description, image_url, created_at, updated_at)
       VALUES (?, ?, ?, ?, NOW(), NOW())`,
      [learnerId, title, description || null, image_url]
    );

    const [practice] = await db.query("SELECT * FROM practice_works WHERE id = ?", [result.insertId]);

    res.status(201).json({ message: "Practice uploaded.", practice: practice[0] });
  } catch (error) {
    console.error("Create practice error:", error);
    res.status(500).json({ message: "Server error." });
  }
};


// ─── GET /api/practice — Get my practice works (Learner only) ─────────────────
exports.getMyPractice = async (req, res) => {
  try {
    const learnerId = req.user.id;

    const [practices] = await db.query(
      `SELECT * FROM practice_works WHERE learner_id = ? ORDER BY created_at DESC`,
      [learnerId]
    );

    if (practices.length === 0) {
      return res.status(404).json({ message: "No data found." });
    }

    res.status(200).json({ message: "Practice list.", total: practices.length, practices });
  } catch (error) {
    console.error("Get practice error:", error);
    res.status(500).json({ message: "Server error." });
  }
};

// ─── DELETE /api/practice/:id — Delete practice (Learner/Owner only) ──────────
exports.deletePractice = async (req, res) => {
  try {
    const { id } = req.params;
    const learnerId = req.user.id;

    const [existing] = await db.query(
      "SELECT * FROM practice_works WHERE id = ?",
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: "Practice not found." });
    }

    if (existing[0].learner_id !== learnerId) {
      return res.status(403).json({ message: "Not owner. Cannot delete this practice." });
    }

    await db.query("DELETE FROM practice_works WHERE id = ?", [id]);
    res.status(200).json({ message: "Practice deleted." });
  } catch (error) {
    console.error("Delete practice error:", error);
    res.status(500).json({ message: "Server error." });
  }
};

// ─── PUT /api/practice/:id — Update practice (Learner/Owner only) ─────────────
exports.updatePractice = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, image_url } = req.body;
    const learnerId = req.user.id;

    const [existing] = await db.query("SELECT * FROM practice_works WHERE id = ?", [id]);

    if (existing.length === 0) {
      return res.status(404).json({ message: "Practice not found." });
    }

    if (existing[0].learner_id !== learnerId) {
      return res.status(403).json({ message: "Not owner. Cannot update this practice." });
    }

    const fields = [];
    const values = [];

    if (title) { fields.push("title = ?"); values.push(title); }
    if (description) { fields.push("description = ?"); values.push(description); }
    if (image_url) { fields.push("image_url = ?"); values.push(image_url); }

    if (fields.length === 0) {
      return res.status(400).json({ message: "No fields provided to update." });
    }

    fields.push("updated_at = NOW()");
    values.push(id);

    await db.query(`UPDATE practice_works SET ${fields.join(", ")} WHERE id = ?`, values);

    const [updated] = await db.query("SELECT * FROM practice_works WHERE id = ?", [id]);
    res.status(200).json({ message: "Practice updated successfully.", practice: updated[0] });
  } catch (error) {
    console.error("Update practice error:", error);
    res.status(500).json({ message: "Server error." });
  }
};
