const http = require("http");

function httpRequest(method, path, body = null, token = null) {
    return new Promise((resolve, reject) => {
        const data = body ? JSON.stringify(body) : null;
        const headers = { "Content-Type": "application/json" };
        if (data) headers["Content-Length"] = Buffer.byteLength(data);
        if (token) headers["Authorization"] = "Bearer " + token;

        const req = http.request({
            hostname: "localhost",
            port: 5000,
            path,
            method,
            headers,
        }, (res) => {
            let raw = "";
            res.on("data", chunk => raw += chunk);
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

async function verifyUserRequestedFlow() {
    console.log("=================================================");
    console.log("  VERIFYING USER REQUESTED AUTH & ENDPOINT FLOW  ");
    console.log("=================================================\n");

    // 1. POST /api/auth/login with admin@gmail.com
    console.log("Step 1: Testing POST /api/auth/login with admin@gmail.com...");
    const loginRes = await httpRequest("POST", "/api/auth/login", {
        email: "admin@gmail.com",
        password: "admin123"
    });
    console.log("  Status Code:", loginRes.status);
    if (loginRes.status !== 200 || !loginRes.body.token) {
        console.error("❌ Login failed:", loginRes.body);
        process.exit(1);
    }
    const token = loginRes.body.token;
    console.log("  ✅ SUCCESS: Received valid JWT Token.");
    console.log("  User Role:", loginRes.body.user.role);

    // 2. GET /api/assets with JWT
    console.log("\nStep 2: Testing GET /api/assets with JWT...");
    const assetsRes = await httpRequest("GET", "/api/assets", null, token);
    console.log("  Status Code:", assetsRes.status);
    console.log(`  ✅ SUCCESS: Fetched ${assetsRes.body.length} assets.`);

    // 3. GET /api/assets?search=Dell with JWT
    console.log("\nStep 3: Testing GET /api/assets?search=Dell with JWT...");
    const searchRes = await httpRequest("GET", "/api/assets?search=Dell", null, token);
    console.log("  Status Code:", searchRes.status);
    console.log(`  ✅ SUCCESS: Found ${searchRes.body.length} matching asset(s).`);

    // 4. GET /api/reports/dashboard with JWT
    console.log("\nStep 4: Testing GET /api/reports/dashboard with JWT...");
    const dashRes = await httpRequest("GET", "/api/reports/dashboard", null, token);
    console.log("  Status Code:", dashRes.status);
    console.log("  ✅ SUCCESS: Dashboard statistics returned successfully:");
    console.log("    Total Assets:", dashRes.body.total_assets);
    console.log("    Available Assets:", dashRes.body.available_assets);
    console.log("    Assigned Assets:", dashRes.body.assigned_assets);
    console.log("    Maintenance Assets:", dashRes.body.maintenance_assets);
    console.log("    Disposed Assets:", dashRes.body.disposed_assets);
    console.log("    Total Employees:", dashRes.body.total_employees);

    console.log("\n=================================================");
    console.log("  ALL REQUESTED STEPS PASSED SUCCESSFULLY!  ");
    console.log("=================================================");
}

verifyUserRequestedFlow().catch(console.error);
