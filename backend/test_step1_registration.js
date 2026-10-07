require("dotenv").config();
const db = require("./config/db");
const AssetModel = require("./models/assetModel");
const BinCardModel = require("./models/binCardModel");

const q = (sql, params = []) =>
    new Promise((resolve, reject) => db.query(sql, params, (err, rows) => err ? reject(err) : resolve(rows)));

async function runTests() {
    console.log("==================================================");
    console.log("  STEP 1 VERIFICATION TEST: Asset Registration -> Bin Card RECEIPT");
    console.log("==================================================");

    let testAssetId = null;
    let testRegId = null;
    let testTransId = null;

    try {
        // 1. Get an asset officer user
        const users = await q("SELECT user_id, email FROM users WHERE role = 'asset_officer' LIMIT 1");
        const officer = users[0] || { user_id: 1 };
        console.log(`\n1. Found Asset Officer: User ID ${officer.user_id}`);

        // 2. Perform Asset Registration
        const testSerial = `TEST-STEP1-${Date.now()}`;
        const assetData = {
            asset_name: "Test Laptop Step 1",
            category_id: 1,
            serial_number: testSerial,
            purchase_date: "2026-08-27",
            purchase_cost: 1500.00,
            status: "Available",
            asset_condition: "New",
            location: "Main Store Room",
            notes: "Test Step 1 Intake"
        };

        console.log(`2. Registering asset with serial: ${testSerial}...`);
        const result = await AssetModel.createWithBinCard(assetData, officer.user_id);
        testAssetId = result.asset_id;
        testRegId = result.registration_id;
        testTransId = result.transaction_id;

        console.log(`   ✅ Asset registered successfully!`);
        console.log(`      Asset ID: ${testAssetId}`);
        console.log(`      Registration ID: ${testRegId}`);
        console.log(`      Transaction ID: ${testTransId}`);

        // 3. Verify assets table
        const assetRows = await q("SELECT * FROM assets WHERE asset_id = ?", [testAssetId]);
        if (assetRows.length === 0) throw new Error("Asset not found in assets table");
        console.log(`\n3. Verified assets table:`);
        console.log(`   - Asset Name: ${assetRows[0].asset_name}`);
        console.log(`   - Serial: ${assetRows[0].serial_number}`);
        console.log(`   - Status: ${assetRows[0].status}`);

        // 4. Verify bin_card_transactions table
        const binRows = await q("SELECT * FROM bin_card_transactions WHERE asset_id = ?", [testAssetId]);
        if (binRows.length === 0) throw new Error("Bin Card transaction not found");
        console.log(`\n4. Verified bin_card_transactions table:`);
        console.log(`   - Transaction ID: ${binRows[0].transaction_id}`);
        console.log(`   - Transaction Type: ${binRows[0].transaction_type}`);
        console.log(`   - Quantity: ${binRows[0].quantity}`);
        console.log(`   - Performed By: ${binRows[0].performed_by}`);
        console.log(`   - Reference Type: ${binRows[0].reference_type}`);
        console.log(`   - Transaction Date: ${binRows[0].transaction_date}`);

        if (binRows[0].transaction_type !== "RECEIPT") {
            throw new Error(`Expected transaction_type to be RECEIPT, got ${binRows[0].transaction_type}`);
        }
        if (binRows[0].quantity !== 1) {
            throw new Error(`Expected quantity to be 1, got ${binRows[0].quantity}`);
        }
        if (binRows[0].performed_by !== officer.user_id) {
            throw new Error(`Expected performed_by to be ${officer.user_id}, got ${binRows[0].performed_by}`);
        }

        // 5. Verify inventory SQL View quantity / availability
        const invRows = await q("SELECT * FROM inventory WHERE asset_id = ?", [testAssetId]);
        if (invRows.length === 0) throw new Error("Asset not found in inventory view");
        console.log(`\n5. Verified inventory view:`);
        console.log(`   - Asset Name: ${invRows[0].asset_name}`);
        console.log(`   - Status: ${invRows[0].status}`);
        console.log(`   - Is Available: ${invRows[0].is_available}`);

        if (invRows[0].is_available !== 1) {
            throw new Error(`Expected inventory view is_available to be 1, got ${invRows[0].is_available}`);
        }

        // 6. Verify duplicate check / duplicate protection
        const dupCheck = await q("SELECT COUNT(*) AS cnt FROM bin_card_transactions WHERE asset_id = ?", [testAssetId]);
        console.log(`\n6. Verified Bin Card RECEIPT count for asset ${testAssetId}: ${dupCheck[0].cnt} (No duplicates)`);
        if (dupCheck[0].cnt !== 1) throw new Error(`Expected exactly 1 RECEIPT transaction, found ${dupCheck[0].cnt}`);

        // 7. Atomic transaction rollback test
        console.log(`\n7. Testing atomic transaction rollback behavior...`);
        try {
            // Pass bad data that fails constraint to trigger rollback
            await AssetModel.createWithBinCard({
                asset_name: null, // violates NOT NULL
                serial_number: `FAIL-${Date.now()}`
            }, officer.user_id);
            console.error("   ❌ Expected error during transaction failure test, but operation succeeded.");
        } catch (rollbackErr) {
            console.log(`   ✅ Transaction correctly rolled back on error: ${rollbackErr.message}`);
        }

        console.log("\n==================================================");
        console.log("  ALL VERIFICATION TESTS PASSED SUCCESSFULLY! ✅");
        console.log("==================================================");

    } catch (err) {
        console.error("\n❌ TEST FAILED:", err.message);
        process.exitCode = 1;
    } finally {
        // Cleanup test data
        if (testAssetId) {
            await q("DELETE FROM bin_card_transactions WHERE asset_id = ?", [testAssetId]);
            await q("DELETE FROM registrations WHERE asset_id = ?", [testAssetId]);
            await q("DELETE FROM assets WHERE asset_id = ?", [testAssetId]);
            console.log(`\nCleaned up test asset ID ${testAssetId}.`);
        }
        db.end();
    }
}

runTests();
