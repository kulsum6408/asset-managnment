/**
 * Phase 4 Test Script — QR Code, Warranty Tracking, Depreciation & Maintenance Reminders
 * Run: node test_phase4.js
 */

require("dotenv").config();
const http = require("http");

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

async function runPhase4Tests() {
    console.log("=======================================================");
    console.log("  PHASE 4 VERIFICATION: QR, WARRANTY, DEPRECIATION & MAINT");
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

    // 2. Test Asset Creation with Warranty & Salvage Value
    const testSn = `SN-P4-${Date.now()}`;
    const today = new Date().toISOString().split('T')[0];
    const nextYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const createRes = await httpRequest("POST", "/api/assets", {
        asset_name: "Quantum Workstation Pro",
        serial_number: testSn,
        purchase_date: today,
        purchase_cost: 5000.00,
        salvage_value: 500.00,
        warranty_start_date: today,
        warranty_end_date: nextYear,
        status: "Available",
        asset_condition: "New",
        location: "Server Room 1"
    }, token);

    let assetId = null;
    if (createRes.status === 201 && createRes.body.asset_id) {
        assetId = createRes.body.asset_id;
        pass("POST /api/assets with Salvage Value & Warranty", `Created asset_id: ${assetId}`);
    } else {
        fail("POST /api/assets with Salvage Value & Warranty", JSON.stringify(createRes.body));
    }

    if (assetId) {
        // 3. Test QR Code Endpoint: GET /api/assets/:id/qr
        const qrRes = await httpRequest("GET", `/api/assets/${assetId}/qr`, null, token);
        if (qrRes.status === 200 && qrRes.body.qr_code && qrRes.body.payload) {
            pass("GET /api/assets/:id/qr", `QR Code Data URI returned (${qrRes.body.qr_code.substring(0, 30)}...)`);
        } else {
            fail("GET /api/assets/:id/qr", JSON.stringify(qrRes.body));
        }

        // 4. Test Warranty Filters
        const activeWarRes = await httpRequest("GET", "/api/assets/warranties/active", null, token);
        if (activeWarRes.status === 200 && Array.isArray(activeWarRes.body)) {
            pass("GET /api/assets/warranties/active", `Returned ${activeWarRes.body.length} active warranty asset(s)`);
        } else {
            fail("GET /api/assets/warranties/active", JSON.stringify(activeWarRes.body));
        }

        const expWarRes = await httpRequest("GET", "/api/assets/warranties/expired", null, token);
        if (expWarRes.status === 200 && Array.isArray(expWarRes.body)) {
            pass("GET /api/assets/warranties/expired", `Returned ${expWarRes.body.length} expired warranty asset(s)`);
        } else {
            fail("GET /api/assets/warranties/expired", JSON.stringify(expWarRes.body));
        }

        const soonWarRes = await httpRequest("GET", "/api/assets/warranties/expiring-soon", null, token);
        if (soonWarRes.status === 200 && Array.isArray(soonWarRes.body)) {
            pass("GET /api/assets/warranties/expiring-soon", `Returned ${soonWarRes.body.length} expiring soon warranty asset(s)`);
        } else {
            fail("GET /api/assets/warranties/expiring-soon", JSON.stringify(soonWarRes.body));
        }

        // 5. Test Instant Depreciation Calculation
        const depCalcRes = await httpRequest("GET", `/api/depreciation/calculate/${assetId}?years=5`, null, token);
        if (depCalcRes.status === 200 && depCalcRes.body.purchase_cost === 5000 && depCalcRes.body.salvage_value === 500) {
            pass("GET /api/depreciation/calculate/:asset_id", `Book Value=${depCalcRes.body.current_book_value}, Annual Dep=${depCalcRes.body.annual_depreciation}`);
        } else {
            fail("GET /api/depreciation/calculate/:asset_id", JSON.stringify(depCalcRes.body));
        }

        // 6. Test Maintenance Reminders & Asset Maintenance History
        const maintCreateRes = await httpRequest("POST", "/api/maintenance", {
            asset_id: assetId,
            description: "Quarterly inspection and thermal paste reapplication",
            status: "Scheduled",
            cost: 200.00,
            maintenance_type: "Preventive",
            next_maintenance_date: nextYear
        }, token);

        let maintId = null;
        if (maintCreateRes.status === 201 && maintCreateRes.body.maintenance_id) {
            maintId = maintCreateRes.body.maintenance_id;
            pass("POST /api/maintenance with Type & Next Date", `Created maintenance_id: ${maintId}`);
        } else {
            fail("POST /api/maintenance with Type & Next Date", JSON.stringify(maintCreateRes.body));
        }

        // Upcoming Maintenance
        const upcomingRes = await httpRequest("GET", "/api/maintenance/reminders/upcoming", null, token);
        if (upcomingRes.status === 200 && Array.isArray(upcomingRes.body)) {
            pass("GET /api/maintenance/reminders/upcoming", `Returned ${upcomingRes.body.length} upcoming maintenance record(s)`);
        } else {
            fail("GET /api/maintenance/reminders/upcoming", JSON.stringify(upcomingRes.body));
        }

        // Overdue Maintenance
        const overdueRes = await httpRequest("GET", "/api/maintenance/reminders/overdue", null, token);
        if (overdueRes.status === 200 && Array.isArray(overdueRes.body)) {
            pass("GET /api/maintenance/reminders/overdue", `Returned ${overdueRes.body.length} overdue maintenance record(s)`);
        } else {
            fail("GET /api/maintenance/reminders/overdue", JSON.stringify(overdueRes.body));
        }

        // Asset Maintenance History
        const assetMaintHist = await httpRequest("GET", `/api/maintenance/asset/${assetId}/history`, null, token);
        if (assetMaintHist.status === 200 && Array.isArray(assetMaintHist.body)) {
            pass("GET /api/maintenance/asset/:asset_id/history", `Returned ${assetMaintHist.body.length} record(s) for asset`);
        } else {
            fail("GET /api/maintenance/asset/:asset_id/history", JSON.stringify(assetMaintHist.body));
        }

        // Cleanup
        if (maintId) {
            await httpRequest("DELETE", `/api/maintenance/${maintId}`, null, token);
        }
        await httpRequest("DELETE", `/api/assets/${assetId}`, null, token);
        pass("Cleanup", `Deleted test asset_id ${assetId}`);
    }

    console.log("\n=======================================================");
    console.log(`  PHASE 4 VERIFICATION RESULTS`);
    console.log(`  PASSED: ${passCount}`);
    console.log(`  FAILED: ${failCount}`);
    console.log("=======================================================\n");

    if (failCount === 0) process.exit(0);
    else process.exit(1);
}

runPhase4Tests().catch((err) => {
    console.error("Test Error:", err);
    process.exit(1);
});
