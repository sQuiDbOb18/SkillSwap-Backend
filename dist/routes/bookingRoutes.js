"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bookingController_1 = require("../controllers/bookingController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const validate_1 = require("../middleware/validate");
const bookingValidation_1 = require("../validations/bookingValidation");
const router = express_1.default.Router();
router.get("/", authMiddleware_1.authMiddleware, bookingController_1.getBookings);
router.post("/", authMiddleware_1.authMiddleware, (0, validate_1.validate)(bookingValidation_1.createBookingSchema), bookingController_1.createBooking);
router.patch("/:bookingId/respond", authMiddleware_1.authMiddleware, (0, validate_1.validate)(bookingValidation_1.respondToBookingSchema), bookingController_1.respondToBookingController);
router.patch("/:bookingId/complete", authMiddleware_1.authMiddleware, bookingController_1.completeBookingController);
exports.default = router;
