"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const walletController_1 = require("../controllers/walletController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const roleMiddleware_1 = require("../middleware/roleMiddleware");
const validate_1 = require("../middleware/validate");
const walletValidation_1 = require("../validations/walletValidation");
const router = express_1.default.Router();
router.get("/", authMiddleware_1.authMiddleware, walletController_1.getWalletController);
router.get("/transactions", authMiddleware_1.authMiddleware, walletController_1.getWalletTransactionsController);
router.post("/credit", authMiddleware_1.authMiddleware, (0, roleMiddleware_1.restrictTo)("Admin"), (0, validate_1.validate)(walletValidation_1.walletTransactionSchema), walletController_1.creditWalletController);
router.post("/debit", authMiddleware_1.authMiddleware, (0, roleMiddleware_1.restrictTo)("Admin"), (0, validate_1.validate)(walletValidation_1.walletTransactionSchema), walletController_1.debitWalletController);
exports.default = router;
