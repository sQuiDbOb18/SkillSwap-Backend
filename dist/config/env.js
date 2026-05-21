"use strict";
var _a, _b, _c, _d, _e, _f;
Object.defineProperty(exports, "__esModule", { value: true });
exports.isProduction = exports.env = void 0;
const requireEnv = (name) => {
    var _a;
    const value = (_a = process.env[name]) === null || _a === void 0 ? void 0 : _a.trim();
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
};
const parsePort = (value) => {
    const parsed = Number(value !== null && value !== void 0 ? value : "4000");
    if (!Number.isInteger(parsed) || parsed <= 0) {
        throw new Error("PORT must be a valid positive integer");
    }
    return parsed;
};
exports.env = {
    nodeEnv: (_a = process.env.NODE_ENV) !== null && _a !== void 0 ? _a : "development",
    port: parsePort(process.env.PORT),
    host: (_b = process.env.HOST) !== null && _b !== void 0 ? _b : "0.0.0.0",
    jwtSecret: requireEnv("JWT_SECRET"),
    databaseUrl: requireEnv("DATABASE_URL"),
    corsOrigin: (_c = process.env.CORS_ORIGIN) !== null && _c !== void 0 ? _c : "",
    appName: (_d = process.env.APP_NAME) !== null && _d !== void 0 ? _d : "SkillSwap",
    clientUrl: (_e = process.env.CLIENT_URL) !== null && _e !== void 0 ? _e : "http://localhost:3000",
    apiUrl: (_f = process.env.API_URL) !== null && _f !== void 0 ? _f : "http://localhost:4000",
};
exports.isProduction = exports.env.nodeEnv === "production";
