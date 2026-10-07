const express = require("express");
const router  = express.Router();
const authenticate = require("../middleware/authMiddleware");
const { isAdmin } = require("../middleware/roleMiddleware");
const {
    getAllUsers, getUserById, createUser,
    updateUser, resetPassword, toggleStatus, deleteUser
} = require("../controllers/userController");
const db = require("../config/db");

router.get   ("/",                  authenticate, isAdmin, getAllUsers);
router.get   ("/:id",               authenticate, getUserById);
router.post  ("/",                  authenticate, isAdmin, createUser);
router.put   ("/:id",               authenticate, isAdmin, updateUser);
router.put   ("/:id/reset-password",authenticate, isAdmin, resetPassword);
router.put   ("/:id/toggle-status", authenticate, isAdmin, toggleStatus);
router.patch ("/:id/active",        authenticate, isAdmin, toggleStatus);
router.patch ("/:id/toggle-status", authenticate, isAdmin, toggleStatus);
router.delete("/:id",               authenticate, isAdmin, deleteUser);

// GET /api/users/list - Any authenticated user can get active employees (for transfers)
router.get("/list/all", authenticate, (req, res) => {
    db.query(
        "SELECT user_id, name, email, role, department FROM users WHERE is_active = 1 ORDER BY name",
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(200).json(rows);
        }
    );
});

module.exports = router;
