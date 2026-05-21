"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const reviewController_1 = require("../controllers/reviewController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const validate_1 = require("../middleware/validate");
const reviewValidation_1 = require("../validations/reviewValidation");
const router = express_1.default.Router();
router.post("/", authMiddleware_1.authMiddleware, (0, validate_1.validate)(reviewValidation_1.createReviewSchema), reviewController_1.createReviewController);
router.get("/users/:userId", reviewController_1.getUserReviewsController);
exports.default = router;
