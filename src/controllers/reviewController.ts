import { asyncHandler } from "../utils/asyncHandler"
import { getUserReviewProfile, submitReview } from "../services/reviewService"

export const createReviewController = asyncHandler(async (req: any, res: any) => {
  const review = await submitReview(
    req.user.userId,
    req.body.bookingId,
    req.body.rating,
    req.body.comment
  )

  res.status(201).json(review)
})

export const getUserReviewsController = asyncHandler(async (req: any, res: any) => {
  const result = await getUserReviewProfile(req.params.userId)
  res.json(result)
})
