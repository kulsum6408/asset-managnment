const axios = require("axios");
const BASE = "http://localhost:5000/api";
const api = axios.create({ baseURL: BASE, headers: { "Content-Type": "application/json" } });

let employeeToken, managerToken, officerToken;
let employeeUser, managerUser, officerUser;

const log = (msg) => console.log(`  ${msg}`);
const pass = (msg) => console.log(`  ✅ PASS: ${msg}`);
const fail = (msg) => { console.log(`  ❌ FAIL: ${msg}`); process.exitCode = 1; };

async function login(email, password) {
    const res = await api.post("/auth/login", { email, password });
    return res.data;
}

async function run() {
    console.log("\n========================================");
    console.log("  ASSET OFFICER ASSIGNMENT WORKFLOW TEST");
    console.log("========================================\n");

    // Login
    const emp = await login("employee@assets.com", "employee123");
    employeeToken = emp.token; employeeUser = emp.user;
    const mgr = await login("manager@assets.com", "manager123");
    managerToken = mgr.token; managerUser = mgr.user;
    const off = await login("assetofficer@assets.com", "officer123");
    officerToken = off.token; officerUser = off.user;
    pass(`Logged in: ${employeeUser.name}(emp), ${managerUser.name}(mgr), ${officerUser.name}(off)`);

    // STEP 1: Find available asset
    const assetsRes = await api.get("/assets", { headers: { Authorization: `Bearer ${officerToken}` } });
    const assets = assetsRes.data.data || assetsRes.data;
    const available = assets.filter(a => a.status === "Available");
    if (!available.length) { fail("No available assets found"); return; }
    const asset = available[0];
    pass(`Available asset: "${asset.asset_name}" (ID=${asset.asset_id}, S/N=${asset.serial_number || "none"})`);

    // STEP 2: Employee request
    const returnDate = new Date(); returnDate.setDate(returnDate.getDate() + 30);
    const reqRes = await api.post("/requests", {
        asset_id: asset.asset_id,
        reason: "Need laptop for development",
        expected_return_date: returnDate.toISOString().split("T")[0]
    }, { headers: { Authorization: `Bearer ${employeeToken}` } });
    const reqId = reqRes.data.request_id;
    pass(`Request created: ID=${reqId}`);

    // STEP 3: Before approval, employee should see Pending
    let requests = await api.get("/requests", { headers: { Authorization: `Bearer ${employeeToken}` } });
    let myReqs = requests.data.data || requests.data;
    let myReq = myReqs.find(r => r.request_id === reqId);
    if (!myReq || myReq.status !== "Pending") fail("Request not Pending for employee");
    else pass("Employee sees request as Pending in My Requests");

    // STEP 4: Manager approves
    await api.put(`/requests/${reqId}/approve`, { remarks: "OK" }, { headers: { Authorization: `Bearer ${managerToken}` } });
    pass("Manager approved request");

    // Verify approved_at is set
    requests = await api.get("/requests", { headers: { Authorization: `Bearer ${officerToken}` } });
    let allReqs = requests.data.data || requests.data;
    let apprReq = allReqs.find(r => r.request_id === reqId);
    log(`Approved_at: ${apprReq.approved_at || "MISSING"}`);
    if (apprReq.approved_at) pass("Request has approved_at timestamp");
    else fail("Request missing approved_at");

    // STEP 5: Asset Officer sees only Approved requests
    const officerView = await api.get("/requests", { headers: { Authorization: `Bearer ${officerToken}` } });
    const officerReqs = officerView.data.data || officerView.data;
    const approvedOnes = officerReqs.filter(r => String(r.status).toLowerCase() === "approved");
    const hasOurApproved = approvedOnes.some(r => r.request_id === reqId);
    if (hasOurApproved) pass("Asset Officer sees the Approved request in list");
    else fail("Approved request not visible to Asset Officer");

    // STEP 6: Assign asset
    const assignRes = await api.post("/assignments", {
        user_id: employeeUser.user_id,
        asset_id: asset.asset_id,
        request_id: reqId,
        assignment_date: new Date().toISOString(),
        expected_return_date: returnDate.toISOString().split("T")[0],
        notes: "Assignment from approved request"
    }, { headers: { Authorization: `Bearer ${officerToken}` } });
    const assignId = assignRes.data.assignment_id;
    pass(`Assignment created: ID=${assignId}`);

    // STEP 7: Request status now Assigned (no longer Approved)
    requests = await api.get("/requests", { headers: { Authorization: `Bearer ${officerToken}` } });
    allReqs = requests.data.data || requests.data;
    const updatedReq = allReqs.find(r => r.request_id === reqId);
    log(`Request ${reqId} status after assign: ${updatedReq.status}`);
    if (String(updatedReq.status).toLowerCase() === "assigned") pass("Request status changed to Assigned (no longer in Approved list)");
    else fail(`Request status is "${updatedReq.status}", expected "Assigned"`);

    // STEP 8: approved requests list no longer contains this request
    const approvedAfter = allReqs.filter(r => String(r.status).toLowerCase() === "approved");
    const stillThere = approvedAfter.some(r => r.request_id === reqId);
    if (!stillThere) pass("Assigned request no longer appears in Approved/Assignable list");
    else fail("Assigned request still appears as Approved");

    // STEP 9: Asset is Assigned
    const assetAfter = await api.get(`/assets/${asset.asset_id}`, { headers: { Authorization: `Bearer ${officerToken}` } });
    if (assetAfter.data.status === "Assigned") pass("Asset status is Assigned");
    else fail(`Asset status is "${assetAfter.data.status}"`);

    // STEP 10: Bin Card OUT -1 recorded once
    const binRes = await api.get(`/bin-card/asset/${asset.asset_id}`, { headers: { Authorization: `Bearer ${officerToken}` } });
    const binTxs = binRes.data.data || [];
    const outTxns = binTxs.filter(t => t.transaction_type === "OUT" && t.reference_id === assignId);
    log(`OUT transactions for this assignment: ${outTxns.length}`);
    if (outTxns.length === 1) {
        log(`  Quantity: ${outTxns[0].quantity}`);
        if (Number(outTxns[0].quantity) === -1) pass("Bin Card OUT -1 recorded exactly once");
        else fail(`Bin Card quantity is ${outTxns[0].quantity}, expected -1`);
    } else {
        fail(`Expected exactly 1 OUT transaction, found ${outTxns.length}`);
    }

    // STEP 11: Employee notified
    const notifs = await api.get("/notifications", { headers: { Authorization: `Bearer ${employeeToken}` } });
    const assignedNotif = (notifs.data || []).some(n =>
        n.user_id === employeeUser.user_id &&
        (n.title.includes("Assigned") || n.title === "Asset Assigned")
    );
    if (assignedNotif) pass("Employee received Asset Assigned notification");
    else fail("Employee did not receive assignment notification");

    // STEP 12: Assignment saved in DATETIME format
    const assignDetails = await api.get(`/assignments/${assignId}`, { headers: { Authorization: `Bearer ${officerToken}` } });
    const ad = assignDetails.data.assignment_date;
    log(`assignment_date value: ${ad}`);
    const datetimePattern = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}/;
    // MySQL DATETIME may come back as "YYYY-MM-DDTHH:mm:ss.000Z" via JS Date serialization
    if (ad && /\d{2}:\d{2}:\d{2}/.test(ad)) pass(`assignment_date includes time component (DATETIME): ${ad}`);
    else fail(`assignment_date missing time: "${ad}"`);

    // STEP 13: Backend rejects assigning a non-approved request
    // Create a new Pending request and try to assign it directly
    const repl = available[1] || available[0];
    const pendReq = await api.post("/requests", {
        asset_id: repl.asset_id,
        reason: "Pending test - should not be assignable"
    }, { headers: { Authorization: `Bearer ${employeeToken}` } });
    const pendId = pendReq.data.request_id;

    try {
        await api.post("/assignments", {
            user_id: employeeUser.user_id,
            asset_id: repl.asset_id,
            request_id: pendId,
            assignment_date: new Date().toISOString(),
            expected_return_date: returnDate.toISOString().split("T")[0]
        }, { headers: { Authorization: `Bearer ${officerToken}` } });
        fail("Backend allowed assignment of Pending request (should be rejected)");
    } catch (err) {
        if (err.response) {
            const msg = err.response.data?.error || "";
            log(`  Backend rejected assignment error: "${msg}"`);
            if (msg.includes("approved") && msg.includes("Pending")) pass("Backend correctly rejected assigning a Pending request");
            else fail(`Backend rejected but message unclear: "${msg}"`);
        } else {
            fail("Unexpected error: " + err.message);
        }
    }

    console.log("\n========================================");
    console.log("  ASSIGNMENT WORKFLOW TEST COMPLETE");
    console.log("========================================\n");
}

run().catch(err => {
    console.error("Test error:", err.message);
    if (err.response) console.error("Response:", JSON.stringify(err.response.data));
    process.exitCode = 1;
});
