const bcrypt = require("bcrypt");
const UserModel = require("../models/userModel");
const NotificationModel = require("../models/notificationModel");
const generateToken = require("../utils/generateToken");
const { isValidEmail, isValidRole } = require("../utils/validator");
const { logAudit } = require("../middleware/auditLogger");

const SALT_ROUNDS = 10;

// POST /api/auth/register
const register = async (req, res) => {
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
        if (existing) return res.status(409).json({ error: "Email already registered." });

        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        const result = await UserModel.create({ name, email, password: hashedPassword, role, department });

        await logAudit({ user: { user_id: result.insertId } }, "REGISTER_USER", "user", result.insertId, { name, email, role });

        res.status(201).json({ message: "User registered successfully.", user_id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// POST /api/auth/login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password)
            return res.status(400).json({ error: "Email and password are required." });

        const cleanEmail = email.trim();
        console.log("[AUTH-DEBUG] login attempt email=" + JSON.stringify(cleanEmail));
        const user = await UserModel.getByEmail(cleanEmail);
        console.log("[AUTH-DEBUG] user found=" + (!!user) + (user ? (" role=" + JSON.stringify(user.role)) : ""));
        if (!user) return res.status(401).json({ error: "Invalid email or password." });

        if (user.is_active === 0)
            return res.status(403).json({ error: "Account deactivated. Contact admin." });

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).json({ error: "Invalid email or password." });

        const token = generateToken(user);

        await logAudit({ user: { user_id: user.user_id }, ip: req.ip }, "USER_LOGIN", "user", user.user_id, { email: user.email });

        res.status(200).json({
            message: "Login successful.",
            token,
            user: {
                user_id:    user.user_id,
                name:       user.name,
                email:      user.email,
                role:       user.role,
                department: user.department
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET /api/auth/me
const getMe = async (req, res) => {
    try {
        const user = await UserModel.getById(req.user.user_id);
        if (!user) return res.status(404).json({ error: "User not found." });
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// PUT /api/auth/change-password
const changePassword = async (req, res) => {
    try {
        const { current_password, new_password } = req.body;

        if (!current_password || !new_password)
            return res.status(400).json({ error: "Current and new password are required." });

        if (new_password.length < 6)
            return res.status(400).json({ error: "New password must be at least 6 characters." });

        const user = await UserModel.getByEmail(req.user.email);
        const match = await bcrypt.compare(current_password, user.password);
        if (!match) return res.status(401).json({ error: "Current password is incorrect." });

        const hashed = await bcrypt.hash(new_password, SALT_ROUNDS);
        await UserModel.updatePassword(req.user.user_id, hashed);

        await logAudit(req, "CHANGE_PASSWORD", "user", req.user.user_id, "User changed password");
        await NotificationModel.create({
            user_id: req.user.user_id,
            title: "Password Changed",
            message: "Your account password was successfully updated.",
            type: "info"
        });

        res.status(200).json({ message: "Password changed successfully." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


module.exports = { register, login, getMe, changePassword };
