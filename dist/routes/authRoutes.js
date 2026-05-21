"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController_1 = require("../controllers/authController");
const validate_1 = require("../middleware/validate");
const authMiddleware_1 = require("../middleware/authMiddleware");
const authValidation_1 = require("../validations/authValidation");
const userValidation_1 = require("../validations/userValidation");
const router = express_1.default.Router();
router.post("/register", (0, validate_1.validate)(authValidation_1.registerSchema), authController_1.register);
router.post("/verify-email", (0, validate_1.validate)(userValidation_1.verifyEmailTokenSchema), authController_1.verifyEmailController);
router.post("/login", (0, validate_1.validate)(authValidation_1.loginSchema), authController_1.login);
router.post("/refresh", authController_1.refreshTokens);
router.post("/logout", authMiddleware_1.authMiddleware, authController_1.logout);
exports.default = router;
