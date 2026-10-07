const express = require("express");
const router  = express.Router();
const db      = require("../config/db");
const authenticate = require("../middleware/authMiddleware");
const { isAdmin, isAssetOfficer } = require("../middleware/roleMiddleware");

const q = (sql, params = []) =>
    new Promise((res, rej) => db.query(sql, params, (e, r) => e ? rej(e) : res(r)));

// GET all categories — any authenticated user
router.get("/", authenticate, async (req, res) => {
    try {
        const rows = await q("SELECT * FROM categories ORDER BY category_name");
        res.status(200).json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET single
router.get("/:id", authenticate, async (req, res) => {
    try {
        const rows = await q("SELECT * FROM categories WHERE category_id = ?", [req.params.id]);
        if (!rows.length) return res.status(404).json({ error: "Category not found." });
        res.status(200).json(rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// CREATE
router.post("/", authenticate, isAssetOfficer, async (req, res) => {
    try {
        const { category_name, description } = req.body;
        if (!category_name) return res.status(400).json({ error: "Category name is required." });
        const result = await q(
            "INSERT INTO categories (category_name, description) VALUES (?, ?)",
            [category_name, description || null]
        );
        res.status(201).json({ message: "Category created.", category_id: result.insertId });
    } catch (err) {
        if (err.code === "ER_DUP_ENTRY") return res.status(409).json({ error: "Category name already exists." });
        res.status(500).json({ error: err.message });
    }
});

// UPDATE
router.put("/:id", authenticate, isAssetOfficer, async (req, res) => {
    try {
        const { category_name, description } = req.body;
        if (!category_name) return res.status(400).json({ error: "Category name is required." });
        const result = await q(
            "UPDATE categories SET category_name = ?, description = ? WHERE category_id = ?",
            [category_name, description || null, req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ error: "Category not found." });
        res.status(200).json({ message: "Category updated." });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE
router.delete("/:id", authenticate, isAdmin, async (req, res) => {
    try {
        const result = await q("DELETE FROM categories WHERE category_id = ?", [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: "Category not found." });
        res.status(200).json({ message: "Category deleted." });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
