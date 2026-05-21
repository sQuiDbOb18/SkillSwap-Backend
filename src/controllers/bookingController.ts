import { asyncHandler } from "../utils/asyncHandler";
import {
  cancelBooking,
  completeBooking,
  listUserBookings,
  reportBookingOutcome,
  requestBookingExtension,
  requestSession,
  respondToBookingExtension,
  respondToBooking,
} from "../services/bookingService";

export const createBooking = asyncHandler(async (req: any, res: any) => {
  const booking = await requestSession(
    req.user.userId,
    req.body.skillId,
    req.body.date,
    req.body.type,
    req.body.offeredSkillId,
    req.body.sessionMode,
    req.body.durationMinutes,
    req.body.meetingPlatform,
    req.body.meetingLink,
    req.body.sessionNotes
  );
  res.status(201).json(booking);
});

export const getBookings = asyncHandler(async (req: any, res: any) => {
  const bookings = await listUserBookings(req.user.userId);
  res.json(bookings);
});

export const respondToBookingController = asyncHandler(async (req: any, res: any) => {
  const booking = await respondToBooking(req.user.userId, req.params.bookingId, req.body.action, {
    meetingPlatform: req.body.meetingPlatform,
    meetingLink: req.body.meetingLink,
    sessionNotes: req.body.sessionNotes,
  });
  res.json(booking);
});

export const completeBookingController = asyncHandler(async (req: any, res: any) => {
  const booking = await completeBooking(req.user.userId, req.params.bookingId);
  res.json(booking);
});

export const cancelBookingController = asyncHandler(async (req: any, res: any) => {
  const booking = await cancelBooking(req.user.userId, req.params.bookingId);
  res.json(booking);
});

export const requestBookingExtensionController = asyncHandler(async (req: any, res: any) => {
  const booking = await requestBookingExtension(
    req.user.userId,
    req.params.bookingId,
    req.body.extraMinutes,
    req.body.extraCreditCost
  );
  res.json(booking);
});

export const respondToBookingExtensionController = asyncHandler(async (req: any, res: any) => {
  const booking = await respondToBookingExtension(
    req.user.userId,
    req.params.bookingId,
    req.body.action
  );
  res.json(booking);
});

export const reportBookingOutcomeController = asyncHandler(async (req: any, res: any) => {
  const booking = await reportBookingOutcome(
    req.user.userId,
    req.params.bookingId,
    req.body.outcome
  );
  res.json(booking);
});
