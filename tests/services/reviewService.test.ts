import { jest, describe, it, expect, beforeEach } from "@jest/globals"
import { BookingStatus } from "@prisma/client"
import * as reviewRepository from "../../src/repositories/reviewRepository"
import * as userRepository from "../../src/repositories/userRepository"
import { getUserReviewProfile, submitReview } from "../../src/services/reviewService"

jest.mock("../../src/repositories/reviewRepository", () => ({
  createReview: jest.fn(),
  findBookingForReview: jest.fn(),
  getReviewsForUser: jest.fn(),
  getReviewSummaryForUser: jest.fn(),
}))

jest.mock("../../src/repositories/userRepository", () => ({
  findUserById: jest.fn(),
}))

const mockedReviewRepository = reviewRepository as jest.Mocked<typeof reviewRepository>
const mockedUserRepository = userRepository as jest.Mocked<typeof userRepository>

describe("reviewService", () => {
  beforeEach(() => jest.clearAllMocks())

  it("creates a review for the other booking participant", async () => {
    const review = { id: "review-1", rating: 5 }
    mockedReviewRepository.findBookingForReview.mockResolvedValue({
      id: "booking-1",
      userId: "requester-1",
      status: BookingStatus.COMPLETED,
      reviews: [],
      skill: { userId: "provider-1" },
    } as never)
    mockedReviewRepository.createReview.mockResolvedValue(review as never)

    await expect(submitReview("requester-1", "booking-1", 5, " Great session ")).resolves.toBe(
      review
    )
    expect(mockedReviewRepository.createReview).toHaveBeenCalledWith({
      userId: "requester-1",
      targetUserId: "provider-1",
      bookingId: "booking-1",
      rating: 5,
      comment: "Great session",
    })
  })

  it("rejects reviews before a booking is completed", async () => {
    mockedReviewRepository.findBookingForReview.mockResolvedValue({
      userId: "requester-1",
      status: BookingStatus.CONFIRMED,
      reviews: [],
      skill: { userId: "provider-1" },
    } as never)

    await expect(submitReview("requester-1", "booking-1", 5)).rejects.toMatchObject({
      message: "Reviews can only be left after a completed session",
      statusCode: 400,
    })
  })

  it("returns rounded review profile summary", async () => {
    mockedUserRepository.findUserById.mockResolvedValue({
      id: "user-1",
      username: "ada",
      fullName: "Ada Lovelace",
      profileImage: null,
    } as never)
    mockedReviewRepository.getReviewSummaryForUser.mockResolvedValue({
      averageRating: 4.236,
      totalReviews: 3,
    } as never)
    mockedReviewRepository.getReviewsForUser.mockResolvedValue([{ id: "review-1" }] as never)

    await expect(getUserReviewProfile("user-1")).resolves.toEqual({
      user: {
        id: "user-1",
        username: "ada",
        fullName: "Ada Lovelace",
        profileImage: null,
      },
      averageRating: 4.24,
      totalReviews: 3,
      reviews: [{ id: "review-1" }],
    })
  })
})
