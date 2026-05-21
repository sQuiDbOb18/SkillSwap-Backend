"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReviewSummaryForUser = exports.getReviewsForUser = exports.createReview = exports.findBookingForReview = void 0;
const db_1 = __importDefault(require("../config/db"));
const reviewInclude = {
    user: {
        select: {
            id: true,
            username: true,
            fullName: true,
            profileImage: true,
        },
    },
    targetUser: {
        select: {
            id: true,
            username: true,
            fullName: true,
            profileImage: true,
        },
    },
    booking: {
        select: {
            id: true,
            date: true,
            status: true,
            skill: {
                select: {
                    id: true,
                    title: true,
                    userId: true,
                },
            },
        },
    },
};
const findBookingForReview = (bookingId, userId) => {
    return db_1.default.booking.findUnique({
        where: { id: bookingId },
        select: {
            id: true,
            userId: true,
            status: true,
            skill: {
                select: {
                    userId: true,
                },
            },
            reviews: {
                where: {
                    userId,
                },
                select: {
                    id: true,
                    userId: true,
                },
            },
        },
    });
};
exports.findBookingForReview = findBookingForReview;
const createReview = (data) => {
    return db_1.default.review.create({
        data,
        include: reviewInclude,
    });
};
exports.createReview = createReview;
const getReviewsForUser = (targetUserId) => {
    return db_1.default.review.findMany({
        where: {
            targetUserId,
            moderationStatus: {
                not: "REMOVED",
            },
        },
        include: reviewInclude,
        orderBy: { createdAt: "desc" },
    });
};
exports.getReviewsForUser = getReviewsForUser;
const getReviewSummaryForUser = async (targetUserId) => {
    const [aggregate, totalReviews] = await Promise.all([
        db_1.default.review.aggregate({
            where: {
                targetUserId,
                moderationStatus: {
                    not: "REMOVED",
                },
            },
            _avg: {
                rating: true,
            },
        }),
        db_1.default.review.count({
            where: {
                targetUserId,
                moderationStatus: {
                    not: "REMOVED",
                },
            },
        }),
    ]);
    return {
        averageRating: aggregate._avg.rating,
        totalReviews,
    };
};
exports.getReviewSummaryForUser = getReviewSummaryForUser;
