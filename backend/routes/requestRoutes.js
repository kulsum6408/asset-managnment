const express = require("express");
const router = express.Router();

const db = require("../config/db");

const authenticate = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const { logAudit } = require("../middleware/auditLogger");

const NotificationModel = require("../models/notificationModel");

// =====================================================
// DATABASE HELPER
// =====================================================
const q = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, params, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });

// =====================================================
// GET /api/requests
// =====================================================
router.get("/", authenticate, async (req, res) => {
  try {
    const privileged = [
      "admin",
      "manager",
      "asset_officer",
    ];

    let sql;
    let params = [];

    if (privileged.includes(req.user.role)) {
      sql = `
        SELECT
          r.*,
          u.name AS requester_name,
          u.email AS requester_email,
          u.department,
          a.asset_name,
          a.serial_number,
          a.status AS asset_status
        FROM requests r
        LEFT JOIN users u
          ON r.user_id = u.user_id
        LEFT JOIN assets a
          ON r.asset_id = a.asset_id
        ORDER BY r.request_date DESC
      `;
    } else {
      sql = `
        SELECT
          r.*,
          a.asset_name,
          a.serial_number,
          a.status AS asset_status
        FROM requests r
        LEFT JOIN assets a
          ON r.asset_id = a.asset_id
        WHERE r.user_id = ?
        ORDER BY r.request_date DESC
      `;

      params = [req.user.user_id];
    }

    const data = await q(sql, params);

    res.status(200).json(data);
  } catch (err) {
    console.error("GET /requests error:", err);

    res.status(500).json({
      error: err.message,
    });
  }
});

// =====================================================
// GET /api/requests/:id
// =====================================================
router.get("/:id", authenticate, async (req, res) => {
  try {
    const rows = await q(
      `
      SELECT
        r.*,
        u.name AS requester_name,
        u.email AS requester_email,
        u.department,
        a.asset_name,
        a.serial_number,
        a.status AS asset_status
      FROM requests r
      LEFT JOIN users u
        ON r.user_id = u.user_id
      LEFT JOIN assets a
        ON r.asset_id = a.asset_id
      WHERE r.request_id = ?
      `,
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({
        error: "Request not found.",
      });
    }

    const request = rows[0];

    const privileged = [
      "admin",
      "manager",
      "asset_officer",
    ];

    if (
      !privileged.includes(req.user.role) &&
      request.user_id !== req.user.user_id
    ) {
      return res.status(403).json({
        error: "Access denied.",
      });
    }

    res.status(200).json(request);
  } catch (err) {
    console.error("GET /requests/:id error:", err);

    res.status(500).json({
      error: err.message,
    });
  }
});

// =====================================================
// POST /api/requests
// =====================================================
router.post("/", authenticate, async (req, res) => {
  try {
    const {
      asset_id,
      reason,
      expected_return_date,
    } = req.body;

    if (!asset_id) {
      return res.status(400).json({
        error: "Asset ID is required.",
      });
    }

    // -------------------------------------------------
    // Validate expected return date
    // -------------------------------------------------
    if (expected_return_date) {
      const returnDate = new Date(
        expected_return_date
      );

      if (Number.isNaN(returnDate.getTime())) {
        return res.status(400).json({
          error: "Invalid expected return date.",
        });
      }

      const today = new Date();

      today.setHours(0, 0, 0, 0);
      returnDate.setHours(0, 0, 0, 0);

      if (returnDate < today) {
        return res.status(400).json({
          error:
            "Expected return date cannot be in the past.",
        });
      }
    }

    // -------------------------------------------------
    // Check asset
    // -------------------------------------------------
    const asset = await q(
      `
      SELECT
        asset_id,
        asset_name,
        serial_number,
        status
      FROM assets
      WHERE asset_id = ?
      `,
      [asset_id]
    );

    if (!asset.length) {
      return res.status(404).json({
        error: "Asset not found.",
      });
    }

    // -------------------------------------------------
    // Disposed asset
    // -------------------------------------------------
    if (asset[0].status === "Disposed") {
      return res.status(400).json({
        error:
          "Cannot request a disposed asset.",
      });
    }

    // -------------------------------------------------
    // Asset must be available
    // -------------------------------------------------
    if (asset[0].status !== "Available") {
      return res.status(400).json({
        error:
          "Asset is not available for request.",
      });
    }

    // -------------------------------------------------
    // Prevent duplicate pending request
    // -------------------------------------------------
    const duplicate = await q(
      `
      SELECT request_id
      FROM requests
      WHERE user_id = ?
        AND asset_id = ?
        AND status = 'Pending'
      `,
      [req.user.user_id, asset_id]
    );

    if (duplicate.length) {
      return res.status(409).json({
        error:
          "You already have a pending request for this asset.",
      });
    }

    // -------------------------------------------------
    // Create request
    // -------------------------------------------------
    const result = await q(
      `
      INSERT INTO requests
      (
        user_id,
        asset_id,
        request_date,
        status,
        reason,
        expected_return_date
      )
      VALUES (?, ?, NOW(), 'Pending', ?, ?)
      `,
      [
        req.user.user_id,
        asset_id,
        reason || null,
        expected_return_date || null,
      ]
    );

    // -------------------------------------------------
    // Audit
    // -------------------------------------------------
    await logAudit(
      req,
      "CREATE_REQUEST",
      "request",
      result.insertId,
      {
        asset_id,
        reason,
        expected_return_date:
          expected_return_date || null,
      }
    );

    // -------------------------------------------------
    // Notify employee
    // -------------------------------------------------
    await NotificationModel.create({
      user_id: req.user.user_id,
      title: "Request Submitted",
      message:
        `Your request for asset "${asset[0].asset_name}" has been submitted.`,
      type: "info",
    });

    // -------------------------------------------------
    // Notify managers
    // -------------------------------------------------
    const managers = await q(
      `
      SELECT user_id
      FROM users
      WHERE role = 'manager'
      `
    );

    for (const manager of managers) {
      await NotificationModel.create({
        user_id: manager.user_id,
        title: "New Asset Request",
        message:
          `Employee ${req.user.user_id} requested asset ` +
          `"${asset[0].asset_name}". Request #${result.insertId} ` +
          `is waiting for approval.`,
        type: "info",
      });
    }

    // -------------------------------------------------
    // Notify asset officers
    // -------------------------------------------------
    const assetOfficers = await q(
      `
      SELECT user_id, name
      FROM users
      WHERE role = 'asset_officer'
      `
    );

    for (const officer of assetOfficers) {
      await NotificationModel.create({
        user_id: officer.user_id,
        title: "New Asset Request",
        message:
          `Employee requested asset "${asset[0].asset_name}". ` +
          `Request #${result.insertId} is waiting for review.`,
        type: "info",
      });
    }

    res.status(201).json({
      message:
        "Request submitted successfully.",
      request_id: result.insertId,
      expected_return_date:
        expected_return_date || null,
    });
  } catch (err) {
    console.error(
      "POST /requests error:",
      err
    );

    res.status(500).json({
      error: err.message,
    });
  }
});

// =====================================================
// PUT /api/requests/:id/approve
// APPROVE ONLY
//
// IMPORTANT:
// - Does NOT create assignment
// - Does NOT mark asset Assigned
// - Does NOT decrease bin card
//
// Those happen during actual handover.
//
// NOTE: Admin and Asset Officer are intentionally NOT included.
// They only monitor requests (view only).
// Only the Manager may approve.
// =====================================================
router.put(
  "/:id/approve",
  authenticate,
  authorize(
    "manager"
  ),
  async (req, res) => {
    try {
      const { remarks } = req.body;

      // -------------------------------------------------
      // Get request and asset
      // -------------------------------------------------
      const rows = await q(
        `
        SELECT
          r.*,
          a.asset_name,
          a.serial_number,
          a.status AS asset_status
        FROM requests r
        LEFT JOIN assets a
          ON r.asset_id = a.asset_id
        WHERE r.request_id = ?
        `,
        [req.params.id]
      );

      if (!rows.length) {
        return res.status(404).json({
          error: "Request not found.",
        });
      }

      const request = rows[0];

      // -------------------------------------------------
      // Request must be pending
      // -------------------------------------------------
      if (request.status !== "Pending") {
        return res.status(400).json({
          error:
            "Only pending requests can be approved. Current status: " + request.status,
        });
      }

      // -------------------------------------------------
      // Asset must still be available
      // -------------------------------------------------
      if (request.asset_status !== "Available") {
        return res.status(400).json({
          error:
            `Asset "${request.asset_name}" is not available.`,
        });
      }

      // -------------------------------------------------
      // Approve request
      // -------------------------------------------------
      await q(
        `
        UPDATE requests
        SET
          status = 'Approved',
          remarks = ?,
          approved_at = NOW(),
          approved_by = ?,
          updated_at = NOW()
        WHERE request_id = ?
        `,
        [
          remarks || null,
          req.user.user_id,
          req.params.id,
        ]
      );

      // -------------------------------------------------
      // Audit
      // -------------------------------------------------
      await logAudit(
        req,
        "APPROVE_REQUEST",
        "request",
        req.params.id,
        {
          remarks: remarks || null,
          user_id: request.user_id,
          asset_id: request.asset_id,
        }
      );

      // -------------------------------------------------
      // Notify employee
      // -------------------------------------------------
      await NotificationModel.create({
        user_id: request.user_id,
        title: "Request Approved",
        message:
          `Your request for "${request.asset_name}" ` +
          `has been approved. Please wait for the ` +
          `Asset Officer to prepare the asset for handover.` +
          (remarks
            ? ` Remarks: ${remarks}`
            : ""),
        type: "success",
      });

      // -------------------------------------------------
      // Notify all Asset Officers
      // -------------------------------------------------
      const assetOfficers = await q(
        `
        SELECT user_id
        FROM users
        WHERE role = 'asset_officer'
        `
      );

      for (const officer of assetOfficers) {
        await NotificationModel.create({
          user_id: officer.user_id,
          title:
            "Approved Asset Request",
          message:
            `Request #${req.params.id} for ` +
            `"${request.asset_name}" has been approved ` +
            `and is waiting for asset handover.`,
          type: "info",
        });
      }

      // -------------------------------------------------
      // Response
      // -------------------------------------------------
      res.status(200).json({
        message:
          "Request approved successfully. Awaiting asset handover.",
        request_id: Number(req.params.id),
        asset_id: request.asset_id,
        user_id: request.user_id,
      });
    } catch (err) {
      console.error(
        "PUT /requests/:id/approve error:",
        err
      );

      res.status(500).json({
        error: err.message,
      });
    }
  }
);

// =====================================================
// PUT /api/requests/:id/reject
// NOTE: Admin and Asset Officer are intentionally NOT included.
// They only monitor requests (view only).
// Only the Manager may reject.
// =====================================================
router.put(
  "/:id/reject",
  authenticate,
  authorize(
    "manager"
  ),
  async (req, res) => {
    try {
      const { remarks } = req.body;

      const rows = await q(
        `
        SELECT
          r.*,
          a.asset_name
        FROM requests r
        LEFT JOIN assets a
          ON r.asset_id = a.asset_id
        WHERE r.request_id = ?
        `,
        [req.params.id]
      );

      if (!rows.length) {
        return res.status(404).json({
          error: "Request not found.",
        });
      }

      const request = rows[0];

      // -------------------------------------------------
      // Only pending requests can be rejected
      // -------------------------------------------------
      if (request.status !== "Pending") {
        return res.status(400).json({
          error:
            "Only pending requests can be rejected.",
        });
      }

      // -------------------------------------------------
      // Reject request
      // -------------------------------------------------
      await q(
        `
        UPDATE requests
        SET
          status = 'Rejected',
          remarks = ?,
          updated_at = NOW()
        WHERE request_id = ?
        `,
        [
          remarks || null,
          req.params.id,
        ]
      );

      // -------------------------------------------------
      // Audit
      // -------------------------------------------------
      await logAudit(
        req,
        "REJECT_REQUEST",
        "request",
        req.params.id,
        {
          remarks: remarks || null,
        }
      );

      // -------------------------------------------------
      // Notify employee
      // -------------------------------------------------
      await NotificationModel.create({
        user_id: request.user_id,
        title: "Request Rejected",
        message:
          `Your request for asset "${request.asset_name}" was rejected.` +
          (remarks
            ? ` Remarks: ${remarks}`
            : ""),
        type: "danger",
      });

      // -------------------------------------------------
      // Notify all Asset Officers
      // -------------------------------------------------
      const assetOfficers = await q(
        `
        SELECT user_id
        FROM users
        WHERE role = 'asset_officer'
        `
      );

      for (const officer of assetOfficers) {
        await NotificationModel.create({
          user_id: officer.user_id,
          title: "Asset Request Rejected",
          message:
            `Request #${req.params.id} for asset ` +
            `"${request.asset_name}" was rejected.`,
          type: "warning",
        });
      }

      res.status(200).json({
        message:
          "Request rejected successfully.",
      });
    } catch (err) {
      console.error(
        "PUT /requests/:id/reject error:",
        err
      );

      res.status(500).json({
        error: err.message,
      });
    }
  }
);

// =====================================================
// DELETE /api/requests/:id
// =====================================================
router.delete(
  "/:id",
  authenticate,
  async (req, res) => {
    try {
      const rows = await q(
        `
        SELECT *
        FROM requests
        WHERE request_id = ?
        `,
        [req.params.id]
      );

      if (!rows.length) {
        return res.status(404).json({
          error: "Request not found.",
        });
      }

      const request = rows[0];

      // -------------------------------------------------
      // Non-admin users can only delete their own
      // pending requests
      // -------------------------------------------------
      if (req.user.role !== "admin") {
        if (
          request.user_id !==
          req.user.user_id
        ) {
          return res.status(403).json({
            error: "Access denied.",
          });
        }

        if (request.status !== "Pending") {
          return res.status(400).json({
            error:
              "Only pending requests can be cancelled.",
          });
        }
      }

      // -------------------------------------------------
      // Soft delete: set status = Cancelled
      // -------------------------------------------------
      await q(
        `
        UPDATE requests
        SET status = 'Cancelled', updated_at = NOW()
        WHERE request_id = ?
        `,
        [req.params.id]
      );

      // -------------------------------------------------
      // Audit
      // -------------------------------------------------
      await logAudit(
        req,
        "CANCEL_REQUEST",
        "request",
        req.params.id
      );

      // -------------------------------------------------
      // Notify employee
      // -------------------------------------------------
      if (request.user_id !== req.user.user_id) {
        const NotificationModel = require("../models/notificationModel");
        await NotificationModel.create({
          user_id: request.user_id,
          title: "Request Cancelled",
          message: `Your request for asset ID ${request.asset_id} has been cancelled.`,
          type: "info"
        });
      }

      res.status(200).json({
        message: "Request cancelled.",
      });
    } catch (err) {
      console.error(
        "DELETE /requests/:id error:",
        err
      );

      res.status(500).json({
        error: err.message,
      });
    }
  }
);

module.exports = router;