"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController_1 = require("../controllers/authController");
const validate_1 = require("../middleware/validate");
const authMiddleware_1 = require("../middleware/authMiddleware");
const rateLimiter_1 = require("../middleware/rateLimiter");
const authValidation_1 = require("../validations/authValidation");
const userValidation_1 = require("../validations/userValidation");
const router = express_1.default.Router();
const authWriteLimiter = (0, rateLimiter_1.rateLimit)({
    max: 10,
    windowMs: 15 * 60 * 1000,
    message: "Too many authentication requests. Please try again later.",
    keyPrefix: "auth-write",
});
const loginLimiter = (0, rateLimiter_1.rateLimit)({
    max: 5,
    windowMs: 15 * 60 * 1000,
    message: "Too many login attempts. Please try again later.",
    keyPrefix: "auth-login",
});
router.post("/register", authWriteLimiter, (0, validate_1.validate)(authValidation_1.registerSchema), authController_1.register);
router.post("/verify-email", authWriteLimiter, (0, validate_1.validate)(userValidation_1.verifyEmailTokenSchema), authController_1.verifyEmailController);
router.post("/login", loginLimiter, (0, validate_1.validate)(authValidation_1.loginSchema), authController_1.login);
router.post("/refresh", authWriteLimiter, authController_1.refreshTokens);
router.post("/logout", authMiddleware_1.authMiddleware, authController_1.logout);
exports.default = router;
