import {
  BookingOutcome,
  BookingStatus,
  BookingType,
  MeetingPlatform,
  PaymentStatus,
  Prisma,
  SessionMode,
} from "@prisma/client";
import prisma from "../config/db";

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
} satisfies Prisma.BookingInclude;

export const findSkillById = (skillId: string) => {
  return prisma.skill.findUnique({
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

export const createBooking = (data: {
  userId: string
  skillId: string
  offeredSkillId?: string
  date: Date
  type: BookingType
  sessionMode: SessionMode
  meetingPlatform?: MeetingPlatform
  meetingLink?: string
  durationMinutes: number
  sessionNotes?: string
  baseCreditCost: number
  counterpartyBaseCreditCost: number
}) => {
  return prisma.booking.create({
    data,
    include: bookingInclude,
  });
};

export const findBookingById = (bookingId: string) => {
  return prisma.booking.findUnique({
    where: { id: bookingId },
    include: bookingInclude,
  });
};

export const deleteBooking = (bookingId: string) => {
  return prisma.booking.delete({
    where: { id: bookingId },
  })
}

export const updateBookingStatus = (bookingId: string, status: BookingStatus) => {
  return prisma.booking.update({
    where: { id: bookingId },
    data: { status },
    include: bookingInclude,
  });
};

export const updateBookingPaymentState = (
  bookingId: string,
  data: {
    paymentStatus: PaymentStatus
    requesterHeldCredits?: number
    providerHeldCredits?: number
  }
) => {
  return prisma.booking.update({
    where: { id: bookingId },
    data,
    include: bookingInclude,
  })
}

export const updateBookingOutcome = (
  bookingId: string,
  data: {
    status?: BookingStatus
    outcome: BookingOutcome
    paymentStatus: PaymentStatus
    requesterHeldCredits?: number
    providerHeldCredits?: number
    cancelledAt?: Date
    completedAt?: Date
  }
) => {
  return prisma.booking.update({
    where: { id: bookingId },
    data,
    include: bookingInclude,
  })
}

export const updateBookingSessionDetails = (
  bookingId: string,
  data: {
    meetingPlatform?: MeetingPlatform
    meetingLink?: string
    sessionNotes?: string
  }
) => {
  return prisma.booking.update({
    where: { id: bookingId },
    data,
    include: bookingInclude,
  });
};

export const setPendingBookingExtension = (
  bookingId: string,
  data: {
    pendingExtensionMinutes: number
    pendingExtensionCreditCost: number
    pendingCounterpartyExtensionCreditCost: number
    extensionRequestedById: string
    extensionStatus: "PENDING"
    extensionRequestedAt: Date
    extensionRespondedAt: null
  }
) => {
  return prisma.booking.update({
    where: { id: bookingId },
    data,
    include: bookingInclude,
  });
};

export const resolveBookingExtension = (
  bookingId: string,
  data:
    | {
        extensionStatus: "APPROVED"
        extensionMinutes: { increment: number }
        extensionCreditCost: { increment: number }
        counterpartyExtensionCreditCost: { increment: number }
        pendingExtensionMinutes: null
        pendingExtensionCreditCost: null
        pendingCounterpartyExtensionCreditCost: null
        extensionRequestedById: null
        extensionRespondedAt: Date
      }
    | {
        extensionStatus: "REJECTED"
        pendingExtensionMinutes: null
        pendingExtensionCreditCost: null
        pendingCounterpartyExtensionCreditCost: null
        extensionRequestedById: null
        extensionRespondedAt: Date
      }
) => {
  return prisma.booking.update({
    where: { id: bookingId },
    data,
    include: bookingInclude,
  });
};

export const getBookingsForUser = (userId: string) => {
  return prisma.booking.findMany({
    where: {
      OR: [{ userId }, { skill: { userId } }],
    },
    include: bookingInclude,
    orderBy: { date: "asc" },
  });
};

export const findPotentialBookingConflicts = (params: {
  participantUserIds: string[]
  startsBefore: Date
}) => {
  return prisma.booking.findMany({
    where: {
      status: {
        in: [BookingStatus.PENDING, BookingStatus.CONFIRMED],
      },
      date: {
        lt: params.startsBefore,
      },
      OR: [
        {
          userId: {
            in: params.participantUserIds,
          },
        },
        {
          skill: {
            userId: {
              in: params.participantUserIds,
            },
          },
        },
      ],
    },
    select: {
      id: true,
      userId: true,
      date: true,
      durationMinutes: true,
      skill: {
        select: {
          userId: true,
          title: true,
        },
      },
    },
  })
}
