"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserReviewsController = exports.createReviewController = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const reviewService_1 = require("../services/reviewService");
exports.createReviewController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const review = await (0, reviewService_1.submitReview)(req.user.userId, req.body.bookingId, req.body.rating, req.body.comment);
    res.status(201).json(review);
});
exports.getUserReviewsController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const result = await (0, reviewService_1.getUserReviewProfile)(req.params.userId);
    res.json(result);
});
