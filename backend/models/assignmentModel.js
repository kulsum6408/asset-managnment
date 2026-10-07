const db = require("../config/db");

const AssignmentModel = {
  // =====================================================
  // GET ALL ASSIGNMENTS
  // =====================================================
  getAll: (userId = null, role = null) => {
    const privileged = [
      "admin",
      "manager",
      "asset_officer",
    ];

    let sql;
    const params = [];

    if (privileged.includes(role)) {
      sql = `
        SELECT
          a.*,
          u.name AS employee_name,
          u.email AS employee_email,
          u.department,
          ast.asset_name,
          ast.serial_number,
          ast.asset_condition,
          ast.location,
          ast.status AS asset_status,
          c.category_name,
          ab.name AS assigned_by_name
        FROM assignments a
        LEFT JOIN users u
          ON a.user_id = u.user_id
        LEFT JOIN assets ast
          ON a.asset_id = ast.asset_id
        LEFT JOIN categories c
          ON ast.category_id = c.category_id
        LEFT JOIN users ab
          ON a.assigned_by = ab.user_id
        ORDER BY a.assignment_date DESC
      `;
    } else {
      sql = `
        SELECT
          a.*,
          u.name AS employee_name,
          u.email AS employee_email,
          ast.asset_name,
          ast.serial_number,
          ast.asset_condition,
          ast.location,
          ast.status AS asset_status,
          c.category_name,
          ab.name AS assigned_by_name
        FROM assignments a
        LEFT JOIN users u
          ON a.user_id = u.user_id
        LEFT JOIN assets ast
          ON a.asset_id = ast.asset_id
        LEFT JOIN categories c
          ON ast.category_id = c.category_id
        LEFT JOIN users ab
          ON a.assigned_by = ab.user_id
        WHERE a.user_id = ?
        ORDER BY a.assignment_date DESC
      `;

      params.push(userId);
    }

    return new Promise((resolve, reject) => {
      db.query(sql, params, (error, rows) => {
        if (error) {
          reject(error);
        } else {
          resolve(rows);
        }
      });
    });
  },

  // =====================================================
  // GET ASSIGNMENT BY ID
  // =====================================================
  getById: (id) =>
    new Promise((resolve, reject) => {
      db.query(
        `
        SELECT
          a.*,
          u.name AS employee_name,
          u.email AS employee_email,
          u.department,
          ast.asset_name,
          ast.serial_number,
          ast.asset_condition,
          ast.location,
          ab.name AS assigned_by_name
        FROM assignments a
        LEFT JOIN users u
          ON a.user_id = u.user_id
        LEFT JOIN assets ast
          ON a.asset_id = ast.asset_id
        LEFT JOIN users ab
          ON a.assigned_by = ab.user_id
        WHERE a.assignment_id = ?
        `,
        [id],
        (error, rows) => {
          if (error) {
            reject(error);
          } else {
            resolve(rows[0] || null);
          }
        }
      );
    }),

  // =====================================================
  // CREATE ASSIGNMENT
  // =====================================================
  create: (data) =>
    new Promise((resolve, reject) => {
      db.query(
        `
        INSERT INTO assignments
        (
          user_id,
          asset_id,
          request_id,
          assignment_date,
          assigned_by,
          notes,
          status,
          expected_return_date
        )
        VALUES (?, ?, ?, ?, ?, ?, 'Active', ?)
        `,
        [
          data.user_id,
          data.asset_id,
          data.request_id || null,
          data.assignment_date || new Date(),
          data.assigned_by,
          data.notes || null,
          data.expected_return_date || null,
        ],
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
    }),

  // =====================================================
  // UPDATE ASSIGNMENT
  // =====================================================
  update: (id, data) =>
    new Promise((resolve, reject) => {
      db.query(
        `
        UPDATE assignments
        SET
          assignment_date = ?,
          notes = ?,
          status = ?,
          expected_return_date = ?
        WHERE assignment_id = ?
        `,
        [
          data.assignment_date,
          data.notes || null,
          data.status || "Active",
          data.expected_return_date || null,
          id,
        ],
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
    }),

  // =====================================================
  // UPDATE STATUS
  // =====================================================
  updateStatus: (id, status) =>
    new Promise((resolve, reject) => {
      db.query(
        `
        UPDATE assignments
        SET status = ?
        WHERE assignment_id = ?
        `,
        [status, id],
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
    }),

  // =====================================================
  // CONFIRM RECEIPT
  // Records the moment the employee acknowledged
  // receiving the assigned asset.
  // =====================================================
  confirmReceipt: (id) =>
    new Promise((resolve, reject) => {
      db.query(
        `
        UPDATE assignments
        SET received_at = NOW()
        WHERE assignment_id = ? AND received_at IS NULL
        `,
        [id],
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
    }),

  // =====================================================
  // GET DUE ASSIGNMENTS
  // =====================================================
  getDueAssignments: () =>
    new Promise((resolve, reject) => {
      db.query(
        `
        SELECT
          a.*,
          u.name AS employee_name,
          u.email AS employee_email,
          ast.asset_name,
          ast.serial_number
        FROM assignments a
        LEFT JOIN users u
          ON a.user_id = u.user_id
        LEFT JOIN assets ast
          ON a.asset_id = ast.asset_id
        WHERE
          a.status = 'Active'
          AND a.expected_return_date IS NOT NULL
          AND DATE(a.expected_return_date) = CURDATE()
        `,
        (error, rows) => {
          if (error) {
            reject(error);
          } else {
            resolve(rows);
          }
        }
      );
    }),

  // =====================================================
  // GET ASSIGNMENTS IN BONUS DAY
  // =====================================================
  getBonusDayAssignments: () =>
    new Promise((resolve, reject) => {
      db.query(
        `
        SELECT
          a.*,
          u.name AS employee_name,
          u.email AS employee_email,
          ast.asset_name,
          ast.serial_number
        FROM assignments a
        LEFT JOIN users u
          ON a.user_id = u.user_id
        LEFT JOIN assets ast
          ON a.asset_id = ast.asset_id
        WHERE
          a.status = 'Active'
          AND a.expected_return_date IS NOT NULL
          AND DATE_ADD(
                DATE(a.expected_return_date),
                INTERVAL 1 DAY
              ) = CURDATE()
        `,
        (error, rows) => {
          if (error) {
            reject(error);
          } else {
            resolve(rows);
          }
        }
      );
    }),

  // =====================================================
  // GET OVERDUE ASSIGNMENTS
  // AFTER EXPECTED DATE + 1 BONUS DAY
  // =====================================================
  getOverdueAssignments: () =>
    new Promise((resolve, reject) => {
      db.query(
        `
        SELECT
          a.*,
          u.name AS employee_name,
          u.email AS employee_email,
          ast.asset_name,
          ast.serial_number
        FROM assignments a
        LEFT JOIN users u
          ON a.user_id = u.user_id
        LEFT JOIN assets ast
          ON a.asset_id = ast.asset_id
        WHERE
          a.status IN ('Active', 'Overdue')
          AND a.expected_return_date IS NOT NULL
          AND CURDATE() >
              DATE_ADD(
                DATE(a.expected_return_date),
                INTERVAL 1 DAY
              )
        `,
        (error, rows) => {
          if (error) {
            reject(error);
          } else {
            resolve(rows);
          }
        }
      );
    }),

  // =====================================================
  // DELETE
  // =====================================================
  delete: (id) =>
    new Promise((resolve, reject) => {
      db.query(
        `
        DELETE FROM assignments
        WHERE assignment_id = ?
        `,
        [id],
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
    }),

  // =====================================================
  // GET ASSET ID
  // =====================================================
  getAssetId: (id) =>
    new Promise((resolve, reject) => {
      db.query(
        `
        SELECT asset_id
        FROM assignments
        WHERE assignment_id = ?
        `,
        [id],
        (error, rows) => {
          if (error) {
            reject(error);
          } else {
            resolve(rows[0] || null);
          }
        }
      );
    }),
};

module.exports = AssignmentModel;