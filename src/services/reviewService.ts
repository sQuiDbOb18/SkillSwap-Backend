import { BookingStatus } from "@prisma/client"
import { findUserById } from "../repositories/userRepository"
import {
  createReview,
  findBookingForReview,
  getReviewsForUser,
  getReviewSummaryForUser,
} from "../repositories/reviewRepository"
import { CustomError } from "../utils/CustomError"

export const submitReview = async (
  currentUserId: string,
  bookingId: string,
  rating: number,
  comment?: string
) => {
  const booking = await findBookingForReview(bookingId, currentUserId)

  if (!booking) {
    throw new CustomError("Booking not found", 404)
  }

  const isParticipant =
    booking.userId === currentUserId || booking.skill.userId === currentUserId

  if (!isParticipant) {
    throw new CustomError("Only session participants can leave a review", 403)
  }

  if (booking.status !== BookingStatus.COMPLETED) {
    throw new CustomError("Reviews can only be left after a completed session", 400)
  }

  if (booking.reviews.length > 0) {
    throw new CustomError("You have already submitted a review for this session", 400)
  }

  const targetUserId =
    booking.userId === currentUserId ? booking.skill.userId : booking.userId

  if (targetUserId === currentUserId) {
    throw new CustomError("You cannot review yourself", 400)
  }

  return createReview({
    userId: currentUserId,
    targetUserId,
    bookingId,
    rating,
    comment: comment?.trim() || undefined,
  })
}

export const getUserReviewProfile = async (targetUserId: string) => {
  if (!targetUserId?.trim()) {
    throw new CustomError("User ID is required", 400)
  }

  const user = await findUserById(targetUserId)

  if (!user) {
    throw new CustomError("User not found", 404)
  }

  const [summary, reviews] = await Promise.all([
    getReviewSummaryForUser(targetUserId),
    getReviewsForUser(targetUserId),
  ])

  return {
    user: {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      profileImage: user.profileImage,
    },
    averageRating:
      summary.averageRating === null ? null : Number(summary.averageRating.toFixed(2)),
    totalReviews: summary.totalReviews,
    reviews,
  }
}
