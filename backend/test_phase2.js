/**
 * Phase 2 Test Script — Asset History Tracking
 * Run: node test_phase2.js
 */

require("dotenv").config();
const http = require("http");
const mysql = require("mysql2");

const db = mysql.createConnection({
    host:     process.env.DB_HOST     || "localhost",
    user:     process.env.DB_USER     || "root",
    password: process.env.DB_PASSWORD || "233889@ky",
    database: process.env.DB_NAME     || "asset_management"
});

function httpRequest(method, path, body = null, token = null) {
    return new Promise((resolve, reject) => {
        const data = body ? JSON.stringify(body) : null;
        const headers = { "Content-Type": "application/json" };
        if (data) headers["Content-Length"] = Buffer.byteLength(data);
        if (token) headers["Authorization"] = "Bearer " + token;

        const req = http.request({
            hostname: "localhost",
            port: process.env.PORT || 5000,
            path,
            method,
            headers,
        }, (res) => {
            let raw = "";
            res.on("data", (chunk) => (raw += chunk));
            res.on("end", () => {
                try {
                    resolve({ status: res.statusCode, body: JSON.parse(raw) });
                } catch {
                    resolve({ status: res.statusCode, body: raw });
                }
            });
        });

        req.on("error", reject);
        if (data) req.write(data);
        req.end();
    });
}

let passCount = 0;
let failCount = 0;

function pass(title, detail = "") {
    passCount++;
    console.log(`  ✅ [PASS] ${title}${detail ? " -> " + detail : ""}`);
}

function fail(title, detail = "") {
    failCount++;
    console.log(`  ❌ [FAIL] ${title}${detail ? " -> " + detail : ""}`);
}

async function runPhase2Tests() {
    console.log("=======================================================");
    console.log("  PHASE 2 VERIFICATION: ASSET HISTORY TRACKING");
    console.log("=======================================================\n");

    // 1. Authenticate
    let token = null;
    try {
        const loginRes = await httpRequest("POST", "/api/auth/login", {
            email: "admin@gmail.com",
            password: "admin123"
        });
        if (loginRes.status === 200 && loginRes.body.token) {
            token = loginRes.body.token;
            pass("Authentication", "Admin login successful, JWT obtained");
        } else {
            fail("Authentication", JSON.stringify(loginRes.body));
            process.exit(1);
        }
    } catch (err) {
        fail("Authentication", err.message);
        process.exit(1);
    }

    // 2. GET /api/assets/:id/history for an existing asset
    const assetsList = await httpRequest("GET", "/api/assets", null, token);
    let sampleAssetId = 1;
    if (assetsList.status === 200 && assetsList.body.length > 0) {
        sampleAssetId = assetsList.body[0].asset_id;
    }
    const histRes = await httpRequest("GET", `/api/assets/${sampleAssetId}/history`, null, token);
    if (histRes.status === 200 && Array.isArray(histRes.body)) {
        pass(`GET /api/assets/${sampleAssetId}/history`, `Returned ${histRes.body.length} history log(s)`);
    } else {
        fail(`GET /api/assets/${sampleAssetId}/history`, JSON.stringify(histRes.body));
    }

    // 3. Create a test asset and verify automated history creation
    const testSn = `SN-HIST-${Date.now()}`;
    const createRes = await httpRequest("POST", "/api/assets", {
        asset_name: "Asset History Test Workstation",
        serial_number: testSn,
        purchase_date: "2024-05-01",
        purchase_cost: 1200.00,
        status: "Available",
        asset_condition: "New",
        location: "Lab Room 303"
    }, token);

    let testAssetId = null;
    if (createRes.status === 201 && createRes.body.asset_id) {
        testAssetId = createRes.body.asset_id;
        pass("POST /api/assets", `Created asset_id: ${testAssetId}`);
    } else {
        fail("POST /api/assets", JSON.stringify(createRes.body));
    }

    if (testAssetId) {
        // Verify ASSET_REGISTERED log entry
        const h1 = await httpRequest("GET", `/api/assets/${testAssetId}/history`, null, token);
        if (h1.status === 200 && h1.body.some(h => h.action === "ASSET_REGISTERED")) {
            pass("Asset Registered Event", "Automated history record ASSET_REGISTERED logged");
        } else {
            fail("Asset Registered Event", JSON.stringify(h1.body));
        }

        // Update asset
        const updateRes = await httpRequest("PUT", `/api/assets/${testAssetId}`, {
            asset_name: "Asset History Test Workstation (Updated)",
            serial_number: testSn,
            purchase_date: "2024-05-01",
            purchase_cost: 1200.00,
            status: "Available",
            asset_condition: "Good",
            location: "Lab Room 304"
        }, token);
        if (updateRes.status === 200) {
            pass("PUT /api/assets/:id", "Updated asset details");
        } else {
            fail("PUT /api/assets/:id", JSON.stringify(updateRes.body));
        }

        // Verify ASSET_UPDATED log entry
        const h2 = await httpRequest("GET", `/api/assets/${testAssetId}/history`, null, token);
        if (h2.status === 200 && h2.body.some(h => h.action === "ASSET_UPDATED")) {
            pass("Asset Updated Event", "Automated history record ASSET_UPDATED logged");
        } else {
            fail("Asset Updated Event", JSON.stringify(h2.body));
        }

        // Update status
        const statusRes = await httpRequest("PATCH", `/api/assets/${testAssetId}/status`, { status: "Under Maintenance" }, token);
        if (statusRes.status === 200) {
            pass("PATCH /api/assets/:id/status", "Updated status to Under Maintenance");
        } else {
            fail("PATCH /api/assets/:id/status", JSON.stringify(statusRes.body));
        }

        // Verify STATUS_CHANGED log entry
        const h3 = await httpRequest("GET", `/api/assets/${testAssetId}/history`, null, token);
        if (h3.status === 200 && h3.body.some(h => h.action === "STATUS_CHANGED")) {
            pass("Status Changed Event", "Automated history record STATUS_CHANGED logged");
        } else {
            fail("Status Changed Event", JSON.stringify(h3.body));
        }

        // Clean up test asset
        await httpRequest("DELETE", `/api/assets/${testAssetId}`, null, token);
        pass("Cleanup", `Deleted test asset_id: ${testAssetId}`);
    }

    console.log("\n=======================================================");
    console.log(`  PHASE 2 VERIFICATION RESULTS`);
    console.log(`  PASSED: ${passCount}`);
    console.log(`  FAILED: ${failCount}`);
    console.log("=======================================================\n");

    db.end();
    if (failCount === 0) process.exit(0);
    else process.exit(1);
}

runPhase2Tests().catch((err) => {
    console.error("Test Error:", err);
    db.end();
    process.exit(1);
});
