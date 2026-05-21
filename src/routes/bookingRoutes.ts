import express from "express";
import {
  cancelBookingController,
  completeBookingController,
  createBooking,
  getBookings,
  reportBookingOutcomeController,
  requestBookingExtensionController,
  respondToBookingExtensionController,
  respondToBookingController,
} from "../controllers/bookingController";
import { authMiddleware } from "../middleware/authMiddleware";
import { validate } from "../middleware/validate";
import {
  cancelBookingSchema,
  createBookingSchema,
  reportBookingOutcomeSchema,
  requestBookingExtensionSchema,
  respondToBookingExtensionSchema,
  respondToBookingSchema,
} from "../validations/bookingValidation";

const router = express.Router();

router.get("/", authMiddleware, getBookings);
router.post("/", authMiddleware, validate(createBookingSchema), createBooking);
router.patch(
  "/:bookingId/respond",
  authMiddleware,
  validate(respondToBookingSchema),
  respondToBookingController
);
router.patch(
  "/:bookingId/cancel",
  authMiddleware,
  validate(cancelBookingSchema),
  cancelBookingController
);
router.patch(
  "/:bookingId/extension",
  authMiddleware,
  validate(requestBookingExtensionSchema),
  requestBookingExtensionController
);
router.patch(
  "/:bookingId/extension/respond",
  authMiddleware,
  validate(respondToBookingExtensionSchema),
  respondToBookingExtensionController
);
router.patch("/:bookingId/complete", authMiddleware, completeBookingController);
router.patch(
  "/:bookingId/outcome",
  authMiddleware,
  validate(reportBookingOutcomeSchema),
  reportBookingOutcomeController
);

export default router;
