const InventoryCheckModel = require("../models/inventoryCheckModel");

// ============================================================
// CHECK ACCESS
// ADMIN + ASSET OFFICER
// ============================================================

const requireInventoryCheckAccess = (req, res) => {

    if (!req.user) {
        res.status(401).json({
            success: false,
            error: "Authentication required."
        });

        return false;
    }

    const role = String(req.user.role || "").toLowerCase();

    const allowedRoles = [
        "admin",
        "administrator",
        "asset_officer"
    ];

    if (!allowedRoles.includes(role)) {

        res.status(403).json({
            success: false,
            error:
                "Access denied. Inventory checking is available to Administrators and Asset Officers."
        });

        return false;
    }

    return true;
};

// ============================================================
// CREATE ACCESS
// ONLY ASSET OFFICER
// ============================================================

const requireAssetOfficer = (req, res) => {

    if (!req.user) {

        res.status(401).json({
            success: false,
            error: "Authentication required."
        });

        return false;
    }

    const role = String(req.user.role || "").toLowerCase();

    if (role !== "asset_officer") {

        res.status(403).json({
            success: false,
            error:
                "Access denied. Only Asset Officers can perform inventory checks."
        });

        return false;
    }

    return true;
};

// ============================================================
// GET ALL CHECKS
// GET /api/inventory-checks
// ============================================================

const getAllInventoryChecks = async (req, res) => {

    try {

        if (!requireInventoryCheckAccess(req, res)) {
            return;
        }

        const {
            year,
            physical_status,
            search
        } = req.query;

        const checks =
            await InventoryCheckModel.getAll({
                year,
                physical_status,
                search
            });

        res.status(200).json({
            success: true,
            count: checks.length,
            data: checks
        });

    } catch (error) {

        console.error(
            "Get inventory checks error:",
            error
        );

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// ============================================================
// GET CHECKS FOR ONE ASSET
// GET /api/inventory-checks/asset/:assetId
// ============================================================

const getInventoryChecksByAsset = async (req, res) => {

    try {

        if (!requireInventoryCheckAccess(req, res)) {
            return;
        }

        const { assetId } = req.params;

        if (!assetId || isNaN(Number(assetId))) {

            return res.status(400).json({
                success: false,
                error: "Valid asset ID is required."
            });
        }

        const checks =
            await InventoryCheckModel.getByAssetId(
                Number(assetId)
            );

        res.status(200).json({
            success: true,
            count: checks.length,
            data: checks
        });

    } catch (error) {

        console.error(
            "Get asset inventory checks error:",
            error
        );

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// ============================================================
// CREATE INVENTORY CHECK
// POST /api/inventory-checks
// ONLY ASSET OFFICER
// ============================================================

const createInventoryCheck = async (req, res) => {

    try {

        if (!requireAssetOfficer(req, res)) {
            return;
        }

        const {
            asset_id,
            check_year,
            physical_status,
            physical_condition,
            physical_location,
            discrepancy,
            notes
        } = req.body;

        // ----------------------------------------------------
        // REQUIRED ASSET
        // ----------------------------------------------------

        if (!asset_id || isNaN(Number(asset_id))) {

            return res.status(400).json({
                success: false,
                error: "Valid asset ID is required."
            });
        }

        // ----------------------------------------------------
        // YEAR
        // ----------------------------------------------------

        const year =
            check_year
                ? Number(check_year)
                : new Date().getFullYear();

        if (
            !Number.isInteger(year) ||
            year < 2000 ||
            year > 2100
        ) {

            return res.status(400).json({
                success: false,
                error: "Valid inventory check year is required."
            });
        }

        // ----------------------------------------------------
        // PHYSICAL STATUS
        // ----------------------------------------------------

        const allowedStatuses = [
            "Found",
            "Missing",
            "Damaged"
        ];

        if (!allowedStatuses.includes(physical_status)) {

            return res.status(400).json({
                success: false,
                error:
                    "Physical status must be Found, Missing, or Damaged."
            });
        }

        // ----------------------------------------------------
        // PREVENT DUPLICATE YEARLY CHECK
        // ----------------------------------------------------

        const alreadyChecked =
            await InventoryCheckModel.existsForYear(
                Number(asset_id),
                year
            );

        if (alreadyChecked) {

            return res.status(409).json({
                success: false,
                error:
                    `This asset has already been checked for ${year}.`
            });
        }

        // ----------------------------------------------------
        // GET CURRENT SYSTEM INFORMATION
        // ----------------------------------------------------

        const db = require("../config/db");

        const getAsset = () => {

            return new Promise((resolve, reject) => {

                db.query(
                    `
                    SELECT
                        asset_id,
                        asset_name,
                        status,
                        asset_condition,
                        location
                    FROM assets
                    WHERE asset_id = ?
                    LIMIT 1
                    `,
                    [Number(asset_id)],
                    (error, rows) => {

                        if (error) {
                            reject(error);
                        } else {
                            resolve(rows);
                        }
                    }
                );

            });
        };

        const assets = await getAsset();

        if (!assets.length) {

            return res.status(404).json({
                success: false,
                error: "Asset not found."
            });
        }

        const asset = assets[0];

        // ----------------------------------------------------
        // CREATE RECORD
        // ----------------------------------------------------

        const result =
            await InventoryCheckModel.create({

                asset_id: Number(asset_id),

                check_year: year,

                system_status: asset.status,

                physical_status,

                system_condition:
                    asset.asset_condition,

                physical_condition:
                    physical_condition || null,

                system_location:
                    asset.location,

                physical_location:
                    physical_location || null,

                discrepancy:
                    discrepancy || null,

                checked_by:
                    req.user.user_id,

                notes:
                    notes || null
            });

        // ----------------------------------------------------
        // UPDATE ASSET STATUS BASED ON PHYSICAL STATUS
        // Missing -> asset becomes 'Lost'
        // Damaged -> route to maintenance
        // ----------------------------------------------------
        const NotificationModel = require("../models/notificationModel");

        if (physical_status === "Missing") {
            await new Promise((res, rej) => {
                db.query(
                    "UPDATE assets SET status = 'Lost' WHERE asset_id = ?",
                    [Number(asset_id)],
                    (e) => e ? rej(e) : res()
                );
            });

            // Notify managers about missing asset
            const managers = await new Promise((res, rej) => {
                db.query(
                    "SELECT user_id FROM users WHERE role = 'manager' AND is_active = 1",
                    [],
                    (e, r) => e ? rej(e) : res(r)
                );
            });
            for (const m of managers) {
                await NotificationModel.create({
                    user_id: m.user_id,
                    title: "Asset Missing - Inventory Check",
                    message: `Asset "${asset.asset_name}" (ID: ${asset_id}) was not found during the ${year} inventory check and has been marked as Lost.`,
                    type: "danger"
                });
            }
        } else if (physical_status === "Damaged") {
            // Create a maintenance record for damaged asset found during inventory
            await new Promise((res, rej) => {
                db.query(
                    `INSERT INTO maintenance
                     (asset_id, maintenance_date, description, status, reported_by, maintenance_type, problem_record, created_at)
                     VALUES (?, CURDATE(), ?, 'Under Inspection', ?, 'Corrective', ?, NOW())`,
                    [
                        Number(asset_id),
                        `Damaged asset found during ${year} inventory check.`,
                        req.user.user_id,
                        `Physical condition: ${physical_condition || "Damaged"}. ${notes || ""}`
                    ],
                    (e) => e ? rej(e) : res()
                );
            });

            // Notify maintenance officer
            const maintOfficers = await new Promise((res, rej) => {
                db.query(
                    "SELECT user_id FROM users WHERE role IN ('maintenance_officer','admin') AND is_active = 1",
                    [],
                    (e, r) => e ? rej(e) : res(r)
                );
            });
            for (const mo of maintOfficers) {
                await NotificationModel.create({
                    user_id: mo.user_id,
                    title: "Damaged Asset Found - Inventory Check",
                    message: `Asset "${asset.asset_name}" (ID: ${asset_id}) was found damaged during the ${year} inventory check. Please inspect.`,
                    type: "warning"
                });
            }
        }

        res.status(201).json({

            success: true,

            message:
                physical_status === "Missing"
                    ? "Asset marked as Missing/Lost. Manager has been notified."
                    : physical_status === "Damaged"
                        ? "Asset recorded as Damaged. Maintenance record created."
                        : "Annual inventory check recorded successfully.",

            check_id: result.insertId
        });

    } catch (error) {

        console.error(
            "Create inventory check error:",
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

module.exports = {
    getAllInventoryChecks,
    getInventoryChecksByAsset,
    createInventoryCheck
};