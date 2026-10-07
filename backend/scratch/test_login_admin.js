const http = require("http");

function login(email, password) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({ email, password });
        const req = http.request({
            hostname: "localhost",
            port: 5000,
            path: "/api/auth/login",
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(data)
            }
        }, (res) => {
            let body = "";
            res.on("data", chunk => body += chunk);
            res.on("end", () => resolve({ status: res.statusCode, body: JSON.parse(body) }));
        });
        req.on("error", reject);
        req.write(data);
        req.end();
    });
}

async function run() {
    console.log("Testing POST /api/auth/login with admin@gmail.com...");
    const res1 = await login("admin@gmail.com", "admin123");
    console.log("Status:", res1.status);
    console.log("Response:", res1.body);

    if (res1.status === 200 && res1.body.token) {
        console.log("✅ Admin login with admin@gmail.com SUCCESSFUL! JWT generated.");
        console.log("User role:", res1.body.user.role);
    } else {
        console.log("❌ Admin login failed.");
    }
}

run().catch(console.error);
