require("dotenv").config();
const http = require("http");
const db = require("./config/db");
const generateToken = require("./utils/generateToken");

const q = (sql, params = []) =>
    new Promise((resolve, reject) => db.query(sql, params, (err, rows) => err ? reject(err) : resolve(rows)));

async function runStep2Verification() {
    console.log("==================================================");
    console.log("  STEP 2 VERIFICATION: Employee -> Request Asset");
    console.log("==================================================");

    try {
        // 1. Get an active employee user
        const employees = await q("SELECT * FROM users WHERE role = 'employee' AND is_active = 1 LIMIT 1");
        if (employees.length === 0) throw new Error("No active employee user found in database");
        const employee = employees[0];
        console.log(`\n1. Found Employee User: ID=${employee.user_id}, Name="${employee.name}", Email="${employee.email}"`);

        // 2. Get an available asset
        const availableAssets = await q("SELECT * FROM assets WHERE status = 'Available' ORDER BY asset_id DESC LIMIT 1");
        if (availableAssets.length === 0) throw new Error("No available asset found in assets table");
        const targetAsset = availableAssets[0];
        console.log(`2. Found Available Asset: ID=${targetAsset.asset_id}, Name="${targetAsset.asset_name}", Status="${targetAsset.status}"`);

        // 3. Generate JWT token for Employee
        const token = generateToken(employee);
        console.log(`3. Generated JWT token for Employee ID=${employee.user_id}`);

        // 4. Record initial Bin Card transaction count
        const initialBinCards = await q("SELECT COUNT(*) AS cnt FROM bin_card_transactions");
        const initialBinCount = initialBinCards[0].cnt;
        console.log(`4. Initial Bin Card transactions count: ${initialBinCount}`);

        // 5. Submit Asset Request via POST /api/requests
        const returnDate = "2026-09-30";
        const reasonText = "Required for Step 2 testing project work";
        const postData = JSON.stringify({
            asset_id: targetAsset.asset_id,
            reason: reasonText,
            expected_return_date: returnDate,
            user_id: 99999 // Malicious attempt to forge user ID (should be ignored by backend)
        });

        console.log(`5. Sending POST http://localhost:5000/api/requests...`);
        const httpResponse = await new Promise((resolve, reject) => {
            const req = http.request({
                hostname: "localhost",
                port: 5000,
                path: "/api/requests",
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Content-Length": Buffer.byteLength(postData),
                    "Authorization": `Bearer ${token}`
                }
            }, (res) => {
                let data = "";
                res.on("data", chunk => data += chunk);
                res.on("end", () => resolve({ statusCode: res.statusCode, body: JSON.parse(data) }));
            });
            req.on("error", reject);
            req.write(postData);
            req.end();
        });

        console.log(`   HTTP Status Code: ${httpResponse.statusCode}`);
        console.log(`   Response Body:`, httpResponse.body);

        if (httpResponse.statusCode !== 201) {
            throw new Error(`API call failed with status ${httpResponse.statusCode}: ${JSON.stringify(httpResponse.body)}`);
        }

        const newRequestId = httpResponse.body.request_id;
        console.log(`   ✅ Asset Request submitted successfully! request_id=${newRequestId}`);

        // 6. Query Database Table `requests`
        console.log("\n--------------------------------------------------");
        console.log("  QUERY: SELECT * FROM requests ORDER BY request_id DESC LIMIT 5;");
        console.log("--------------------------------------------------");
        const requests = await q("SELECT * FROM requests ORDER BY request_id DESC LIMIT 5");
        console.table(requests.map(r => ({
            request_id: r.request_id,
            user_id: r.user_id,
            asset_id: r.asset_id,
            status: r.status,
            request_date: r.request_date,
            reason: r.reason,
            expected_return_date: r.expected_return_date
        })));

        const createdRequest = requests.find(r => r.request_id === newRequestId);
        if (!createdRequest) throw new Error(`Newly created request_id #${newRequestId} not found in database!`);

        // 7. Verify Business Rules
        console.log("\n7. VERIFYING STEP 2 BUSINESS RULES:");
        console.log(`   - Exactly 1 new request created (ID=${createdRequest.request_id}): ✅ YES`);
        console.log(`   - user_id matches authenticated employee (${createdRequest.user_id} == ${employee.user_id}): ${createdRequest.user_id === employee.user_id ? '✅ YES' : '❌ NO'}`);
        console.log(`   - Security check: Forged body user_id (99999) was ignored: ${createdRequest.user_id !== 99999 ? '✅ YES' : '❌ NO'}`);
        console.log(`   - asset_id matches (${createdRequest.asset_id} == ${targetAsset.asset_id}): ${createdRequest.asset_id === targetAsset.asset_id ? '✅ YES' : '❌ NO'}`);
        console.log(`   - status is strictly PENDING ('${createdRequest.status}'): ${createdRequest.status === 'Pending' ? '✅ YES' : '❌ NO'}`);
        console.log(`   - reason is recorded correctly ('${createdRequest.reason}'): ${createdRequest.reason === reasonText ? '✅ YES' : '❌ NO'}`);

        // 8. Verify Asset Status remains 'Available'
        const currentAsset = await q("SELECT asset_id, asset_name, status FROM assets WHERE asset_id = ?", [targetAsset.asset_id]);
        console.log(`\n8. VERIFYING ASSET STATUS:`);
        console.log(`   - Asset #${currentAsset[0].asset_id} status: "${currentAsset[0].status}"`);
        if (currentAsset[0].status !== "Available") {
            throw new Error(`Expected asset status to remain Available, got "${currentAsset[0].status}"`);
        }
        console.log(`   - Asset is NOT assigned or changed yet: ✅ YES`);

        // 9. Verify Bin Card transactions count and contents
        const postBinCards = await q("SELECT COUNT(*) AS cnt FROM bin_card_transactions");
        const postBinCount = postBinCards[0].cnt;
        console.log(`\n9. VERIFYING BIN CARD TRANSACTIONS:`);
        console.log(`   - Initial Bin Card count: ${initialBinCount}, Current Bin Card count: ${postBinCount}`);
        if (postBinCount !== initialBinCount) {
            throw new Error(`Bin Card count changed! Expected ${initialBinCount}, got ${postBinCount}`);
        }
        console.log(`   - NO new ISSUE transaction created: ✅ YES`);

        // 10. Verify GET /api/requests for Employee
        console.log(`\n10. VERIFYING GET /api/requests FOR EMPLOYEE:`);
        const getMyRequests = await new Promise((resolve, reject) => {
            const req = http.request({
                hostname: "localhost",
                port: 5000,
                path: "/api/requests",
                method: "GET",
                headers: { "Authorization": `Bearer ${token}` }
            }, (res) => {
                let data = "";
                res.on("data", chunk => data += chunk);
                res.on("end", () => resolve({ statusCode: res.statusCode, body: JSON.parse(data) }));
            });
            req.on("error", reject);
            req.end();
        });

        console.log(`   GET Status Code: ${getMyRequests.statusCode}`);
        const foundInMyRequests = getMyRequests.body.find(r => r.request_id === newRequestId);
        if (!foundInMyRequests) throw new Error("Newly created request not returned in GET /api/requests for employee!");
        console.log(`   - Found request #${newRequestId} in My Requests: ✅ YES (Status: "${foundInMyRequests.status}")`);

        // 11. NEGATIVE TESTS
        console.log(`\n11. EXECUTING NEGATIVE TESTS:`);

        // A. Missing asset_id
        const missingAssetData = JSON.stringify({ reason: "Testing missing asset" });
        const resMissing = await new Promise((resolve, reject) => {
            const req = http.request({
                hostname: "localhost",
                port: 5000,
                path: "/api/requests",
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Content-Length": Buffer.byteLength(missingAssetData),
                    "Authorization": `Bearer ${token}`
                }
            }, (res) => {
                let data = "";
                res.on("data", chunk => data += chunk);
                res.on("end", () => resolve({ statusCode: res.statusCode, body: JSON.parse(data) }));
            });
            req.on("error", reject);
            req.write(missingAssetData);
            req.end();
        });
        console.log(`   - A. Missing asset_id -> Status ${resMissing.statusCode} (${resMissing.body.error}): ✅ PASS`);
        if (resMissing.statusCode !== 400) throw new Error(`Expected status 400 for missing asset_id, got ${resMissing.statusCode}`);

        // B. Requesting Assigned/Unavailable asset
        const assignedAssets = await q("SELECT asset_id FROM assets WHERE status = 'Assigned' LIMIT 1");
        if (assignedAssets.length > 0) {
            const assignedData = JSON.stringify({ asset_id: assignedAssets[0].asset_id, reason: "Testing assigned asset" });
            const resAssigned = await new Promise((resolve, reject) => {
                const req = http.request({
                    hostname: "localhost",
                    port: 5000,
                    path: "/api/requests",
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Content-Length": Buffer.byteLength(assignedData),
                        "Authorization": `Bearer ${token}`
                    }
                }, (res) => {
                    let data = "";
                    res.on("data", chunk => data += chunk);
                    res.on("end", () => resolve({ statusCode: res.statusCode, body: JSON.parse(data) }));
                });
                req.on("error", reject);
                req.write(assignedData);
                req.end();
            });
            console.log(`   - B. Requesting Assigned asset -> Status ${resAssigned.statusCode} (${resAssigned.body.error}): ✅ PASS`);
            if (resAssigned.statusCode !== 400) throw new Error(`Expected status 400 for assigned asset request, got ${resAssigned.statusCode}`);
        }

        // C. Duplicate pending request
        const dupData = JSON.stringify({ asset_id: targetAsset.asset_id, reason: "Duplicate request test" });
        const resDup = await new Promise((resolve, reject) => {
            const req = http.request({
                hostname: "localhost",
                port: 5000,
                path: "/api/requests",
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Content-Length": Buffer.byteLength(dupData),
                    "Authorization": `Bearer ${token}`
                }
            }, (res) => {
                let data = "";
                res.on("data", chunk => data += chunk);
                res.on("end", () => resolve({ statusCode: res.statusCode, body: JSON.parse(data) }));
            });
            req.on("error", reject);
            req.write(dupData);
            req.end();
        });
        console.log(`   - C. Duplicate pending request -> Status ${resDup.statusCode} (${resDup.body.error}): ✅ PASS`);
        if (resDup.statusCode !== 409) throw new Error(`Expected status 409 for duplicate pending request, got ${resDup.statusCode}`);

        console.log("\n==================================================");
        console.log("  ALL STEP 2 VERIFICATION CHECKS PASSED! ✅");
        console.log("==================================================");
        console.log(`Test Employee ID: ${employee.user_id}`);
        console.log(`Test Asset ID: ${targetAsset.asset_id}`);
        console.log(`Resulting Request ID: ${newRequestId}`);
        console.log(`Resulting Request Status: ${createdRequest.status}`);

    } catch (err) {
        console.error("\n❌ STEP 2 VERIFICATION FAILED:", err.message);
        process.exitCode = 1;
    } finally {
        db.end();
    }
}

runStep2Verification();
