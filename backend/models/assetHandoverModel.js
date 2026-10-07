const db = require("../config/db");

const AssetHandoverModel = {

  // =====================================================
  // GET APPROVED REQUESTS READY FOR HANDOVER
  // =====================================================
  getApprovedRequests: () =>
    new Promise((resolve, reject) => {
      db.query(
        `
        SELECT
          r.request_id,
          r.user_id AS employee_id,
          r.asset_id,
          r.status AS request_status,
          r.reason,

          u.name AS employee_name,
          u.email AS employee_email,
          u.department,

          a.asset_name,
          a.serial_number,
          a.status AS asset_status,
          a.asset_condition,
          a.location

        FROM requests r

        INNER JOIN users u
          ON r.user_id = u.user_id

        INNER JOIN assets a
          ON r.asset_id = a.asset_id

        WHERE r.status = 'Approved'

        ORDER BY r.request_date ASC
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
  // GET REQUEST FOR HANDOVER
  // =====================================================
  getRequestForHandover: (requestId) =>
    new Promise((resolve, reject) => {
      db.query(
        `
        SELECT
          r.request_id,
          r.user_id AS employee_id,
          r.asset_id,
          r.status AS request_status,
          r.reason,

          u.name AS employee_name,
          u.email AS employee_email,
          u.department,

          a.asset_name,
          a.serial_number,
          a.status AS asset_status,
          a.asset_condition,
          a.location

        FROM requests r

        INNER JOIN users u
          ON r.user_id = u.user_id

        INNER JOIN assets a
          ON r.asset_id = a.asset_id

        WHERE r.request_id = ?
        `,
        [requestId],
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
  // CHECK IF REQUEST ALREADY HAS HANDOVER
  // =====================================================
  getByRequestId: (requestId) =>
    new Promise((resolve, reject) => {
      db.query(
        `
        SELECT
          h.*,
          u.name AS employee_name,
          a.asset_name,
          a.serial_number

        FROM asset_handovers h

        LEFT JOIN users u
          ON h.employee_id = u.user_id

        LEFT JOIN assets a
          ON h.asset_id = a.asset_id

        WHERE h.request_id = ?

        ORDER BY h.handover_id DESC

        LIMIT 1
        `,
        [requestId],
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
  // CHECK ACTIVE ASSIGNMENT FOR ASSET
  // =====================================================
  getActiveAssignmentByAssetId: (assetId) =>
    new Promise((resolve, reject) => {
      db.query(
        `
        SELECT
          assignment_id,
          asset_id,
          user_id,
          assignment_date,
          assigned_by,
          status
        FROM assignments
        WHERE asset_id = ?
          AND status = 'Active'
        LIMIT 1
        `,
        [assetId],
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
  // CREATE HANDOVER
  // =====================================================
  create: (data) =>
    new Promise((resolve, reject) => {
      db.query(
        `
        INSERT INTO asset_handovers
        (
          request_id,
          asset_id,
          employee_id,
          issued_by,
          receipt_number,
          condition_at_issue,
          accessories,
          employee_confirmed,
          employee_confirmed_at,
          notes,
          status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          data.request_id,
          data.asset_id,
          data.employee_id,
          data.issued_by,
          data.receipt_number,
          data.condition_at_issue || null,
          data.accessories || null,
          data.employee_confirmed ? 1 : 0,
          data.employee_confirmed_at || null,
          data.notes || null,
          data.status || "Completed",
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
  // GET HANDOVER BY ID
  // =====================================================
  getById: (handoverId) =>
    new Promise((resolve, reject) => {
      db.query(
        `
        SELECT
          h.*,

          u.name AS employee_name,
          u.email AS employee_email,
          u.department,

          issuer.name AS issued_by_name,

          a.asset_name,
          a.serial_number,
          a.asset_condition,
          a.location

        FROM asset_handovers h

        LEFT JOIN users u
          ON h.employee_id = u.user_id

        LEFT JOIN users issuer
          ON h.issued_by = issuer.user_id

        LEFT JOIN assets a
          ON h.asset_id = a.asset_id

        WHERE h.handover_id = ?
        `,
        [handoverId],
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
  // GET ALL HANDOVERS
  // =====================================================
  getAll: () =>
    new Promise((resolve, reject) => {
      db.query(
        `
        SELECT
          h.*,

          u.name AS employee_name,
          u.email AS employee_email,

          issuer.name AS issued_by_name,

          a.asset_name,
          a.serial_number

        FROM asset_handovers h

        LEFT JOIN users u
          ON h.employee_id = u.user_id

        LEFT JOIN users issuer
          ON h.issued_by = issuer.user_id

        LEFT JOIN assets a
          ON h.asset_id = a.asset_id

        ORDER BY h.handover_id DESC
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
  // CREATE BIN CARD TRANSACTION
  // =====================================================
  createBinCardTransaction: (data) =>
    new Promise((resolve, reject) => {
      db.query(
        `
        INSERT INTO bin_card_transactions
        (
          asset_id,
          transaction_type,
          quantity,
          reference_type,
          reference_id,
          receipt_number,
          employee_id,
          performed_by,
          transaction_date,
          notes
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)
        `,
        [
          data.asset_id,
          data.transaction_type,
          data.quantity,
          data.reference_type || null,
          data.reference_id || null,
          data.receipt_number || null,
          data.employee_id || null,
          data.performed_by,
          data.notes || null,
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
  // GET BIN CARD HISTORY FOR ASSET
  // =====================================================
  getBinCardByAssetId: (assetId) =>
    new Promise((resolve, reject) => {
      db.query(
        `
        SELECT
          b.*,

          u.name AS performed_by_name,

          e.name AS employee_name

        FROM bin_card_transactions b

        LEFT JOIN users u
          ON b.performed_by = u.user_id

        LEFT JOIN users e
          ON b.employee_id = e.user_id

        WHERE b.asset_id = ?

        ORDER BY b.transaction_id DESC
        `,
        [assetId],
        (error, rows) => {
          if (error) {
            reject(error);
          } else {
            resolve(rows);
          }
        }
      );
    }),
};

module.exports = AssetHandoverModel;