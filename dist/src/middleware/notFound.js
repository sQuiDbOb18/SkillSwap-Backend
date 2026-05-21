"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = void 0;
const CustomError_1 = require("../utils/CustomError");
const notFoundHandler = (req, res, next) => {
    next(new CustomError_1.CustomError(`Route not found: ${req.method} ${req.originalUrl}`, 404, {
        type: "NOT_FOUND",
    }));
};
exports.notFoundHandler = notFoundHandler;
