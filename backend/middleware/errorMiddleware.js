// 404 Handler — place before errorHandler in server.js
const notFound = (req, res, next) => {
    const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
    error.statusCode = 404;
    next(error);
};

// Global error handler — place last in server.js
const errorHandler = (err, req, res, next) => {
    console.error(`[ERROR] ${err.message}`);

    const statusCode = err.statusCode || res.statusCode === 200 ? 500 : res.statusCode;

    res.status(statusCode).json({
        error: err.message || "Internal server error",
        ...(process.env.NODE_ENV === "development" && { stack: err.stack })
    });
};

module.exports = { notFound, errorHandler };
