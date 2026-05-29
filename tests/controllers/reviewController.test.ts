import { jest, describe, it, expect, beforeEach } from "@jest/globals"
import { getUserReviewProfile, submitReview } from "../../src/services/reviewService"
import {
  createReviewController,
  getUserReviewsController,
} from "../../src/controllers/reviewController"

jest.mock("../../src/services/reviewService", () => ({
  getUserReviewProfile: jest.fn(),
  submitReview: jest.fn(),
}))

const mockedSubmitReview = submitReview as jest.MockedFunction<typeof submitReview>
const mockedGetUserReviewProfile = getUserReviewProfile as jest.MockedFunction<
  typeof getUserReviewProfile
>

const createResponse = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() })
const runController = async (controller: any, req: any, res: any, next = jest.fn()) => {
  controller(req, res, next)
  await Promise.resolve()
  await Promise.resolve()
}

describe("reviewController", () => {
  beforeEach(() => jest.clearAllMocks())

  it("creates a review with status 201", async () => {
    const review = { id: "review-1" }
    const res = createResponse()
    mockedSubmitReview.mockResolvedValue(review as never)
    await runController(
      createReviewController,
      { user: { userId: "user-1" }, body: { bookingId: "booking-1", rating: 5, comment: "nice" } },
      res
    )
    expect(mockedSubmitReview).toHaveBeenCalledWith("user-1", "booking-1", 5, "nice")
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith(review)
  })

  it("gets a user's review profile", async () => {
    const profile = { totalReviews: 2 }
    const res = createResponse()
    mockedGetUserReviewProfile.mockResolvedValue(profile as never)
    await runController(getUserReviewsController, { params: { userId: "user-2" } }, res)
    expect(mockedGetUserReviewProfile).toHaveBeenCalledWith("user-2")
    expect(res.json).toHaveBeenCalledWith(profile)
  })
})
