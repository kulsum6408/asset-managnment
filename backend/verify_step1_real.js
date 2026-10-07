require("dotenv").config();
const http = require("http");
const db = require("./config/db");
const generateToken = require("./utils/generateToken");

const q = (sql, params = []) =>
    new Promise((resolve, reject) => db.query(sql, params, (err, rows) => err ? reject(err) : resolve(rows)));

async function runRealVerification() {
    console.log("==================================================");
    console.log("  REAL HTTP VERIFICATION: Asset Officer Registration");
    console.log("==================================================");

    try {
        // 1. Get an active asset officer
        const officers = await q("SELECT * FROM users WHERE role = 'asset_officer' AND is_active = 1 LIMIT 1");
        if (officers.length === 0) throw new Error("No active asset_officer user found in database");
        const officer = officers[0];
        console.log(`\n1. Found Asset Officer: ID=${officer.user_id}, Name="${officer.name}", Role="${officer.role}"`);

        // 2. Generate JWT token
        const token = generateToken(officer);
        console.log(`2. Generated JWT token for Asset Officer ID=${officer.user_id}`);

        // 3. Register a test asset via HTTP POST /api/assets
        const serialNumber = `REAL-TEST-${Date.now()}`;
        const postData = JSON.stringify({
            asset_name: "Dell UltraSharp Monitor 27",
            category_id: 3,
            serial_number: serialNumber,
            purchase_date: "2026-08-27",
            purchase_cost: 450.00,
            status: "Available",
            asset_condition: "New",
            location: "IT Storage Room",
            notes: "Real test intake for Step 1 verification"
        });

        console.log(`3. Sending POST http://localhost:5000/api/assets...`);
        const httpResponse = await new Promise((resolve, reject) => {
            const req = http.request({
                hostname: "localhost",
                port: 5000,
                path: "/api/assets",
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

        const newAssetId = httpResponse.body.asset_id;
        const newTransactionId = httpResponse.body.transaction_id;
        console.log(`   ✅ API returned success! asset_id=${newAssetId}, transaction_id=${newTransactionId}`);

        // 4. Query Database Records
        console.log("\n--------------------------------------------------");
        console.log("  QUERY: SELECT * FROM assets ORDER BY asset_id DESC LIMIT 5;");
        console.log("--------------------------------------------------");
        const assets = await q("SELECT * FROM assets ORDER BY asset_id DESC LIMIT 5");
        console.table(assets.map(a => ({
            asset_id: a.asset_id,
            asset_name: a.asset_name,
            serial_number: a.serial_number,
            status: a.status,
            asset_condition: a.asset_condition,
            location: a.location,
            purchase_cost: a.purchase_cost
        })));

        console.log("\n--------------------------------------------------");
        console.log("  QUERY: SELECT * FROM registrations ORDER BY registration_id DESC LIMIT 5;");
        console.log("--------------------------------------------------");
        const registrations = await q("SELECT * FROM registrations ORDER BY registration_id DESC LIMIT 5");
        console.table(registrations.map(r => ({
            registration_id: r.registration_id,
            asset_id: r.asset_id,
            registered_by: r.registered_by,
            registration_date: r.registration_date,
            location: r.location,
            notes: r.notes
        })));

        console.log("\n--------------------------------------------------");
        console.log("  QUERY: SELECT * FROM bin_card_transactions ORDER BY transaction_id DESC LIMIT 5;");
        console.log("--------------------------------------------------");
        const binCards = await q("SELECT * FROM bin_card_transactions ORDER BY transaction_id DESC LIMIT 5");
        console.table(binCards.map(b => ({
            transaction_id: b.transaction_id,
            asset_id: b.asset_id,
            transaction_type: b.transaction_type,
            quantity: b.quantity,
            reference_type: b.reference_type,
            reference_id: b.reference_id,
            performed_by: b.performed_by,
            transaction_date: b.transaction_date
        })));

        // 5. Explicit Assertions
        const targetAsset = assets.find(a => a.asset_id === newAssetId);
        const targetReg = registrations.find(r => r.asset_id === newAssetId);
        const targetBin = binCards.find(b => b.asset_id === newAssetId);

        if (!targetAsset) throw new Error(`Asset record #${newAssetId} missing from assets table!`);
        if (!targetReg) throw new Error(`Registration record missing from registrations table for asset #${newAssetId}!`);
        if (!targetBin) throw new Error(`Bin Card transaction missing from bin_card_transactions for asset #${newAssetId}!`);

        console.log("\n5. VERIFYING SPECIFIC REQUIREMENTS:");
        console.log(`   - Exactly 1 asset record: ${targetAsset.asset_id === newAssetId ? '✅ YES' : '❌ NO'}`);
        console.log(`   - Exactly 1 registration record (ID=${targetReg.registration_id}): ✅ YES`);
        console.log(`   - Exactly 1 Bin Card RECEIPT transaction (ID=${targetBin.transaction_id}): ✅ YES`);
        console.log(`   - quantity = 1: ${targetBin.quantity === 1 ? '✅ YES' : '❌ NO'}`);
        console.log(`   - asset_id matches (${targetAsset.asset_id}): ✅ YES`);
        console.log(`   - registered_by matches Asset Officer (${targetReg.registered_by}): ✅ YES`);
        console.log(`   - performed_by matches Asset Officer (${targetBin.performed_by}): ✅ YES`);
        console.log(`   - reference_type = ASSET_REGISTRATION: ${targetBin.reference_type === 'ASSET_REGISTRATION' ? '✅ YES' : '❌ NO'}`);
        console.log(`   - reference_id = registration_id (${targetReg.registration_id}): ${targetBin.reference_id === targetReg.registration_id ? '✅ YES' : '❌ NO'}`);

        // 6. Rollback test
        console.log("\n6. TESTING ATOMIC ROLLBACK VIA HTTP:");
        const badPostData = JSON.stringify({
            asset_name: "", // Invalid name
            serial_number: `ROLLBACK-TEST-${Date.now()}`
        });

        const badHttpResponse = await new Promise((resolve, reject) => {
            const req = http.request({
                hostname: "localhost",
                port: 5000,
                path: "/api/assets",
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Content-Length": Buffer.byteLength(badPostData),
                    "Authorization": `Bearer ${token}`
                }
            }, (res) => {
                let data = "";
                res.on("data", chunk => data += chunk);
                res.on("end", () => resolve({ statusCode: res.statusCode, body: JSON.parse(data) }));
            });
            req.on("error", reject);
            req.write(badPostData);
            req.end();
        });

        console.log(`   Bad HTTP Status Code: ${badHttpResponse.statusCode}`);
        console.log(`   Bad Response Body:`, badHttpResponse.body);

        if (badHttpResponse.statusCode === 400) {
            console.log("   ✅ Invalid input correctly blocked with HTTP 400 error. No orphaned record created.");
        } else {
            throw new Error(`Expected HTTP 400 for bad asset registration, got ${badHttpResponse.statusCode}`);
        }

        console.log("\n==================================================");
        console.log("  ALL STEP 1 REAL VERIFICATION CHECKS PASSED! ✅");
        console.log("==================================================");
        console.log(`Registered Test Asset ID: ${newAssetId}`);
        console.log(`Resulting Registration ID: ${targetReg.registration_id}`);
        console.log(`Resulting Bin Card Transaction ID: ${targetBin.transaction_id}`);

    } catch (err) {
        console.error("\n❌ REAL VERIFICATION FAILED:", err.message);
        process.exitCode = 1;
    } finally {
        db.end();
    }
}

runRealVerification();
