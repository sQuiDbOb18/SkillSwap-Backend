"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimit = void 0;
const CustomError_1 = require("../utils/CustomError");
const store = new Map();
const getClientKey = (req, keyPrefix) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    return `${keyPrefix}:${ip}`;
};
const rateLimit = ({ max, windowMs, message = "Too many requests. Please try again later.", type = "RATE_LIMIT_ERROR", keyPrefix = "global", }) => {
    return (req, res, next) => {
        const now = Date.now();
        const key = getClientKey(req, keyPrefix);
        const current = store.get(key);
        if (!current || current.resetAt <= now) {
            const resetAt = now + windowMs;
            store.set(key, {
                count: 1,
                resetAt,
            });
            res.setHeader("X-RateLimit-Limit", max.toString());
            res.setHeader("X-RateLimit-Remaining", Math.max(0, max - 1).toString());
            res.setHeader("X-RateLimit-Reset", Math.ceil(resetAt / 1000).toString());
            return next();
        }
        current.count += 1;
        store.set(key, current);
        const remaining = Math.max(0, max - current.count);
        res.setHeader("X-RateLimit-Limit", max.toString());
        res.setHeader("X-RateLimit-Remaining", remaining.toString());
        res.setHeader("X-RateLimit-Reset", Math.ceil(current.resetAt / 1000).toString());
        if (current.count > max) {
            return next(new CustomError_1.CustomError(message, 429, {
                type,
            }));
        }
        next();
    };
};
exports.rateLimit = rateLimit;
