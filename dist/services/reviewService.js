"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserReviewProfile = exports.submitReview = void 0;
const client_1 = require("@prisma/client");
const userRepository_1 = require("../repositories/userRepository");
const reviewRepository_1 = require("../repositories/reviewRepository");
const CustomError_1 = require("../utils/CustomError");
const submitReview = async (currentUserId, bookingId, rating, comment) => {
    const booking = await (0, reviewRepository_1.findBookingForReview)(bookingId, currentUserId);
    if (!booking) {
        throw new CustomError_1.CustomError("Booking not found", 404);
    }
    const isParticipant = booking.userId === currentUserId || booking.skill.userId === currentUserId;
    if (!isParticipant) {
        throw new CustomError_1.CustomError("Only session participants can leave a review", 403);
    }
    if (booking.status !== client_1.BookingStatus.COMPLETED) {
        throw new CustomError_1.CustomError("Reviews can only be left after a completed session", 400);
    }
    if (booking.reviews.length > 0) {
        throw new CustomError_1.CustomError("You have already submitted a review for this session", 400);
    }
    const targetUserId = booking.userId === currentUserId ? booking.skill.userId : booking.userId;
    if (targetUserId === currentUserId) {
        throw new CustomError_1.CustomError("You cannot review yourself", 400);
    }
    return (0, reviewRepository_1.createReview)({
        userId: currentUserId,
        targetUserId,
        bookingId,
        rating,
        comment: (comment === null || comment === void 0 ? void 0 : comment.trim()) || undefined,
    });
};
exports.submitReview = submitReview;
const getUserReviewProfile = async (targetUserId) => {
    if (!(targetUserId === null || targetUserId === void 0 ? void 0 : targetUserId.trim())) {
        throw new CustomError_1.CustomError("User ID is required", 400);
    }
    const user = await (0, userRepository_1.findUserById)(targetUserId);
    if (!user) {
        throw new CustomError_1.CustomError("User not found", 404);
    }
    const [summary, reviews] = await Promise.all([
        (0, reviewRepository_1.getReviewSummaryForUser)(targetUserId),
        (0, reviewRepository_1.getReviewsForUser)(targetUserId),
    ]);
    return {
        user: {
            id: user.id,
            username: user.username,
            fullName: user.fullName,
            profileImage: user.profileImage,
        },
        averageRating: summary.averageRating === null ? null : Number(summary.averageRating.toFixed(2)),
        totalReviews: summary.totalReviews,
        reviews,
    };
};
exports.getUserReviewProfile = getUserReviewProfile;
