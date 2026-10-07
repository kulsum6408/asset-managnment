/**
 * Phase 3 Test Script — PDF / Excel / CSV Report Export
 * Run: node test_phase3.js
 */

require("dotenv").config();
const http = require("http");

function httpRequest(method, path, body = null, token = null) {
    return new Promise((resolve, reject) => {
        const data = body ? JSON.stringify(body) : null;
        const headers = {};
        if (data) {
            headers["Content-Type"] = "application/json";
            headers["Content-Length"] = Buffer.byteLength(data);
        }
        if (token) headers["Authorization"] = "Bearer " + token;

        const req = http.request({
            hostname: "localhost",
            port: process.env.PORT || 5000,
            path,
            method,
            headers,
        }, (res) => {
            const chunks = [];
            res.on("data", chunk => chunks.push(chunk));
            res.on("end", () => {
                const buffer = Buffer.concat(chunks);
                const contentType = res.headers["content-type"] || "";
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    contentType,
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

function pass(title, detail = "") {
    passCount++;
    console.log(`  ✅ [PASS] ${title}${detail ? " -> " + detail : ""}`);
}

function fail(title, detail = "") {
    failCount++;
    console.log(`  ❌ [FAIL] ${title}${detail ? " -> " + detail : ""}`);
}

async function runPhase3Tests() {
    console.log("=======================================================");
    console.log("  PHASE 3 VERIFICATION: PDF / EXCEL / CSV REPORT EXPORT");
    console.log("=======================================================\n");

    // 1. Login
    let token = null;
    try {
        const loginRes = await httpRequest("POST", "/api/auth/login", {
            email: "admin@gmail.com",
            password: "admin123"
        });
        if (loginRes.status === 200) {
            const json = JSON.parse(loginRes.bodyText);
            token = json.token;
            pass("Authentication", "Admin login successful, JWT obtained");
        } else {
            fail("Authentication", loginRes.bodyText);
            process.exit(1);
        }
    } catch (err) {
        fail("Authentication", err.message);
        process.exit(1);
    }

    // 2. Test CSV Export: GET /api/reports/export/csv
    const csvRes = await httpRequest("GET", "/api/reports/export/csv?type=assets", null, token);
    if (csvRes.status === 200 && csvRes.contentType.includes("csv")) {
        pass("GET /api/reports/export/csv", `Content-Type: ${csvRes.contentType}, Length: ${csvRes.buffer.length} bytes`);
        if (!csvRes.bodyText.includes("password") && !csvRes.bodyText.includes("jwt_secret")) {
            pass("CSV Security Check", "No sensitive credentials in CSV export");
        } else {
            fail("CSV Security Check", "Found sensitive field in CSV");
        }
    } else {
        fail("GET /api/reports/export/csv", `Status: ${csvRes.status}, Content-Type: ${csvRes.contentType}`);
    }

    // 3. Test Excel Export: GET /api/reports/export/excel
    const excelRes = await httpRequest("GET", "/api/reports/export/excel?type=assets", null, token);
    if (excelRes.status === 200 && excelRes.contentType.includes("excel")) {
        pass("GET /api/reports/export/excel", `Content-Type: ${excelRes.contentType}, Length: ${excelRes.buffer.length} bytes`);
        if (!excelRes.bodyText.includes("password")) {
            pass("Excel Security Check", "No sensitive credentials in Excel export");
        } else {
            fail("Excel Security Check", "Found sensitive field in Excel XML");
        }
    } else {
        fail("GET /api/reports/export/excel", `Status: ${excelRes.status}, Content-Type: ${excelRes.contentType}`);
    }

    // 4. Test PDF Export: GET /api/reports/export/pdf
    const pdfRes = await httpRequest("GET", "/api/reports/export/pdf?type=assets", null, token);
    if (pdfRes.status === 200 && pdfRes.contentType.includes("pdf")) {
        pass("GET /api/reports/export/pdf", `Content-Type: ${pdfRes.contentType}, Length: ${pdfRes.buffer.length} bytes`);
        if (pdfRes.buffer.toString("binary").startsWith("%PDF-1.4")) {
            pass("PDF Spec Verification", "Valid PDF 1.4 header bytes detected");
        } else {
            fail("PDF Spec Verification", "Invalid PDF format header");
        }
    } else {
        fail("GET /api/reports/export/pdf", `Status: ${pdfRes.status}, Content-Type: ${pdfRes.contentType}`);
    }

    console.log("\n=======================================================");
    console.log(`  PHASE 3 VERIFICATION RESULTS`);
    console.log(`  PASSED: ${passCount}`);
    console.log(`  FAILED: ${failCount}`);
    console.log("=======================================================\n");

    if (failCount === 0) process.exit(0);
    else process.exit(1);
}

runPhase3Tests().catch((err) => {
    console.error("Test Error:", err);
    process.exit(1);
});
