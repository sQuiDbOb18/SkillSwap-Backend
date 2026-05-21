"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomError = void 0;
class CustomError extends Error {
    constructor(message, statusCode, options) {
        super(message);
        this.statusCode = statusCode;
        this.type = options?.type;
        this.errors = options?.errors;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.CustomError = CustomError;
