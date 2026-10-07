const TransferModel = require("../models/transferModel");
const AssetModel = require("../models/assetModel");
const NotificationModel = require("../models/notificationModel");
const AssetHistoryModel = require("../models/assetHistoryModel");
const db = require("../config/db");

const q = (sql, params = []) =>
    new Promise((res, rej) => db.query(sql, params, (e, r) => e ? rej(e) : res(r)));

const getAllTransfers = async (req, res) => {
    try {
        const filters = {};
        if (req.query.status) filters.status = req.query.status;

        if (req.user.role === "employee") {
            filters.employee_id = req.user.user_id;
        }

        const transfers = await TransferModel.getAll(filters);
        res.status(200).json(transfers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getTransferById = async (req, res) => {
    try {
        const transfer = await TransferModel.getById(req.params.id);
        if (!transfer) return res.status(404).json({ error: "Transfer record not found." });
        res.status(200).json(transfer);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// =====================================================
// GET /api/transfers/my-assets (Employee only)
// Returns ONLY assets the logged-in employee currently
// has an ACTIVE assignment for, join them with their
// CURRENT asset state, and exclude everything that is not
// transferable right now:
//   - assets not assigned to the authenticated employee
//   - returned / completed / closed assignments
//   - assets that are currently under maintenance
//   - disposed / pending disposal / lost assets
//   - store / unassigned assets
//   - assets already involved in a Pending/Approved transfer
// This uses the authenticated user's ID, never a client-
// supplied user id, so an employee can only ever see and
// transfer their own currently-held assets.
// =====================================================
const getMyTransferableAssets = async (req, res) => {
    try {
        const rows = await q(
            `SELECT a.assignment_id, a.user_id, a.asset_id, a.assignment_date,
                    u.name AS employee_name, u.department,
                    ast.asset_name, ast.serial_number, ast.status AS asset_status,
                    ast.asset_condition, ast.location,
                    c.category_name
             FROM assignments a
             JOIN assets ast ON a.asset_id = ast.asset_id
             LEFT JOIN users u ON a.user_id = u.user_id
             LEFT JOIN categories c ON ast.category_id = c.category_id
             WHERE a.user_id = ?
               AND a.status IN ('Active','Assigned')
               AND ast.status NOT IN ('Disposed','Pending Disposal','Lost')
               AND LOWER(COALESCE(ast.status,'')) <> 'under maintenance'
               AND NOT EXISTS (
                   SELECT 1 FROM transfers t
                   WHERE t.asset_id = a.asset_id
                     AND t.status IN ('Pending','Approved')
               )
             ORDER BY a.assignment_date DESC, a.assignment_id DESC`,
            [req.user.user_id]
        );

        res.status(200).json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// =====================================================
// CREATE TRANSFER REQUEST
// Employee, Admin, Manager, or Asset Officer
// Creates a Pending transfer. Does NOT modify assignments.
// =====================================================
const createTransfer = async (req, res) => {
    try {
        const { asset_id, to_user_id, reason, notes } = req.body;
        if (!asset_id) return res.status(400).json({ error: "Asset ID is required." });
        if (!to_user_id) return res.status(400).json({ error: "Target employee is required." });
        if (!reason || !reason.trim()) return res.status(400).json({ error: "Reason for transfer is required." });

        const asset = await AssetModel.getById(asset_id);
        if (!asset) return res.status(404).json({ error: "Asset not found." });

        if (asset.status === "Disposed")
            return res.status(400).json({ error: "Cannot transfer a disposed asset." });

        if (asset.status === "Lost")
            return res.status(400).json({ error: "Cannot transfer a lost asset." });

        if (asset.status === "Pending Disposal")
            return res.status(400).json({ error: "Cannot transfer an asset pending disposal." });

        // An asset is "currently under maintenance" only when its CURRENT status
        // says so. Historical/completed maintenance records do NOT mean the
        // asset is in maintenance right now, so we must not base this decision
        // on maintenance history. The maintenance module sets assets.status to
        // "Under Maintenance" when maintenance is in progress and clears it on
        // completion / return-to-store, so it is the authoritative field.
        if (String(asset.status || "").toLowerCase() === "under maintenance")
            return res.status(400).json({ error: "Asset is currently under maintenance and cannot be transferred." });

        // A transfer is already "in flight" for this asset if there is either a
        // Pending request waiting for approval OR an Approved one that has not
        // yet been handed over. Both must block a new request so the same asset
        // can never have two competing transfers.
        const inFlightTransfer = await q(
            "SELECT transfer_id FROM transfers WHERE asset_id=? AND status IN ('Pending','Approved') LIMIT 1",
            [asset_id]
        );
        if (inFlightTransfer.length)
            return res.status(400).json({ error: "This asset already has a transfer request in progress." });

        // The current holder is whoever has an open (Active or Assigned)
        // assignment for the asset - this matches exactly what the Transfer
        // page lists as "my transferable assets".
        const activeAssign = await q(
            "SELECT * FROM assignments WHERE asset_id=? AND status IN ('Active','Assigned') LIMIT 1",
            [asset_id]
        );
        const from_user_id = activeAssign.length ? activeAssign[0].user_id : null;

        if (req.user.role === "employee") {
            if (!from_user_id || from_user_id !== req.user.user_id)
                return res.status(403).json({ error: "You can only transfer assets currently assigned to you." });
        }

        // Resolve the target employee by numeric user_id OR by name
        const isNumericId = /^\d+$/.test(String(to_user_id).trim());
        let targetUser;
        if (isNumericId) {
            targetUser = await q(
                "SELECT user_id, name FROM users WHERE user_id=? AND role='employee' AND is_active=1 LIMIT 1",
                [parseInt(to_user_id)]
            );
        } else {
            targetUser = await q(
                "SELECT user_id, name FROM users WHERE LOWER(name)=LOWER(?) AND role='employee' AND is_active=1 LIMIT 1",
                [String(to_user_id).trim()]
            );
        }
        if (!targetUser.length)
            return res.status(404).json({ error: "Target employee not found or inactive." });

        const targetUserId = targetUser[0].user_id;

        if (from_user_id && from_user_id === targetUserId)
            return res.status(400).json({ error: "Cannot transfer an asset to the same employee." });

        const result = await TransferModel.create({
            asset_id,
            from_user_id,
            to_user_id: targetUserId,
            from_location: asset.location || null,
            to_location: null,
            reason: reason.trim(),
            transferred_by: req.user.user_id,
            notes: notes || null
        });

        await AssetHistoryModel.create({
            asset_id,
            user_id: req.user.user_id,
            action: "TRANSFER_REQUESTED",
            previous_value: { status: asset.status, assigned_to: from_user_id || null },
            new_value: { status: asset.status, transfer_to: targetUserId },
            description: `Transfer requested for asset "${asset.asset_name}" from ${req.user.name || `User #${req.user.user_id}`} to ${targetUser[0].name}. Awaiting review/approval.`
        });

        // Notify everyone who reviews transfer requests: managers (who approve)
        // and asset officers (who confirm the physical handover).
        const reviewers = await q(
            "SELECT user_id FROM users WHERE role IN ('manager','asset_officer') AND is_active = 1"
        );
        for (const reviewer of reviewers) {
            await NotificationModel.create({
                user_id: reviewer.user_id,
                title: "New Transfer Request",
                message: `New Transfer Request: ${req.user.name || `User #${req.user.user_id}`} requested to transfer ${asset.asset_name} ${asset.serial_number || ""} to ${targetUser[0].name}.`,
                type: "warning"
            });
        }

        res.status(201).json({
            message: "Transfer request submitted. Awaiting approval.",
            transfer_id: result.insertId
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// =====================================================
// ASSET OFFICER APPROVES TRANSFER REQUEST
// Pending → Approved. Records approving officer + date.
// Does NOT change the assigned employee. The physical
// handover must still be confirmed via completeTransfer.
// =====================================================
const approveTransfer = async (req, res) => {
    try {
        const { remarks } = req.body;
        const transfer = await TransferModel.getById(req.params.id);
        if (!transfer) return res.status(404).json({ error: "Transfer not found." });
        if (transfer.status !== "Pending")
            return res.status(400).json({ error: `Transfer is already ${transfer.status}.` });

        const asset = await AssetModel.getById(transfer.asset_id);
        if (!asset)
            return res.status(400).json({ error: "Asset no longer exists." });

        if (asset.status === "Disposed")
            return res.status(400).json({ error: "Asset has been disposed and cannot be transferred." });

        if (asset.status === "Pending Disposal")
            return res.status(400).json({ error: "Asset is pending disposal and cannot be transferred." });

        if (asset.status === "Lost")
            return res.status(400).json({ error: "Asset is lost and cannot be transferred." });

        // Use the asset's CURRENT state only - never maintenance history.
        // An asset that is under maintenance right now cannot be handed over.
        if (String(asset.status || "").toLowerCase() === "under maintenance")
            return res.status(400).json({ error: "Asset is currently under maintenance and cannot be transferred." });

        await TransferModel.approve(req.params.id, req.user.user_id, remarks);

        await AssetHistoryModel.create({
            asset_id: transfer.asset_id,
            user_id: req.user.user_id,
            action: "TRANSFER_APPROVED",
            previous_value: { transfer_status: "Pending", assigned_to: transfer.from_user_name },
            new_value: { transfer_status: "Approved", transfer_to: transfer.to_user_name },
            description: `Transfer request approved by ${req.user.name || `User #${req.user.user_id}`}. Awaiting handover from ${transfer.from_user_name || "current holder"} to ${transfer.to_user_name || "recipient"}.`
        });

        try {
            // Manager approval tells the ASSET OFFICER to physically hand the
            // asset over. It must NOT notify Employee B yet - B's "Transfer
            // Received" notification is created only when the handover is
            // actually completed (see completeTransfer).
            const officers = await q(
                "SELECT user_id FROM users WHERE role='asset_officer' AND is_active = 1"
            );
            for (const officer of officers) {
                await NotificationModel.create({
                    user_id: officer.user_id,
                    title: "Transfer Approved",
                    message: `Transfer approved. Please hand over the asset "${asset.asset_name}" to ${transfer.to_user_name || "the receiving employee"}.`,
                    type: "success"
                });
            }

            // Employee A (current holder) is informed the request was approved,
            // not instructed to perform the handover.
            if (transfer.from_user_id) {
                await NotificationModel.create({
                    user_id: transfer.from_user_id,
                    title: "Transfer Approved",
                    message: `Your transfer request for "${asset.asset_name}" to ${transfer.to_user_name || "the receiving employee"} has been approved. Please cooperate with the asset officer to complete the handover.`,
                    type: "info"
                });
            }
            if (transfer.transferred_by && transfer.transferred_by !== req.user.user_id && transfer.transferred_by !== transfer.from_user_id) {
                await NotificationModel.create({
                    user_id: transfer.transferred_by,
                    title: "Transfer Approved",
                    message: `Transfer of asset "${asset.asset_name}" was approved. Awaiting handover to ${transfer.to_user_name || "recipient"}.`,
                    type: "info"
                });
            }
        } catch (nErr) {
            console.error("Transfer approve notify error:", nErr.message);
        }

        res.status(200).json({ message: "Transfer request approved. Wait for the physical handover to be confirmed." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// =====================================================
// ASSET OFFICER COMPLETES TRANSFER (CONFIRMS HANDOVER)
// Approved → Completed. Reassigns the asset from the
// current employee to the receiving employee, marks the
// asset as Assigned, records history, and notifies both
// employees. Unauthorized users cannot do this.
// =====================================================
const completeTransfer = async (req, res) => {
    try {
        const transfer = await TransferModel.getById(req.params.id);
        if (!transfer) return res.status(404).json({ error: "Transfer not found." });
        if (transfer.status !== "Approved")
            return res.status(400).json({ error: `Only approved transfers can be completed. Current status: ${transfer.status}.` });

        const asset = await AssetModel.getById(transfer.asset_id);
        if (!asset)
            return res.status(400).json({ error: "Asset no longer exists." });

        // Guard the physical handover against the asset's CURRENT state.
        // If the asset went into maintenance (or was disposed/lost) after
        // approval, the handover cannot be completed until it is repaired
        // and returned - history does not block, current state does.
        if (asset.status === "Disposed" || asset.status === "Pending Disposal" || asset.status === "Lost")
            return res.status(400).json({ error: "Asset is no longer transferable." });

        if (String(asset.status || "").toLowerCase() === "under maintenance")
            return res.status(400).json({ error: "Asset is currently under maintenance and cannot be transferred until it is repaired and returned." });

        const connection = db;
        await new Promise((resolve, reject) => {
            connection.beginTransaction((err) => {
                if (err) return reject(err);
                const rollback = () => {
                    connection.rollback(() => reject(new Error("Transaction failed")));
                };
                connection.query(
                    "SELECT assignment_id FROM assignments WHERE asset_id=? AND status IN ('Active','Assigned') LIMIT 1",
                    [transfer.asset_id],
                    (e, oldAssign) => {
                        if (e) return rollback();
                        const closeOld = (cb) => {
                            if (oldAssign.length) {
                                connection.query(
                                    "UPDATE assignments SET status='Returned' WHERE assignment_id=?",
                                    [oldAssign[0].assignment_id],
                                    (e2) => e2 ? rollback() : cb()
                                );
                            } else {
                                cb();
                            }
                        };
                        closeOld(() => {
                            connection.query(
                                `INSERT INTO assignments
                                 (user_id, asset_id, assignment_date, assigned_by, status, notes, expected_return_date)
                                 VALUES (?, ?, NOW(), ?, 'Active', ?, NULL)`,
                                [
                                    transfer.to_user_id,
                                    transfer.asset_id,
                                    req.user.user_id,
                                    `Transferred from ${transfer.from_user_name || "previous holder"} to ${transfer.to_user_name || "recipient"}.`
                                ],
                                (e3) => {
                                    if (e3) return rollback();
                                    connection.query(
                                        "UPDATE assets SET status='Assigned' WHERE asset_id=?",
                                        [transfer.asset_id],
                                        (e4) => {
                                            if (e4) return rollback();
                                            connection.query(
                                                "UPDATE transfers SET status='Completed', completed_at=NOW() WHERE transfer_id=?",
                                                [transfer.transfer_id],
                                                (e5) => {
                                                    if (e5) return rollback();
                                                    connection.commit((e6) => {
                                                        if (e6) return rollback();
                                                        resolve();
                                                    });
                                                }
                                            );
                                        }
                                    );
                                }
                            );
                        });
                    }
                );
            });
        });

        await AssetHistoryModel.create({
            asset_id: transfer.asset_id,
            user_id: req.user.user_id,
            action: "TRANSFER_COMPLETED",
            previous_value: { assigned_to: transfer.from_user_name || null, assignment_status: "Active" },
            new_value: { assigned_to: transfer.to_user_name || null, assignment_status: "Active", asset_status: "Assigned" },
            description: `Handover confirmed. Asset transferred from ${transfer.from_user_name || "Unassigned"} to ${transfer.to_user_name || "Unassigned"} by asset officer ${req.user.name || `User #${req.user.user_id}`}.`
        });

        try {
            // Employee B receives the "Transfer Received" notification ONLY
            // now, when the handover has actually been completed.
            if (transfer.to_user_id) {
                await NotificationModel.create({
                    user_id: transfer.to_user_id,
                    title: "Transfer Received",
                    message: `Transfer Received — The asset "${asset.asset_name}" has been transferred to you. You can now see it in My Assets.`,
                    type: "success"
                });
            }
            if (transfer.from_user_id) {
                await NotificationModel.create({
                    user_id: transfer.from_user_id,
                    title: "Transfer Completed",
                    message: `Asset "${asset.asset_name}" has been transferred successfully to ${transfer.to_user_name || "the receiving employee"}. It is no longer assigned to you.`,
                    type: "info"
                });
            }
            if (transfer.transferred_by && transfer.transferred_by !== transfer.to_user_id && transfer.transferred_by !== transfer.from_user_id) {
                await NotificationModel.create({
                    user_id: transfer.transferred_by,
                    title: "Transfer Completed",
                    message: `Transfer of asset "${asset.asset_name}" from ${transfer.from_user_name || "N/A"} to ${transfer.to_user_name || "N/A"} has been completed.`,
                    type: "success"
                });
            }
        } catch (nErr) {
            console.error("Transfer complete notify error:", nErr.message);
        }

        res.status(200).json({ message: "Transfer completed. Asset has been reassigned to the receiving employee." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// =====================================================
// ASSET OFFICER REJECTS TRANSFER
// No assignment changes. Asset remains with original employee.
// =====================================================
const rejectTransfer = async (req, res) => {
    try {
        const { rejection_reason } = req.body;
        const transfer = await TransferModel.getById(req.params.id);
        if (!transfer) return res.status(404).json({ error: "Transfer not found." });
        if (transfer.status !== "Pending")
            return res.status(400).json({ error: `Transfer is already ${transfer.status}.` });

        await TransferModel.reject(req.params.id, req.user.user_id, rejection_reason);

        await AssetHistoryModel.create({
            asset_id: transfer.asset_id,
            user_id: req.user.user_id,
            action: "TRANSFER_REJECTED",
            previous_value: { transfer_status: "Pending" },
            new_value: { transfer_status: "Rejected" },
            description: `Transfer request rejected by ${req.user.name || `User #${req.user.user_id}`}. ${rejection_reason || ""}`
        });

        try {
            if (transfer.transferred_by) {
                await NotificationModel.create({
                    user_id: transfer.transferred_by,
                    title: "Transfer Rejected",
                    message: `Transfer request for asset "${transfer.asset_name}" has been rejected. ${rejection_reason || ""}`,
                    type: "danger"
                });
            }
            if (transfer.from_user_id) {
                await NotificationModel.create({
                    user_id: transfer.from_user_id,
                    title: "Asset Transfer Rejected",
                    message: `Transfer of asset "${transfer.asset_name}" was rejected. Asset remains assigned to you. ${rejection_reason || ""}`,
                    type: "danger"
                });
            }
        } catch (nErr) {
            console.error("Transfer reject notify error:", nErr.message);
        }

        res.status(200).json({ message: "Transfer rejected." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// =====================================================
// EMPLOYEE CANCELS THEIR OWN TRANSFER REQUEST
// =====================================================
const cancelTransfer = async (req, res) => {
    try {
        const transfer = await TransferModel.getById(req.params.id);
        if (!transfer) return res.status(404).json({ error: "Transfer not found." });
        if (transfer.status !== "Pending")
            return res.status(400).json({ error: `Transfer is already ${transfer.status}.` });

        if (transfer.transferred_by !== req.user.user_id)
            return res.status(403).json({ error: "You can only cancel transfers you created." });

        await TransferModel.cancel(req.params.id);

        await AssetHistoryModel.create({
            asset_id: transfer.asset_id,
            user_id: req.user.user_id,
            action: "TRANSFER_CANCELLED",
            previous_value: { transfer_status: "Pending" },
            new_value: { transfer_status: "Cancelled" },
            description: `Transfer request cancelled by creator.`
        });

        res.status(200).json({ message: "Transfer cancelled." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const deleteTransfer = async (req, res) => {
    try {
        const transfer = await TransferModel.getById(req.params.id);
        if (!transfer) return res.status(404).json({ error: "Transfer record not found." });
        if (transfer.status === "Completed")
            return res.status(400).json({ error: "Cannot delete a completed transfer." });

        const result = await TransferModel.delete(req.params.id);
        if (result.affectedRows === 0) return res.status(404).json({ error: "Transfer record not found." });
        res.status(200).json({ message: "Transfer record deleted." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    getAllTransfers,
    getTransferById,
    getMyTransferableAssets,
    createTransfer,
    approveTransfer,
    completeTransfer,
    rejectTransfer,
    cancelTransfer,
    deleteTransfer
};
