const express = require("express");
const router  = express.Router();
const db = require("../config/db");
const authenticate = require("../middleware/authMiddleware");
const { isMaintenance, isManager, isAssetOfficer, authorize } = require("../middleware/roleMiddleware");
const { logAudit } = require("../middleware/auditLogger");
const NotificationModel = require("../models/notificationModel");
const AssetHistoryModel = require("../models/assetHistoryModel");
const DisposalModel = require("../models/disposalModel");

const q = (sql, params = []) =>
    new Promise((res, rej) => db.query(sql, params, (e, r) => e ? rej(e) : res(r)));

// Record a Bin Card OUT transaction when an asset physically leaves the store
// to go for maintenance. Only meaningful when the asset was Available (in
// store) right before maintenance started - assets that are assigned to an
// employee were already tracked as ISSUE OUT and never occupy the store.
// Guarded against duplicates so repeated PUT status updates do not double
// record the same movement.
const recordMaintenanceOut = async (assetId, maintenanceId, assetName, actorId, prevStatus) => {
    if (String(prevStatus || "").toLowerCase() !== "available") return;

    const existing = await q(
        `SELECT transaction_id FROM bin_card_transactions
         WHERE reference_type = 'MAINTENANCE' AND reference_id = ?
           AND transaction_type IN ('OUT', 'MAINTENANCE OUT')`,
        [maintenanceId]
    );
    if (existing.length) return;

    await q(
        `INSERT INTO bin_card_transactions
         (asset_id, transaction_type, quantity, reference_type, reference_id,
          receipt_number, employee_id, performed_by, notes, transaction_date)
         VALUES (?, 'OUT', 1, 'MAINTENANCE', ?, NULL, NULL, ?, ?, NOW())`,
        [assetId, maintenanceId, actorId, `Asset "${assetName}" sent for maintenance (maintenance #${maintenanceId}).`]
    );
};

// GET /api/maintenance/reminders/upcoming
router.get("/reminders/upcoming", authenticate, async (req, res) => {
    try {
        const sql = `
            SELECT m.*, a.asset_name, a.serial_number, a.location, u.name AS technician_name,
                   DATEDIFF(m.next_maintenance_date, CURRENT_DATE()) AS days_until_due
            FROM maintenance m
            LEFT JOIN assets a ON m.asset_id = a.asset_id
            LEFT JOIN users u  ON m.technician_id = u.user_id
            WHERE (m.next_maintenance_date >= CURRENT_DATE() OR m.status = 'Scheduled')
              AND m.status NOT IN ('Completed', 'Cancelled')
            ORDER BY m.next_maintenance_date ASC
        `;
        res.status(200).json(await q(sql));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/maintenance/reminders/overdue
router.get("/reminders/overdue", authenticate, async (req, res) => {
    try {
        const sql = `
            SELECT m.*, a.asset_name, a.serial_number, a.location, u.name AS technician_name,
                   DATEDIFF(CURRENT_DATE(), m.next_maintenance_date) AS days_overdue
            FROM maintenance m
            LEFT JOIN assets a ON m.asset_id = a.asset_id
            LEFT JOIN users u  ON m.technician_id = u.user_id
            WHERE m.next_maintenance_date IS NOT NULL
              AND m.next_maintenance_date < CURRENT_DATE()
              AND m.status NOT IN ('Completed', 'Cancelled')
            ORDER BY m.next_maintenance_date ASC
        `;
        res.status(200).json(await q(sql));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/maintenance/asset/:asset_id/history
router.get("/asset/:asset_id/history", authenticate, async (req, res) => {
    try {
        const sql = `
            SELECT m.*, a.asset_name, a.serial_number, u.name AS technician_name
            FROM maintenance m
            LEFT JOIN assets a ON m.asset_id = a.asset_id
            LEFT JOIN users u  ON m.technician_id = u.user_id
            WHERE m.asset_id = ?
            ORDER BY m.maintenance_date DESC
        `;
        res.status(200).json(await q(sql, [req.params.asset_id]));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/maintenance
router.get("/", authenticate, async (req, res) => {
    try {
        const { status, asset_id } = req.query;
        let sql = `SELECT m.*, a.asset_name, a.serial_number, a.location, u.name AS technician_name,
                          rp.name AS employee_name, rp.user_id AS reporter_user_id,
                          (SELECT COUNT(*) FROM maintenance_materials mm WHERE mm.maintenance_id = m.maintenance_id) AS materials_count,
                          (SELECT COALESCE(SUM(mm.total_cost),0) FROM maintenance_materials mm WHERE mm.maintenance_id = m.maintenance_id) AS materials_total_cost
                   FROM maintenance m
                   LEFT JOIN assets a ON m.asset_id    = a.asset_id
                   LEFT JOIN users u  ON m.technician_id = u.user_id
                   LEFT JOIN users rp ON m.reported_by   = rp.user_id
                   WHERE 1=1`;
        const params = [];
        if (status)   { sql += " AND m.status=?";   params.push(status); }
        if (asset_id) { sql += " AND m.asset_id=?"; params.push(asset_id); }
        sql += " ORDER BY m.maintenance_date DESC";
        res.status(200).json(await q(sql, params));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/maintenance/pending-confirmation
// Employee-facing: completed maintenance records for assets currently
// assigned (Active) to the logged-in employee that the employee has NOT
// yet confirmed receiving. Drives the "Confirm Received" action shown
// after the maintenance completion notification. Must be declared before
// the generic /:id routes so "pending-confirmation" is not captured as an id.
router.get("/pending-confirmation", authenticate, async (req, res) => {
    try {
        const rows = await q(
            `SELECT m.maintenance_id, m.asset_id, m.maintenance_date, m.status,
                    m.employee_confirmed_at, a.asset_name, a.serial_number
             FROM maintenance m
             INNER JOIN assignments asg
                     ON asg.asset_id = m.asset_id
                    AND asg.user_id = ?
                    AND asg.status = 'Active'
             LEFT JOIN assets a ON m.asset_id = a.asset_id
             WHERE m.status = 'Completed'
               AND m.employee_confirmed_at IS NULL
             ORDER BY m.maintenance_date DESC`,
            [req.user.user_id]
        );
        res.status(200).json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/maintenance/:id/materials
router.get("/:id/materials", authenticate, async (req, res) => {
    try {
        const rows = await q(
            "SELECT * FROM maintenance_materials WHERE maintenance_id=? ORDER BY material_id ASC",
            [req.params.id]
        );
        res.status(200).json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/maintenance/:id
router.get("/:id", authenticate, async (req, res) => {
    try {
        const rows = await q(
            `SELECT m.*, a.asset_name, a.serial_number, u.name AS technician_name,
                    rp.name AS employee_name
             FROM maintenance m
             LEFT JOIN assets a ON m.asset_id=a.asset_id
             LEFT JOIN users u  ON m.technician_id=u.user_id
             LEFT JOIN users rp ON m.reported_by=rp.user_id
             WHERE m.maintenance_id=?`, [req.params.id]
        );
        if (!rows.length) return res.status(404).json({ error: "Record not found." });
        const materials = await q(
            "SELECT * FROM maintenance_materials WHERE maintenance_id=? ORDER BY material_id ASC",
            [req.params.id]
        );
        res.status(200).json({ ...rows[0], materials });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/maintenance/:id/confirm-receipt
// Employee confirms/acknowledges receiving their repaired asset back
// after maintenance is completed. Only the employee the asset is currently
// assigned to (Active assignment) may confirm, and only when the
// maintenance record is Completed. Idempotent: a second confirmation does
// not overwrite the original timestamp.
router.put("/:id/confirm-receipt", authenticate, async (req, res) => {
    try {
        const maintenanceId = Number(req.params.id);
        if (!maintenanceId || isNaN(maintenanceId))
            return res.status(400).json({ error: "Valid maintenance ID is required." });

        const rows = await q(
            `SELECT m.maintenance_id, m.asset_id, m.status, m.employee_confirmed_at,
                    a.asset_name, a.serial_number
             FROM maintenance m
             LEFT JOIN assets a ON m.asset_id = a.asset_id
             WHERE m.maintenance_id = ?`,
            [maintenanceId]
        );
        if (!rows.length)
            return res.status(404).json({ error: "Maintenance record not found." });

        const record = rows[0];
        if (String(record.status || "").toLowerCase() !== "completed")
            return res.status(400).json({ error: "This maintenance record is not completed yet." });

        const assign = await q(
            "SELECT assignment_id FROM assignments WHERE asset_id=? AND user_id=? AND status='Active' LIMIT 1",
            [record.asset_id, req.user.user_id]
        );
        if (!assign.length)
            return res.status(403).json({ error: "This repaired asset is not assigned to you." });

        if (record.employee_confirmed_at) {
            await logAudit(req, "CONFIRM_MAINTENANCE_RECEIPT", "maintenance", maintenanceId, { asset_id: record.asset_id, repeat: true });
            return res.status(200).json({
                already_confirmed: true,
                message: "Asset receipt already confirmed.",
                maintenance_id: maintenanceId,
                asset_name: record.asset_name,
                employee_confirmed_at: record.employee_confirmed_at
            });
        }

        await q(
            "UPDATE maintenance SET employee_confirmed_at = NOW() WHERE maintenance_id = ?",
            [maintenanceId]
        );

        await logAudit(req, "CONFIRM_MAINTENANCE_RECEIPT", "maintenance", maintenanceId, { asset_id: record.asset_id });

        res.status(200).json({
            already_confirmed: false,
            message: "Asset receipt confirmed.",
            maintenance_id: maintenanceId,
            asset_name: record.asset_name,
            employee_confirmed_at: new Date()
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/maintenance/report
// Any authenticated employee can report a problem.
// It is created Under Inspection and assigned to the
// maintenance team to inspect and repair.
router.post("/report", authenticate, async (req, res) => {
    try {
        const { asset_id, issue_type, description, priority, problem_record } = req.body;
        if (!asset_id || !description)
            return res.status(400).json({ error: "Asset ID and description are required." });

        const asset = await q("SELECT asset_name FROM assets WHERE asset_id=?", [asset_id]);
        if (!asset.length) return res.status(404).json({ error: "Asset not found." });

        const fullDescription = `[${issue_type || "Problem"}, Priority: ${priority || "Medium"}] ${description}`;

        const result = await q(
            `INSERT INTO maintenance 
             (asset_id, maintenance_date, description, status, technician_id, reported_by, problem_record, created_at)
             VALUES (?,?,?, 'Under Inspection', NULL, ?, ?, NOW())`,
            [asset_id, new Date(), fullDescription, req.user.user_id, problem_record || null]
        );

        const officers = await q("SELECT user_id FROM users WHERE role IN ('maintenance_officer','admin')");
        for (const o of officers) {
            await NotificationModel.create({
                user_id: o.user_id,
                title: "New Problem Report",
                message: `Asset "${asset[0].asset_name}" reported: ${fullDescription}`,
                type: "warning"
            });
        }

        const managers = await q("SELECT user_id FROM users WHERE role = 'manager'");
        for (const m of managers) {
            await NotificationModel.create({
                user_id: m.user_id,
                title: "New Problem Report",
                message: `Asset "${asset[0].asset_name}" needs attention: ${fullDescription}`,
                type: "warning"
            });
        }

        await logAudit(req, "CREATE_MAINTENANCE", "maintenance", result.insertId, { asset_id, report: "from_employee" });

        res.status(201).json({ message: "Problem reported. Maintenance team has been notified.", maintenance_id: result.insertId });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/maintenance
router.post("/", authenticate, isMaintenance, async (req, res) => {
    try {
        const {
            asset_id, description, status, cost, maintenance_date, technician_id,
            maintenance_type, next_maintenance_date, notes, problem_record,
            inspection_result, repair_requirements, repair_keyword
        } = req.body;
        if (!asset_id || !description)
            return res.status(400).json({ error: "Asset ID and description are required." });

        const asset = await q("SELECT asset_name, status FROM assets WHERE asset_id=?", [asset_id]);
        if (!asset.length) return res.status(404).json({ error: "Asset not found." });

        const techId = technician_id || req.user.user_id;

        const result = await q(
            `INSERT INTO maintenance 
             (asset_id, maintenance_date, description, problem_record, inspection_result, repair_requirements,
              repair_keyword, status, cost, technician_id, maintenance_type, next_maintenance_date, notes, created_at)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,NOW())`,
            [
                asset_id,
                maintenance_date || new Date(),
                description,
                problem_record || null,
                inspection_result || null,
                repair_requirements || null,
                repair_keyword || null,
                status || "Under Inspection",
                cost || null,
                techId,
                maintenance_type || "Preventive",
                next_maintenance_date || null,
                notes || null
            ]
        );

        if (["In Progress", "Under Inspection", "Pending Repair", "Beyond Repair"].includes(status)) {
            // Bin Card OUT when a store-held asset leaves for maintenance.
            await recordMaintenanceOut(asset_id, result.insertId, asset[0].asset_name, req.user.user_id, asset[0].status);
            let target = "Under Maintenance";
            if (status === "Beyond Repair") target = "Under Maintenance";
            await q("UPDATE assets SET status=? WHERE asset_id=?", [target, asset_id]);
        }

        await logAudit(req, "CREATE_MAINTENANCE", "maintenance", result.insertId, { asset_id, status: status || "Under Inspection" });
        await NotificationModel.create({
            user_id: techId,
            title: "Maintenance Task Created",
            message: `Maintenance created for asset "${asset[0].asset_name}": ${description}`,
            type: "warning"
        });

        res.status(201).json({ message: "Maintenance record created.", maintenance_id: result.insertId });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/maintenance/:id
router.put("/:id", authenticate, isMaintenance, async (req, res) => {
    try {
        const {
            maintenance_date, description, status, cost, technician_id, maintenance_type,
            next_maintenance_date, notes, problem_record, inspection_result,
            repair_requirements, repair_keyword, recommended_disposal,
            disposal_recommendation, materials_summary, materials
        } = req.body;

        const current = await q(
            `SELECT m.*, a.asset_name, a.status AS asset_status, u.name AS reporter_name, u.user_id AS reporter_id
             FROM maintenance m
             LEFT JOIN assets a ON m.asset_id = a.asset_id
             LEFT JOIN users u  ON m.reported_by = u.user_id
             WHERE m.maintenance_id=?`,
            [req.params.id]
        );
        if (!current.length) return res.status(404).json({ error: "Record not found." });
        const record = current[0];
        const assetId = record.asset_id;

        await q(
            `UPDATE maintenance 
             SET maintenance_date=?, description=?, problem_record=?, inspection_result=?,
                 repair_requirements=?, repair_keyword=?, status=?, cost=?, technician_id=?,
                 maintenance_type=?, next_maintenance_date=?, notes=?,
                 recommended_disposal=?, disposal_recommendation=?, materials_summary=?
             WHERE maintenance_id=?`,
            [
                maintenance_date || new Date(),
                description,
                problem_record !== undefined ? problem_record : record.problem_record,
                inspection_result !== undefined ? inspection_result : record.inspection_result,
                repair_requirements !== undefined ? repair_requirements : record.repair_requirements,
                repair_keyword !== undefined ? repair_keyword : record.repair_keyword,
                status || record.status,
                cost !== undefined ? cost : record.cost,
                technician_id || record.technician_id,
                maintenance_type || record.maintenance_type,
                next_maintenance_date !== undefined ? next_maintenance_date : record.next_maintenance_date,
                notes !== undefined ? notes : record.notes,
                recommended_disposal !== undefined ? (recommended_disposal ? 1 : 0) : record.recommended_disposal,
                disposal_recommendation !== undefined ? disposal_recommendation : record.disposal_recommendation,
                materials_summary !== undefined ? materials_summary : record.materials_summary,
                req.params.id
            ]
        );

        // Replace materials if provided
        if (Array.isArray(materials)) {
            await q("DELETE FROM maintenance_materials WHERE maintenance_id=?", [req.params.id]);
            for (const m of materials) {
                if (m && m.material_name && m.material_name.trim()) {
                    const qty = Number(m.quantity) || 0;
                    const unitCost = Number(m.unit_cost) || 0;
                    await q(
                        `INSERT INTO maintenance_materials (maintenance_id, material_name, quantity, unit, unit_cost, total_cost)
                         VALUES (?,?,?,?,?,?)`,
                        [req.params.id, m.material_name.trim(), qty, m.unit || null, unitCost, qty * unitCost]
                    );
                }
            }
        }

        let statusChangedTo = null;
        const ns = status || record.status;
        if (["In Progress", "Under Inspection", "Pending Repair", "Beyond Repair"].includes(ns)) {
            statusChangedTo = ns;
            // Bin Card OUT when a store-held asset leaves for maintenance.
            await recordMaintenanceOut(assetId, req.params.id, record.asset_name, req.user.user_id, record.asset_status);
            await q("UPDATE assets SET status='Under Maintenance' WHERE asset_id=?", [assetId]);
        } else if (ns === "Completed") {
            if (String(record.status || "").toLowerCase() === "completed") {
                return res.status(400).json({ error: "This maintenance record is already completed." });
            }
            statusChangedTo = "Completed";
            await q(
                "UPDATE maintenance SET status='Completed' WHERE maintenance_id=?",
                [req.params.id]
            );

            if (!recommended_disposal) {
                const prevCondition = String(record.asset_condition || "").trim();
                const finalCondition =
                    String(prevCondition).toLowerCase() !== "good"
                        ? "Good"
                        : prevCondition;

                // A repaired asset that was assigned to an employee MUST
                // return to that same employee - NOT to the store. The
                // existing assignment stays Active, the employee is notified,
                // and no Bin Card movement is recorded (the asset never
                // entered the store).
                const activeAssign = await q(
                    "SELECT assignment_id, user_id FROM assignments WHERE asset_id=? AND status='Active' LIMIT 1",
                    [assetId]
                );

                if (activeAssign.length) {
                    await q(
                        "UPDATE assets SET status = 'Assigned', asset_condition = ? WHERE asset_id = ?",
                        [finalCondition, assetId]
                    );

                    await AssetHistoryModel.create({
                        asset_id: assetId,
                        user_id: req.user.user_id,
                        action: "MAINTENANCE_RETURNED_TO_EMPLOYEE",
                        previous_value: { status: "Under Maintenance", assignment_status: "Active" },
                        new_value: { status: "Assigned", assignment_status: "Active", asset_condition: finalCondition },
                        description:
                            `Asset "${record.asset_name}" repaired and returned to its assigned employee ` +
                            `(maintenance #${req.params.id}).`
                    });

                    await NotificationModel.create({
                        user_id: activeAssign[0].user_id,
                        title: "Repaired Asset Returned To You",
                        message:
                            `The repaired asset "${record.asset_name}" has been returned to you. ` +
                            `You can continue using it as normal.`,
                        type: "success"
                    });
                } else {
                    // Returning the repaired asset to store. Guard against
                    // duplicate execution so the same repair cannot be
                    // returned to store twice (matching return-to-store).
                    const alreadyReturned = await q(
                        `SELECT transaction_id FROM bin_card_transactions
                         WHERE reference_type = 'MAINTENANCE_RETURN' AND reference_id = ?`,
                        [req.params.id]
                    );

                    if (!alreadyReturned.length) {
                        // Asset is no longer in maintenance: back in the Store as Available.
                        await q(
                            "UPDATE assets SET status = 'Available', location = 'Store', asset_condition = ? WHERE asset_id = ?",
                            [finalCondition, assetId]
                        );

                        // The employee no longer holds the asset once it is back in
                        // store: close any active assignment.
                        await q(
                            "UPDATE assignments SET status='Returned' WHERE asset_id=? AND status='Active'",
                            [assetId]
                        );

                        // Bin Card IN +1: record the physical return of the repaired
                        // asset to store.
                        await q(
                            `INSERT INTO bin_card_transactions
                             (asset_id, transaction_type, quantity, reference_type, reference_id,
                              receipt_number, employee_id, performed_by, notes, transaction_date)
                             VALUES (?, 'IN', 1, 'MAINTENANCE_RETURN', ?, NULL, NULL, ?, ?, NOW())`,
                            [
                                assetId,
                                req.params.id,
                                req.user.user_id,
                                `Asset "${record.asset_name}" repaired and returned to store (maintenance #${req.params.id}).`
                            ]
                        );

                        await AssetHistoryModel.create({
                            asset_id: assetId,
                            user_id: req.user.user_id,
                            action: "RETURN_TO_STORE",
                            previous_value: { status: "Under Maintenance", asset_condition: record.asset_condition },
                            new_value: { status: "Available", asset_condition: finalCondition, location: "Store" },
                            description:
                                `Asset "${record.asset_name}" repaired and returned to store ` +
                                `(maintenance #${req.params.id}).`
                        });

                        // Notify asset officers that the repaired asset is back in store.
                        const officers = await q(
                            "SELECT user_id FROM users WHERE role IN ('asset_officer','admin')"
                        );
                        for (const o of officers) {
                            await NotificationModel.create({
                                user_id: o.user_id,
                                title: "Repaired Asset Returned to Store",
                                message:
                                    `Asset "${record.asset_name}" (maintenance #${req.params.id}) was repaired ` +
                                    `and is now available in store.`,
                                type: "success"
                            });
                        }
                    }
                }
            }
        } else if (ns === "Cancelled") {
            statusChangedTo = "Cancelled";
            await q("UPDATE assets SET status='Available' WHERE asset_id=?", [assetId]);
        }

        // Notify relevant users on meaningful status transitions
        if (statusChangedTo === "In Progress") {
            const managers = await q("SELECT user_id FROM users WHERE role = 'manager'");
            for (const m of managers) {
                await NotificationModel.create({
                    user_id: m.user_id,
                    title: "Maintenance In Progress",
                    message:
                        `Maintenance has started for asset "${record.asset_name}": ` +
                        `${description || "Repair in progress"}.`,
                    type: "info"
                });
            }
            if (record.reporter_id) {
                await NotificationModel.create({
                    user_id: record.reporter_id,
                    title: "Repair Started",
                    message: `The repair for asset "${record.asset_name}" has started.`,
                    type: "info"
                });
            }
        } else if (statusChangedTo === "Beyond Repair") {
            // Notify managers and asset officers that the asset may need disposal
            const recipients = await q(
                "SELECT user_id FROM users WHERE role IN ('manager','asset_officer','admin')"
            );
            for (const r of recipients) {
                await NotificationModel.create({
                    user_id: r.user_id,
                    title: "Asset Beyond Repair",
                    message:
                        `Asset "${record.asset_name}" has been assessed as beyond repair. ` +
                        `Consider recommending disposal.`,
                    type: "warning"
                });
            }
        } else if (statusChangedTo === "Completed") {
            const officers = await q(
                "SELECT user_id FROM users WHERE role IN ('manager','asset_officer','admin')"
            );
            for (const o of officers) {
                await NotificationModel.create({
                    user_id: o.user_id,
                    title: "Maintenance Completed",
                    message:
                        `Maintenance for asset "${record.asset_name}" is complete.` +
                        (notes ? ` Notes: ${notes}` : ""),
                    type: "success"
                });
            }
            if (record.reporter_id) {
                await NotificationModel.create({
                    user_id: record.reporter_id,
                    title: "Repair Completed",
                    message: `The repair for asset "${record.asset_name}" is complete.`,
                    type: "success"
                });
            }
        } else if (statusChangedTo === "Pending Repair") {
            const techs = await q("SELECT user_id FROM users WHERE role IN ('maintenance_officer','admin')");
            for (const t of techs) {
                await NotificationModel.create({
                    user_id: t.user_id,
                    title: "Maintenance Pending Repair",
                    message: `Asset "${record.asset_name}" is awaiting repair.`,
                    type: "info"
                });
            }
        }

        await logAudit(req, "UPDATE_MAINTENANCE", "maintenance", req.params.id, { new_status: status });

        res.status(200).json({ message: "Maintenance updated." });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/maintenance/:id
router.delete("/:id", authenticate, isMaintenance, async (req, res) => {
    try {
        const result = await q("DELETE FROM maintenance WHERE maintenance_id=?", [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: "Record not found." });
        await logAudit(req, "DELETE_MAINTENANCE", "maintenance", req.params.id);
        res.status(200).json({ message: "Maintenance record deleted." });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/maintenance/:id/return-to-store
// Manager (or maintenance officer) finalizes a repair by
// returning the asset to the store: status -> Available,
// condition restored to Good, maintenance record completed,
// and a permanent asset-history entry is written so the
// service history is kept.
router.put(
    "/:id/return-to-store",
    authenticate,
    authorize("admin", "manager", "asset_officer"),
    async (req, res) => {
        try {
            const id = Number(req.params.id);
            if (!id || isNaN(id))
                return res.status(400).json({ error: "Valid maintenance ID is required." });

            const rows = await q(
                `SELECT m.*, a.asset_name, a.asset_condition AS prev_condition
                 FROM maintenance m
                 LEFT JOIN assets a ON m.asset_id = a.asset_id
                 WHERE m.maintenance_id = ?`,
                [id]
            );

            if (!rows.length)
                return res.status(404).json({ error: "Maintenance record not found." });

            const record = rows[0];

            // Prevent duplicate / re-execution: if maintenance is already completed
            // and the asset already returned to store, reject the call.
            const alreadyReturned = await q(
                `SELECT transaction_id FROM bin_card_transactions
                 WHERE reference_type = 'MAINTENANCE_RETURN' AND reference_id = ?`,
                [id]
            );

            if (
                alreadyReturned.length ||
                String(record.status || "").toLowerCase() === "completed"
            ) {
                return res.status(409).json({
                    error: "This maintenance record has already been completed and the asset returned to store."
                });
            }

            if (record.recommended_disposal)
                return res.status(400).json({
                    error: "This asset is recommended for disposal. It cannot be returned to store."
                });

            // Update asset back to the store as Available with restored condition,
            // but preserve the asset's condition if it was already in good health.
            const finalCondition =
                String(record.prev_condition || "")
                    .trim()
                    .toLowerCase() !== "good"
                    ? "Good"
                    : record.prev_condition;

            const nq = (sql, params = []) =>
                new Promise((res2, rej2) =>
                    db.query(sql, params, (e, r) => (e ? rej2(e) : res2(r)))
                );

            // A repaired asset that is currently assigned to an employee must
            // return to that same employee, not to the store. The active
            // assignment is preserved.
            const activeAssign = await nq(
                "SELECT assignment_id, user_id FROM assignments WHERE asset_id=? AND status='Active' LIMIT 1",
                [record.asset_id]
            );

            if (activeAssign.length) {
                await nq(
                    `UPDATE maintenance 
                     SET status = 'Completed', recommended_disposal = 0, disposal_recommendation = NULL
                     WHERE maintenance_id = ?`,
                    [id]
                );

                await nq(
                    "UPDATE assets SET status = 'Assigned', asset_condition = ? WHERE asset_id = ?",
                    [finalCondition, record.asset_id]
                );

                await AssetHistoryModel.create({
                    asset_id: record.asset_id,
                    user_id: req.user.user_id,
                    action: "MAINTENANCE_RETURNED_TO_EMPLOYEE",
                    previous_value: { status: record.status, asset_condition: record.prev_condition },
                    new_value: { status: "Assigned", asset_condition: finalCondition, assignment_status: "Active" },
                    description:
                        `Asset "${record.asset_name}" repaired and returned to its assigned employee ` +
                        `(maintenance #${id}).`
                });

                await NotificationModel.create({
                    user_id: activeAssign[0].user_id,
                    title: "Repaired Asset Returned To You",
                    message:
                        `The repaired asset "${record.asset_name}" has been returned to you. ` +
                        `You can continue using it as normal.`,
                    type: "success"
                });

                await logAudit(
                    req,
                    "RETURN_TO_EMPLOYEE",
                    "maintenance",
                    id,
                    { asset_id: record.asset_id, status: "Assigned" }
                );

                return res.status(200).json({
                    success: true,
                    message:
                        "Repaired asset returned to its assigned employee and marked as Assigned. " +
                        "Maintenance history preserved."
                });
            }

            await nq(
                `UPDATE maintenance 
                 SET status = 'Completed', recommended_disposal = 0, disposal_recommendation = NULL
                 WHERE maintenance_id = ?`,
                [id]
            );

            await nq(
                "UPDATE assets SET status = 'Available', location = 'Store', asset_condition = ? WHERE asset_id = ?",
                [finalCondition, record.asset_id]
            );

            // Bin Card IN: record the physical return of the repaired asset to store.
            await q(
                `INSERT INTO bin_card_transactions
                 (asset_id, transaction_type, quantity, reference_type, reference_id,
                  receipt_number, employee_id, performed_by, notes, transaction_date)
                 VALUES (?, 'IN', 1, 'MAINTENANCE_RETURN', ?, NULL, NULL, ?, ?, NOW())`,
                [
                    record.asset_id,
                    id,
                    req.user.user_id,
                    `Asset "${record.asset_name}" repaired and returned to store (maintenance #${id}).`
                ]
            );

            await AssetHistoryModel.create({
                asset_id: record.asset_id,
                user_id: req.user.user_id,
                action: "RETURN_TO_STORE",
                previous_value: { status: record.status, asset_condition: record.prev_condition },
                new_value: { status: "Available", asset_condition: finalCondition },
                description:
                    `Asset "${record.asset_name}" repaired and returned to store ` +
                    `(maintenance #${id}).`
            });

            const officers = await q(
                "SELECT user_id FROM users WHERE role IN ('asset_officer','admin')"
            );
            for (const o of officers) {
                await NotificationModel.create({
                    user_id: o.user_id,
                    title: "Repaired Asset Returned to Store",
                    message:
                        `Asset "${record.asset_name}" (maintenance #${id}) was repaired ` +
                        `and is now available in store.`,
                    type: "success"
                });
            }

            await logAudit(
                req,
                "RETURN_TO_STORE",
                "maintenance",
                id,
                { asset_id: record.asset_id, status: "Available" }
            );

            res.status(200).json({
                success: true,
                message:
                    "Repaired asset returned to store and marked as Available. " +
                    "Maintenance history preserved."
            });
        } catch (err) {
            console.error("Return to store error:", err);
            res.status(500).json({ error: err.message });
        }
    }
);

// PUT /api/maintenance/:id/recommend-disposal
// Maintenance officer recommends that an asset (beyond repair)
// be disposed of. It marks the maintenance record as recommending
// disposal and notifies the Asset Officer, who is responsible for
// creating the formal Disposal Request (which triggers manager
// approval). It does NOT create the disposal or dispose the asset.
router.put("/:id/recommend-disposal", authenticate, isMaintenance, async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!id || isNaN(id))
            return res.status(400).json({ error: "Valid maintenance ID is required." });

        const rows = await q(
            `SELECT m.*, a.asset_name
             FROM maintenance m
             LEFT JOIN assets a ON m.asset_id = a.asset_id
             WHERE m.maintenance_id = ?`,
            [id]
        );
        if (!rows.length)
            return res.status(404).json({ error: "Maintenance record not found." });

        const record = rows[0];
        const recommendation = req.body.recommendation || "Asset assessed as beyond economical repair.";

        // Prevent re-recommending an asset that already holds an active
        // (pending/approved/completed) disposal request or recommendation.
        if (record.recommended_disposal) {
            return res.status(400).json({
                error:
                    "This maintenance record has already recommended disposal. " +
                    "The Asset Officer has been notified to create the Disposal Request."
            });
        }

        // Mark maintenance record as recommending disposal
        await q(
            `UPDATE maintenance 
             SET recommended_disposal = 1, disposal_recommendation = ?
             WHERE maintenance_id = ?`,
            [recommendation, id]
        );

        // Prevent creating a disposal recommendation if this asset already
        // holds an active (non-rejected) disposal record.
        const activeDisposals = await q(
            `SELECT disposal_id, status FROM disposals
             WHERE asset_id = ? AND status <> 'Rejected'
             LIMIT 1`,
            [record.asset_id]
        );

        let disposalId = null;
        if (activeDisposals.length) {
            // A disposal already exists (e.g. previously recommended but not
            // yet submitted, or already in the approval pipeline). Surface a
            // clear message and do NOT duplicate the recommendation.
            return res.status(400).json({
                error:
                    "This asset already has a disposal record (" +
                    activeDisposals[0].status +
                    "). The Asset Officer can proceed with it; a duplicate recommendation was not created."
            });
        }

        // Create the disposal recommendation that carries the asset onto the
        // Asset Officer's Disposal screen (status 'Recommended'). It is not
        // visible to managers until the Asset Officer submits it.
        const created =
            await DisposalModel.createRecommendation({
                asset_id: record.asset_id,
                reason: recommendation,
                source_maintenance_id: id
            });
        disposalId = created.insertId;

        // Hold the asset so it cannot be reassigned/transferred/requested
        // until the Asset Officer formally creates a Disposal Request.
        await q("UPDATE assets SET status = 'Pending Disposal' WHERE asset_id = ?", [record.asset_id]);

        await AssetHistoryModel.create({
            asset_id: record.asset_id,
            user_id: req.user.user_id,
            action: "DISPOSAL_RECOMMENDED",
            previous_value: { status: "Under Maintenance" },
            new_value: { status: "Pending Disposal" },
            description:
                `Asset "${record.asset_name}" recommended for disposal ` +
                `following maintenance #${id}: ${recommendation}`
        });

        // Notify Asset Officers: the recommended asset is waiting on their
        // Disposal page to be submitted for manager approval. No re-selection.
        const officers = await q(
            "SELECT user_id FROM users WHERE role IN ('asset_officer','admin')"
        );
        for (const o of officers) {
            await NotificationModel.create({
                user_id: o.user_id,
                title: "Disposal Recommended",
                message:
                    `Maintenance officer recommends disposal of asset "${record.asset_name}" ` +
                    `(maintenance #${id}). The asset is ready on your Disposal page; ` +
                    `review it and submit the Disposal Request for manager approval.`,
                type: "warning"
            });
        }

        await logAudit(req, "RECOMMEND_DISPOSAL", "maintenance", id, {
            asset_id: record.asset_id,
            disposal_id: disposalId,
            recommendation
        });

        res.status(200).json({
            success: true,
            disposal_id: disposalId,
            message:
                `Disposal recommended for asset "${record.asset_name}". ` +
                "The Asset Officer has been notified; the asset is ready on their Disposal page to submit."
        });
    } catch (err) {
        console.error("Recommend disposal error:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
