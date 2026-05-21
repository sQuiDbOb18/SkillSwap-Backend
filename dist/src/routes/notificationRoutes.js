"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const notificationController_1 = require("../controllers/notificationController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.get("/", authMiddleware_1.authMiddleware, notificationController_1.getNotificationsController);
router.get("/unread-count", authMiddleware_1.authMiddleware, notificationController_1.getUnreadNotificationCountController);
router.patch("/read-all", authMiddleware_1.authMiddleware, notificationController_1.markAllNotificationsAsReadController);
router.patch("/:notificationId/read", authMiddleware_1.authMiddleware, notificationController_1.markNotificationAsReadController);
exports.default = router;
