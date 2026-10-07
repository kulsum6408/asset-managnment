require("dotenv").config({ path: require("path").join(__dirname, ".env") });
const db = require("./config/db");
const q = (sql, p = []) => new Promise((res, rej) => db.query(sql, p, (e, r) => e ? rej(e) : res(r)));

(async () => {
  try {
    const assets = await q("SELECT asset_id, asset_name, status, serial_number FROM assets ORDER BY asset_id");
    console.log("asset_id | current STATUS | #bin | bin_running | n_active_assign | RECEIPT_sum | OUT_sum");
    for (const a of assets) {
      const bin = await q(
        "SELECT transaction_type, quantity FROM bin_card_transactions WHERE asset_id=? ORDER BY transaction_id",
        [a.asset_id]
      );
      let running = 0, recv = 0, outsum = 0;
      for (const t of bin) {
        const tp = String(t.transaction_type).toUpperCase();
        const qq = Number(t.quantity) || 0;
        if (tp === "RECEIPT" || tp === "RECEIPTS" || tp === "IN" || tp === "RETURN" || tp === "RETURNS") { running += qq; recv += qq; }
        else { running -= Math.abs(qq); outsum += Math.abs(qq); }
      }
      const asg = await q("SELECT COUNT(*) c FROM assignments WHERE asset_id=? AND status='Active'", [a.asset_id]);
      console.log(`  ${String(a.asset_id).padEnd(4)} | ${String(a.status).padEnd(18)} | ${String(bin.length).padEnd(4)} | ${String(running).padEnd(5)} | ${String(asg[0].c).padEnd(5)} | ${recv} | ${outsum} | ${a.asset_name}`);
    }
  } catch (e) { console.error("ERR:", e.message); }
  finally { db.end(); }
})();
