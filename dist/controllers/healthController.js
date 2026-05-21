"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readinessCheck = exports.healthCheck = void 0;
const db_1 = __importDefault(require("../config/db"));
const healthCheck = (_req, res) => {
    res.status(200).json({
        success: true,
        status: "ok",
        timestamp: new Date().toISOString(),
    });
};
exports.healthCheck = healthCheck;
const readinessCheck = async (_req, res) => {
    try {
        await db_1.default.$queryRaw `SELECT 1`;
        res.status(200).json({
            success: true,
            status: "ready",
            database: "connected",
            timestamp: new Date().toISOString(),
        });
    }
    catch (_error) {
        res.status(503).json({
            success: false,
            status: "not_ready",
            database: "disconnected",
            timestamp: new Date().toISOString(),
        });
    }
};
exports.readinessCheck = readinessCheck;
