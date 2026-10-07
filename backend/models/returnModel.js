const db = require("../config/db");

const ReturnModel = {

    getAll: (userId = null, role = null) => {
        const privileged = ["admin", "manager", "asset_officer"];
        let sql;
        const params = [];

        if (privileged.includes(role)) {
            sql = `
                SELECT r.*, u.name AS employee_name, u.email AS employee_email,
                       u.department, a.asset_name, a.serial_number, a.location,
                       recv.name AS received_by_name
                FROM returns r
                LEFT JOIN assignments asn ON r.assignment_id = asn.assignment_id
                LEFT JOIN users u         ON asn.user_id = u.user_id
                LEFT JOIN assets a        ON asn.asset_id = a.asset_id
                LEFT JOIN users recv      ON r.received_by = recv.user_id
                ORDER BY r.return_date DESC
            `;
        } else {
            sql = `
                SELECT r.*, a.asset_name, a.serial_number
                FROM returns r
                LEFT JOIN assignments asn ON r.assignment_id = asn.assignment_id
                LEFT JOIN assets a        ON asn.asset_id = a.asset_id
                WHERE asn.user_id = ?
                ORDER BY r.return_date DESC
            `;
            params.push(userId);
        }

        return new Promise((res, rej) =>
            db.query(sql, params, (e, r) => e ? rej(e) : res(r))
        );
    },

    getById: (id) =>
        new Promise((res, rej) =>
            db.query(
                `SELECT r.*, u.name AS employee_name, a.asset_name, a.serial_number
                 FROM returns r
                 LEFT JOIN assignments asn ON r.assignment_id = asn.assignment_id
                 LEFT JOIN users u         ON asn.user_id = u.user_id
                 LEFT JOIN assets a        ON asn.asset_id = a.asset_id
                 WHERE r.return_id = ?`,
                [id], (e, r) => e ? rej(e) : res(r[0] || null)
            )
        ),

    getByAssignment: (assignmentId) =>
        new Promise((res, rej) =>
            db.query(
                "SELECT return_id FROM returns WHERE assignment_id=?",
                [assignmentId], (e, r) => e ? rej(e) : res(r[0] || null)
            )
        ),

    create: (data) =>
        new Promise((res, rej) =>
            db.query(
                "INSERT INTO returns (assignment_id, return_date, asset_condition, notes, received_by) VALUES (?,?,?,?,?)",
                [data.assignment_id, data.return_date || new Date(), data.asset_condition || "Good", data.notes || null, data.received_by],
                (e, r) => e ? rej(e) : res(r)
            )
        ),

    update: (id, data) =>
        new Promise((res, rej) =>
            db.query(
                "UPDATE returns SET return_date=?, asset_condition=?, notes=? WHERE return_id=?",
                [data.return_date, data.asset_condition || "Good", data.notes || null, id],
                (e, r) => e ? rej(e) : res(r)
            )
        ),

    delete: (id) =>
        new Promise((res, rej) =>
            db.query(
                "DELETE FROM returns WHERE return_id=?",
                [id], (e, r) => e ? rej(e) : res(r)
            )
        ),
};

module.exports = ReturnModel;
