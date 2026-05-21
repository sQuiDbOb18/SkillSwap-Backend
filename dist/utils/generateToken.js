"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRefreshToken = exports.generateAccessToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const ACCESS_TOKEN_EXPIRES_IN = ((_a = process.env.ACCESS_TOKEN_EXPIRES_IN) !== null && _a !== void 0 ? _a : "15m");
const REFRESH_TOKEN_EXPIRES_IN = ((_b = process.env.REFRESH_TOKEN_EXPIRES_IN) !== null && _b !== void 0 ? _b : "7d");
const generateAccessToken = (userId, role, tokenVersion) => {
    return jsonwebtoken_1.default.sign({ userId, role, tokenVersion }, process.env.JWT_ACCESS_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
};
exports.generateAccessToken = generateAccessToken;
const generateRefreshToken = (userId, tokenVersion) => {
    return jsonwebtoken_1.default.sign({ userId, tokenVersion, type: "refresh" }, process.env.JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
};
exports.generateRefreshToken = generateRefreshToken;
