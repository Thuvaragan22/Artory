const db = require("../config/db.js");
const bcrypt = require("bcryptjs");

// ─── GET ALL USERS ─────────────────────────────────────────────────────────────
exports.getAllUsers = async (req, res) => {
  try {
    const [users] = await db.query(
      "SELECT id, username, email, role, is_verified, created_at, updated_at FROM users ORDER BY created_at DESC"
    );
    res.status(200).json({ message: "Users fetched successfully.", total: users.length, users });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({ message: "Server error." });
  }
};

// ─── GET SINGLE USER ───────────────────────────────────────────────────────────
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const [users] = await db.query(
      "SELECT id, username, email, role, is_verified, created_at, updated_at FROM users WHERE id = ?",
      [id]
    );
    if (users.length === 0) return res.status(404).json({ message: "User not found." });
    res.status(200).json({ user: users[0] });
  } catch (error) {
    console.error("Get user by id error:", error);
    res.status(500).json({ message: "Server error." });
  }
};

// ─── EDIT USER ─────────────────────────────────────────────────────────────────
// Admin can update: username, email, role, password — send only fields to change
exports.editUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, role, password } = req.body;

    const [existing] = await db.query("SELECT * FROM users WHERE id = ?", [id]);
    if (existing.length === 0) return res.status(404).json({ message: "User not found." });

    const allowedRoles = ["learner", "guide", "admin"];
    if (role && !allowedRoles.includes(role)) {
      return res.status(400).json({ message: `Invalid role. Allowed: ${allowedRoles.join(", ")}` });
    }

    if (email && email !== existing[0].email) {
      const [emailCheck] = await db.query(
        "SELECT id FROM users WHERE email = ? AND id != ?", [email, id]
      );
      if (emailCheck.length > 0) {
        return res.status(400).json({ message: "Email already in use by another account." });
      }
    }

    const fields = [];
    const values = [];

    if (username) { fields.push("username = ?"); values.push(username); }
    if (email)    { fields.push("email = ?");    values.push(email); }
    if (role)     { fields.push("role = ?");     values.push(role); }
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters." });
      }
      const hashed = await bcrypt.hash(password, 10);
      fields.push("password = ?");
      values.push(hashed);
    }

    if (fields.length === 0) {
      return res.status(400).json({ message: "No fields provided to update." });
    }

    values.push(id);
    await db.query(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`, values);

    const [updated] = await db.query(
      "SELECT id, username, email, role, is_verified, created_at, updated_at FROM users WHERE id = ?",
      [id]
    );

    res.status(200).json({ message: "User updated successfully.", user: updated[0] });
  } catch (error) {
    console.error("Edit user error:", error);
    res.status(500).json({ message: "Server error." });
  }
};

// ─── DELETE USER ───────────────────────────────────────────────────────────────
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ message: "Admin cannot delete their own account." });
    }

    const [existing] = await db.query("SELECT id FROM users WHERE id = ?", [id]);
    if (existing.length === 0) return res.status(404).json({ message: "User not found." });

    await db.query("DELETE FROM users WHERE id = ?", [id]);
    res.status(200).json({ message: "User deleted successfully." });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ message: "Server error." });
  }
};