"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const messageController_1 = require("../controllers/messageController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const validate_1 = require("../middleware/validate");
const messageValidation_1 = require("../validations/messageValidation");
const router = express_1.default.Router();
router.get("/conversations", authMiddleware_1.authMiddleware, messageController_1.listConversationsController);
router.get("/unread-count", authMiddleware_1.authMiddleware, messageController_1.getUnreadCountController);
router.post("/", authMiddleware_1.authMiddleware, (0, validate_1.validate)(messageValidation_1.sendMessageSchema), messageController_1.sendMessageController);
router.patch("/:userId/read", authMiddleware_1.authMiddleware, messageController_1.markConversationAsReadController);
router.get("/:userId", authMiddleware_1.authMiddleware, messageController_1.getChatHistoryController);
exports.default = router;
