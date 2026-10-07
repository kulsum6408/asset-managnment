require("dotenv").config({ path: require("path").join(__dirname, ".env") });
const db = require("./config/db");
const q = (s, p = []) => new Promise((r, j) => db.query(s, p, (e, rr) => e ? j(e) : r(rr)));

(async () => {
    try {
        const t = await q("SELECT status, COUNT(*) c FROM assignments GROUP BY status");
        console.table(t);
    } catch (e) { console.error(e.message); }
    finally { db.end(); }
})();
