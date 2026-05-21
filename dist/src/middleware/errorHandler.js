"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalErrorHandler = void 0;
const zod_1 = require("zod");
const CustomError_1 = require("../utils/CustomError");
const globalErrorHandler = (err, req, res, next) => {
    if (err instanceof zod_1.ZodError) {
        err = new CustomError_1.CustomError("Validation failed", 400, {
            type: "VALIDATION_ERROR",
            errors: err.issues.map((issue) => ({
                field: issue.path.join(".") || "request",
                message: issue.message,
            })),
        });
    }
    if (err instanceof SyntaxError && "body" in err) {
        err = new CustomError_1.CustomError("Invalid JSON payload", 400, {
            type: "INVALID_JSON",
        });
    }
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    if (statusCode >= 500) {
        console.error(err);
    }
    res.status(statusCode).json({
        success: false,
        type: err.type ?? (statusCode >= 500 ? "INTERNAL_ERROR" : "REQUEST_ERROR"),
        message,
        ...(err.errors ? { errors: err.errors } : {}),
    });
};
exports.globalErrorHandler = globalErrorHandler;
