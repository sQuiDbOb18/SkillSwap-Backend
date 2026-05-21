"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportBookingOutcomeController = exports.respondToBookingExtensionController = exports.requestBookingExtensionController = exports.cancelBookingController = exports.completeBookingController = exports.respondToBookingController = exports.getBookings = exports.createBooking = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const bookingService_1 = require("../services/bookingService");
exports.createBooking = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const booking = await (0, bookingService_1.requestSession)(req.user.userId, req.body.skillId, req.body.date, req.body.type, req.body.offeredSkillId, req.body.sessionMode, req.body.durationMinutes, req.body.meetingPlatform, req.body.meetingLink, req.body.sessionNotes);
    res.status(201).json(booking);
});
exports.getBookings = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const bookings = await (0, bookingService_1.listUserBookings)(req.user.userId);
    res.json(bookings);
});
exports.respondToBookingController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const booking = await (0, bookingService_1.respondToBooking)(req.user.userId, req.params.bookingId, req.body.action, {
        meetingPlatform: req.body.meetingPlatform,
        meetingLink: req.body.meetingLink,
        sessionNotes: req.body.sessionNotes,
    });
    res.json(booking);
});
exports.completeBookingController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const booking = await (0, bookingService_1.completeBooking)(req.user.userId, req.params.bookingId);
    res.json(booking);
});
exports.cancelBookingController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const booking = await (0, bookingService_1.cancelBooking)(req.user.userId, req.params.bookingId);
    res.json(booking);
});
exports.requestBookingExtensionController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const booking = await (0, bookingService_1.requestBookingExtension)(req.user.userId, req.params.bookingId, req.body.extraMinutes, req.body.extraCreditCost);
    res.json(booking);
});
exports.respondToBookingExtensionController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const booking = await (0, bookingService_1.respondToBookingExtension)(req.user.userId, req.params.bookingId, req.body.action);
    res.json(booking);
});
exports.reportBookingOutcomeController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const booking = await (0, bookingService_1.reportBookingOutcome)(req.user.userId, req.params.bookingId, req.body.outcome);
    res.json(booking);
});
