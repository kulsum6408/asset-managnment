const DisposalModel = require("../models/disposalModel");
const AssetModel = require("../models/assetModel");
const NotificationModel = require("../models/notificationModel");
const BinCardModel = require("../models/binCardModel");
const AssetHistoryModel = require("../models/assetHistoryModel");
const db = require("../config/db");

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

// ============================================================
// Helper: notify a specific role group
// ============================================================
const notifyRole = async (role, title, message, type = "info") => {
    const users = await q(
        "SELECT user_id FROM users WHERE role = ?",
        [role]
    );

    for (const user of users) {
        await NotificationModel.create({
            user_id: user.user_id,
            title,
            message,
            type,
        });
    }
};

// ============================================================
// GET ALL DISPOSALS
// GET /api/disposals
// ============================================================
const getAllDisposals = async (req, res) => {
    try {
        const disposals = await DisposalModel.getAll();

        res.status(200).json({
            success: true,
            count: disposals.length,
            data: disposals
        });
    } catch (error) {
        console.error("Get all disposals error:", error);

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// ============================================================
// GET PENDING DISPOSALS
// GET /api/disposals/pending
// ============================================================
const getPendingDisposals = async (req, res) => {
    try {
        const disposals = await DisposalModel.getPending();

        res.status(200).json({
            success: true,
            count: disposals.length,
            data: disposals
        });
    } catch (error) {
        console.error("Get pending disposals error:", error);

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// ============================================================
// GET DISPOSAL BY ID
// GET /api/disposals/:id
// ============================================================
const getDisposalById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(Number(id))) {
            return res.status(400).json({
                success: false,
                error: "Valid disposal ID is required."
            });
        }

        const disposal = await DisposalModel.getById(id);

        if (!disposal) {
            return res.status(404).json({
                success: false,
                error: "Disposal record not found."
            });
        }

        res.status(200).json({
            success: true,
            data: disposal
        });
    } catch (error) {
        console.error("Get disposal by ID error:", error);

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// ============================================================
// GET DISPOSALS BY ASSET
// GET /api/disposals/asset/:assetId
// ============================================================
const getDisposalsByAsset = async (req, res) => {
    try {
        const { assetId } = req.params;

        if (!assetId || isNaN(Number(assetId))) {
            return res.status(400).json({
                success: false,
                error: "Valid asset ID is required."
            });
        }

        const disposals =
            await DisposalModel.getByAssetId(assetId);

        res.status(200).json({
            success: true,
            count: disposals.length,
            data: disposals
        });
    } catch (error) {
        console.error(
            "Get disposals by asset error:",
            error
        );

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// ============================================================
// CREATE DISPOSAL REQUEST
// POST /api/disposals
// Asset Officer creates a Disposal Request (Pending). The asset is
// NOT marked disposed until manager approval and physical completion.
// ============================================================
const createDisposal = async (req, res) => {
    try {
        const {
            asset_id,
            disposal_date,
            reason
        } = req.body;

        if (typeof req.user === "undefined") {
            return res.status(401).json({
                success: false,
                error: "Authentication required."
            });
        }

        const requesterId = req.user.user_id;

        // ----------------------------------------------------
        // VALIDATE ASSET
        // ----------------------------------------------------
        if (!asset_id || isNaN(Number(asset_id))) {
            return res.status(400).json({
                success: false,
                error: "Valid asset ID is required."
            });
        }

        // ----------------------------------------------------
        // VALIDATE DATE
        // ----------------------------------------------------
        if (!disposal_date) {
            return res.status(400).json({
                success: false,
                error: "Disposal date is required."
            });
        }

        // ----------------------------------------------------
        // VALIDATE REASON
        // ----------------------------------------------------
        if (!reason || reason.trim() === "") {
            return res.status(400).json({
                success: false,
                error: "Disposal reason is required."
            });
        }

        // ----------------------------------------------------
        // CHECK ASSET EXISTS
        // ----------------------------------------------------
        const asset = await AssetModel.getById(
            Number(asset_id)
        );

        if (!asset) {
            return res.status(404).json({
                success: false,
                error: "Asset not found."
            });
        }

        // ----------------------------------------------------
        // PREVENT DUPLICATE DISPOSAL RECOMMENDATION
        // ----------------------------------------------------
        const existing =
            await DisposalModel.getByAssetId(
                Number(asset_id)
            );

        const hasActiveOrPending = existing.some(
            (d) => d.status !== "Rejected"
        );

        if (hasActiveOrPending) {
            const recommended = existing.find(
                (d) =>
                    String(d.status || "")
                        .toLowerCase() === "recommended"
            );

            return res.status(400).json({
                success: false,
                error: recommended
                    ? "This asset has a pending disposal recommendation from Maintenance. " +
                      "Please submit that recommendation from the Disposal page instead."
                    : "This asset already has a disposal record that is pending or approved."
            });
        }

        // ----------------------------------------------------
        // CREATE DISPOSAL RECOMMENDATION (Pending)
        // ----------------------------------------------------
        const result = await DisposalModel.create({
            asset_id: Number(asset_id),
            disposal_date,
            reason: reason.trim(),
            requested_by: requesterId
        });

        // ----------------------------------------------------
        // MARK ASSET AS PENDING DISPOSAL
        // ----------------------------------------------------
        const previousStatus = asset.status;
        await q(
            `UPDATE assets SET status = 'Pending Disposal' WHERE asset_id = ?`,
            [Number(asset_id)]
        );

        // ----------------------------------------------------
        // RECORD ASSET HISTORY
        // ----------------------------------------------------
        await AssetHistoryModel.create({
            asset_id: Number(asset_id),
            user_id: requesterId,
            action: "DISPOSAL_REQUESTED",
            previous_value: previousStatus,
            new_value: "Pending Disposal",
            description: `Disposal request created: ${reason.trim()}`
        });

        // ----------------------------------------------------
        // NOTIFY ALL MANAGERS (for approval)
        // ----------------------------------------------------
        await notifyRole(
            "manager",
            "New Disposal Request",
            `A disposal request has been created for asset ` +
            `"${asset.asset_name}". Disposal #${result.insertId} is ` +
            `waiting for your approval.`,
            "warning"
        );

        // ----------------------------------------------------
        // NOTIFY SUBMITTING ASSET OFFICER (confirmation)
        // ----------------------------------------------------
        await NotificationModel.create({
            user_id: requesterId,
            title: "Disposal Request Submitted",
            message:
                `Your disposal request for asset ` +
                `"${asset.asset_name}" has been submitted and is ` +
                `awaiting manager approval.`,
            type: "info",
        });

        // ----------------------------------------------------
        // AUDIT
        // ----------------------------------------------------
        const { logAudit } = require("../middleware/auditLogger");
        await logAudit(
            req,
            "CREATE_DISPOSAL_RECOMMENDATION",
            "disposal",
            result.insertId,
            {
                asset_id: Number(asset_id),
                reason: reason.trim()
            }
        );

        res.status(201).json({
            success: true,
            message:
                "Disposal request submitted. Awaiting manager approval.",
            disposal_id: result.insertId
        });
    } catch (error) {
        console.error(
            "Create disposal error:",
            error
        );

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// ============================================================
// SUBMIT A MAINTENANCE-RECOMMENDED DISPOSAL
// POST /api/disposals/:id/submit
// Asset Officer reviews the asset already recommended for disposal
// by the Maintenance Officer (status 'Recommended'), optionally
// updates the disposal reason, and submits it. This routes the
// request to the manager for approval. The Asset Officer does NOT
// re-select the asset; it is carried over automatically.
// ============================================================
const submitDisposal = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (typeof req.user === "undefined") {
            return res.status(401).json({
                success: false,
                error: "Authentication required."
            });
        }

        if (!id || isNaN(Number(id))) {
            return res.status(400).json({
                success: false,
                error: "Valid disposal ID is required."
            });
        }

        // Load the current recommended disposal with asset info
        const rows = await DisposalModel.getStatus(Number(id));

        if (!rows.length) {
            return res.status(404).json({
                success: false,
                error: "Disposal record not found."
            });
        }

        const current = rows[0];

        // Only a Maintenance-recommended disposal can be submitted.
        if (String(current.status || "").toLowerCase() !== "recommended") {
            return res.status(400).json({
                success: false,
                error:
                    "Only disposal recommendations from Maintenance can be submitted for approval."
            });
        }

        const finalReason =
            reason && reason.trim() !== ""
                ? reason.trim()
                : (current.reason || "").trim() || "Asset recommended for disposal by Maintenance.";

        // Submit: mark as Pending, attribute to this Asset Officer,
        // and record the final reason.
        const result = await DisposalModel.submit(
            Number(id),
            req.user.user_id,
            finalReason
        );

        if (result.affectedRows === 0) {
            return res.status(400).json({
                success: false,
                error: "Unable to submit the disposal. It may no longer be in Recommended status."
            });
        }

        // Ensure the asset is held as pending disposal
        await q(
            `UPDATE assets SET status = 'Pending Disposal' WHERE asset_id = ?`,
            [current.asset_id]
        );

        // ----------------------------------------------------
        // RECORD ASSET HISTORY
        // ----------------------------------------------------
        await AssetHistoryModel.create({
            asset_id: current.asset_id,
            user_id: req.user.user_id,
            action: "DISPOSAL_REQUESTED",
            previous_value: { status: "Recommended" },
            new_value: { status: "Pending" },
            description: `Disposal request submitted from Maintenance recommendation #${id}: ${finalReason}`
        });

        // ----------------------------------------------------
        // NOTIFY ALL MANAGERS (for approval)
        // ----------------------------------------------------
        await notifyRole(
            "manager",
            "New Disposal Request",
            `A disposal request has been submitted for asset ` +
            `"${current.asset_name}". Disposal #${id} is ` +
            `waiting for your approval.`,
            "warning"
        );

        // ----------------------------------------------------
        // NOTIFY SUBMITTING ASSET OFFICER (confirmation)
        // ----------------------------------------------------
        await NotificationModel.create({
            user_id: req.user.user_id,
            title: "Disposal Request Submitted",
            message:
                `Your disposal request for asset ` +
                `"${current.asset_name}" has been submitted and is ` +
                `awaiting manager approval.`,
            type: "info",
        });

        // ----------------------------------------------------
        // AUDIT
        // ----------------------------------------------------
        const { logAudit } = require("../middleware/auditLogger");
        await logAudit(
            req,
            "SUBMIT_DISPOSAL_RECOMMENDATION",
            "disposal",
            Number(id),
            {
                asset_id: current.asset_id,
                reason: finalReason
            }
        );

        res.status(200).json({
            success: true,
            message:
                "Disposal request submitted. Awaiting manager approval.",
            disposal_id: Number(id)
        });
    } catch (error) {
        console.error("Submit disposal error:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// ============================================================
// APPROVE DISPOSAL
// PUT /api/disposals/:id/approve
// Manager approves the disposal request. The asset is NOT marked
// Disposed here; the Asset Officer completes the physical disposal
// (marking the asset Disposed) after approval.
// ============================================================
const approveDisposal = async (req, res) => {
    try {
        const { id } = req.params;
        const { remarks } = req.body;

        if (!id || isNaN(Number(id))) {
            return res.status(400).json({
                success: false,
                error: "Valid disposal ID is required."
            });
        }

        if (req.user.role !== "manager") {
            return res.status(403).json({
                success: false,
                error:
                    "Only a manager can approve disposals. Disposal cannot be completed without manager approval."
            });
        }

        // Check current status
        const statusRows = await DisposalModel.getStatus(id);

        if (!statusRows.length) {
            return res.status(404).json({
                success: false,
                error: "Disposal record not found."
            });
        }

        const current = statusRows[0];

        if (current.status !== "Pending") {
            return res.status(400).json({
                success: false,
                error:
                    "Only pending disposal recommendations can be approved."
            });
        }

        // Approve
        const result = await DisposalModel.approve(
            id,
            req.user.user_id,
            remarks
        );

        if (result.affectedRows === 0) {
            return res.status(400).json({
                success: false,
                error: "Unable to approve disposal. It may no longer be pending."
            });
        }

        // ----------------------------------------------------
        // Seed disposal financials (book value) so finance can
        // complete the financial record for this disposal.
        // ----------------------------------------------------
        const bookValue =
            current.current_book_value != null
                ? Number(current.current_book_value)
                : current.purchase_cost != null
                    ? Number(current.purchase_cost)
                    : null;

        const accumulatedDepreciation =
            current.accumulated_depreciation != null
                ? Number(current.accumulated_depreciation)
                : 0;

        await DisposalModel.captureFinancials(
            id,
            bookValue,
            accumulatedDepreciation
        );

        // ----------------------------------------------------
        // Notify Finance Officers (to record financials)
        // ----------------------------------------------------
        await notifyRole(
            "finance_officer",
            "Disposal Approved - Finance Record Pending",
            `Disposal #${id} of asset "${current.asset_name}" was approved. ` +
            `Please record the disposal financials (book value, proceeds, payment).`,
            "warning"
        );

        // ----------------------------------------------------
        // Notify Asset Officers that the approved disposal can
        // now be physically completed. The asset is NOT marked
        // Disposed until the Asset Officer completes it.
        // ----------------------------------------------------
        await notifyRole(
            "asset_officer",
            "Disposal Approved - Ready to Complete",
            `Disposal #${id} of asset "${current.asset_name}" was APPROVED. ` +
            `Please complete the physical disposal to mark the asset as Disposed.` +
            (remarks ? ` Remarks: ${remarks}` : ""),
            "success"
        );

        // ----------------------------------------------------
        // Notify the requesting officer
        // ----------------------------------------------------
        if (current.requested_by) {
            await NotificationModel.create({
                user_id: current.requested_by,
                title: "Disposal Approved",
                message:
                    `Your disposal request for asset ` +
                    `"${current.asset_name}" has been APPROVED. ` +
                    `The Asset Officer has been notified to complete the disposal.` +
                    (remarks ? ` Remarks: ${remarks}` : ""),
                type: "success",
            });
        }

        // ----------------------------------------------------
        // Audit
        // ----------------------------------------------------
        const { logAudit } = require("../middleware/auditLogger");
        await logAudit(
            req,
            "APPROVE_DISPOSAL",
            "disposal",
            id,
            { remarks: remarks || null, asset_id: current.asset_id }
        );

        res.status(200).json({
            success: true,
            message:
                "Disposal approved. The Asset Officer has been notified to complete the disposal.",
            disposal_id: Number(id)
        });
    } catch (error) {
        console.error(
            "Approve disposal error:",
            error
        );

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// ============================================================
// REJECT DISPOSAL
// PUT /api/disposals/:id/reject
// Manager rejects; asset is NOT disposed.
// ============================================================
const rejectDisposal = async (req, res) => {
    try {
        const { id } = req.params;
        const { remarks } = req.body;

        if (!id || isNaN(Number(id))) {
            return res.status(400).json({
                success: false,
                error: "Valid disposal ID is required."
            });
        }

        if (req.user.role !== "manager") {
            return res.status(403).json({
                success: false,
                error: "Only a manager can reject disposals."
            });
        }

        const statusRows = await DisposalModel.getStatus(id);

        if (!statusRows.length) {
            return res.status(404).json({
                success: false,
                error: "Disposal record not found."
            });
        }

        const current = statusRows[0];

        if (current.status !== "Pending") {
            return res.status(400).json({
                success: false,
                error:
                    "Only pending disposal recommendations can be rejected."
            });
        }

        const result = await DisposalModel.reject(
            id,
            req.user.user_id,
            remarks
        );

        if (result.affectedRows === 0) {
            return res.status(400).json({
                success: false,
                error: "Unable to reject disposal."
            });
        }

        // ----------------------------------------------------
        // REVERT ASSET STATUS (from Pending Disposal to Available)
        // ----------------------------------------------------
        await q(
            `UPDATE assets SET status = 'Available' WHERE asset_id = ? AND status = 'Pending Disposal'`,
            [current.asset_id]
        );

        // ----------------------------------------------------
        // ASSET HISTORY ENTRY
        // ----------------------------------------------------
        await AssetHistoryModel.create({
            asset_id: current.asset_id,
            user_id: req.user.user_id,
            action: "DISPOSAL_REJECTED",
            previous_value: "Pending Disposal",
            new_value: "Available",
            description: `Disposal #${id} rejected.` +
                (remarks ? ` Remarks: ${remarks}` : "")
        });

        // ----------------------------------------------------
        // Notify the requesting officer
        // ----------------------------------------------------
        if (current.requested_by) {
            await NotificationModel.create({
                user_id: current.requested_by,
                title: "Disposal Rejected",
                message:
                    `Your disposal recommendation for asset ` +
                    `"${current.asset_name}" was REJECTED. ` +
                    `The asset is not being disposed.` +
                    (remarks ? ` Remarks: ${remarks}` : ""),
                type: "danger",
            });
        }

        // ----------------------------------------------------
        // Audit
        // ----------------------------------------------------
        const { logAudit } = require("../middleware/auditLogger");
        await logAudit(
            req,
            "REJECT_DISPOSAL",
            "disposal",
            id,
            { remarks: remarks || null }
        );

        res.status(200).json({
            success: true,
            message: "Disposal recommendation rejected.",
            disposal_id: Number(id)
        });
    } catch (error) {
        console.error(
            "Reject disposal error:",
            error
        );

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// ============================================================
// DELETE DISPOSAL
// DELETE /api/disposals/:id
// ============================================================
const deleteDisposal = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(Number(id))) {
            return res.status(400).json({
                success: false,
                error: "Valid disposal ID is required."
            });
        }

        const result =
            await DisposalModel.delete(id);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                error: "Disposal record not found."
            });
        }

        res.status(200).json({
            success: true,
            message:
                "Disposal record deleted successfully."
        });
    } catch (error) {
        console.error(
            "Delete disposal error:",
            error
        );

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// ============================================================
// GET APPROVED DISPOSALS FOR FINANCE REVIEW
// GET /api/disposals/finance
// Finance officer reviews approved disposals and records
// disposal financials (book value, proceeds, payment).
// ============================================================
const getDisposalsForFinance = async (req, res) => {
    try {
        const disposals =
            await DisposalModel.getFinancialsForFinance();

        res.status(200).json({
            success: true,
            count: disposals.length,
            data: disposals
        });
    } catch (error) {
        console.error("Get disposals for finance error:", error);

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// ============================================================
// RECORD / PROCESS DISPOSAL FINANCIALS (FINANCE)
// PUT /api/disposals/:id/financials
// Finance officer records the disposal value/proceeds,
// book value, accumulated depreciation, payment + status.
// ============================================================
const processDisposalFinancials = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            book_value,
            accumulated_depreciation,
            disposal_value,
            financial_status,
            payment_status,
            financial_remarks
        } = req.body;

        if (!id || isNaN(Number(id))) {
            return res.status(400).json({
                success: false,
                error: "Valid disposal ID is required."
            });
        }

        const rows = await DisposalModel.getStatus(id);

        if (!rows.length) {
            return res.status(404).json({
                success: false,
                error: "Disposal record not found."
            });
        }

        const current = rows[0];

        if (current.status !== "Approved" && current.status !== "Completed") {
            return res.status(400).json({
                success: false,
                error:
                    "Only approved or completed disposals can have financials recorded."
            });
        }

        await DisposalModel.processFinancials(id, {
            book_value:
                book_value != null ? Number(book_value) : null,
            accumulated_depreciation:
                accumulated_depreciation != null
                    ? Number(accumulated_depreciation)
                    : null,
            disposal_value:
                disposal_value != null
                    ? Number(disposal_value)
                    : null,
            financial_status:
                financial_status || "Recorded",
            payment_status: payment_status || null,
            financial_remarks: financial_remarks || null
        });

        // Notify the requesting officer and managers
        await notifyRole(
            "manager",
            "Disposal Financials Recorded",
            `Disposal #${id} of asset "${current.asset_name}" has its ` +
            `financials recorded by finance.`,
            "info"
        );

        if (current.requested_by) {
            await NotificationModel.create({
                user_id: current.requested_by,
                title: "Disposal Financials Recorded",
                message:
                    `Financials for disposal #${id} of asset ` +
                    `"${current.asset_name}" have been recorded by finance.`,
                type: "info",
            });
        }

        const { logAudit } = require("../middleware/auditLogger");
        await logAudit(
            req,
            "PROCESS_DISPOSAL_FINANCIALS",
            "disposal",
            id,
            {
                book_value,
                disposal_value,
                financial_status,
                payment_status
            }
        );

        res.status(200).json({
            success: true,
            message: "Disposal financials recorded successfully.",
            disposal_id: Number(id)
        });
    } catch (error) {
        console.error(
            "Process disposal financials error:",
            error
        );

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// ============================================================
// EXPORTS
// ============================================================

// ============================================================
// COMPLETE PHYSICAL DISPOSAL
// PUT /api/disposals/:id/complete
// Asset Officer (or admin) completes the physical disposal of an
// approved disposal: marks the asset as Disposed, creates the
// Bin Card OUT transaction, closes any active assignment, records
// the disposal method, and completes the disposal.
// ============================================================
const completePhysicalDisposal = async (req, res) => {
    try {
        const { id } = req.params;
        const { method, notes } = req.body;

        if (!id || isNaN(Number(id))) {
            return res.status(400).json({
                success: false,
                error: "Valid disposal ID is required."
            });
        }

        const rows = await DisposalModel.getStatus(id);

        if (!rows.length) {
            return res.status(404).json({
                success: false,
                error: "Disposal record not found."
            });
        }

        const current = rows[0];

        if (current.status !== "Approved") {
            return res.status(400).json({
                success: false,
                error:
                    "Only approved disposals can be completed."
            });
        }

        // Guard against duplicate completion: if this disposal has
        // already been physically completed, reject the call.
        const alreadyCompleted = await q(
            `SELECT disposal_id FROM disposals WHERE disposal_id = ? AND status = 'Completed'`,
            [id]
        );
        if (alreadyCompleted.length) {
            return res.status(409).json({
                success: false,
                error: "This disposal has already been completed."
            });
        }

        // Record physical disposal and mark the disposal as Completed
        await q(
            `UPDATE disposals
             SET method = ?, disposed_by = ?, notes = ?, status = 'Completed'
             WHERE disposal_id = ? AND status = 'Approved'`,
            [method || null, req.user.user_id, notes || null, id]
        );

        // ----------------------------------------------------
        // Mark the asset as Disposed (final state)
        // ----------------------------------------------------
        await q(
            `UPDATE assets SET status = 'Disposed' WHERE asset_id = ?`,
            [current.asset_id]
        );

        // ----------------------------------------------------
        // BIN CARD OUT TRANSACTION
        // ----------------------------------------------------
        const alreadyOut = await q(
            `SELECT transaction_id FROM bin_card_transactions
             WHERE reference_type = 'DISPOSAL' AND reference_id = ?`,
            [id]
        );

        if (!alreadyOut.length) {
            await BinCardModel.createTransaction({
                asset_id: current.asset_id,
                transaction_type: "OUT",
                quantity: 1,
                reference_type: "DISPOSAL",
                reference_id: id,
                performed_by: req.user.user_id,
                notes: `Disposed: ${current.asset_name}.${notes ? ` ${notes}` : ""}`
            });
        }

        // Close any active assignment: the asset is no longer held.
        await q(
            `UPDATE assignments SET status = 'Returned'
             WHERE asset_id = ? AND status = 'Active'`,
            [current.asset_id]
        );

        // Asset history entry
        await AssetHistoryModel.create({
            asset_id: current.asset_id,
            user_id: req.user.user_id,
            action: "DISPOSAL_COMPLETED",
            previous_value: { status: "Approved" },
            new_value: { status: "Disposed" },
            description: `Asset physically disposed. Method: ${method || "N/A"}` +
                (notes ? `. Notes: ${notes}` : "")
        });

        // Notify managers
        await notifyRole(
            "manager",
            "Disposal Completed",
            `Physical disposal of asset "${current.asset_name}" (Disposal #${id}) has been completed.`,
            "success"
        );

        // Notify the asset officer group that the disposal is complete
        await notifyRole(
            "asset_officer",
            "Disposal Completed",
            `Physical disposal of asset "${current.asset_name}" (Disposal #${id}) has been completed.`,
            "info"
        );

        // Notify the requesting officer
        if (current.requested_by) {
            await NotificationModel.create({
                user_id: current.requested_by,
                title: "Disposal Completed",
                message:
                    `Physical disposal of asset "${current.asset_name}" ` +
                    `(Disposal #${id}) has been completed. The asset is now Disposed.`,
                type: "success",
            });
        }

        // Notify the currently assigned employee (if any)
        const assigned = await q(
            `SELECT user_id FROM assignments 
             WHERE asset_id = ? AND status = 'Returned'
             ORDER BY assignment_date DESC LIMIT 1`,
            [current.asset_id]
        );

        if (assigned.length) {
            await NotificationModel.create({
                user_id: assigned[0].user_id,
                title: "Asset Disposed",
                message:
                    `The asset "${current.asset_name}" has been disposed of and ` +
                    `is no longer available.`,
                type: "danger",
            });
        }

        // Audit
        const { logAudit } = require("../middleware/auditLogger");
        await logAudit(
            req,
            "COMPLETE_DISPOSAL",
            "disposal",
            id,
            { method, notes, asset_id: current.asset_id }
        );

        res.status(200).json({
            success: true,
            message:
                "Physical disposal completed. Asset marked as Disposed.",
            disposal_id: Number(id)
        });
    } catch (error) {
        console.error(
            "Complete disposal error:",
            error
        );

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

module.exports = {
    getAllDisposals,
    getPendingDisposals,
    getDisposalById,
    getDisposalsByAsset,
    createDisposal,
    submitDisposal,
    approveDisposal,
    rejectDisposal,
    deleteDisposal,
    getDisposalsForFinance,
    processDisposalFinancials,
    completePhysicalDisposal
};
