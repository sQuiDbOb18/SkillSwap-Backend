"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBookingsForUser = exports.resolveBookingExtension = exports.setPendingBookingExtension = exports.updateBookingSessionDetails = exports.updateBookingOutcome = exports.updateBookingPaymentState = exports.updateBookingStatus = exports.deleteBooking = exports.findBookingById = exports.createBooking = exports.findSkillById = void 0;
const db_1 = __importDefault(require("../config/db"));
const bookingInclude = {
    user: {
        select: {
            id: true,
            email: true,
            username: true,
            fullName: true,
        },
    },
    skill: {
        select: {
            id: true,
            title: true,
            userId: true,
            category: true,
            level: true,
            creditCost: true,
            isBarter: true,
            user: {
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                },
            },
        },
    },
    offeredSkill: {
        select: {
            id: true,
            title: true,
            userId: true,
            category: true,
            level: true,
            creditCost: true,
            isBarter: true,
            user: {
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                },
            },
        },
    },
};
const findSkillById = (skillId) => {
    return db_1.default.skill.findUnique({
        where: { id: skillId },
        select: {
            id: true,
            userId: true,
            title: true,
            creditCost: true,
            isBarter: true,
        },
    });
};
exports.findSkillById = findSkillById;
const createBooking = (data) => {
    return db_1.default.booking.create({
        data,
        include: bookingInclude,
    });
};
exports.createBooking = createBooking;
const findBookingById = (bookingId) => {
    return db_1.default.booking.findUnique({
        where: { id: bookingId },
        include: bookingInclude,
    });
};
exports.findBookingById = findBookingById;
const deleteBooking = (bookingId) => {
    return db_1.default.booking.delete({
        where: { id: bookingId },
    });
};
exports.deleteBooking = deleteBooking;
const updateBookingStatus = (bookingId, status) => {
    return db_1.default.booking.update({
        where: { id: bookingId },
        data: { status },
        include: bookingInclude,
    });
};
exports.updateBookingStatus = updateBookingStatus;
const updateBookingPaymentState = (bookingId, data) => {
    return db_1.default.booking.update({
        where: { id: bookingId },
        data,
        include: bookingInclude,
    });
};
exports.updateBookingPaymentState = updateBookingPaymentState;
const updateBookingOutcome = (bookingId, data) => {
    return db_1.default.booking.update({
        where: { id: bookingId },
        data,
        include: bookingInclude,
    });
};
exports.updateBookingOutcome = updateBookingOutcome;
const updateBookingSessionDetails = (bookingId, data) => {
    return db_1.default.booking.update({
        where: { id: bookingId },
        data,
        include: bookingInclude,
    });
};
exports.updateBookingSessionDetails = updateBookingSessionDetails;
const setPendingBookingExtension = (bookingId, data) => {
    return db_1.default.booking.update({
        where: { id: bookingId },
        data,
        include: bookingInclude,
    });
};
exports.setPendingBookingExtension = setPendingBookingExtension;
const resolveBookingExtension = (bookingId, data) => {
    return db_1.default.booking.update({
        where: { id: bookingId },
        data,
        include: bookingInclude,
    });
};
exports.resolveBookingExtension = resolveBookingExtension;
const getBookingsForUser = (userId) => {
    return db_1.default.booking.findMany({
        where: {
            OR: [{ userId }, { skill: { userId } }],
        },
        include: bookingInclude,
        orderBy: { date: "asc" },
    });
};
exports.getBookingsForUser = getBookingsForUser;
