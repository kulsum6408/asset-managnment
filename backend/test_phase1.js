/**
 * Phase 1 Test Script — Asset Search & Filtering + Dashboard Statistics
 * Run: node test_phase1.js
 */

require("dotenv").config();
const http = require("http");
const mysql = require("mysql2");

// DB Connection for direct verification
const db = mysql.createConnection({
    host:     process.env.DB_HOST     || "localhost",
    user:     process.env.DB_USER     || "root",
    password: process.env.DB_PASSWORD || "233889@ky",
    database: process.env.DB_NAME     || "asset_management"
});

function dbQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, rows) => err ? reject(err) : resolve(rows));
    });
}

function httpRequest(method, path, body = null, token = null) {
    return new Promise((resolve, reject) => {
        const data = body ? JSON.stringify(body) : null;
        const headers = { "Content-Type": "application/json" };
        if (data) headers["Content-Length"] = Buffer.byteLength(data);
        if (token) headers["Authorization"] = "Bearer " + token;

        const options = {
            hostname: "localhost",
            port: process.env.PORT || 5000,
            path,
            method,
            headers,
        };

        const req = http.request(options, (res) => {
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

async function runPhase1Tests() {
    console.log("=======================================================");
    console.log("  PHASE 1 VERIFICATION: SEARCH, FILTERING & DASHBOARD");
    console.log("=======================================================\n");

    // 1. Verify MySQL Direct Connection
    try {
        await new Promise((res, rej) => db.connect((err) => err ? rej(err) : res()));
        pass("MySQL Connection", "Connected successfully to asset_management database");
    } catch (err) {
        fail("MySQL Connection", err.message);
        process.exit(1);
    }

    // 2. Login to obtain JWT token
    let token = null;
    try {
        const loginRes = await httpRequest("POST", "/api/auth/login", {
            email: "admin@gmail.com",
            password: "admin123"
        });
        if (loginRes.status === 200 && loginRes.body.token) {
            token = loginRes.body.token;
            pass("Authentication & Authorization", "Admin login (admin@gmail.com) successful, JWT obtained");
        } else {
            // Backup attempt for admin@assets.com
            const backupRes = await httpRequest("POST", "/api/auth/login", {
                email: "admin@assets.com",
                password: "admin123"
            });
            if (backupRes.status === 200 && backupRes.body.token) {
                token = backupRes.body.token;
                pass("Authentication & Authorization", "Backup admin login (admin@assets.com) successful");
            } else {
                fail("Authentication & Authorization", JSON.stringify(loginRes.body));
            }
        }
    } catch (err) {
        fail("Authentication & Authorization", err.message);
    }

    if (!token) {
        console.error("No token available. Ensure server is running on port 5000.");
        db.end();
        process.exit(1);
    }

    // 3. Test Unauthorized Access (RBAC Protection Check)
    const noAuthRes = await httpRequest("GET", "/api/assets");
    if (noAuthRes.status === 401) {
        pass("Security Check", "GET /api/assets without token properly blocked (401 Unauthorized)");
    } else {
        fail("Security Check", `Expected 401, got ${noAuthRes.status}`);
    }

    // 4. Test GET /api/assets (Existing Behavior Preserved)
    const allAssetsRes = await httpRequest("GET", "/api/assets", null, token);
    if (allAssetsRes.status === 200 && Array.isArray(allAssetsRes.body)) {
        pass("GET /api/assets", `Returned ${allAssetsRes.body.length} total assets`);
    } else {
        fail("GET /api/assets", JSON.stringify(allAssetsRes.body));
    }

    // 5. Test Filters Individually & Combined
    // a) Search Filter
    const searchRes = await httpRequest("GET", "/api/assets?search=Dell", null, token);
    if (searchRes.status === 200 && Array.isArray(searchRes.body)) {
        pass("GET /api/assets?search=Dell", `Found ${searchRes.body.length} asset(s) matching 'Dell'`);
    } else {
        fail("GET /api/assets?search=Dell", JSON.stringify(searchRes.body));
    }

    // b) Status Filter
    const statusRes = await httpRequest("GET", "/api/assets?status=Available", null, token);
    if (statusRes.status === 200 && Array.isArray(statusRes.body)) {
        pass("GET /api/assets?status=Available", `Found ${statusRes.body.length} available asset(s)`);
    } else {
        fail("GET /api/assets?status=Available", JSON.stringify(statusRes.body));
    }

    // c) Category ID Filter
    const catRes = await httpRequest("GET", "/api/assets?category_id=1", null, token);
    if (catRes.status === 200 && Array.isArray(catRes.body)) {
        pass("GET /api/assets?category_id=1", `Found ${catRes.body.length} asset(s) in category_id=1`);
    } else {
        fail("GET /api/assets?category_id=1", JSON.stringify(catRes.body));
    }

    // d) Location Filter
    const locRes = await httpRequest("GET", "/api/assets?location=Main%20HQ%20Office", null, token);
    if (locRes.status === 200 && Array.isArray(locRes.body)) {
        pass("GET /api/assets?location=Main HQ Office", `Found ${locRes.body.length} asset(s)`);
    } else {
        fail("GET /api/assets?location=Main HQ Office", JSON.stringify(locRes.body));
    }

    // e) Asset Condition Filter
    const condRes = await httpRequest("GET", "/api/assets?asset_condition=New", null, token);
    if (condRes.status === 200 && Array.isArray(condRes.body)) {
        pass("GET /api/assets?asset_condition=New", `Found ${condRes.body.length} asset(s) with condition 'New'`);
    } else {
        fail("GET /api/assets?asset_condition=New", JSON.stringify(condRes.body));
    }

    // f) Combined Multi-Filter
    const multiRes = await httpRequest("GET", "/api/assets?status=Available&category_id=1", null, token);
    if (multiRes.status === 200 && Array.isArray(multiRes.body)) {
        pass("GET /api/assets?status=Available&category_id=1", `Combined filter returned ${multiRes.body.length} asset(s)`);
    } else {
        fail("GET /api/assets?status=Available&category_id=1", JSON.stringify(multiRes.body));
    }

    // 6. Test Dashboard Statistics API
    const dashRes = await httpRequest("GET", "/api/reports/dashboard", null, token);
    if (dashRes.status === 200 && dashRes.body) {
        const d = dashRes.body;
        pass("GET /api/reports/dashboard", `Payload returned: Total=${d.total_assets}, Available=${d.available_assets}, Assigned=${d.assigned_assets}, Maintenance=${d.maintenance_assets}, Disposed=${d.disposed_assets}, Total Employees=${d.total_employees}`);

        // Validate structure
        const requiredKeys = [
            "total_assets", "available_assets", "assigned_assets", "maintenance_assets",
            "disposed_assets", "total_employees", "total_active_users",
            "assets_by_category", "assets_by_location", "assets_by_status"
        ];
        const missingKeys = requiredKeys.filter(k => d[k] === undefined);
        if (missingKeys.length === 0) {
            pass("Dashboard Structure Check", "All required metric fields and breakdown arrays are present");
        } else {
            fail("Dashboard Structure Check", `Missing keys: ${missingKeys.join(", ")}`);
        }

        // 7. Verify Dashboard Statistics Against Direct MySQL Queries
        const [dbAssetCount] = await dbQuery("SELECT COUNT(*) AS total FROM assets");
        const [dbAvailableCount] = await dbQuery("SELECT COUNT(*) AS total FROM assets WHERE status='Available'");
        const [dbAssignedCount] = await dbQuery("SELECT COUNT(*) AS total FROM assets WHERE status='Assigned'");
        const [dbMaintCount] = await dbQuery("SELECT COUNT(*) AS total FROM assets WHERE status='Under Maintenance'");
        const [dbDisposedCount] = await dbQuery("SELECT COUNT(*) AS total FROM assets WHERE status='Disposed'");
        const [dbEmployeeCount] = await dbQuery("SELECT COUNT(*) AS total FROM users WHERE role='employee' AND is_active=1");

        let match = true;
        if (d.total_assets !== dbAssetCount.total) { match = false; console.log(`Mismatch: total_assets API ${d.total_assets} vs DB ${dbAssetCount.total}`); }
        if (d.available_assets !== dbAvailableCount.total) { match = false; console.log(`Mismatch: available_assets API ${d.available_assets} vs DB ${dbAvailableCount.total}`); }
        if (d.assigned_assets !== dbAssignedCount.total) { match = false; console.log(`Mismatch: assigned_assets API ${d.assigned_assets} vs DB ${dbAssignedCount.total}`); }
        if (d.maintenance_assets !== dbMaintCount.total) { match = false; console.log(`Mismatch: maintenance_assets API ${d.maintenance_assets} vs DB ${dbMaintCount.total}`); }
        if (d.disposed_assets !== dbDisposedCount.total) { match = false; console.log(`Mismatch: disposed_assets API ${d.disposed_assets} vs DB ${dbDisposedCount.total}`); }
        if (d.total_employees !== dbEmployeeCount.total) { match = false; console.log(`Mismatch: total_employees API ${d.total_employees} vs DB ${dbEmployeeCount.total}`); }

        if (match) {
            pass("MySQL Verification", "All API dashboard numbers strictly match direct MySQL query counts");
        } else {
            fail("MySQL Verification", "API data does not match direct DB queries");
        }
    } else {
        fail("GET /api/reports/dashboard", JSON.stringify(dashRes.body));
    }

    console.log("\n=======================================================");
    console.log(`  PHASE 1 VERIFICATION RESULTS`);
    console.log(`  PASSED: ${passCount}`);
    console.log(`  FAILED: ${failCount}`);
    console.log("=======================================================\n");

    db.end();

    if (failCount === 0) {
        process.exit(0);
    } else {
        process.exit(1);
    }
}

runPhase1Tests().catch((err) => {
    console.error("Test Error:", err);
    db.end();
    process.exit(1);
});
