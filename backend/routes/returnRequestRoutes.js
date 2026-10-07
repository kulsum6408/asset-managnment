const express = require("express");

const router = express.Router();

const db = require("../config/db");
const authenticate = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const { logAudit } = require("../middleware/auditLogger");
const NotificationModel = require("../models/notificationModel");

const q = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, params, (error, rows) => {
      if (error) {
        reject(error);
      } else {
        resolve(rows);
      }
    });
  });

// =====================================================
// GET /api/return-requests
// Employee → own requests
// Admin / Manager / Asset Officer → all requests
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
          rr.*,
          u.name AS employee_name,
          u.email AS employee_email,
          u.department,
          a.assignment_date,
          a.expected_return_date,
          ast.asset_name,
          ast.serial_number,
          ab.name AS assigned_by_name,
          rb.name AS reviewed_by_name,
          rcv.name AS received_by_name
        FROM return_requests rr
        LEFT JOIN users u
          ON rr.user_id = u.user_id
        LEFT JOIN assignments a
          ON rr.assignment_id = a.assignment_id
        LEFT JOIN assets ast
          ON a.asset_id = ast.asset_id
        LEFT JOIN users ab
          ON a.assigned_by = ab.user_id
        LEFT JOIN users rb
          ON rr.reviewed_by = rb.user_id
        LEFT JOIN users rcv
          ON rr.received_by = rcv.user_id
        ORDER BY rr.requested_date DESC
      `;
    } else {
      sql = `
        SELECT
          rr.*,
          a.assignment_date,
          a.expected_return_date,
          ast.asset_name,
          ast.serial_number
        FROM return_requests rr
        LEFT JOIN assignments a
          ON rr.assignment_id = a.assignment_id
        LEFT JOIN assets ast
          ON a.asset_id = ast.asset_id
        WHERE rr.user_id = ?
        ORDER BY rr.requested_date DESC
      `;

      params = [req.user.user_id];
    }

    const rows = await q(sql, params);

    res.status(200).json(rows);
  } catch (error) {
    console.error(
      "GET /return-requests error:",
      error
    );

    res.status(500).json({
      error: error.message,
    });
  }
});

// =====================================================
// GET /api/return-requests/:id
// =====================================================
router.get("/:id", authenticate, async (req, res) => {
  try {
    const rows = await q(
      `
      SELECT
        rr.*,
        u.name AS employee_name,
        u.email AS employee_email,
        a.assignment_date,
        a.expected_return_date,
        ast.asset_name,
        ast.serial_number,
        ast.asset_condition
      FROM return_requests rr
      LEFT JOIN users u
        ON rr.user_id = u.user_id
      LEFT JOIN assignments a
        ON rr.assignment_id = a.assignment_id
      LEFT JOIN assets ast
        ON a.asset_id = ast.asset_id
      WHERE rr.return_request_id = ?
      `,
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({
        error: "Return request not found.",
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
  } catch (error) {
    console.error(
      "GET /return-requests/:id error:",
      error
    );

    res.status(500).json({
      error: error.message,
    });
  }
});

// =====================================================
// POST /api/return-requests
// Employee creates return request
// =====================================================
router.post("/", authenticate, async (req, res) => {
  try {
    const {
      assignment_id,
      reason,
    } = req.body;

    if (!assignment_id) {
      return res.status(400).json({
        error: "Assignment ID is required.",
      });
    }

    // Check assignment
    const assignments = await q(
      `
      SELECT
        a.*,
        ast.asset_name
      FROM assignments a
      LEFT JOIN assets ast
        ON a.asset_id = ast.asset_id
      WHERE a.assignment_id = ?
      `,
      [assignment_id]
    );

    if (!assignments.length) {
      return res.status(404).json({
        error: "Assignment not found.",
      });
    }

    const assignment = assignments[0];

    // Employee can only request return for own assignment
    if (
      req.user.role !== "admin" &&
      req.user.role !== "manager" &&
      req.user.role !== "asset_officer" &&
      assignment.user_id !== req.user.user_id
    ) {
      return res.status(403).json({
        error: "Access denied.",
      });
    }

    // Already returned
    if (assignment.status === "Returned") {
      return res.status(400).json({
        error: "This asset has already been returned.",
      });
    }

    // Check for existing pending request
    const existing = await q(
      `
      SELECT return_request_id
      FROM return_requests
      WHERE assignment_id = ?
        AND status = 'Pending'
      `,
      [assignment_id]
    );

    if (existing.length) {
      return res.status(409).json({
        error:
          "A return request is already pending.",
      });
    }

    const result = await q(
      `
      INSERT INTO return_requests
      (
        assignment_id,
        user_id,
        requested_date,
        status,
        reason
      )
      VALUES (?, ?, NOW(), 'Pending', ?)
      `,
      [
        assignment_id,
        assignment.user_id,
        reason || null,
      ]
    );

    await logAudit(
      req,
      "CREATE_RETURN_REQUEST",
      "return_request",
      result.insertId,
      {
        assignment_id,
      }
    );

    // Notify Asset Officer
    const officers = await q(
      `
      SELECT user_id
      FROM users
      WHERE role = 'asset_officer'
        AND is_active = 1
      `
    );

    for (const officer of officers) {
      await NotificationModel.create({
        user_id: officer.user_id,
        title: "Asset Return Requested",
        message: `Employee requested to return asset "${assignment.asset_name}".`,
        type: "warning",
      });
    }

    // Notify employee
    await NotificationModel.create({
      user_id: assignment.user_id,
      title: "Return Request Submitted",
      message: `Your return request for "${assignment.asset_name}" has been submitted.`,
      type: "info",
    });

    res.status(201).json({
      message:
        "Return request submitted successfully.",
      return_request_id: result.insertId,
    });
  } catch (error) {
    console.error(
      "POST /return-requests error:",
      error
    );

    res.status(500).json({
      error: error.message,
    });
  }
});

// =====================================================
// PUT /api/return-requests/:id/complete
// Asset Officer physically receives + inspects the returned
// asset and completes the return in a single atomic transaction:
//   1. return request   -> Completed (received_by, received_at, inspection)
//   2. assignment       -> Returned
//   3. asset            -> Available + location -> store + condition
//   4. returns record   -> created (received_by, return_date, condition, notes)
//   5. bin card IN      -> RETURN transaction
// Manager / Admin / Employee are intentionally NOT allowed here.
// =====================================================
router.put(
  "/:id/complete",
  authenticate,
  authorize("asset_officer"),
  async (req, res) => {
    const {
      asset_condition,
      notes,
    } = req.body;

    try {
      const rows = await q(
        `
        SELECT
          rr.*,
          a.assignment_id,
          a.user_id,
          a.asset_id,
          ast.asset_name,
          ast.status AS asset_status,
          u.name AS employee_name
        FROM return_requests rr
        LEFT JOIN assignments a
          ON rr.assignment_id = a.assignment_id
        LEFT JOIN assets ast
          ON a.asset_id = ast.asset_id
        LEFT JOIN users u
          ON rr.user_id = u.user_id
        WHERE rr.return_request_id = ?
        `,
        [req.params.id]
      );

      if (!rows.length) {
        return res.status(404).json({
          error: "Return request not found.",
        });
      }

      const request = rows[0];

      if (
        !request.assignment_id ||
        !request.asset_id
      ) {
        return res.status(400).json({
          error:
            "This return request has no linked assignment.",
        });
      }

      if (request.status !== "Approved") {
        return res.status(400).json({
          error:
            "Only approved return requests can be completed. Pending requests must be approved first.",
        });
      }

      const validConditions = [
        "New",
        "Good",
        "Fair",
        "Poor",
        "Damaged",
      ];

      const condition = validConditions.includes(
        asset_condition
      )
        ? asset_condition
        : "Good";

      const transaction = await new Promise(
        (resolve, reject) => {
          db.beginTransaction((err) => {
            if (err) return reject(err);

            // -------------------------------------------------
            // 1. Mark return request completed
            // -------------------------------------------------
            db.query(
              `
              UPDATE return_requests
              SET
                status = 'Completed',
                received_by = ?,
                received_at = NOW(),
                inspection_condition = ?,
                inspection_remarks = ?
              WHERE return_request_id = ?
              `,
              [
                req.user.user_id,
                condition,
                notes || null,
                req.params.id,
              ],
              (err) => {
                if (err) {
                  return db.rollback(() =>
                    reject(err)
                  );
                }

                // ---------------------------------------------
                // 2. Mark assignment Returned
                // ---------------------------------------------
                db.query(
                  `
                  UPDATE assignments
                  SET status = 'Returned'
                  WHERE assignment_id = ?
                  `,
                  [request.assignment_id],
                  (err) => {
                    if (err) {
                      return db.rollback(() =>
                        reject(err)
                      );
                    }

                    // -------------------------------------------
                    // 3. Update asset
                    //    Good  -> Available in store
                    //    Damaged -> Under Maintenance (NOT sold/store)
                    // -------------------------------------------
                    const isDamaged =
                      condition === "Damaged";

                    const assetStatus = isDamaged
                      ? "Under Maintenance"
                      : "Available";

                    db.query(
                      `
                      UPDATE assets
                      SET
                        status = ?,
                        asset_condition = ?
                        ${isDamaged ? "" : ", location = 'Store'"}
                      WHERE asset_id = ?
                      `,
                      [
                        assetStatus,
                        condition,
                        request.asset_id,
                      ],
                      (err) => {
                        if (err) {
                          return db.rollback(() =>
                            reject(err)
                          );
                        }

                        // ---------------------------------------
                        // 4. Create returns record
                        // ---------------------------------------
                        db.query(
                          `
                          INSERT INTO returns
                          (assignment_id, return_date, asset_condition, notes, received_by)
                          VALUES (?, NOW(), ?, ?, ?)
                          `,
                          [
                            request.assignment_id,
                            condition,
                            notes || null,
                            req.user.user_id,
                          ],
                          (err, returnResult) => {
                            if (err) {
                              return db.rollback(() =>
                                reject(err)
                              );
                            }

                            const returnId =
                              returnResult.insertId;

                            // -----------------------------------
                            // 5. Bin card IN - ONLY for normal returns.
                            //    Damaged assets do NOT enter the store, so
                            //    NO Bin Card IN is created here. The Bin Card
                            //    IN for a damaged asset happens after repair
                            //    via /api/maintenance/:id/return-to-store.
                            // -----------------------------------
                            const problemRecord = isDamaged
                              ? `Asset "${request.asset_name}" returned damaged (condition: ${condition}).`
                              : null;

                            const afterBinCard = () => {
                              // Damaged -> create maintenance record
                              if (isDamaged) {
                                const maintenanceDescription =
                                  `[Returned Damaged, condition: ${condition}] ` +
                                  (notes || "Asset returned in damaged condition.");

                                db.query(
                                  `
                                  INSERT INTO maintenance
                                  (asset_id, maintenance_date, description, problem_record, repair_requirements, status, reported_by, maintenance_type, created_at)
                                  VALUES (?, CURDATE(), ?, ?, ?, 'Under Inspection', ?, 'Corrective', NOW())
                                  `,
                                  [
                                    request.asset_id,
                                    maintenanceDescription,
                                    problemRecord,
                                    notes || null,
                                    req.user.user_id,
                                  ],
                                  (err, maintResult) => {
                                    if (err) {
                                      return db.rollback(() =>
                                        reject(err)
                                      );
                                    }
                                    db.commit(
                                      (err) => {
                                        if (err) {
                                          return db.rollback(() =>
                                            reject(err)
                                          );
                                        }
                                        resolve({
                                          returnId,
                                          maintenanceId:
                                            maintResult.insertId,
                                          damaged: true,
                                        });
                                      }
                                    );
                                  }
                                );
                              } else {
                                // Good/Fair/Poor -> no maintenance record
                                db.commit(
                                  (err) => {
                                    if (err) {
                                      return db.rollback(() =>
                                        reject(err)
                                      );
                                    }
                                    resolve({
                                      returnId,
                                      damaged: false,
                                    });
                                  }
                                );
                              }
                            };

                            if (isDamaged) {
                              afterBinCard();
                            } else {
                              const binNote = `Asset "${request.asset_name}" returned to store (condition: ${condition}).`;
                              db.query(
                                `
                                INSERT INTO bin_card_transactions
                                (asset_id, transaction_type, quantity, reference_type, reference_id, receipt_number, employee_id, performed_by, notes, transaction_date)
                                VALUES (?, 'IN', 1, 'RETURN', ?, NULL, ?, ?, ?, NOW())
                                `,
                                [
                                  request.asset_id,
                                  returnId,
                                  request.user_id,
                                  req.user.user_id,
                                  binNote,
                                ],
                                (err) => {
                                  if (err) {
                                    return db.rollback(() =>
                                      reject(err)
                                    );
                                  }
                                  afterBinCard();
                                }
                              );
                            }
                          }
                        );
                      }
                    );
                  }
                );
              }
            );
          });
        }
      );

      await logAudit(
        req,
        "COMPLETE_RETURN",
        "return_request",
        req.params.id,
        {
          assignment_id: request.assignment_id,
          asset_id: request.asset_id,
          return_id: transaction.returnId,
          condition,
          damaged: transaction.damaged,
          maintenance_id: transaction.maintenanceId || null,
        }
      );

      await NotificationModel.create({
        user_id: request.user_id,
        title: transaction.damaged
          ? "Asset Return Received - Needs Maintenance"
          : "Asset Return Completed",
        message: transaction.damaged
          ? `Your return of "${request.asset_name}" was received and inspected as damaged. It has been sent to maintenance.`
          : `Your return of "${request.asset_name}" has been received and completed. Condition recorded as ${condition}.`,
        type: transaction.damaged ? "warning" : "success",
      });

      if (transaction.damaged) {
        const maintenanceOfficers = await q(
          `
          SELECT user_id
          FROM users
          WHERE role IN ('maintenance_officer','admin')
            AND is_active = 1
          `
        );

        for (const officer of maintenanceOfficers) {
      const AssetHistoryModel = require("../models/assetHistoryModel");

      await AssetHistoryModel.create({
        asset_id: request.asset_id,
        user_id: req.user.user_id,
        action: transaction.damaged ? "ASSET_RETURNED_DAMAGED" : "ASSET_RETURNED",
        previous_value: { assignment_status: "Active", asset_status: request.asset_status },
        new_value: transaction.damaged
          ? { assignment_status: "Returned", asset_status: "Under Maintenance" }
          : { assignment_status: "Returned", asset_status: "Available", location: "Store" },
        description: transaction.damaged
          ? `Asset "${request.asset_name}" returned damaged (condition: ${condition}) and routed to maintenance.`
          : `Asset "${request.asset_name}" returned to store (condition: ${condition}).`
      });

      await NotificationModel.create({
            user_id: officer.user_id,
            title: "Damaged Asset Returned",
            message: `Damaged asset "${request.asset_name}" was returned and requires maintenance.`,
            type: "warning",
          });
        }
      }

      res.status(200).json({
        message: transaction.damaged
          ? "Return completed. Damaged asset sent to maintenance."
          : "Return completed successfully.",
        return_id: transaction.returnId,
        damaged: transaction.damaged,
        maintenance_id: transaction.maintenanceId || null,
      });
    } catch (error) {
      console.error(
        "PUT /return-requests/:id/complete error:",
        error
      );

      if (
        !res.headersSent &&
        error &&
        String(error.message || "").includes(
          "Duplicate entry"
        )
      ) {
        return res.status(409).json({
          error:
            "This return has already been completed.",
        });
      }

      res.status(500).json({
        error: error.message,
      });
    }
  }
);

// =====================================================
// PUT /api/return-requests/:id/approve
// Asset Officer (or Admin fallback) approves employee return
// Manager is intentionally NOT allowed to approve normal returns.
router.put(
  "/:id/approve",
  authenticate,
  authorize(
    "asset_officer",
    "admin"
  ),
  async (req, res) => {
    try {
      const {
        remarks,
      } = req.body;

      const rows = await q(
        `
        SELECT
          rr.*,
          a.assignment_id,
          a.user_id,
          a.asset_id,
          ast.asset_name
        FROM return_requests rr
        LEFT JOIN assignments a
          ON rr.assignment_id = a.assignment_id
        LEFT JOIN assets ast
          ON a.asset_id = ast.asset_id
        WHERE rr.return_request_id = ?
        `,
        [req.params.id]
      );

      if (!rows.length) {
        return res.status(404).json({
          error: "Return request not found.",
        });
      }

      const request = rows[0];

      if (request.status !== "Pending") {
        return res.status(400).json({
          error:
            "Only pending return requests can be approved.",
        });
      }

      await q(
        `
        UPDATE return_requests
        SET
          status = 'Approved',
          remarks = ?,
          reviewed_by = ?,
          reviewed_at = NOW()
        WHERE return_request_id = ?
        `,
        [
          remarks || null,
          req.user.user_id,
          req.params.id,
        ]
      );

      await logAudit(
        req,
        "APPROVE_RETURN_REQUEST",
        "return_request",
        req.params.id,
        {
          remarks,
        }
      );

      await NotificationModel.create({
        user_id: request.user_id,
        title: "Return Request Approved",
        message: `Your return request for "${request.asset_name}" has been approved. Please return the asset to the Asset Officer.`,
        type: "success",
      });

      res.status(200).json({
        message:
          "Return request approved successfully.",
      });
    } catch (error) {
      console.error(
        "PUT /return-requests/:id/approve error:",
        error
      );

      res.status(500).json({
        error: error.message,
      });
    }
  }
);

// =====================================================
// PUT /api/return-requests/:id/reject
// Asset Officer (or Admin fallback) rejects employee return
// Manager is intentionally NOT allowed to reject normal returns.
// =====================================================
router.put(
  "/:id/reject",
  authenticate,
  authorize(
    "asset_officer",
    "admin"
  ),
  async (req, res) => {
    try {
      const {
        remarks,
      } = req.body;

      const rows = await q(
        `
        SELECT
          rr.*,
          ast.asset_name
        FROM return_requests rr
        LEFT JOIN assignments a
          ON rr.assignment_id = a.assignment_id
        LEFT JOIN assets ast
          ON a.asset_id = ast.asset_id
        WHERE rr.return_request_id = ?
        `,
        [req.params.id]
      );

      if (!rows.length) {
        return res.status(404).json({
          error: "Return request not found.",
        });
      }

      const request = rows[0];

      if (request.status !== "Pending") {
        return res.status(400).json({
          error:
            "Only pending return requests can be rejected.",
        });
      }

      await q(
        `
        UPDATE return_requests
        SET
          status = 'Rejected',
          remarks = ?,
          reviewed_by = ?,
          reviewed_at = NOW()
        WHERE return_request_id = ?
        `,
        [
          remarks || null,
          req.user.user_id,
          req.params.id,
        ]
      );

      await logAudit(
        req,
        "REJECT_RETURN_REQUEST",
        "return_request",
        req.params.id,
        {
          remarks,
        }
      );

      await NotificationModel.create({
        user_id: request.user_id,
        title: "Return Request Rejected",
        message: `Your return request for "${request.asset_name}" was rejected.${remarks ? ` Remarks: ${remarks}` : ""}`,
        type: "danger",
      });

      res.status(200).json({
        message:
          "Return request rejected successfully.",
      });
    } catch (error) {
      console.error(
        "PUT /return-requests/:id/reject error:",
        error
      );

      res.status(500).json({
        error: error.message,
      });
    }
  }
);

module.exports = router;