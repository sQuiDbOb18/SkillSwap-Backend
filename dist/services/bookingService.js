"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.completeBooking = exports.respondToBooking = exports.listUserBookings = exports.requestSession = void 0;
const client_1 = require("@prisma/client");
const email_1 = require("../config/email");
const CustomError_1 = require("../utils/CustomError");
const emailService_1 = require("./emailService");
const bookingRepository_1 = require("../repositories/bookingRepository");
const requestSession = async (userId, skillId, date, type, offeredSkillId) => {
    const skill = await (0, bookingRepository_1.findSkillById)(skillId);
    if (!skill) {
        throw new CustomError_1.CustomError("Skill not found", 404);
    }
    if (skill.userId === userId) {
        throw new CustomError_1.CustomError("You cannot book your own skill", 400);
    }
    let validOfferedSkillId;
    if (type === client_1.BookingType.SWAP) {
        if (!offeredSkillId) {
            throw new CustomError_1.CustomError("Offered skill is required for swap requests", 400);
        }
        const offeredSkill = await (0, bookingRepository_1.findSkillById)(offeredSkillId);
        if (!offeredSkill) {
            throw new CustomError_1.CustomError("Offered skill not found", 404);
        }
        if (offeredSkill.userId !== userId) {
            throw new CustomError_1.CustomError("You can only offer one of your own skills in a swap request", 403);
        }
        if (offeredSkill.id === skill.id) {
            throw new CustomError_1.CustomError("Requested skill and offered skill must be different", 400);
        }
        if (offeredSkill.userId === skill.userId) {
            throw new CustomError_1.CustomError("Swap requests must be between different users", 400);
        }
        validOfferedSkillId = offeredSkill.id;
    }
    const booking = await (0, bookingRepository_1.createBooking)({
        userId,
        skillId,
        offeredSkillId: validOfferedSkillId,
        date: new Date(date),
        type,
    });
    if (booking.type === client_1.BookingType.SWAP &&
        booking.offeredSkill &&
        booking.skill.user.email) {
        await (0, emailService_1.sendSwapRequestReceivedEmail)({
            email: booking.skill.user.email,
            name: booking.skill.user.fullName,
            otherUserName: booking.user.fullName,
            requestedSkillTitle: booking.skill.title,
            offeredSkillTitle: booking.offeredSkill.title,
            actionUrl: email_1.emailConfig.bookingsPageUrl,
        });
    }
    return booking;
};
exports.requestSession = requestSession;
const listUserBookings = async (userId) => {
    return (0, bookingRepository_1.getBookingsForUser)(userId);
};
exports.listUserBookings = listUserBookings;
const respondToBooking = async (currentUserId, bookingId, action) => {
    const booking = await (0, bookingRepository_1.findBookingById)(bookingId);
    if (!booking) {
        throw new CustomError_1.CustomError("Booking not found", 404);
    }
    if (booking.skill.userId !== currentUserId) {
        throw new CustomError_1.CustomError("Only the skill owner can respond to this booking", 403);
    }
    if (booking.status !== client_1.BookingStatus.PENDING) {
        throw new CustomError_1.CustomError("Only pending bookings can be updated", 400);
    }
    const nextStatus = action === "accept" ? client_1.BookingStatus.CONFIRMED : client_1.BookingStatus.REJECTED;
    const updatedBooking = await (0, bookingRepository_1.updateBookingStatus)(bookingId, nextStatus);
    if (action === "accept" &&
        updatedBooking.type === client_1.BookingType.SWAP &&
        updatedBooking.offeredSkill &&
        updatedBooking.user.email) {
        await (0, emailService_1.sendSwapRequestAcceptedEmail)({
            email: updatedBooking.user.email,
            name: updatedBooking.user.fullName,
            otherUserName: updatedBooking.skill.user.fullName,
            requestedSkillTitle: updatedBooking.skill.title,
            offeredSkillTitle: updatedBooking.offeredSkill.title,
            actionUrl: email_1.emailConfig.bookingsPageUrl,
        });
    }
    return updatedBooking;
};
exports.respondToBooking = respondToBooking;
const completeBooking = async (currentUserId, bookingId) => {
    const booking = await (0, bookingRepository_1.findBookingById)(bookingId);
    if (!booking) {
        throw new CustomError_1.CustomError("Booking not found", 404);
    }
    if (booking.skill.userId !== currentUserId) {
        throw new CustomError_1.CustomError("Only the skill owner can complete this booking", 403);
    }
    if (booking.status !== client_1.BookingStatus.CONFIRMED) {
        throw new CustomError_1.CustomError("Only confirmed bookings can be marked as completed", 400);
    }
    return (0, bookingRepository_1.updateBookingStatus)(bookingId, client_1.BookingStatus.COMPLETED);
};
exports.completeBooking = completeBooking;
