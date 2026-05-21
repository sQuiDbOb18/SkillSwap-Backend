"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalErrorHandler = void 0;
const globalErrorHandler = (err, req, res, next) => {
    var _a;
    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal Server Error";
    res.status(statusCode).json({
        success: false,
        type: (_a = err.type) !== null && _a !== void 0 ? _a : (statusCode >= 500 ? "INTERNAL_ERROR" : "REQUEST_ERROR"),
        message,
        ...(err.errors ? { errors: err.errors } : {}),
    });
};
exports.globalErrorHandler = globalErrorHandler;
