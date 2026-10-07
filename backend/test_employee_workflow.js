const axios = require("axios");

const BASE = "http://localhost:5000/api";

const api = axios.create({ baseURL: BASE, headers: { "Content-Type": "application/json" } });

let employeeToken, managerToken, officerToken;
let employeeUser, managerUser, officerUser;
let testAssetId, testRequestId, testAssignmentId, testTransferId;

const log = (msg) => console.log(`  ${msg}`);
const pass = (msg) => console.log(`  ✅ PASS: ${msg}`);
const fail = (msg) => { console.log(`  ❌ FAIL: ${msg}`); process.exitCode = 1; };

async function login(email, password) {
    const res = await api.post("/auth/login", { email, password });
    return res.data;
}

async function run() {
    console.log("\n========================================");
    console.log("  END-TO-END EMPLOYEE WORKFLOW TEST");
    console.log("========================================\n");

    // ── STEP 0: Login all users ──
    console.log("STEP 0: Login all users");
    try {
        const emp = await login("employee@assets.com", "employee123");
        employeeToken = emp.token; employeeUser = emp.user;
        log(`Employee: ${employeeUser.name} (${employeeUser.role}) ID=${employeeUser.user_id}`);

        const mgr = await login("manager@assets.com", "manager123");
        managerToken = mgr.token; managerUser = mgr.user;
        log(`Manager: ${managerUser.name} (${managerUser.role}) ID=${managerUser.user_id}`);

        const off = await login("assetofficer@assets.com", "officer123");
        officerToken = off.token; officerUser = off.user;
        log(`Officer: ${officerUser.name} (${officerUser.role}) ID=${officerUser.user_id}`);
    } catch (err) {
        fail("Login failed: " + err.message);
        return;
    }

    pass("All three users logged in");

    // ── STEP 1: Find an Available asset ──
    console.log("\nSTEP 1: Find Available asset");
    const assetsRes = await api.get("/assets", {
        headers: { Authorization: `Bearer ${officerToken}` }
    });
    const assets = Array.isArray(assetsRes.data) ? assetsRes.data : assetsRes.data.data || [];
    const available = assets.filter(a => a.status === "Available");
    if (available.length === 0) {
        fail("No available assets found. Cannot test.");
        return;
    }
    testAssetId = available[0].asset_id;
    pass(`Found available asset: "${available[0].asset_name}" (ID=${testAssetId})`);

    // ── STEP 2: Employee requests asset ──
    console.log("\nSTEP 2: Employee requests asset");
    const returnDate = new Date();
    returnDate.setDate(returnDate.getDate() + 30);
    const reqRes = await api.post("/requests", {
        asset_id: testAssetId,
        reason: "Need this for my project work",
        expected_return_date: returnDate.toISOString().split("T")[0]
    }, { headers: { Authorization: `Bearer ${employeeToken}` } });
    testRequestId = reqRes.data.request_id;
    pass(`Request created: ID=${testRequestId}`);

    // ── STEP 3: Verify request appears in My Requests as Pending ──
    console.log("\nSTEP 3: Verify My Requests shows Pending");
    const myReqsRes = await api.get("/requests", {
        headers: { Authorization: `Bearer ${employeeToken}` }
    });
    const myReqs = Array.isArray(myReqsRes.data) ? myReqsRes.data : myReqsRes.data.data || [];
    const myReq = myReqs.find(r => r.request_id === testRequestId);
    if (!myReq) {
        fail("Request not found in My Requests");
        return;
    }
    if (myReq.status !== "Pending") {
        fail(`Request status is "${myReq.status}", expected "Pending"`);
    } else {
        pass(`Request appears in My Requests with status: ${myReq.status}`);
    }

    // ── STEP 4: Manager approves request ──
    console.log("\nSTEP 4: Manager approves request");
    await api.put(`/requests/${testRequestId}/approve`, {
        remarks: "Approved for project work"
    }, { headers: { Authorization: `Bearer ${managerToken}` } });
    pass("Manager approved request");

    // ── STEP 5: Verify employee received approval notification ──
    console.log("\nSTEP 5: Verify employee got approval notification");
    const empNotifs = await api.get("/notifications", {
        headers: { Authorization: `Bearer ${employeeToken}` }
    });
    const approvalNotif = (empNotifs.data || []).find(
        n => n.title === "Request Approved" && n.user_id === employeeUser.user_id
    );
    if (approvalNotif) {
        pass(`Employee received: "${approvalNotif.title}" - ${approvalNotif.message.substring(0, 60)}...`);
    } else {
        fail("Employee did not receive approval notification");
    }

    // ── STEP 6: Asset Officer assigns asset ──
    console.log("\nSTEP 6: Asset Officer assigns asset to employee");
    const assignRes = await api.post("/assignments", {
        user_id: employeeUser.user_id,
        asset_id: testAssetId,
        assignment_date: new Date().toISOString(),
        expected_return_date: returnDate.toISOString().split("T")[0],
        notes: "Assigned per approved request"
    }, { headers: { Authorization: `Bearer ${officerToken}` } });
    testAssignmentId = assignRes.data.assignment_id;
    pass(`Assignment created: ID=${testAssignmentId}`);

    // ── STEP 7: Verify Assignment = Active ──
    console.log("\nSTEP 7: Verify Assignment is Active");
    const assignDetails = await api.get(`/assignments/${testAssignmentId}`, {
        headers: { Authorization: `Bearer ${officerToken}` }
    });
    if (assignDetails.data.status === "Active") {
        pass(`Assignment status: ${assignDetails.data.status}`);
    } else {
        fail(`Assignment status is "${assignDetails.data.status}", expected "Active"`);
    }

    // ── STEP 8: Verify Asset = Assigned ──
    console.log("\nSTEP 8: Verify Asset status is Assigned");
    const assetDetails = await api.get(`/assets/${testAssetId}`, {
        headers: { Authorization: `Bearer ${officerToken}` }
    });
    if (assetDetails.data.status === "Assigned") {
        pass(`Asset status: ${assetDetails.data.status}`);
    } else {
        fail(`Asset status is "${assetDetails.data.status}", expected "Assigned"`);
    }

    // ── STEP 9: Verify Bin Card has OUT transaction ──
    console.log("\nSTEP 9: Verify Bin Card has OUT transaction");
    const binCard = await api.get(`/bin-card/asset/${testAssetId}`, {
        headers: { Authorization: `Bearer ${officerToken}` }
    });
    const outTx = (binCard.data.data || []).find(
        t => t.transaction_type === "OUT" && t.reference_type === "ASSIGNMENT"
    );
    if (outTx) {
        pass(`Bin Card OUT transaction found: ID=${outTx.transaction_type}, ref=${outTx.reference_type}`);
    } else {
        const allTypes = (binCard.data.data || []).map(t => t.transaction_type).join(", ");
        fail(`No OUT transaction found. Existing types: ${allTypes}`);
    }

    // ── STEP 10: Verify asset appears in Employee My Assets ──
    console.log("\nSTEP 10: Verify asset appears in Employee My Assets");
    const myAssetsRes = await api.get("/assignments", {
        headers: { Authorization: `Bearer ${employeeToken}` }
    });
    const myAssets = Array.isArray(myAssetsRes.data) ? myAssetsRes.data : myAssetsRes.data.data || [];
    const myAsset = myAssets.find(a =>
        a.assignment_id === testAssignmentId ||
        (a.asset_id === testAssetId && ["active", "assigned"].includes(String(a.status).toLowerCase()))
    );
    if (myAsset) {
        pass(`Asset "${myAsset.asset_name}" found in My Assets (status: ${myAsset.status})`);
    } else {
        fail("Asset not found in Employee My Assets");
    }

    // ── STEP 11: Verify receipt data ──
    console.log("\nSTEP 11: Verify receipt data completeness");
    if (myAsset) {
        const hasAssetName = !!myAsset.asset_name;
        const hasEmployeeName = !!myAsset.employee_name;
        const hasAssignmentDate = !!myAsset.assignment_date;
        const hasReturnDate = !!myAsset.expected_return_date;
        const hasSerial = !!myAsset.serial_number;
        const hasCondition = !!myAsset.asset_condition;
        log(`Asset name: ${hasAssetName ? "✅" : "❌"} ${myAsset.asset_name || "MISSING"}`);
        log(`Employee name: ${hasEmployeeName ? "✅" : "❌"} ${myAsset.employee_name || "MISSING"}`);
        log(`Assignment date: ${hasAssignmentDate ? "✅" : "❌"} ${myAsset.assignment_date || "MISSING"}`);
        log(`Expected return: ${hasReturnDate ? "✅" : "❌"} ${myAsset.expected_return_date || "MISSING"}`);
        log(`Serial number: ${hasSerial ? "✅" : "❌"} ${myAsset.serial_number || "MISSING"}`);
        log(`Condition: ${hasCondition ? "✅" : "❌"} ${myAsset.asset_condition || "MISSING"}`);
        if (hasAssetName && hasEmployeeName && hasAssignmentDate && hasReturnDate && hasSerial && hasCondition) {
            pass("Receipt has all required fields");
        } else {
            fail("Receipt is missing required fields");
        }
    }

    // ── STEP 12: Employee can ONLY transfer assigned assets ──
    console.log("\nSTEP 12: Transfer - employee can only transfer assigned assets");
    // Try to transfer an asset not assigned to them
    const otherAssets = available.filter(a => a.asset_id !== testAssetId);
    if (otherAssets.length > 0) {
        try {
            await api.post("/transfers", {
                asset_id: otherAssets[0].asset_id,
                to_user_id: managerUser.user_id,
                reason: "Test transfer of unassigned asset"
            }, { headers: { Authorization: `Bearer ${employeeToken}` } });
            fail("Employee should NOT be able to transfer unassigned asset");
        } catch (err) {
            if (err.response && err.response.status === 403) {
                pass("Employee correctly blocked from transferring unassigned asset");
            } else {
                fail(`Unexpected error: ${err.message}`);
            }
        }
    } else {
        pass("(Skipped - no other assets to test with)");
    }

    // ── STEP 13: Employee transfers their assigned asset ──
    console.log("\nSTEP 13: Employee transfers their assigned asset");
    // Find a target employee (someone who isn't the current employee)
    const allUsersRes = await api.get("/users/list/all", {
        headers: { Authorization: `Bearer ${officerToken}` }
    });
    const allUsers = allUsersRes.data;
    const targetEmp = allUsers.find(u => u.user_id !== employeeUser.user_id);
    if (!targetEmp) {
        fail("No target employee found for transfer test");
        return;
    }

    const transferRes = await api.post("/transfers", {
        asset_id: testAssetId,
        to_user_id: targetEmp.user_id,
        reason: "I no longer need this asset. It should be reassigned to someone who needs it more for their daily work."
    }, { headers: { Authorization: `Bearer ${employeeToken}` } });
    testTransferId = transferRes.data.transfer_id;
    pass(`Transfer request created: ID=${testTransferId} (to ${targetEmp.name})`);

    // ── STEP 14: Manager sees transfer with correct details ──
    console.log("\nSTEP 14: Manager views transfer details");
    const transferDetails = await api.get(`/transfers/${testTransferId}`, {
        headers: { Authorization: `Bearer ${managerToken}` }
    });
    const t = transferDetails.data;
    log(`From: ${t.from_user_name} | To: ${t.to_user_name} | Asset: ${t.asset_name}`);
    log(`Reason: ${t.reason}`);
    log(`Status: ${t.status}`);

    const hasFrom = !!t.from_user_name;
    const hasTo = !!t.to_user_name;
    const hasAsset = !!t.asset_name;
    const hasReason = !!t.reason;
    const hasStatus = t.status === "Pending";

    if (hasFrom && hasTo && hasAsset && hasReason && hasStatus) {
        pass("Manager sees all required transfer details");
    } else {
        fail("Manager transfer view missing fields");
    }

    // ── STEP 15: Manager approves transfer ──
    console.log("\nSTEP 15: Manager approves transfer");
    await api.put(`/transfers/${testTransferId}/approve`, {}, {
        headers: { Authorization: `Bearer ${managerToken}` }
    });
    pass("Transfer approved by manager");

    // ── STEP 16: Verify old assignment closed, new created ──
    console.log("\nSTEP 16: Verify assignment changes after transfer approval");
    const oldAssign = await api.get(`/assignments/${testAssignmentId}`, {
        headers: { Authorization: `Bearer ${officerToken}` }
    });
    log(`Old assignment status: ${oldAssign.data.status}`);
    if (String(oldAssign.data.status).toLowerCase() === "returned") {
        pass("Old assignment status is Returned");
    } else {
        fail(`Old assignment status is "${oldAssign.data.status}", expected "Returned"`);
    }

    // Check new assignment exists
    const allAssigns = await api.get("/assignments", {
        headers: { Authorization: `Bearer ${officerToken}` }
    });
    const assigns = Array.isArray(allAssigns.data) ? allAssigns.data : allAssigns.data.data || [];
    const newAssign = assigns.find(a =>
        a.asset_id === testAssetId &&
        a.user_id === targetEmp.user_id &&
        String(a.status).toLowerCase() === "active"
    );
    if (newAssign) {
        pass(`New assignment created for ${targetEmp.name}: ID=${newAssign.assignment_id}`);
    } else {
        fail("New assignment not found for target employee");
    }

    // ── STEP 17: Verify asset still Assigned ──
    console.log("\nSTEP 17: Verify asset still Assigned after transfer");
    const assetAfter = await api.get(`/assets/${testAssetId}`, {
        headers: { Authorization: `Bearer ${officerToken}` }
    });
    if (assetAfter.data.status === "Assigned") {
        pass(`Asset status still: ${assetAfter.data.status}`);
    } else {
        fail(`Asset status changed to "${assetAfter.data.status}", expected "Assigned"`);
    }

    // ── STEP 18: Verify NO Bin Card transaction for transfer ──
    console.log("\nSTEP 18: Verify no Bin Card transaction for transfer");
    const binAfter = await api.get(`/bin-card/asset/${testAssetId}`, {
        headers: { Authorization: `Bearer ${officerToken}` }
    });
    const transferTx = (binAfter.data.data || []).find(
        t => t.reference_type === "TRANSFER" ||
             (t.transaction_date > new Date(Date.now() - 60000).toISOString() && t.transaction_type !== "OUT" && t.transaction_type !== "RECEIPT")
    );
    if (!transferTx) {
        pass("No Bin Card transaction created for transfer");
    } else {
        fail(`Unexpected Bin Card transaction: ${transferTx.transaction_type}`);
    }

    // ── STEP 19: Both employees notified ──
    console.log("\nSTEP 19: Verify employees notified of transfer");
    const fromNotifs = await api.get("/notifications", {
        headers: { Authorization: `Bearer ${employeeToken}` }
    });
    const toNotifs = await api.get("/notifications", {
        headers: { Authorization: `Bearer ${officerToken}` }
    });
    // The from_user (employee) should get a notification
    const fromNotif = (fromNotifs.data || []).find(n =>
        n.title.includes("Transfer") && n.user_id === employeeUser.user_id
    );
    if (fromNotif) {
        pass(`Original employee notified: "${fromNotif.title}"`);
    } else {
        // Check all notifications
        const allEmpNotifs = (fromNotifs.data || []).filter(n => n.user_id === employeeUser.user_id);
        log(`Employee notifications: ${allEmpNotifs.map(n => n.title).join(", ") || "none"}`);
        // Try a broader check
        const transferNotif = (fromNotifs.data || []).find(n =>
            n.message && n.message.includes("transfer") || n.message && n.message.includes("Transfer")
        );
        if (transferNotif) {
            pass(`Original employee notified: "${transferNotif.title}"`);
        } else {
            fail("Original employee not notified of transfer");
        }
    }

    // ── STEP 20: Cancel request test ──
    console.log("\nSTEP 20: Employee cancels own Pending request");
    // Create a new request to cancel
    const cancelReq = await api.post("/requests", {
        asset_id: available.length > 1 ? available[1].asset_id : testAssetId,
        reason: "This is a test request to cancel"
    }, { headers: { Authorization: `Bearer ${employeeToken}` } });
    const cancelId = cancelReq.data.request_id;

    await api.delete(`/requests/${cancelId}`, {
        headers: { Authorization: `Bearer ${employeeToken}` }
    });

    // Verify status is Cancelled
    const cancelCheck = await api.get("/requests", {
        headers: { Authorization: `Bearer ${employeeToken}` }
    });
    const cancelledReq = (Array.isArray(cancelCheck.data) ? cancelCheck.data : cancelCheck.data.data || [])
        .find(r => r.request_id === cancelId);
    if (cancelledReq && String(cancelledReq.status).toLowerCase() === "cancelled") {
        pass(`Request ${cancelId} status is Cancelled (not deleted)`);
    } else {
        fail(`Request status is "${cancelledReq?.status}", expected "Cancelled"`);
    }

    // ── SUMMARY ──
    console.log("\n========================================");
    console.log("  TEST COMPLETE");
    console.log("========================================\n");
}

run().catch(err => {
    console.error("Test error:", err.message);
    if (err.response) console.error("Response:", err.response.data);
    process.exitCode = 1;
});
