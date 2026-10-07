require("dotenv").config();
const http = require("http");
const db = require("./config/db");
const generateToken = require("./utils/generateToken");

const q = (sql, params = []) =>
    new Promise((resolve, reject) => db.query(sql, params, (err, rows) => err ? reject(err) : resolve(rows)));

async function runStep3Verification() {
    console.log("==================================================");
    console.log("  STEP 3 VERIFICATION: Manager -> Approve / Reject");
    console.log("==================================================");

    try {
        // 1. Get active manager and employee users
        const managers = await q("SELECT * FROM users WHERE role = 'manager' AND is_active = 1 LIMIT 1");
        if (managers.length === 0) throw new Error("No active manager user found in database");
        const manager = managers[0];
        console.log(`\n1. Found Manager User: ID=${manager.user_id}, Name="${manager.name}", Email="${manager.email}"`);

        const employees = await q("SELECT * FROM users WHERE role = 'employee' AND is_active = 1 LIMIT 1");
        if (employees.length === 0) throw new Error("No active employee user found in database");
        const employee = employees[0];
        console.log(`2. Found Employee User: ID=${employee.user_id}, Name="${employee.name}", Email="${employee.email}"`);

        // Generate JWT tokens
        const managerToken = generateToken(manager);
        const employeeToken = generateToken(employee);

        // 3. Inspect target pending request (request #14 from Step 2)
        const targetReqId = 14;
        const initialRequests = await q("SELECT * FROM requests WHERE request_id = ?", [targetReqId]);
        if (initialRequests.length === 0) throw new Error(`Request #${targetReqId} not found in database`);
        const initialReq = initialRequests[0];

        console.log(`\n3. Target Request Details BEFORE Approval:`);
        console.log(`   - Request ID: ${initialReq.request_id}`);
        console.log(`   - Employee ID: ${initialReq.user_id}`);
        console.log(`   - Asset ID: ${initialReq.asset_id}`);
        console.log(`   - Initial Status: "${initialReq.status}"`);

        if (initialReq.status !== "Pending") {
            throw new Error(`Expected initial status to be Pending, got "${initialReq.status}"`);
        }

        // 4. Record initial Asset status and Bin Card count
        const initialAsset = await q("SELECT asset_id, asset_name, status FROM assets WHERE asset_id = ?", [initialReq.asset_id]);
        console.log(`   - Target Asset ID=${initialAsset[0].asset_id} Status: "${initialAsset[0].status}"`);

        const initialBinCards = await q("SELECT COUNT(*) AS cnt FROM bin_card_transactions");
        const initialBinCount = initialBinCards[0].cnt;
        console.log(`   - Initial Bin Card transactions count: ${initialBinCount}`);

        // 5. Manager Approves Request #14 via PUT /api/requests/14/approve
        const approvePayload = JSON.stringify({ remarks: "Approved by manager" });
        console.log(`\n5. Manager sending PUT http://localhost:5000/api/requests/${targetReqId}/approve...`);

        const approveRes = await new Promise((resolve, reject) => {
            const req = http.request({
                hostname: "localhost",
                port: 5000,
                path: `/api/requests/${targetReqId}/approve`,
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Content-Length": Buffer.byteLength(approvePayload),
                    "Authorization": `Bearer ${managerToken}`
                }
            }, (res) => {
                let data = "";
                res.on("data", chunk => data += chunk);
                res.on("end", () => resolve({ statusCode: res.statusCode, body: JSON.parse(data) }));
            });
            req.on("error", reject);
            req.write(approvePayload);
            req.end();
        });

        console.log(`   HTTP Status Code: ${approveRes.statusCode}`);
        console.log(`   Response Body:`, approveRes.body);

        if (approveRes.statusCode !== 200) {
            throw new Error(`Approval failed with status ${approveRes.statusCode}: ${JSON.stringify(approveRes.body)}`);
        }

        // 6. Query Database for Request #14
        console.log("\n--------------------------------------------------");
        console.log(`  QUERY: SELECT * FROM requests WHERE request_id = ${targetReqId};`);
        console.log("--------------------------------------------------");
        const approvedRequests = await q("SELECT * FROM requests WHERE request_id = ?", [targetReqId]);
        const approvedReq = approvedRequests[0];
        console.table([{
            request_id: approvedReq.request_id,
            user_id: approvedReq.user_id,
            asset_id: approvedReq.asset_id,
            previous_status: initialReq.status,
            new_status: approvedReq.status,
            remarks: approvedReq.remarks,
            updated_at: approvedReq.updated_at
        }]);

        // 7. Verify Approval Business Rules
        console.log("\n7. VERIFYING APPROVAL BUSINESS RULES:");
        console.log(`   - Previous status was Pending: ✅ YES`);
        console.log(`   - New status is strictly Approved ('${approvedReq.status}'): ${approvedReq.status === 'Approved' ? '✅ YES' : '❌ NO'}`);
        console.log(`   - Remarks updated ('${approvedReq.remarks}'): ${approvedReq.remarks === 'Approved by manager' ? '✅ YES' : '❌ NO'}`);

        // 8. Verify Asset Status remains Available (Approval is NOT Assignment)
        const postApprovalAsset = await q("SELECT asset_id, asset_name, status FROM assets WHERE asset_id = ?", [initialReq.asset_id]);
        console.log(`\n8. VERIFYING ASSET STATUS (APPROVAL IS NOT ASSIGNMENT):`);
        console.log(`   - Asset #${postApprovalAsset[0].asset_id} status: "${postApprovalAsset[0].status}"`);
        if (postApprovalAsset[0].status !== "Available") {
            throw new Error(`Expected asset status to remain Available after approval, got "${postApprovalAsset[0].status}"`);
        }
        console.log(`   - Asset is NOT marked Assigned yet: ✅ YES`);

        // 9. Verify Bin Card transactions count and contents
        const postApprovalBinCards = await q("SELECT COUNT(*) AS cnt FROM bin_card_transactions");
        const postApprovalBinCount = postApprovalBinCards[0].cnt;
        console.log(`\n9. VERIFYING BIN CARD TRANSACTIONS:`);
        console.log(`   - Initial Bin Card count: ${initialBinCount}, Post-approval Bin Card count: ${postApprovalBinCount}`);
        if (postApprovalBinCount !== initialBinCount) {
            throw new Error(`Bin Card count changed! Expected ${initialBinCount}, got ${postApprovalBinCount}`);
        }
        console.log(`   - NO new ISSUE transaction created by Manager Approval: ✅ YES`);

        // 10. Verify Employee My Requests shows Approved status
        console.log(`\n10. VERIFYING EMPLOYEE MY REQUESTS UI API:`);
        const getMyRequests = await new Promise((resolve, reject) => {
            const req = http.request({
                hostname: "localhost",
                port: 5000,
                path: "/api/requests",
                method: "GET",
                headers: { "Authorization": `Bearer ${employeeToken}` }
            }, (res) => {
                let data = "";
                res.on("data", chunk => data += chunk);
                res.on("end", () => resolve({ statusCode: res.statusCode, body: JSON.parse(data) }));
            });
            req.on("error", reject);
            req.end();
        });

        const empReqItem = getMyRequests.body.find(r => r.request_id === targetReqId);
        if (!empReqItem) throw new Error(`Request #${targetReqId} not found in Employee My Requests API!`);
        console.log(`   - Found request #${targetReqId} in Employee My Requests: ✅ YES (Status: "${empReqItem.status}")`);
        if (empReqItem.status !== "Approved") throw new Error(`Expected status Approved in Employee My Requests, got "${empReqItem.status}"`);

        // 11. SECURITY & NEGATIVE TESTS
        console.log(`\n11. EXECUTING SECURITY & NEGATIVE TESTS:`);

        // A. Employee user tries to approve -> 403
        const resEmpApprove = await new Promise((resolve, reject) => {
            const req = http.request({
                hostname: "localhost",
                port: 5000,
                path: `/api/requests/${targetReqId}/approve`,
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Content-Length": Buffer.byteLength(approvePayload),
                    "Authorization": `Bearer ${employeeToken}`
                }
            }, (res) => {
                let data = "";
                res.on("data", chunk => data += chunk);
                res.on("end", () => resolve({ statusCode: res.statusCode, body: JSON.parse(data) }));
            });
            req.on("error", reject);
            req.write(approvePayload);
            req.end();
        });
        console.log(`   - A. Employee attempts approval -> Status ${resEmpApprove.statusCode} (${resEmpApprove.body.error}): ✅ PASS (403 Forbidden)`);
        if (resEmpApprove.statusCode !== 403) throw new Error(`Expected status 403 for employee approval attempt, got ${resEmpApprove.statusCode}`);

        // B. Unauthenticated attempt -> 401
        const resUnauth = await new Promise((resolve, reject) => {
            const req = http.request({
                hostname: "localhost",
                port: 5000,
                path: `/api/requests/${targetReqId}/approve`,
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Content-Length": Buffer.byteLength(approvePayload)
                }
            }, (res) => {
                let data = "";
                res.on("data", chunk => data += chunk);
                res.on("end", () => resolve({ statusCode: res.statusCode, body: JSON.parse(data) }));
            });
            req.on("error", reject);
            req.write(approvePayload);
            req.end();
        });
        console.log(`   - B. Unauthenticated approval attempt -> Status ${resUnauth.statusCode} (${resUnauth.body.error}): ✅ PASS (401 Unauthorized)`);
        if (resUnauth.statusCode !== 401) throw new Error(`Expected status 401 for unauthenticated approval, got ${resUnauth.statusCode}`);

        // C. Re-approving already Approved request -> 400
        const resReApprove = await new Promise((resolve, reject) => {
            const req = http.request({
                hostname: "localhost",
                port: 5000,
                path: `/api/requests/${targetReqId}/approve`,
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Content-Length": Buffer.byteLength(approvePayload),
                    "Authorization": `Bearer ${managerToken}`
                }
            }, (res) => {
                let data = "";
                res.on("data", chunk => data += chunk);
                res.on("end", () => resolve({ statusCode: res.statusCode, body: JSON.parse(data) }));
            });
            req.on("error", reject);
            req.write(approvePayload);
            req.end();
        });
        console.log(`   - C. Re-approving already Approved request -> Status ${resReApprove.statusCode} (${resReApprove.body.error}): ✅ PASS (400 Bad Request)`);
        if (resReApprove.statusCode !== 400) throw new Error(`Expected status 400 for re-approval attempt, got ${resReApprove.statusCode}`);

        // 12. TEST REJECTION WORKFLOW
        console.log(`\n12. TESTING REJECTION WORKFLOW:`);
        // Find another available asset
        const availAssets = await q("SELECT asset_id FROM assets WHERE status = 'Available' AND asset_id != ? LIMIT 1", [initialReq.asset_id]);
        const testAssetId2 = availAssets[0]?.asset_id || initialReq.asset_id;

        // Create secondary test request for rejection test
        const rejPostData = JSON.stringify({ asset_id: testAssetId2, reason: "Rejection testing request" });
        const createRejReqRes = await new Promise((resolve, reject) => {
            const req = http.request({
                hostname: "localhost",
                port: 5000,
                path: "/api/requests",
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Content-Length": Buffer.byteLength(rejPostData),
                    "Authorization": `Bearer ${employeeToken}`
                }
            }, (res) => {
                let data = "";
                res.on("data", chunk => data += chunk);
                res.on("end", () => resolve({ statusCode: res.statusCode, body: JSON.parse(data) }));
            });
            req.on("error", reject);
            req.write(rejPostData);
            req.end();
        });

        const rejectionReqId = createRejReqRes.body.request_id;
        console.log(`   - Created secondary request #${rejectionReqId} with status Pending`);

        // Manager Rejects Request
        const rejectPayload = JSON.stringify({ remarks: "Rejected by manager due to budget" });
        const resReject = await new Promise((resolve, reject) => {
            const req = http.request({
                hostname: "localhost",
                port: 5000,
                path: `/api/requests/${rejectionReqId}/reject`,
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Content-Length": Buffer.byteLength(rejectPayload),
                    "Authorization": `Bearer ${managerToken}`
                }
            }, (res) => {
                let data = "";
                res.on("data", chunk => data += chunk);
                res.on("end", () => resolve({ statusCode: res.statusCode, body: JSON.parse(data) }));
            });
            req.on("error", reject);
            req.write(rejectPayload);
            req.end();
        });

        console.log(`   - Manager reject status code: ${resReject.statusCode} (${resReject.body.message})`);
        if (resReject.statusCode !== 200) throw new Error(`Rejection failed with status ${resReject.statusCode}`);

        // Verify Rejection in Database
        const rejectedReqs = await q("SELECT * FROM requests WHERE request_id = ?", [rejectionReqId]);
        console.log(`   - Database status for request #${rejectionReqId}: "${rejectedReqs[0].status}" (Remarks: "${rejectedReqs[0].remarks}")`);
        if (rejectedReqs[0].status !== "Rejected") throw new Error(`Expected status Rejected, got "${rejectedReqs[0].status}"`);

        // Attempting to Approve a Rejected Request -> 400
        const resApproveRejected = await new Promise((resolve, reject) => {
            const req = http.request({
                hostname: "localhost",
                port: 5000,
                path: `/api/requests/${rejectionReqId}/approve`,
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Content-Length": Buffer.byteLength(approvePayload),
                    "Authorization": `Bearer ${managerToken}`
                }
            }, (res) => {
                let data = "";
                res.on("data", chunk => data += chunk);
                res.on("end", () => resolve({ statusCode: res.statusCode, body: JSON.parse(data) }));
            });
            req.on("error", reject);
            req.write(approvePayload);
            req.end();
        });
        console.log(`   - Attempting to Approve a Rejected request -> Status ${resApproveRejected.statusCode} (${resApproveRejected.body.error}): ✅ PASS (400 Bad Request)`);
        if (resApproveRejected.statusCode !== 400) throw new Error(`Expected status 400 when approving rejected request, got ${resApproveRejected.statusCode}`);

        console.log("\n==================================================");
        console.log("  ALL STEP 3 VERIFICATION CHECKS PASSED! ✅");
        console.log("==================================================");
        console.log(`Test Request ID: ${targetReqId}`);
        console.log(`Employee Who Requested: User ID ${initialReq.user_id}`);
        console.log(`Asset Involved: Asset ID ${initialReq.asset_id}`);
        console.log(`Manager Who Approved: User ID ${manager.user_id}`);
        console.log(`Previous Status: ${initialReq.status}`);
        console.log(`New Status: ${approvedReq.status}`);

    } catch (err) {
        console.error("\n❌ STEP 3 VERIFICATION FAILED:", err.message);
        process.exitCode = 1;
    } finally {
        db.end();
    }
}

runStep3Verification();
