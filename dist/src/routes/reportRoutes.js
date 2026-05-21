"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const reportController_1 = require("../controllers/reportController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const rateLimiter_1 = require("../middleware/rateLimiter");
const validate_1 = require("../middleware/validate");
const adminValidation_1 = require("../validations/adminValidation");
const router = express_1.default.Router();
const reportLimiter = (0, rateLimiter_1.rateLimit)({
    max: 5,
    windowMs: 10 * 60 * 1000,
    message: "Too many reports submitted. Please try again later.",
    keyPrefix: "create-report",
});
router.post("/", authMiddleware_1.authMiddleware, reportLimiter, (0, validate_1.validate)(adminValidation_1.createReportSchema), reportController_1.createReportController);
exports.default = router;
