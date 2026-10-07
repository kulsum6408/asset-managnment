const db = require("../config/db");

const UserModel = {

    getAll: () =>
        new Promise((res, rej) =>
            db.query(
                "SELECT user_id, name, email, role, department, is_active, created_at FROM users ORDER BY created_at DESC",
                (e, r) => e ? rej(e) : res(r)
            )
        ),

    getById: (id) =>
        new Promise((res, rej) =>
            db.query(
                "SELECT user_id, name, email, role, department, is_active, created_at FROM users WHERE user_id = ?",
                [id], (e, r) => e ? rej(e) : res(r[0] || null)
            )
        ),

    getByEmail: (email) =>
        new Promise((res, rej) =>
            db.query(
                "SELECT * FROM users WHERE LOWER(TRIM(email)) = LOWER(TRIM(?))",
                [email ? email.trim() : ""], (e, r) => e ? rej(e) : res(r[0] || null)
            )
        ),

    create: (data) =>
        new Promise((res, rej) =>
            db.query(
                "INSERT INTO users (name, email, password, role, department, is_active, created_at) VALUES (?,?,?,?,?,1,NOW())",
                [data.name, data.email, data.password, data.role, data.department || null],
                (e, r) => e ? rej(e) : res(r)
            )
        ),

    update: (id, data) =>
        new Promise((res, rej) =>
            db.query(
                "UPDATE users SET name=?, email=?, role=?, department=?, is_active=? WHERE user_id=?",
                [data.name, data.email, data.role, data.department || null, data.is_active ?? 1, id],
                (e, r) => e ? rej(e) : res(r)
            )
        ),

    updatePassword: (id, hashedPassword) =>
        new Promise((res, rej) =>
            db.query(
                "UPDATE users SET password=? WHERE user_id=?",
                [hashedPassword, id], (e, r) => e ? rej(e) : res(r)
            )
        ),

    toggleStatus: (id, status) =>
        new Promise((res, rej) =>
            db.query(
                "UPDATE users SET is_active=? WHERE user_id=?",
                [status, id], (e, r) => e ? rej(e) : res(r)
            )
        ),

    delete: (id) =>
        new Promise((res, rej) =>
            db.query(
                "DELETE FROM users WHERE user_id=?",
                [id], (e, r) => e ? rej(e) : res(r)
            )
        ),
};

module.exports = UserModel;
