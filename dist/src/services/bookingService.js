"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportBookingOutcome = exports.respondToBookingExtension = exports.requestBookingExtension = exports.completeBooking = exports.cancelBooking = exports.respondToBooking = exports.listUserBookings = exports.requestSession = void 0;
const client_1 = require("@prisma/client");
const email_1 = require("../config/email");
const CustomError_1 = require("../utils/CustomError");
const emailService_1 = require("./emailService");
const bookingRepository_1 = require("../repositories/bookingRepository");
const notificationService_1 = require("./notificationService");
const walletService_1 = require("./walletService");
const sanitizeBookingForResponse = (booking) => {
    if (booking.status === client_1.BookingStatus.CONFIRMED ||
        booking.status === client_1.BookingStatus.COMPLETED) {
        return booking;
    }
    return {
        ...booking,
        meetingLink: null,
        meetingPlatform: null,
    };
};
const isRequester = (booking, userId) => booking.userId === userId;
const isProvider = (booking, userId) => booking.skill.userId === userId;
const isParticipant = (booking, userId) => isRequester(booking, userId) || isProvider(booking, userId);
const getHalf = (amount) => Math.floor(amount / 2);
const refundRequester = async (booking, amount, reason) => {
    if (amount <= 0) {
        return;
    }
    await (0, walletService_1.refundBookingCredits)({
        bookingId: booking.id,
        userId: booking.userId,
        amount,
        counterpartyUserId: booking.skill.userId,
        role: "requester",
        reason,
    });
};
const refundProvider = async (booking, amount, reason) => {
    if (amount <= 0) {
        return;
    }
    await (0, walletService_1.refundBookingCredits)({
        bookingId: booking.id,
        userId: booking.skill.userId,
        amount,
        counterpartyUserId: booking.userId,
        role: "provider",
        reason,
    });
};
const releaseRequesterHoldToProvider = async (booking, amount) => {
    if (amount <= 0) {
        return;
    }
    await (0, walletService_1.releaseHeldBookingCredits)({
        bookingId: booking.id,
        payerUserId: booking.userId,
        recipientUserId: booking.skill.userId,
        skillTitle: booking.skill.title,
        amount,
        role: "requester",
    });
};
const releaseProviderHoldToRequester = async (booking, amount) => {
    if (amount <= 0) {
        return;
    }
    await (0, walletService_1.releaseHeldBookingCredits)({
        bookingId: booking.id,
        payerUserId: booking.skill.userId,
        recipientUserId: booking.userId,
        skillTitle: booking.offeredSkill?.title ?? "swap session",
        amount,
        role: "provider",
    });
};
const setHeldState = async (bookingId, requesterHeldCredits, providerHeldCredits, paymentStatus) => {
    return (0, bookingRepository_1.updateBookingPaymentState)(bookingId, {
        requesterHeldCredits,
        providerHeldCredits,
        paymentStatus,
    });
};
const holdRequesterPayment = async (booking, amount) => {
    if (amount <= 0) {
        return booking;
    }
    await (0, walletService_1.holdBookingCredits)({
        bookingId: booking.id,
        payerUserId: booking.userId,
        counterpartyUserId: booking.skill.userId,
        amount,
        role: "requester",
    });
    const nextPaymentStatus = booking.type === client_1.BookingType.SWAP ? client_1.PaymentStatus.PARTIALLY_HELD : client_1.PaymentStatus.HELD;
    return setHeldState(booking.id, booking.requesterHeldCredits + amount, booking.providerHeldCredits, nextPaymentStatus);
};
const holdProviderPayment = async (booking, amount) => {
    if (amount <= 0) {
        return booking;
    }
    await (0, walletService_1.holdBookingCredits)({
        bookingId: booking.id,
        payerUserId: booking.skill.userId,
        counterpartyUserId: booking.userId,
        amount,
        role: "provider",
    });
    return setHeldState(booking.id, booking.requesterHeldCredits, booking.providerHeldCredits + amount, client_1.PaymentStatus.HELD);
};
const refundAllHeldFunds = async (booking, reason) => {
    await Promise.all([
        refundRequester(booking, booking.requesterHeldCredits, reason),
        refundProvider(booking, booking.providerHeldCredits, reason),
    ]);
};
const requestSession = async (userId, skillId, date, type, offeredSkillId, sessionMode, durationMinutes, meetingPlatform, meetingLink, sessionNotes) => {
    const skill = await (0, bookingRepository_1.findSkillById)(skillId);
    if (!skill) {
        throw new CustomError_1.CustomError("Skill not found", 404);
    }
    if (skill.userId === userId) {
        throw new CustomError_1.CustomError("You cannot book your own skill", 400);
    }
    const baseCreditCost = type === client_1.BookingType.SWAP
        ? skill.creditCost ?? 0
        : !skill.isBarter
            ? skill.creditCost ?? 0
            : 0;
    if (baseCreditCost > 0) {
        await (0, walletService_1.ensureUserHasCredits)(userId, baseCreditCost);
    }
    let validOfferedSkillId;
    let counterpartyBaseCreditCost = 0;
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
        if (skill.creditCost == null || offeredSkill.creditCost == null) {
            throw new CustomError_1.CustomError("Both skills must have a credit cost before they can be booked as a paid swap", 400);
        }
        if (skill.creditCost <= 0 || offeredSkill.creditCost <= 0) {
            throw new CustomError_1.CustomError("Swap skills must have a credit cost greater than zero", 400);
        }
        validOfferedSkillId = offeredSkill.id;
        counterpartyBaseCreditCost = offeredSkill.creditCost;
    }
    let booking = await (0, bookingRepository_1.createBooking)({
        userId,
        skillId,
        offeredSkillId: validOfferedSkillId,
        date: new Date(date),
        type,
        sessionMode,
        meetingPlatform,
        meetingLink,
        durationMinutes,
        sessionNotes,
        baseCreditCost,
        counterpartyBaseCreditCost,
    });
    try {
        booking = await holdRequesterPayment(booking, baseCreditCost);
    }
    catch (error) {
        await (0, bookingRepository_1.deleteBooking)(booking.id);
        throw error;
    }
    if (booking.type === client_1.BookingType.SWAP && booking.offeredSkill && booking.skill.user.email) {
        await (0, emailService_1.sendSwapRequestReceivedEmail)({
            email: booking.skill.user.email,
            name: booking.skill.user.fullName,
            otherUserName: booking.user.fullName,
            requestedSkillTitle: booking.skill.title,
            offeredSkillTitle: booking.offeredSkill.title,
            actionUrl: email_1.emailConfig.bookingsPageUrl,
        });
    }
    await (0, notificationService_1.notifyUser)({
        userId: booking.skill.userId,
        type: "BOOKING_CREATED",
        message: `${booking.user.fullName} requested a ${booking.type.toLowerCase()} session for ${booking.skill.title}.`,
        relatedBookingId: booking.id,
    });
    return sanitizeBookingForResponse(booking);
};
exports.requestSession = requestSession;
const listUserBookings = async (userId) => {
    const bookings = await (0, bookingRepository_1.getBookingsForUser)(userId);
    return bookings.map((booking) => sanitizeBookingForResponse(booking));
};
exports.listUserBookings = listUserBookings;
const respondToBooking = async (currentUserId, bookingId, action, details) => {
    let booking = await (0, bookingRepository_1.findBookingById)(bookingId);
    if (!booking) {
        throw new CustomError_1.CustomError("Booking not found", 404);
    }
    if (!isProvider(booking, currentUserId)) {
        throw new CustomError_1.CustomError("Only the skill owner can respond to this booking", 403);
    }
    if (booking.status !== client_1.BookingStatus.PENDING) {
        throw new CustomError_1.CustomError("Only pending bookings can be updated", 400);
    }
    if (action === "accept") {
        const nextMeetingLink = details?.meetingLink ?? booking.meetingLink ?? undefined;
        const nextMeetingPlatform = details?.meetingPlatform ?? booking.meetingPlatform ?? undefined;
        if (booking.sessionMode === client_1.SessionMode.EXTERNAL_LINK && !nextMeetingLink) {
            throw new CustomError_1.CustomError("An external session must include a meeting link before it can be accepted", 400);
        }
        if (booking.sessionMode === client_1.SessionMode.EXTERNAL_LINK && !nextMeetingPlatform) {
            throw new CustomError_1.CustomError("An external session must include a meeting platform before it can be accepted", 400);
        }
        if (booking.type === client_1.BookingType.SWAP && booking.counterpartyBaseCreditCost > 0) {
            await (0, walletService_1.ensureUserHasCredits)(currentUserId, booking.counterpartyBaseCreditCost);
            booking = await holdProviderPayment(booking, booking.counterpartyBaseCreditCost);
        }
        if (details?.meetingLink || details?.meetingPlatform || details?.sessionNotes) {
            booking = await (0, bookingRepository_1.updateBookingSessionDetails)(bookingId, {
                meetingLink: details.meetingLink ?? booking.meetingLink ?? undefined,
                meetingPlatform: details.meetingPlatform ?? booking.meetingPlatform ?? undefined,
                sessionNotes: details.sessionNotes ?? booking.sessionNotes ?? undefined,
            });
        }
        const updatedBooking = await (0, bookingRepository_1.updateBookingStatus)(bookingId, client_1.BookingStatus.CONFIRMED);
        if (updatedBooking.type === client_1.BookingType.SWAP &&
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
        await (0, notificationService_1.notifyUser)({
            userId: updatedBooking.userId,
            type: "BOOKING_CONFIRMED",
            message: `Your booking for ${updatedBooking.skill.title} was accepted.`,
            relatedBookingId: updatedBooking.id,
        });
        return sanitizeBookingForResponse(updatedBooking);
    }
    await refundAllHeldFunds(booking, "Booking rejected and funds refunded");
    const updatedBooking = await (0, bookingRepository_1.updateBookingOutcome)(bookingId, {
        status: client_1.BookingStatus.REJECTED,
        outcome: client_1.BookingOutcome.CANCELLED_BY_PROVIDER,
        paymentStatus: client_1.PaymentStatus.REFUNDED,
        requesterHeldCredits: 0,
        providerHeldCredits: 0,
        cancelledAt: new Date(),
    });
    await (0, notificationService_1.notifyUser)({
        userId: updatedBooking.userId,
        type: "BOOKING_REJECTED",
        message: `Your booking for ${updatedBooking.skill.title} was rejected and refunded.`,
        relatedBookingId: updatedBooking.id,
    });
    return sanitizeBookingForResponse(updatedBooking);
};
exports.respondToBooking = respondToBooking;
const cancelBooking = async (currentUserId, bookingId) => {
    const booking = await (0, bookingRepository_1.findBookingById)(bookingId);
    if (!booking) {
        throw new CustomError_1.CustomError("Booking not found", 404);
    }
    if (!isParticipant(booking, currentUserId)) {
        throw new CustomError_1.CustomError("Only booking participants can cancel this booking", 403);
    }
    if (![client_1.BookingStatus.PENDING, client_1.BookingStatus.CONFIRMED].includes(booking.status)) {
        throw new CustomError_1.CustomError("Only pending or confirmed bookings can be cancelled", 400);
    }
    await refundAllHeldFunds(booking, "Booking cancelled and funds refunded");
    const outcome = isRequester(booking, currentUserId)
        ? client_1.BookingOutcome.CANCELLED_BY_REQUESTER
        : client_1.BookingOutcome.CANCELLED_BY_PROVIDER;
    const updatedBooking = await (0, bookingRepository_1.updateBookingOutcome)(bookingId, {
        status: client_1.BookingStatus.CANCELLED,
        outcome,
        paymentStatus: client_1.PaymentStatus.REFUNDED,
        requesterHeldCredits: 0,
        providerHeldCredits: 0,
        cancelledAt: new Date(),
    });
    await (0, notificationService_1.notifyUser)({
        userId: isRequester(booking, currentUserId) ? booking.skill.userId : booking.userId,
        type: "BOOKING_REJECTED",
        message: `The booking for ${booking.skill.title} was cancelled and refunded.`,
        relatedBookingId: booking.id,
    });
    return sanitizeBookingForResponse(updatedBooking);
};
exports.cancelBooking = cancelBooking;
const completeBooking = async (currentUserId, bookingId) => {
    const booking = await (0, bookingRepository_1.findBookingById)(bookingId);
    if (!booking) {
        throw new CustomError_1.CustomError("Booking not found", 404);
    }
    if (!isProvider(booking, currentUserId)) {
        throw new CustomError_1.CustomError("Only the skill owner can complete this booking", 403);
    }
    if (booking.status !== client_1.BookingStatus.CONFIRMED) {
        throw new CustomError_1.CustomError("Only confirmed bookings can be marked as completed", 400);
    }
    await releaseRequesterHoldToProvider(booking, booking.requesterHeldCredits);
    if (booking.type === client_1.BookingType.SWAP) {
        await releaseProviderHoldToRequester(booking, booking.providerHeldCredits);
    }
    const updatedBooking = await (0, bookingRepository_1.updateBookingOutcome)(bookingId, {
        status: client_1.BookingStatus.COMPLETED,
        outcome: client_1.BookingOutcome.COMPLETED,
        paymentStatus: client_1.PaymentStatus.RELEASED,
        requesterHeldCredits: 0,
        providerHeldCredits: 0,
        completedAt: new Date(),
    });
    await (0, notificationService_1.notifyUser)({
        userId: updatedBooking.userId,
        type: "BOOKING_COMPLETED",
        message: `Your booking for ${updatedBooking.skill.title} has been completed.`,
        relatedBookingId: updatedBooking.id,
    });
    return sanitizeBookingForResponse(updatedBooking);
};
exports.completeBooking = completeBooking;
const requestBookingExtension = async (currentUserId, bookingId, extraMinutes, extraCreditCost) => {
    const booking = await (0, bookingRepository_1.findBookingById)(bookingId);
    if (!booking) {
        throw new CustomError_1.CustomError("Booking not found", 404);
    }
    if (booking.status !== client_1.BookingStatus.CONFIRMED) {
        throw new CustomError_1.CustomError("Only confirmed bookings can be extended", 400);
    }
    if (booking.extensionStatus === client_1.ExtensionStatus.PENDING) {
        throw new CustomError_1.CustomError("There is already a pending extension request for this booking", 400);
    }
    const resolvedExtraCreditCost = extraCreditCost ?? 0;
    if (booking.type === client_1.BookingType.LEARN) {
        if (!isRequester(booking, currentUserId)) {
            throw new CustomError_1.CustomError("Only the learner who booked the session can request extra time for a paid session", 403);
        }
        if (resolvedExtraCreditCost <= 0) {
            throw new CustomError_1.CustomError("Paid learning sessions must include an extra credit cost for additional time", 400);
        }
        const updatedBooking = await (0, bookingRepository_1.setPendingBookingExtension)(bookingId, {
            pendingExtensionMinutes: extraMinutes,
            pendingExtensionCreditCost: resolvedExtraCreditCost,
            pendingCounterpartyExtensionCreditCost: 0,
            extensionRequestedById: currentUserId,
            extensionStatus: "PENDING",
            extensionRequestedAt: new Date(),
            extensionRespondedAt: null,
        });
        return sanitizeBookingForResponse(updatedBooking);
    }
    if (!isParticipant(booking, currentUserId)) {
        throw new CustomError_1.CustomError("Only booking participants can request swap extensions", 403);
    }
    if (resolvedExtraCreditCost <= 0 || resolvedExtraCreditCost % 2 !== 0) {
        throw new CustomError_1.CustomError("Swap session extension cost must be a positive even number so it can be split evenly", 400);
    }
    const splitCost = resolvedExtraCreditCost / 2;
    const updatedBooking = await (0, bookingRepository_1.setPendingBookingExtension)(bookingId, {
        pendingExtensionMinutes: extraMinutes,
        pendingExtensionCreditCost: splitCost,
        pendingCounterpartyExtensionCreditCost: splitCost,
        extensionRequestedById: currentUserId,
        extensionStatus: "PENDING",
        extensionRequestedAt: new Date(),
        extensionRespondedAt: null,
    });
    return sanitizeBookingForResponse(updatedBooking);
};
exports.requestBookingExtension = requestBookingExtension;
const respondToBookingExtension = async (currentUserId, bookingId, action) => {
    let booking = await (0, bookingRepository_1.findBookingById)(bookingId);
    if (!booking) {
        throw new CustomError_1.CustomError("Booking not found", 404);
    }
    if (!isParticipant(booking, currentUserId)) {
        throw new CustomError_1.CustomError("Only booking participants can respond to extension requests", 403);
    }
    if (booking.extensionRequestedById === currentUserId) {
        throw new CustomError_1.CustomError("You cannot respond to your own extension request", 403);
    }
    if (booking.status !== client_1.BookingStatus.CONFIRMED) {
        throw new CustomError_1.CustomError("Only confirmed bookings can be extended", 400);
    }
    if (booking.extensionStatus !== client_1.ExtensionStatus.PENDING ||
        !booking.pendingExtensionMinutes) {
        throw new CustomError_1.CustomError("There is no pending extension request for this booking", 400);
    }
    if (action === "approve") {
        const requesterIncrement = booking.type === client_1.BookingType.SWAP
            ? booking.pendingExtensionCreditCost ?? 0
            : booking.pendingExtensionCreditCost ?? 0;
        const providerIncrement = booking.type === client_1.BookingType.SWAP
            ? booking.pendingCounterpartyExtensionCreditCost ?? 0
            : 0;
        if (requesterIncrement > 0) {
            await (0, walletService_1.ensureUserHasCredits)(booking.userId, requesterIncrement);
            booking = await holdRequesterPayment(booking, requesterIncrement);
        }
        if (providerIncrement > 0) {
            await (0, walletService_1.ensureUserHasCredits)(booking.skill.userId, providerIncrement);
            booking = await holdProviderPayment(booking, providerIncrement);
        }
        const updatedBooking = await (0, bookingRepository_1.resolveBookingExtension)(bookingId, {
            extensionStatus: "APPROVED",
            extensionMinutes: { increment: booking.pendingExtensionMinutes },
            extensionCreditCost: { increment: requesterIncrement },
            counterpartyExtensionCreditCost: { increment: providerIncrement },
            pendingExtensionMinutes: null,
            pendingExtensionCreditCost: null,
            pendingCounterpartyExtensionCreditCost: null,
            extensionRequestedById: null,
            extensionRespondedAt: new Date(),
        });
        return sanitizeBookingForResponse(updatedBooking);
    }
    const updatedBooking = await (0, bookingRepository_1.resolveBookingExtension)(bookingId, {
        extensionStatus: "REJECTED",
        pendingExtensionMinutes: null,
        pendingExtensionCreditCost: null,
        pendingCounterpartyExtensionCreditCost: null,
        extensionRequestedById: null,
        extensionRespondedAt: new Date(),
    });
    return sanitizeBookingForResponse(updatedBooking);
};
exports.respondToBookingExtension = respondToBookingExtension;
const reportBookingOutcome = async (currentUserId, bookingId, outcome) => {
    const booking = await (0, bookingRepository_1.findBookingById)(bookingId);
    if (!booking) {
        throw new CustomError_1.CustomError("Booking not found", 404);
    }
    if (!isParticipant(booking, currentUserId)) {
        throw new CustomError_1.CustomError("Only booking participants can report session outcomes", 403);
    }
    if (booking.status !== client_1.BookingStatus.CONFIRMED) {
        throw new CustomError_1.CustomError("Only confirmed bookings can be marked with a no-show outcome", 400);
    }
    if (outcome === "REQUESTER_NO_SHOW" && isRequester(booking, currentUserId)) {
        throw new CustomError_1.CustomError("You cannot report yourself as the person who showed up", 400);
    }
    if (outcome === "PROVIDER_NO_SHOW" && isProvider(booking, currentUserId)) {
        throw new CustomError_1.CustomError("You cannot report yourself as the person who showed up", 400);
    }
    let paymentStatus = client_1.PaymentStatus.REFUNDED;
    if (booking.type === client_1.BookingType.LEARN) {
        if (outcome === "REQUESTER_NO_SHOW") {
            const payout = getHalf(booking.requesterHeldCredits);
            const refund = booking.requesterHeldCredits - payout;
            await releaseRequesterHoldToProvider(booking, payout);
            await refundRequester(booking, refund, "Partial refund after learner no-show");
            paymentStatus = client_1.PaymentStatus.PARTIALLY_RELEASED;
        }
        else {
            await refundRequester(booking, booking.requesterHeldCredits, "Refund after provider no-show");
            paymentStatus = client_1.PaymentStatus.REFUNDED;
        }
    }
    else {
        if (outcome === "BOTH_NO_SHOW") {
            await refundAllHeldFunds(booking, "Swap session missed by both users and fully refunded");
            paymentStatus = client_1.PaymentStatus.REFUNDED;
        }
        else if (outcome === "REQUESTER_NO_SHOW") {
            await refundProvider(booking, booking.providerHeldCredits, "Your swap hold was refunded");
            await (0, walletService_1.compensateBookingNoShow)({
                bookingId: booking.id,
                noShowUserId: booking.userId,
                compensatedUserId: booking.skill.userId,
                amount: getHalf(booking.requesterHeldCredits),
                description: "No-show compensation for attending the swap session",
            });
            paymentStatus = client_1.PaymentStatus.PARTIALLY_RELEASED;
        }
        else {
            await refundRequester(booking, booking.requesterHeldCredits, "Your swap hold was refunded");
            await (0, walletService_1.compensateBookingNoShow)({
                bookingId: booking.id,
                noShowUserId: booking.skill.userId,
                compensatedUserId: booking.userId,
                amount: getHalf(booking.providerHeldCredits),
                description: "No-show compensation for attending the swap session",
            });
            paymentStatus = client_1.PaymentStatus.PARTIALLY_RELEASED;
        }
    }
    const updatedBooking = await (0, bookingRepository_1.updateBookingOutcome)(bookingId, {
        status: client_1.BookingStatus.CANCELLED,
        outcome: client_1.BookingOutcome[outcome],
        paymentStatus,
        requesterHeldCredits: 0,
        providerHeldCredits: 0,
        cancelledAt: new Date(),
    });
    return sanitizeBookingForResponse(updatedBooking);
};
exports.reportBookingOutcome = reportBookingOutcome;
