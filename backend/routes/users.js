const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const db = require("../db");
const { authenticate, requireAdmin } = require("../middleware/authMiddleware");

const SALT_ROUNDS = 10;
const VALID_ROLES = ["admin", "manager", "asset_officer", "finance_officer", "maintenance_officer", "employee"];

// =====================
// GET ALL USERS
// GET /api/users
// Admin only
// =====================
router.get("/", authenticate, requireAdmin, (req, res) => {
    const sql = "SELECT user_id, name, email, role, department, is_active, created_at FROM users ORDER BY created_at DESC";

    db.query(sql, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(result);
    });
});

// =====================
// GET SINGLE USER
// GET /api/users/:id
// Admin or the user themselves
// =====================
router.get("/:id", authenticate, (req, res) => {
    const userId = req.params.id;

    // Users can only fetch their own data unless admin
    if (req.user.role !== "admin" && req.user.user_id !== parseInt(userId)) {
        return res.status(403).json({ error: "Access denied." });
    }

    const sql = "SELECT user_id, name, email, role, department, is_active, created_at FROM users WHERE user_id = ?";

    db.query(sql, [userId], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        if (result.length === 0) {
            return res.status(404).json({ error: "User not found." });
        }

        res.status(200).json(result[0]);
    });
});

// =====================
// CREATE USER
// POST /api/users
// Admin only
// =====================
router.post("/", authenticate, requireAdmin, async (req, res) => {
    try {
        const { name, email, password, role, department } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({ error: "Name, email, password, and role are required." });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: "Invalid email format." });
        }

        if (!VALID_ROLES.includes(role)) {
            return res.status(400).json({ error: `Invalid role. Valid roles: ${VALID_ROLES.join(", ")}` });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: "Password must be at least 6 characters." });
        }

        // Check duplicate email
        db.query("SELECT user_id FROM users WHERE email = ?", [email], async (err, result) => {
            if (err) return res.status(500).json({ error: err.message });

            if (result.length > 0) {
                return res.status(409).json({ error: "Email already exists." });
            }

            const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

            const sql = `
                INSERT INTO users (name, email, password, role, department, is_active, created_at)
                VALUES (?, ?, ?, ?, ?, 1, NOW())
            `;

            db.query(sql, [name, email, hashedPassword, role, department || null], (insertErr, insertResult) => {
                if (insertErr) return res.status(500).json({ error: insertErr.message });

                res.status(201).json({
                    message: "User created successfully.",
                    user_id: insertResult.insertId
                });
            });
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =====================
// UPDATE USER
// PUT /api/users/:id
// Admin only
// =====================
router.put("/:id", authenticate, requireAdmin, (req, res) => {
    const userId = req.params.id;
    const { name, email, role, department, is_active } = req.body;

    if (!name || !email || !role) {
        return res.status(400).json({ error: "Name, email, and role are required." });
    }

    if (!VALID_ROLES.includes(role)) {
        return res.status(400).json({ error: `Invalid role. Valid roles: ${VALID_ROLES.join(", ")}` });
    }

    const sql = `
        UPDATE users
        SET name = ?, email = ?, role = ?, department = ?, is_active = ?
        WHERE user_id = ?
    `;

    db.query(sql, [name, email, role, department || null, is_active ?? 1, userId], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "User not found." });
        }

        res.status(200).json({ message: "User updated successfully." });
    });
});

// =====================
// RESET USER PASSWORD
// PUT /api/users/:id/reset-password
// Admin only
// =====================
router.put("/:id/reset-password", authenticate, requireAdmin, async (req, res) => {
    try {
        const userId = req.params.id;
        const { new_password } = req.body;

        if (!new_password || new_password.length < 6) {
            return res.status(400).json({ error: "New password must be at least 6 characters." });
        }

        const hashedPassword = await bcrypt.hash(new_password, SALT_ROUNDS);

        db.query("UPDATE users SET password = ? WHERE user_id = ?", [hashedPassword, userId], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: "User not found." });
            }

            res.status(200).json({ message: "Password reset successfully." });
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =====================
// DEACTIVATE / ACTIVATE USER
// PUT /api/users/:id/toggle-status
// Admin only
// =====================
router.put("/:id/toggle-status", authenticate, requireAdmin, (req, res) => {
    const userId = req.params.id;

    db.query("SELECT is_active FROM users WHERE user_id = ?", [userId], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        if (result.length === 0) {
            return res.status(404).json({ error: "User not found." });
        }

        const newStatus = result[0].is_active === 1 ? 0 : 1;

        db.query("UPDATE users SET is_active = ? WHERE user_id = ?", [newStatus, userId], (updateErr) => {
            if (updateErr) return res.status(500).json({ error: updateErr.message });

            res.status(200).json({
                message: `User ${newStatus === 1 ? "activated" : "deactivated"} successfully.`,
                is_active: newStatus
            });
        });
    });
});

// =====================
// DELETE USER
// DELETE /api/users/:id
// Admin only
// =====================
router.delete("/:id", authenticate, requireAdmin, (req, res) => {
    const userId = req.params.id;

    // Prevent self-deletion
    if (req.user.user_id === parseInt(userId)) {
        return res.status(400).json({ error: "You cannot delete your own account." });
    }

    db.query("DELETE FROM users WHERE user_id = ?", [userId], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "User not found." });
        }

        res.status(200).json({ message: "User deleted successfully." });
    });
});

module.exports = router;
