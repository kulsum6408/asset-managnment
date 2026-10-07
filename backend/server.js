require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const {
    notFound,
    errorHandler,
} = require("./middleware/errorMiddleware");

// ============================================================
// ROUTES
// ============================================================

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const assetRoutes = require("./routes/assetRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const requestRoutes = require("./routes/requestRoutes");
const assignmentRoutes = require("./routes/assignmentRoutes");
const maintenanceRoutes = require("./routes/maintenanceRoutes");
const returnRoutes = require("./routes/returnRoutes");
const reportRoutes = require("./routes/reportRoutes");
const returnRequestRoutes = require("./routes/returnRequestRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const binCardRoutes = require("./routes/binCardRoutes");
const transferRoutes = require("./routes/transferRoutes");
const disposalRoutes = require("./routes/disposalRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");
const inventoryCheckRoutes = require("./routes/inventoryCheckRoutes");
const depreciationRoutes = require("./routes/depreciationRoutes");
const maintenanceCostRoutes = require("./routes/maintenanceCostRoutes");

// ============================================================
// RETURN REMINDER SERVICE
// ============================================================

let ReturnReminderService = null;

try {
    ReturnReminderService = require(
        "./services/returnReminderService"
    );

    console.log("✅ Return Reminder Service loaded.");
} catch (error) {
    console.log(
        "⚠️ Return Reminder Service not available:",
        error.message
    );
}

// ============================================================
// APP
// ============================================================

const app = express();

// ============================================================
// PORT
// ============================================================

const PORT = Number(process.env.PORT) || 5000;

// ============================================================
// CORS
// ============================================================

const allowedOrigins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",

    "http://localhost:5173",
    "http://127.0.0.1:5173",

    "http://localhost:5174",
    "http://127.0.0.1:5174",

    "http://localhost:5177",
    "http://127.0.0.1:5177",

    "http://localhost:5179",
    "http://127.0.0.1:5179",

    "http://localhost:5182",
    "http://127.0.0.1:5182",
];

app.use(
    cors({
        origin: function (origin, callback) {
            // Requests without an Origin header
            // such as curl, PowerShell, etc.
            if (!origin) {
                return callback(null, true);
            }

            // Explicitly allowed origins
            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            // Allow localhost development ports
            try {
                const url = new URL(origin);

                if (
                    url.hostname === "localhost" ||
                    url.hostname === "127.0.0.1"
                ) {
                    return callback(null, true);
                }
            } catch (error) {
                console.error(
                    "Invalid origin:",
                    origin
                );
            }

            console.log(
                "❌ CORS blocked:",
                origin
            );

            return callback(
                new Error(
                    `CORS blocked for origin: ${origin}`
                )
            );
        },

        credentials: true,

        methods: [
            "GET",
            "POST",
            "PUT",
            "PATCH",
            "DELETE",
            "OPTIONS",
        ],

        allowedHeaders: [
            "Content-Type",
            "Authorization",
        ],

        optionsSuccessStatus: 204,
    })
);

// ============================================================
// BODY PARSERS
// ============================================================

app.use(
    express.json({
        limit: "10mb",
    })
);

app.use(
    express.urlencoded({
        extended: true,
        limit: "10mb",
    })
);

// ============================================================
// STATIC FILES
// ============================================================

app.use(
    "/uploads",
    express.static(
        path.join(__dirname, "uploads")
    )
);

// ============================================================
// REQUEST LOGGER
// ============================================================

app.use((req, res, next) => {
    console.log(
        `[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`
    );

    next();
});

// ============================================================
// ROOT ROUTE
// ============================================================

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Asset Management System API v2.0",
        status: "Running",
        port: PORT,
    });
});

// ============================================================
// HEALTH CHECK
// ============================================================

app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        status: "OK",
        message: "Backend is running",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        port: PORT,
    });
});

// ============================================================
// EXISTING API ROUTES
// ============================================================

app.use("/api/auth", authRoutes);

app.use("/api/users", userRoutes);

app.use("/api/assets", assetRoutes);

app.use("/api/categories", categoryRoutes);

app.use("/api/requests", requestRoutes);

app.use("/api/assignments", assignmentRoutes);

app.use("/api/maintenance/cost-approvals", maintenanceCostRoutes);

app.use("/api/maintenance", maintenanceRoutes);

app.use("/api/returns", returnRoutes);

app.use("/api/return-requests", returnRequestRoutes);

app.use("/api/reports", reportRoutes);

app.use("/api/notifications", notificationRoutes);

app.use("/api/transfers", transferRoutes);

app.use("/api/disposals", disposalRoutes);

app.use("/api/inventory", inventoryRoutes);

// ============================================================
// BIN CARD
// ============================================================

app.use(
    "/api/bin-card",
    binCardRoutes
);

// ============================================================
// INVENTORY CHECKS
// ============================================================

app.use(
    "/api/inventory-checks",
    inventoryCheckRoutes
);

// ============================================================
// DEPRECIATION
// ============================================================

app.use(
    "/api/depreciation",
    depreciationRoutes
);

// ============================================================
// 404 HANDLER
// ============================================================

app.use(notFound);

// ============================================================
// ERROR HANDLER
// ============================================================

app.use(errorHandler);

// ============================================================
// RETURN REMINDER
// ============================================================

const runReturnReminder = async () => {
    if (
        !ReturnReminderService ||
        typeof ReturnReminderService.checkReturnDates !==
            "function"
    ) {
        return;
    }

    try {
        await ReturnReminderService.checkReturnDates();

        console.log(
            "✅ Return reminder check completed."
        );
    } catch (error) {
        console.error(
            "❌ Return reminder check failed:",
            error.message
        );
    }
};

// ============================================================
// START SERVER
// ============================================================

const server = app.listen(
    PORT,
    "0.0.0.0",
    () => {
        console.log("");

        console.log(
            "==========================================="
        );

        console.log(
            "  ASSET MANAGEMENT SYSTEM API v2.0"
        );

        console.log(
            "==========================================="
        );

        console.log(
            `  Backend  -> http://localhost:${PORT}`
        );

        console.log(
            `  Health   -> http://localhost:${PORT}/api/health`
        );

        console.log(
            "  Frontend -> http://localhost:5182"
        );

        console.log(
            "  CORS     -> Enabled"
        );

        console.log(
            "  Bin Card -> /api/bin-card"
        );

        console.log(
            "==========================================="
        );

        console.log("");

        // Run reminder once after startup.
        // It does NOT prevent the server from running.
        runReturnReminder();

        // Run reminder every hour.
        setInterval(
            runReturnReminder,
            60 * 60 * 1000
        );
    }
);

// ============================================================
// SERVER ERROR
// ============================================================

server.on("error", (error) => {
    console.error(
        "❌ SERVER ERROR:",
        error.message
    );

    if (error.code === "EADDRINUSE") {
        console.error(
            `❌ Port ${PORT} is already in use.`
        );

        console.error(
            "Run:"
        );

        console.error(
            `Get-NetTCPConnection -LocalPort ${PORT}`
        );
    }

    if (error.code === "EACCES") {
        console.error(
            `❌ Permission denied for port ${PORT}.`
        );
    }
});

// ============================================================
// UNHANDLED PROMISE REJECTION
// ============================================================

process.on(
    "unhandledRejection",
    (error) => {
        console.error(
            "❌ Unhandled Promise Rejection:",
            error
        );
    }
);

// ============================================================
// UNCAUGHT EXCEPTION
// ============================================================

process.on(
    "uncaughtException",
    (error) => {
        console.error(
            "❌ Uncaught Exception:",
            error
        );
    }
);

// ============================================================
// GRACEFUL SHUTDOWN
// ============================================================

const shutdown = (signal) => {
    console.log(
        `\n⚠️ ${signal} received.`
    );

    server.close(() => {
        console.log(
            "✅ Server closed successfully."
        );

        process.exit(0);
    });
};

process.on(
    "SIGINT",
    () => shutdown("SIGINT")
);

process.on(
    "SIGTERM",
    () => shutdown("SIGTERM")
);

// ============================================================
// EXPORT
// ============================================================

module.exports = app;