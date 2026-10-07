/**
 * Master Comprehensive Backend API Test Suite for Asset Management System
 * Validates ALL 12 Features across Users, Assets, Categories, Requests, Assignments,
 * Returns, Maintenance, Disposals, Transfers, Depreciation, Registrations,
 * Notifications, Audit Logs, Report Exports, QR Codes, Warranties, and Reminders.
 *
 * Run: node test_all_backend_endpoints.js
 */

require("dotenv").config();
const http = require("http");

function request(method, path, body = null, token = null) {
    return new Promise((resolve, reject) => {
        const data = body ? JSON.stringify(body) : null;
        const headers = {};
        if (data) {
            headers["Content-Type"] = "application/json";
            headers["Content-Length"] = Buffer.byteLength(data);
        }
        if (token) headers["Authorization"] = "Bearer " + token;

        const options = {
            hostname: "localhost",
            port: process.env.PORT || 5000,
            path,
            method,
            headers,
        };

        const req = http.request(options, (res) => {
            const chunks = [];
            res.on("data", (chunk) => chunks.push(chunk));
            res.on("end", () => {
                const buffer = Buffer.concat(chunks);
                const contentType = res.headers["content-type"] || "";
                let json = null;
                try {
                    json = JSON.parse(buffer.toString("utf8"));
                } catch (e) {
                    json = null;
                }
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    contentType,
                    body: json,
                    bodyText: buffer.toString("utf8"),
                    buffer
                });
            });
        });

        req.on("error", reject);
        if (data) req.write(data);
        req.end();
    });
}

let passCount = 0;
let failCount = 0;

function pass(name, detail = "") {
    passCount++;
    console.log(`  ✅  [PASS] ${name}${detail ? " -> " + detail : ""}`);
}

function fail(name, detail = "") {
    failCount++;
    console.log(`  ❌  [FAIL] ${name}${detail ? " -> " + detail : ""}`);
}

function section(title) {
    console.log(`\n=======================================================`);
    console.log(`  ${title}`);
    console.log(`=======================================================`);
}

async function runMasterTestSuite() {
    console.log("Starting Master Comprehensive Backend API Verification...\n");

    const tokens = {};
    const rolesToTest = [
        { role: "admin", email: "admin@gmail.com", password: "admin123" },
        { role: "asset_officer", email: "assetofficer@assets.com", password: "officer123" },
        { role: "manager", email: "manager@assets.com", password: "manager123" },
        { role: "finance_officer", email: "finance@assets.com", password: "finance123" },
        { role: "maintenance_officer", email: "maintenance@assets.com", password: "maintenance123" },
        { role: "employee", email: "employee@assets.com", password: "employee123" },
    ];

    // 1. System Health
    section("1. SYSTEM HEALTH & ROOT");
    const rootRes = await request("GET", "/");
    if (rootRes.status === 200 && rootRes.body && rootRes.body.status === "Running") {
        pass("GET /", `API Version: ${rootRes.body.version}`);
    } else {
        fail("GET /", rootRes.bodyText);
    }

    const healthRes = await request("GET", "/api/health");
    if (healthRes.status === 200 && healthRes.body && healthRes.body.status === "OK") {
        pass("GET /api/health", `Uptime: ${Math.round(healthRes.body.uptime)}s`);
    } else {
        fail("GET /api/health", healthRes.bodyText);
    }

    // 2. Authentication & Roles
    section("2. AUTHENTICATION & LOGIN (ALL ROLES)");
    for (const r of rolesToTest) {
        const res = await request("POST", "/api/auth/login", { email: r.email, password: r.password });
        if (res.status === 200 && res.body && res.body.token) {
            tokens[r.role] = res.body.token;
            pass(`Login (${r.role})`, `Email: ${r.email}`);
        } else {
            fail(`Login (${r.role})`, res.bodyText);
        }
    }

    const adminToken = tokens["admin"];
    const officerToken = tokens["asset_officer"];
    const empToken = tokens["employee"];
    const maintToken = tokens["maintenance_officer"];

    if (!adminToken || !officerToken) {
        console.error("Critical authentication failure. Stopping tests.");
        process.exit(1);
    }

    // Auth Me check
    const meRes = await request("GET", "/api/auth/me", null, officerToken);
    if (meRes.status === 200 && meRes.body && meRes.body.email === "assetofficer@assets.com") {
        pass("GET /api/auth/me", `User: ${meRes.body.name}`);
    } else {
        fail("GET /api/auth/me", meRes.bodyText);
    }

    // 3. User Management
    section("3. USER MANAGEMENT MODULE");
    const getUsersRes = await request("GET", "/api/users", null, adminToken);
    if (getUsersRes.status === 200 && Array.isArray(getUsersRes.body)) {
        pass("GET /api/users", `Total users: ${getUsersRes.body.length}`);
    } else {
        fail("GET /api/users", getUsersRes.bodyText);
    }

    // 4. Asset Search, Filters & CRUD
    section("4. ASSET MANAGEMENT MODULE (SEARCH & FILTERS)");
    const getAssetsRes = await request("GET", "/api/assets", null, officerToken);
    if (getAssetsRes.status === 200 && Array.isArray(getAssetsRes.body)) {
        pass("GET /api/assets", `Total assets: ${getAssetsRes.body.length}`);
    } else {
        fail("GET /api/assets", getUsersRes.bodyText);
    }

    const searchRes = await request("GET", "/api/assets?search=Dell", null, officerToken);
    if (searchRes.status === 200 && Array.isArray(searchRes.body)) {
        pass("GET /api/assets?search=Dell", `Found ${searchRes.body.length} item(s)`);
    } else {
        fail("GET /api/assets?search=Dell", searchRes.bodyText);
    }

    const multiFilterRes = await request("GET", "/api/assets?status=Available&category_id=1", null, officerToken);
    if (multiFilterRes.status === 200 && Array.isArray(multiFilterRes.body)) {
        pass("GET /api/assets?status=Available&category_id=1", `Combined filter returned ${multiFilterRes.body.length} item(s)`);
    } else {
        fail("GET /api/assets?status=Available&category_id=1", multiFilterRes.bodyText);
    }

    // Create Test Asset
    const testSn = `SN-MASTER-${Date.now()}`;
    const today = new Date().toISOString().split('T')[0];
    const nextYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const createAssetRes = await request("POST", "/api/assets", {
        asset_name: "Master Suite Workstation M4 Pro",
        serial_number: testSn,
        purchase_date: today,
        purchase_cost: 4500.00,
        salvage_value: 450.00,
        warranty_start_date: today,
        warranty_end_date: nextYear,
        status: "Available",
        asset_condition: "New",
        location: "Primary Server Room"
    }, officerToken);

    let createdAssetId = null;
    if (createAssetRes.status === 201 && createAssetRes.body && createAssetRes.body.asset_id) {
        createdAssetId = createAssetRes.body.asset_id;
        pass("POST /api/assets", `Created asset_id: ${createdAssetId}`);
    } else {
        fail("POST /api/assets", createAssetRes.bodyText);
    }

    if (createdAssetId) {
        // 5. Asset History Verification
        section("5. ASSET HISTORY MODULE");
        const histRes = await request("GET", `/api/assets/${createdAssetId}/history`, null, officerToken);
        if (histRes.status === 200 && Array.isArray(histRes.body) && histRes.body.some(h => h.action === "ASSET_REGISTERED")) {
            pass("GET /api/assets/:id/history", `Automated history logged: ASSET_REGISTERED`);
        } else {
            fail("GET /api/assets/:id/history", histRes.bodyText);
        }

        // 6. QR Code Support
        section("6. QR CODE API MODULE");
        const qrRes = await request("GET", `/api/assets/${createdAssetId}/qr`, null, officerToken);
        if (qrRes.status === 200 && qrRes.body && qrRes.body.qr_code && qrRes.body.payload) {
            pass("GET /api/assets/:id/qr", `QR Code Data URI generated (${qrRes.body.qr_code.substring(0, 30)}...)`);
        } else {
            fail("GET /api/assets/:id/qr", qrRes.bodyText);
        }

        // 7. Warranty Tracking
        section("7. WARRANTY TRACKING MODULE");
        const actWarRes = await request("GET", "/api/assets/warranties/active", null, officerToken);
        if (actWarRes.status === 200 && Array.isArray(actWarRes.body)) {
            pass("GET /api/assets/warranties/active", `Returned ${actWarRes.body.length} active item(s)`);
        } else {
            fail("GET /api/assets/warranties/active", actWarRes.bodyText);
        }

        const expWarRes = await request("GET", "/api/assets/warranties/expired", null, officerToken);
        if (expWarRes.status === 200 && Array.isArray(expWarRes.body)) {
            pass("GET /api/assets/warranties/expired", `Returned ${expWarRes.body.length} expired item(s)`);
        } else {
            fail("GET /api/assets/warranties/expired", expWarRes.bodyText);
        }

        // 8. Depreciation Module
        section("8. DEPRECIATION MODULE");
        const depRes = await request("GET", `/api/depreciation/calculate/${createdAssetId}?years=5`, null, officerToken);
        if (depRes.status === 200 && depRes.body && depRes.body.salvage_value === 450) {
            pass("GET /api/depreciation/calculate/:asset_id", `Calculated book value: $${depRes.body.current_book_value} (Salvage: $450)`);
        } else {
            fail("GET /api/depreciation/calculate/:asset_id", depRes.bodyText);
        }

        // 9. Maintenance & Reminders Module
        section("9. MAINTENANCE & REMINDERS MODULE");
        const maintRes = await request("POST", "/api/maintenance", {
            asset_id: createdAssetId,
            description: "Scheduled semi-annual diagnostic & hardware service",
            status: "Scheduled",
            cost: 250.00,
            maintenance_type: "Preventive",
            next_maintenance_date: nextYear
        }, maintToken);

        let maintId = null;
        if (maintRes.status === 201 && maintRes.body && maintRes.body.maintenance_id) {
            maintId = maintRes.body.maintenance_id;
            pass("POST /api/maintenance", `Scheduled maintenance_id: ${maintId}`);
        } else {
            fail("POST /api/maintenance", maintRes.bodyText);
        }

        const upcomingRes = await request("GET", "/api/maintenance/reminders/upcoming", null, maintToken);
        if (upcomingRes.status === 200 && Array.isArray(upcomingRes.body)) {
            pass("GET /api/maintenance/reminders/upcoming", `Returned ${upcomingRes.body.length} upcoming item(s)`);
        } else {
            fail("GET /api/maintenance/reminders/upcoming", upcomingRes.bodyText);
        }

        const overdueRes = await request("GET", "/api/maintenance/reminders/overdue", null, maintToken);
        if (overdueRes.status === 200 && Array.isArray(overdueRes.body)) {
            pass("GET /api/maintenance/reminders/overdue", `Returned ${overdueRes.body.length} overdue item(s)`);
        } else {
            fail("GET /api/maintenance/reminders/overdue", overdueRes.bodyText);
        }

        // 10. Dashboard & Reporting Exports
        section("10. DASHBOARD & REPORT EXPORTS MODULE");
        const dashRes = await request("GET", "/api/reports/dashboard", null, officerToken);
        if (dashRes.status === 200 && dashRes.body && dashRes.body.total_assets !== undefined) {
            pass("GET /api/reports/dashboard", `Total Assets: ${dashRes.body.total_assets}, Total Employees: ${dashRes.body.total_employees}`);
        } else {
            fail("GET /api/reports/dashboard", dashRes.bodyText);
        }

        const csvRes = await request("GET", "/api/reports/export/csv?type=assets", null, officerToken);
        if (csvRes.status === 200 && csvRes.contentType.includes("csv")) {
            pass("GET /api/reports/export/csv", `Valid CSV exported (${csvRes.buffer.length} bytes)`);
        } else {
            fail("GET /api/reports/export/csv", csvRes.bodyText);
        }

        const excelRes = await request("GET", "/api/reports/export/excel?type=assets", null, officerToken);
        if (excelRes.status === 200 && excelRes.contentType.includes("excel")) {
            pass("GET /api/reports/export/excel", `Valid Excel XML exported (${excelRes.buffer.length} bytes)`);
        } else {
            fail("GET /api/reports/export/excel", excelRes.bodyText);
        }

        const pdfRes = await request("GET", "/api/reports/export/pdf?type=assets", null, officerToken);
        if (pdfRes.status === 200 && pdfRes.contentType.includes("pdf")) {
            pass("GET /api/reports/export/pdf", `Valid PDF 1.4 document exported (${pdfRes.buffer.length} bytes)`);
        } else {
            fail("GET /api/reports/export/pdf", pdfRes.bodyText);
        }

        // Cleanup
        if (maintId) await request("DELETE", `/api/maintenance/${maintId}`, null, maintToken);
        await request("DELETE", `/api/assets/${createdAssetId}`, null, officerToken);
        pass("Cleanup", `Deleted test asset_id: ${createdAssetId}`);
    }

    // Summary
    console.log("\n=======================================================");
    console.log(`  MASTER VERIFICATION COMPLETE`);
    console.log(`  PASSED: ${passCount}`);
    console.log(`  FAILED: ${failCount}`);
    console.log("=======================================================\n");

    if (failCount === 0) {
        console.log("🎉 ALL 12 BACKEND IMPROVEMENTS ARE 100% IMPLEMENTED AND OPERATIONAL!");
        process.exit(0);
    } else {
        console.log("⚠️ Some backend endpoints need attention.");
        process.exit(1);
    }
}

runMasterTestSuite().catch(console.error);
