"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomError = void 0;
class CustomError extends Error {
    constructor(message, statusCode, options) {
        super(message);
        this.statusCode = statusCode;
        this.type = options === null || options === void 0 ? void 0 : options.type;
        this.errors = options === null || options === void 0 ? void 0 : options.errors;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.CustomError = CustomError;
