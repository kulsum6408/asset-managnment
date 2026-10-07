/**
 * API TEST SCRIPT - Asset Management System
 * Run: node test_api.js
 */

require("dotenv").config();
const http = require("http");

// ─── HTTP Helper ───────────────────────────────────────────
function request(method, path, body = null, token = null) {
    return new Promise((resolve, reject) => {
        const data = body ? JSON.stringify(body) : null;

        const headers = { "Content-Type": "application/json" };
        if (data) headers["Content-Length"] = Buffer.byteLength(data);
        if (token) headers["Authorization"] = "Bearer " + token;

        const options = {
            hostname: "localhost",
            port: 5000,
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

// ─── Logging Helpers ──────────────────────────────────────
function pass(label, detail = "") {
    console.log(`  ✅  ${label}${detail ? "  →  " + detail : ""}`);
}
function fail(label, detail = "") {
    console.log(`  ❌  ${label}${detail ? "  →  " + detail : ""}`);
}
function info(label, detail = "") {
    console.log(`  ℹ️   ${label}${detail ? "  →  " + detail : ""}`);
}
function section(title) {
    console.log(`\n${"═".repeat(55)}`);
    console.log(`  ${title}`);
    console.log("═".repeat(55));
}

// ─── Tests ────────────────────────────────────────────────
async function run() {
    let token = null;
    let createdAssetId = null;

    // ── 1. Health Check ──────────────────────────────────
    section("1. HEALTH CHECK");
    const health = await request("GET", "/api/health");
    health.status === 200
        ? pass("Server is running", `uptime: ${Math.round(health.body.uptime)}s`)
        : fail("Health check failed", JSON.stringify(health.body));

    // ── 2. Login ─────────────────────────────────────────
    section("2. LOGIN  (asset_officer)");
    const login = await request("POST", "/api/auth/login", {
        email: "assetofficer@assets.com",
        password: "officer123",
    });

    info("HTTP Status", login.status);
    if (login.status === 200 && login.body.token) {
        token = login.body.token;
        pass("Login successful");
        pass("User", `${login.body.user.name} | role: ${login.body.user.role}`);
        info("Token (first 60 chars)", token.substring(0, 60) + "...");
    } else {
        fail("Login failed", JSON.stringify(login.body));
        process.exit(1);
    }

    // ── 3. Verify token on /api/auth/me ──────────────────
    section("3. VERIFY TOKEN  (GET /api/auth/me)");
    const me = await request("GET", "/api/auth/me", null, token);
    info("HTTP Status", me.status);
    if (me.status === 200) {
        pass("Token is valid");
        pass("Profile", `${me.body.name} | ${me.body.email} | ${me.body.role}`);
    } else {
        fail("Token rejected", JSON.stringify(me.body));
        info("Stopping here — token issue must be fixed first");
        process.exit(1);
    }

    // ── 4. Get All Assets ────────────────────────────────
    section("4. GET ALL ASSETS  (GET /api/assets)");
    const allAssets = await request("GET", "/api/assets", null, token);
    info("HTTP Status", allAssets.status);
    if (allAssets.status === 200) {
        pass(`Fetched ${allAssets.body.length} assets`);
        allAssets.body.slice(0, 5).forEach((a) => {
            console.log(`       • [${String(a.asset_id).padStart(2)}] ${a.asset_name.padEnd(32)} | ${a.status.padEnd(18)} | ${a.location || "N/A"}`);
        });
        if (allAssets.body.length > 5) {
            console.log(`       • ... and ${allAssets.body.length - 5} more`);
        }
    } else {
        fail("Failed to fetch assets", JSON.stringify(allAssets.body));
    }

    // ── 5. Register a New Asset ──────────────────────────
    section("5. REGISTER NEW ASSET  (POST /api/assets)");
    const newAsset = await request(
        "POST",
        "/api/assets",
        {
            asset_name:      "Test MacBook Air M2",
            serial_number:   "TEST-MBA-M2-9999",
            purchase_date:   "2024-06-01",
            purchase_cost:   1299.00,
            status:          "Available",
            asset_condition: "New",
            location:        "IT Store",
        },
        token
    );

    info("HTTP Status", newAsset.status);
    if (newAsset.status === 201) {
        createdAssetId = newAsset.body.asset_id;
        pass("Asset registered successfully");
        pass("New asset_id", createdAssetId);
    } else {
        fail("Asset registration failed", JSON.stringify(newAsset.body));
    }

    // ── 6. Get Asset by ID ───────────────────────────────
    if (createdAssetId) {
        section(`6. GET ASSET BY ID  (GET /api/assets/${createdAssetId})`);
        const single = await request("GET", `/api/assets/${createdAssetId}`, null, token);
        info("HTTP Status", single.status);
        if (single.status === 200) {
            const a = single.body;
            pass("Asset found");
            console.log(`       Name      : ${a.asset_name}`);
            console.log(`       Serial    : ${a.serial_number}`);
            console.log(`       Cost      : $${a.purchase_cost}`);
            console.log(`       Status    : ${a.status}`);
            console.log(`       Condition : ${a.asset_condition}`);
            console.log(`       Location  : ${a.location}`);
        } else {
            fail("Could not fetch asset", JSON.stringify(single.body));
        }
    }

    // ── 7. Update Asset ──────────────────────────────────
    if (createdAssetId) {
        section(`7. UPDATE ASSET  (PUT /api/assets/${createdAssetId})`);
        const update = await request(
            "PUT",
            `/api/assets/${createdAssetId}`,
            {
                asset_name:      "Test MacBook Air M2 (Updated)",
                serial_number:   "TEST-MBA-M2-9999",
                purchase_date:   "2024-06-01",
                purchase_cost:   1199.00,
                status:          "Available",
                asset_condition: "Good",
                location:        "Finance Department",
            },
            token
        );
        info("HTTP Status", update.status);
        update.status === 200
            ? pass("Asset updated successfully")
            : fail("Update failed", JSON.stringify(update.body));
    }

    // ── 8. Patch Status ──────────────────────────────────
    if (createdAssetId) {
        section(`8. PATCH STATUS  (PATCH /api/assets/${createdAssetId}/status)`);
        const patch = await request(
            "PATCH",
            `/api/assets/${createdAssetId}/status`,
            { status: "Under Maintenance" },
            token
        );
        info("HTTP Status", patch.status);
        patch.status === 200
            ? pass("Status updated to 'Under Maintenance'")
            : fail("Patch failed", JSON.stringify(patch.body));
    }

    // ── 9. Filter by Status ──────────────────────────────
    section("9. FILTER  (GET /api/assets?status=Available)");
    const filtered = await request("GET", "/api/assets?status=Available", null, token);
    info("HTTP Status", filtered.status);
    filtered.status === 200
        ? pass(`${filtered.body.length} Available assets found`)
        : fail("Filter failed", JSON.stringify(filtered.body));

    // ── 10. Search ───────────────────────────────────────
    section("10. SEARCH  (GET /api/assets?search=Dell)");
    const search = await request("GET", "/api/assets?search=Dell", null, token);
    info("HTTP Status", search.status);
    if (search.status === 200) {
        pass(`${search.body.length} assets matching "Dell"`);
        search.body.forEach((a) => console.log(`       • ${a.asset_name}`));
    } else {
        fail("Search failed", JSON.stringify(search.body));
    }

    // ── 11. Delete Test Asset ────────────────────────────
    if (createdAssetId) {
        section(`11. DELETE  (DELETE /api/assets/${createdAssetId})`);
        const del = await request("DELETE", `/api/assets/${createdAssetId}`, null, token);
        info("HTTP Status", del.status);
        del.status === 200
            ? pass("Test asset deleted")
            : fail("Delete failed", JSON.stringify(del.body));
    }

    // ── 12. Categories API ──────────────────────────────
    section("12. CATEGORIES API  (GET /api/categories & POST /api/categories)");
    const catList = await request("GET", "/api/categories", null, token);
    if (catList.status === 200) {
        pass(`Fetched ${catList.body.length} categories`);
    } else {
        fail("Failed to fetch categories", JSON.stringify(catList.body));
    }

    // ── 13. Asset Transfers API ─────────────────────────
    section("13. ASSET TRANSFERS API  (GET /api/transfers)");
    const transfers = await request("GET", "/api/transfers", null, token);
    transfers.status === 200
        ? pass(`Fetched ${transfers.body.length} transfer records`)
        : fail("Failed to fetch transfers", JSON.stringify(transfers.body));

    // ── 14. Asset Disposals API ─────────────────────────
    section("14. ASSET DISPOSALS API  (GET /api/disposals)");
    const disposals = await request("GET", "/api/disposals", null, token);
    disposals.status === 200
        ? pass(`Fetched ${disposals.body.length} disposal records`)
        : fail("Failed to fetch disposals", JSON.stringify(disposals.body));

    // ── 15. Asset Depreciation API ──────────────────────
    section("15. ASSET DEPRECIATION API  (GET /api/depreciation)");
    const depreciation = await request("GET", "/api/depreciation", null, token);
    depreciation.status === 200
        ? pass(`Fetched ${depreciation.body.length} depreciation records`)
        : fail("Failed to fetch depreciation", JSON.stringify(depreciation.body));

    // ── 16. Asset Registrations API ─────────────────────
    section("16. ASSET REGISTRATIONS API  (GET /api/registrations)");
    const registrations = await request("GET", "/api/registrations", null, token);
    registrations.status === 200
        ? pass(`Fetched ${registrations.body.length} registration records`)
        : fail("Failed to fetch registrations", JSON.stringify(registrations.body));

    // ── 17. Audit Logs API ──────────────────────────────
    section("17. AUDIT LOGS API  (GET /api/audit-logs)");
    const auditLogs = await request("GET", "/api/audit-logs", null, token);
    auditLogs.status === 200
        ? pass(`Fetched ${auditLogs.body.length} audit log entries`)
        : fail("Failed to fetch audit logs", JSON.stringify(auditLogs.body));

    // ── 18. Notifications API ───────────────────────────
    section("18. NOTIFICATIONS API  (GET /api/notifications)");
    const notifications = await request("GET", "/api/notifications", null, token);
    notifications.status === 200
        ? pass(`Fetched ${notifications.body.length} notifications`)
        : fail("Failed to fetch notifications", JSON.stringify(notifications.body));

    // ── Summary ──────────────────────────────────────────
    console.log(`\n${"═".repeat(55)}`);
    console.log("  ALL TESTS DONE — BACKEND HEALTHY");
    console.log("═".repeat(55) + "\n");
}

run().catch((err) => {
    console.error("\n❌ Test script crashed:", err.message);
    console.error("   Make sure the server is running first.\n");
    process.exit(1);
});

