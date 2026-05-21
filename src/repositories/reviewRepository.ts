import { Prisma } from "@prisma/client"
import prisma from "../config/db"

const reviewInclude: Prisma.ReviewInclude = {
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
}

export const findBookingForReview = (bookingId: string, userId: string) => {
  return prisma.booking.findUnique({
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
  })
}

export const createReview = (data: {
  userId: string
  targetUserId: string
  bookingId: string
  rating: number
  comment?: string
}) => {
  return prisma.review.create({
    data,
    include: reviewInclude,
  })
}

export const getReviewsForUser = (targetUserId: string) => {
  return prisma.review.findMany({
    where: {
      targetUserId,
      moderationStatus: {
        not: "REMOVED",
      },
    },
    include: reviewInclude,
    orderBy: { createdAt: "desc" },
  })
}

export const getReviewSummaryForUser = async (targetUserId: string) => {
  const [aggregate, totalReviews] = await Promise.all([
    prisma.review.aggregate({
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
    prisma.review.count({
      where: {
        targetUserId,
        moderationStatus: {
          not: "REMOVED",
        },
      },
    }),
  ])

  return {
    averageRating: aggregate._avg.rating,
    totalReviews,
  }
}
