"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userController_1 = require("../controllers/userController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const rateLimiter_1 = require("../middleware/rateLimiter");
const validate_1 = require("../middleware/validate");
const userValidation_1 = require("../validations/userValidation");
const router = express_1.default.Router();
const passwordRecoveryLimiter = (0, rateLimiter_1.rateLimit)({
    max: 5,
    windowMs: 15 * 60 * 1000,
    message: "Too many password recovery attempts. Please try again later.",
    keyPrefix: "password-recovery",
});
const accountRecoveryLimiter = (0, rateLimiter_1.rateLimit)({
    max: 3,
    windowMs: 60 * 60 * 1000,
    message: "Too many account recovery attempts. Please try again later.",
    keyPrefix: "account-recovery",
});
router.get("/verify-email", userController_1.verifyEmailChangeRedirect);
router.get("/profile", authMiddleware_1.authMiddleware, userController_1.getProfile);
router.put("/profile", authMiddleware_1.authMiddleware, (0, validate_1.validate)(userValidation_1.updateProfileSchema), userController_1.updateProfile);
router.put("/password", authMiddleware_1.authMiddleware, (0, validate_1.validate)(userValidation_1.changePasswordSchema), userController_1.changePasswordController);
router.put("/email", authMiddleware_1.authMiddleware, (0, validate_1.validate)(userValidation_1.changeEmailSchema), userController_1.changeEmailController);
router.post("/verify-email", passwordRecoveryLimiter, (0, validate_1.validate)(userValidation_1.verifyEmailTokenSchema), userController_1.verifyEmailChange);
router.post("/forgot-password", passwordRecoveryLimiter, (0, validate_1.validate)(userValidation_1.forgotPasswordSchema), userController_1.forgotPasswordController);
router.post("/reset-password/verify-code", passwordRecoveryLimiter, (0, validate_1.validate)(userValidation_1.verifyResetPasswordCodeSchema), userController_1.verifyResetPasswordCodeController);
router.post("/reset-password", passwordRecoveryLimiter, (0, validate_1.validate)(userValidation_1.resetPasswordSchema), userController_1.resetPasswordController);
router.post("/restore-account", accountRecoveryLimiter, (0, validate_1.validate)(userValidation_1.restoreAccountSchema), userController_1.restoreAccountController);
router.delete("/account", authMiddleware_1.authMiddleware, (0, validate_1.validate)(userValidation_1.deleteAccountSchema), userController_1.deleteAccountController);
exports.default = router;
