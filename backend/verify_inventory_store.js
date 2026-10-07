require("dotenv").config();
const http = require("http");
const db = require("./config/db");
const generateToken = require("./utils/generateToken");

const q = (sql, params = []) =>
    new Promise((resolve, reject) => db.query(sql, params, (err, rows) => err ? reject(err) : resolve(rows)));

async function runInventoryVerification() {
    console.log("==================================================");
    console.log("  AMS STEP 1 VERIFICATION: Inventory + Store");
    console.log("==================================================");

    try {
        // 1. Get Users for roles: Admin, Asset Officer, Manager, Employee
        const adminUser = (await q("SELECT * FROM users WHERE role = 'admin' AND is_active = 1 LIMIT 1"))[0];
        const officerUser = (await q("SELECT * FROM users WHERE role = 'asset_officer' AND is_active = 1 LIMIT 1"))[0];
        const managerUser = (await q("SELECT * FROM users WHERE role = 'manager' AND is_active = 1 LIMIT 1"))[0];
        const employeeUser = (await q("SELECT * FROM users WHERE role = 'employee' AND is_active = 1 LIMIT 1"))[0];

        if (!adminUser || !officerUser || !managerUser || !employeeUser) {
            throw new Error("Required user roles (Admin, Asset Officer, Manager, Employee) not found in database");
        }

        console.log(`\n1. User Roles Loaded:`);
        console.log(`   - Admin: ID=${adminUser.user_id} (${adminUser.email})`);
        console.log(`   - Asset Officer: ID=${officerUser.user_id} (${officerUser.email})`);
        console.log(`   - Manager: ID=${managerUser.user_id} (${managerUser.email})`);
        console.log(`   - Employee: ID=${employeeUser.user_id} (${employeeUser.email})`);

        const adminToken = generateToken(adminUser);
        const officerToken = generateToken(officerUser);
        const managerToken = generateToken(managerUser);
        const employeeToken = generateToken(employeeUser);

        // Helper for HTTP requests
        const apiCall = (path, method = "GET", token = null, bodyData = null) => {
            return new Promise((resolve, reject) => {
                const payload = bodyData ? JSON.stringify(bodyData) : null;
                const req = http.request({
                    hostname: "localhost",
                    port: 5000,
                    path,
                    method,
                    headers: {
                        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
                        ...(payload ? {
                            "Content-Type": "application/json",
                            "Content-Length": Buffer.byteLength(payload)
                        } : {})
                    }
                }, (res) => {
                    let data = "";
                    res.on("data", chunk => data += chunk);
                    res.on("end", () => resolve({ statusCode: res.statusCode, body: JSON.parse(data) }));
                });
                req.on("error", reject);
                if (payload) req.write(payload);
                req.end();
            });
        };

        // 2. Fetch Initial Inventory Summary
        console.log("\n2. Fetching Initial Inventory Summary...");
        const initialSummaryRes = await apiCall("/api/inventory/summary", "GET", officerToken);
        const initialSummary = initialSummaryRes.body;
        console.log("   Initial Store Summary:", {
            total: initialSummary.total_assets,
            available: initialSummary.available_assets,
            assigned: initialSummary.assigned_assets,
            maintenance: initialSummary.maintenance_assets
        });

        // TEST 1 — Registration (Register 1 test laptop)
        console.log("\n==================================================");
        console.log("  TEST 1: ASSET REGISTRATION -> Store Inventory Increases");
        console.log("==================================================");
        const categories = await q("SELECT category_id FROM categories LIMIT 1");
        const categoryId = categories[0]?.category_id || 1;

        const regData = {
            asset_name: `Test Laptop ${Date.now()}`,
            category_id: categoryId,
            serial_number: `SN-INV-${Date.now()}`,
            status: "Available",
            asset_condition: "New",
            location: "Main Store Room",
            purchase_cost: 1200.00
        };

        const regRes = await apiCall("/api/assets", "POST", officerToken, regData);
        if (regRes.statusCode !== 201) throw new Error(`Asset registration failed with status ${regRes.statusCode}`);
        const registeredAssetId = regRes.body.asset_id;
        console.log(`   ✅ Registered new asset ID=${registeredAssetId} ("${regData.asset_name}") with status Available`);

        // Check Inventory Summary after registration
        const postRegSummaryRes = await apiCall("/api/inventory/summary", "GET", officerToken);
        const postRegSummary = postRegSummaryRes.body;
        console.log("   Post-Registration Store Summary:", {
            total: postRegSummary.total_assets,
            available: postRegSummary.available_assets,
            assigned: postRegSummary.assigned_assets
        });

        if (postRegSummary.available_assets !== initialSummary.available_assets + 1) {
            throw new Error(`Expected available store count to increase by 1 (${initialSummary.available_assets + 1}), got ${postRegSummary.available_assets}`);
        }
        console.log(`   ✅ Available store inventory increased by 1: PASS`);

        // TEST 2 — Manager Approval (Manager approves request)
        console.log("\n==================================================");
        console.log("  TEST 2: MANAGER APPROVAL -> Inventory Does NOT Change");
        console.log("==================================================");

        // Employee requests the newly registered asset
        const reqPostRes = await apiCall("/api/requests", "POST", employeeToken, {
            asset_id: registeredAssetId,
            reason: "Inventory testing asset request"
        });
        const testReqId = reqPostRes.body.request_id;
        console.log(`   - Employee created request #${testReqId} for asset #${registeredAssetId}`);

        // Manager approves the request
        const approveRes = await apiCall(`/api/requests/${testReqId}/approve`, "PUT", managerToken, {
            remarks: "Approved during inventory test"
        });
        console.log(`   - Manager approved request #${testReqId} (Status: ${approveRes.body.message})`);

        // Verify Store Inventory Summary after Approval
        const postApproveSummaryRes = await apiCall("/api/inventory/summary", "GET", officerToken);
        const postApproveSummary = postApproveSummaryRes.body;
        console.log("   Post-Approval Store Summary:", {
            total: postApproveSummary.total_assets,
            available: postApproveSummary.available_assets,
            assigned: postApproveSummary.assigned_assets
        });

        if (postApproveSummary.available_assets !== postRegSummary.available_assets) {
            throw new Error(`Store inventory changed upon Manager approval! Expected ${postRegSummary.available_assets}, got ${postApproveSummary.available_assets}`);
        }
        console.log(`   ✅ Manager approval alone DID NOT change inventory: PASS`);

        // TEST 3 — Issuance (Asset Officer issues asset -> Assignment created)
        console.log("\n==================================================");
        console.log("  TEST 3: ASSET OFFICER ISSUANCE -> Available Decreases, Assigned Increases");
        console.log("==================================================");

        const assignRes = await apiCall("/api/assignments", "POST", officerToken, {
            user_id: employeeUser.user_id,
            asset_id: registeredAssetId,
            notes: "Issued during inventory store test"
        });
        console.log(`   - Asset Officer issued asset #${registeredAssetId} to Employee #${employeeUser.user_id} (Assignment ID=${assignRes.body.assignment_id})`);

        // Verify Store Inventory Summary after Issuance
        const postIssueSummaryRes = await apiCall("/api/inventory/summary", "GET", officerToken);
        const postIssueSummary = postIssueSummaryRes.body;
        console.log("   Post-Issuance Store Summary:", {
            total: postIssueSummary.total_assets,
            available: postIssueSummary.available_assets,
            assigned: postIssueSummary.assigned_assets
        });

        if (postIssueSummary.available_assets !== postApproveSummary.available_assets - 1) {
            throw new Error(`Expected available store count to decrease by 1, got ${postIssueSummary.available_assets}`);
        }
        if (postIssueSummary.assigned_assets !== postApproveSummary.assigned_assets + 1) {
            throw new Error(`Expected assigned count to increase by 1, got ${postIssueSummary.assigned_assets}`);
        }
        console.log(`   ✅ Available store count decreased by 1 & Assigned count increased by 1: PASS`);

        // TEST 4 — Admin & Asset Officer Consistency
        console.log("\n==================================================");
        console.log("  TEST 4: ADMIN & ASSET OFFICER DATA CONSISTENCY");
        console.log("==================================================");

        const adminInventoryRes = await apiCall("/api/inventory", "GET", adminToken);
        const officerInventoryRes = await apiCall("/api/inventory", "GET", officerToken);

        const adminSummaryRes = await apiCall("/api/inventory/summary", "GET", adminToken);
        const officerSummaryRes = await apiCall("/api/inventory/summary", "GET", officerToken);

        console.log(`   - Admin fetched ${adminInventoryRes.body.length} inventory items`);
        console.log(`   - Asset Officer fetched ${officerInventoryRes.body.length} inventory items`);

        if (adminInventoryRes.body.length !== officerInventoryRes.body.length) {
            throw new Error("Admin and Asset Officer see different inventory item counts!");
        }
        if (JSON.stringify(adminSummaryRes.body) !== JSON.stringify(officerSummaryRes.body)) {
            throw new Error("Admin and Asset Officer see different inventory summary data!");
        }
        console.log(`   ✅ Admin and Asset Officer read the EXACT SAME real inventory data: PASS`);

        // TEST 5 — Database Persistence / Refresh
        console.log("\n==================================================");
        console.log("  TEST 5: REFRESH & DATABASE PERSISTENCE");
        console.log("==================================================");
        const dbAssets = await q("SELECT status FROM assets WHERE asset_id = ?", [registeredAssetId]);
        console.log(`   - Direct DB Check for asset #${registeredAssetId}: Status = "${dbAssets[0].status}"`);
        if (dbAssets[0].status !== "Assigned") {
            throw new Error(`Expected asset status in DB to be Assigned, got "${dbAssets[0].status}"`);
        }
        console.log(`   ✅ Database state is persistent and accurate: PASS`);

        console.log("\n==================================================");
        console.log("  ALL INVENTORY & STORE TESTS PASSED! ✅");
        console.log("==================================================");

    } catch (err) {
        console.error("\n❌ INVENTORY VERIFICATION FAILED:", err.message);
        process.exitCode = 1;
    } finally {
        db.end();
    }
}

runInventoryVerification();
