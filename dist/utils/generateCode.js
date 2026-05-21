"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashCode = exports.generateVerificationCode = exports.generateEmailCode = void 0;
const crypto_1 = __importDefault(require("crypto"));
const hashValue = (value) => crypto_1.default.createHash("sha256").update(value).digest("hex");
const generateEmailCode = () => {
    const rawCode = crypto_1.default.randomInt(100000, 1000000).toString();
    const hashedCode = hashValue(rawCode);
    return { rawCode, hashedCode };
};
exports.generateEmailCode = generateEmailCode;
const generateVerificationCode = () => {
    const rawCode = crypto_1.default.randomInt(1000, 10000).toString();
    const hashedCode = hashValue(rawCode);
    return { rawCode, hashedCode };
};
exports.generateVerificationCode = generateVerificationCode;
const hashCode = (code) => hashValue(code.trim());
exports.hashCode = hashCode;
