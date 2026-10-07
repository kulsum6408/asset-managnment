const bcrypt = require("bcrypt");
const UserModel = require("../models/userModel");
const { isValidEmail, isValidRole } = require("../utils/validator");
const { logAudit } = require("../middleware/auditLogger");
const SALT_ROUNDS = 10;
// GET /api/users
const getAllUsers = async (req, res) => {
    try {
        const users = await UserModel.getAll();
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
// GET /api/users/:id
const getUserById = async (req, res) => {
    try {
        const user = await UserModel.getById(req.params.id);
        if (!user) return res.status(404).json({ error: "User not found." });
        // Non-admins can only fetch their own profile
        if (req.user.role !== "admin" && req.user.user_id !== parseInt(req.params.id))
            return res.status(403).json({ error: "Access denied." });
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}
// POST /api/users
const createUser = async (req, res) => {
    try {
        const { name, email, password, role, department } = req.body;
        if (!name || !email || !password || !role)
            return res.status(400).json({ error: "Name, email, password, and role are required." });
        if (!isValidEmail(email))
            return res.status(400).json({ error: "Invalid email format." });
        if (!isValidRole(role))
            return res.status(400).json({ error: "Invalid role." });
        if (password.length < 6)
            return res.status(400).json({ error: "Password must be at least 6 characters." });
        const existing = await UserModel.getByEmail(email);
        if (existing) return res.status(409).json({ error: "Email already exists." });
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        const result = await UserModel.create({ name, email, password: hashedPassword, role, department });
        await logAudit(req, "CREATE_USER", "user", result.insertId, { name, email, role, department });
        res.status(201).json({ message: "User created successfully.", user_id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
// PUT /api/users/:id
const updateUser = async (req, res) => {
    try {
        const { name, email, role, department, is_active } = req.body;
        if (!name || !email || !role)
            return res.status(400).json({ error: "Name, email, and role are required." });
        if (!isValidRole(role))
            return res.status(400).json({ error: "Invalid role." });
        const result = await UserModel.update(req.params.id, { name, email, role, department, is_active });
        if (result.affectedRows === 0) return res.status(404).json({ error: "User not found." });
        await logAudit(req, "UPDATE_USER", "user", req.params.id, { name, email, role, is_active });
        res.status(200).json({ message: "User updated successfully." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
// PUT /api/users/:id/reset-password
const resetPassword = async (req, res) => {
    try {
        const { new_password } = req.body;
        if (!new_password || new_password.length < 6)
            return res.status(400).json({ error: "Password must be at least 6 characters." });
        const hashed = await bcrypt.hash(new_password, SALT_ROUNDS);
        const result = await UserModel.updatePassword(req.params.id, hashed);
        if (result.affectedRows === 0) return res.status(404).json({ error: "User not found." });
        await logAudit(req, "ADMIN_RESET_PASSWORD", "user", req.params.id);
        res.status(200).json({ message: "Password reset successfully." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
// PUT /api/users/:id/toggle-status
const toggleStatus = async (req, res) => {
    try {
        const user = await UserModel.getById(req.params.id);
        if (!user) return res.status(404).json({ error: "User not found." });
        const newStatus = user.is_active === 1 ? 0 : 1;
        await UserModel.toggleStatus(req.params.id, newStatus);
        await logAudit(req, "TOGGLE_USER_STATUS", "user", req.params.id, { new_status: newStatus });
        res.status(200).json({
            message: `User ${newStatus === 1 ? "activated" : "deactivated"} successfully.`,
            is_active: newStatus
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
// DELETE /api/users/:id
const deleteUser = async (req, res) => {
    try {
        if (req.user.user_id === parseInt(req.params.id))
            return res.status(400).json({ error: "You cannot delete your own account." });
        const result = await UserModel.delete(req.params.id);
        if (result.affectedRows === 0) return res.status(404).json({ error: "User not found." });
        await logAudit(req, "DELETE_USER", "user", req.params.id);

        res.status(200).json({ message: "User deleted successfully." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { getAllUsers, getUserById, createUser, updateUser, resetPassword, toggleStatus, deleteUser };

