import { jest, describe, it, expect, beforeEach } from "@jest/globals"
import {
  BookingOutcome,
  BookingStatus,
  BookingType,
  MeetingPlatform,
  PaymentStatus,
  SessionMode,
} from "@prisma/client"
import * as bookingRepository from "../../src/repositories/bookingRepository"
import * as walletService from "../../src/services/walletService"
import * as emailService from "../../src/services/emailService"
import * as notificationService from "../../src/services/notificationService"
import {
  cancelBooking,
  completeBooking,
  listUserBookings,
  requestSession,
  respondToBooking,
} from "../../src/services/bookingService"

jest.mock("../../src/repositories/bookingRepository", () => ({
  createBooking: jest.fn(),
  deleteBooking: jest.fn(),
  findBookingById: jest.fn(),
  findPotentialBookingConflicts: jest.fn(),
  findSkillById: jest.fn(),
  getBookingsForUser: jest.fn(),
  resolveBookingExtension: jest.fn(),
  setPendingBookingExtension: jest.fn(),
  updateBookingOutcome: jest.fn(),
  updateBookingPaymentState: jest.fn(),
  updateBookingSessionDetails: jest.fn(),
  updateBookingStatus: jest.fn(),
}))

jest.mock("../../src/services/walletService", () => ({
  ensureUserHasCredits: jest.fn(),
  holdBookingCredits: jest.fn(),
  refundBookingCredits: jest.fn(),
  releaseHeldBookingCredits: jest.fn(),
  compensateBookingNoShow: jest.fn(),
}))

jest.mock("../../src/services/emailService", () => ({
  sendSwapRequestAcceptedEmail: jest.fn(),
  sendSwapRequestReceivedEmail: jest.fn(),
}))

jest.mock("../../src/services/notificationService", () => ({
  notifyUser: jest.fn(),
}))

const mockedBookingRepository = bookingRepository as jest.Mocked<typeof bookingRepository>
const mockedWalletService = walletService as jest.Mocked<typeof walletService>
const mockedNotificationService = notificationService as jest.Mocked<typeof notificationService>

const createBookingRecord = (overrides: Record<string, any> = {}) => ({
  id: "booking-1",
  userId: "requester-1",
  skillId: "skill-1",
  offeredSkillId: null,
  date: new Date("2026-06-01T10:00:00.000Z"),
  type: BookingType.LEARN,
  status: BookingStatus.PENDING,
  sessionMode: SessionMode.EXTERNAL_LINK,
  meetingPlatform: MeetingPlatform.ZOOM,
  meetingLink: "https://zoom.example/session",
  durationMinutes: 60,
  sessionNotes: null,
  baseCreditCost: 5,
  counterpartyBaseCreditCost: 0,
  requesterHeldCredits: 0,
  providerHeldCredits: 0,
  paymentStatus: PaymentStatus.UNPAID,
  extensionStatus: "NONE",
  extensionRequestedById: null,
  pendingExtensionMinutes: null,
  pendingExtensionCreditCost: null,
  pendingCounterpartyExtensionCreditCost: null,
  user: {
    id: "requester-1",
    email: "requester@example.com",
    fullName: "Ada Lovelace",
  },
  skill: {
    id: "skill-1",
    title: "React",
    userId: "provider-1",
    creditCost: 5,
    isBarter: false,
    user: {
      id: "provider-1",
      email: "provider@example.com",
      fullName: "Grace Hopper",
    },
  },
  offeredSkill: null,
  ...overrides,
})

describe("bookingService", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedBookingRepository.findPotentialBookingConflicts.mockResolvedValue([])
    void emailService
  })

  it("requests a paid learning session, holds credits, notifies the provider, and hides meeting details", async () => {
    const createdBooking = createBookingRecord()
    const heldBooking = createBookingRecord({
      requesterHeldCredits: 5,
      paymentStatus: PaymentStatus.HELD,
    })
    mockedBookingRepository.findSkillById.mockResolvedValue({
      id: "skill-1",
      userId: "provider-1",
      title: "React",
      creditCost: 5,
      isBarter: false,
    } as never)
    mockedWalletService.ensureUserHasCredits.mockResolvedValue(undefined as never)
    mockedBookingRepository.createBooking.mockResolvedValue(createdBooking as never)
    mockedWalletService.holdBookingCredits.mockResolvedValue(undefined as never)
    mockedBookingRepository.updateBookingPaymentState.mockResolvedValue(heldBooking as never)
    mockedNotificationService.notifyUser.mockResolvedValue({ id: "notification-1" } as never)

    const result = await requestSession(
      "requester-1",
      "skill-1",
      "2026-06-01T10:00:00.000Z",
      BookingType.LEARN,
      undefined,
      SessionMode.EXTERNAL_LINK,
      60,
      MeetingPlatform.ZOOM,
      "https://zoom.example/session",
      "Bring questions"
    )

    expect(mockedWalletService.ensureUserHasCredits).toHaveBeenCalledWith("requester-1", 5)
    expect(mockedBookingRepository.createBooking).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "requester-1",
        skillId: "skill-1",
        date: expect.any(Date),
        type: BookingType.LEARN,
        sessionMode: SessionMode.EXTERNAL_LINK,
        meetingPlatform: MeetingPlatform.ZOOM,
        meetingLink: "https://zoom.example/session",
        durationMinutes: 60,
        sessionNotes: "Bring questions",
        baseCreditCost: 5,
        counterpartyBaseCreditCost: 0,
      })
    )
    expect(mockedWalletService.holdBookingCredits).toHaveBeenCalledWith({
      bookingId: "booking-1",
      payerUserId: "requester-1",
      counterpartyUserId: "provider-1",
      amount: 5,
      role: "requester",
    })
    expect(mockedNotificationService.notifyUser).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "provider-1",
        type: "BOOKING_CREATED",
        relatedBookingId: "booking-1",
      })
    )
    expect(result).toEqual(
      expect.objectContaining({
        id: "booking-1",
        meetingLink: null,
        meetingPlatform: null,
      })
    )
  })

  it("rejects booking your own skill", async () => {
    mockedBookingRepository.findSkillById.mockResolvedValue({
      id: "skill-1",
      userId: "requester-1",
      title: "React",
      creditCost: 5,
      isBarter: false,
    } as never)

    await expect(
      requestSession(
        "requester-1",
        "skill-1",
        "2026-06-01T10:00:00.000Z",
        BookingType.LEARN,
        undefined,
        SessionMode.EXTERNAL_LINK,
        60
      )
    ).rejects.toMatchObject({
      message: "You cannot book your own skill",
      statusCode: 400,
    })
    expect(mockedBookingRepository.createBooking).not.toHaveBeenCalled()
  })

  it("rejects bookings that overlap an existing session for either participant", async () => {
    mockedBookingRepository.findSkillById.mockResolvedValue({
      id: "skill-1",
      userId: "provider-1",
      title: "React",
      creditCost: 5,
      isBarter: false,
    } as never)
    mockedWalletService.ensureUserHasCredits.mockResolvedValue(undefined as never)
    mockedBookingRepository.findPotentialBookingConflicts.mockResolvedValue([
      {
        id: "booking-2",
        userId: "someone-else",
        date: new Date("2026-06-01T09:30:00.000Z"),
        durationMinutes: 60,
        skill: {
          userId: "provider-1",
          title: "Node.js",
        },
      },
    ] as never)

    await expect(
      requestSession(
        "requester-1",
        "skill-1",
        "2026-06-01T10:00:00.000Z",
        BookingType.LEARN,
        undefined,
        SessionMode.EXTERNAL_LINK,
        60
      )
    ).rejects.toMatchObject({
      message: "Booking conflicts with an existing session for Node.js.",
      statusCode: 409,
    })
    expect(mockedBookingRepository.createBooking).not.toHaveBeenCalled()
  })

  it("sanitizes pending bookings when listing user bookings", async () => {
    mockedBookingRepository.getBookingsForUser.mockResolvedValue([
      createBookingRecord({
        status: BookingStatus.PENDING,
        meetingLink: "https://private.example/session",
        meetingPlatform: MeetingPlatform.ZOOM,
      }),
      createBookingRecord({
        id: "booking-2",
        status: BookingStatus.CONFIRMED,
        meetingLink: "https://visible.example/session",
        meetingPlatform: MeetingPlatform.GOOGLE_MEET,
      }),
    ] as never)

    const result = await listUserBookings("requester-1")

    expect(result[0]).toEqual(
      expect.objectContaining({
        id: "booking-1",
        meetingLink: null,
        meetingPlatform: null,
      })
    )
    expect(result[1]).toEqual(
      expect.objectContaining({
        id: "booking-2",
        meetingLink: "https://visible.example/session",
        meetingPlatform: MeetingPlatform.GOOGLE_MEET,
      })
    )
  })

  it("allows the provider to accept a pending booking and notifies the requester", async () => {
    const pendingBooking = createBookingRecord()
    const detailsUpdatedBooking = createBookingRecord({
      meetingLink: "https://meet.example/session",
      meetingPlatform: MeetingPlatform.GOOGLE_MEET,
    })
    const confirmedBooking = createBookingRecord({
      status: BookingStatus.CONFIRMED,
      meetingLink: "https://meet.example/session",
      meetingPlatform: MeetingPlatform.GOOGLE_MEET,
    })
    mockedBookingRepository.findBookingById.mockResolvedValue(pendingBooking as never)
    mockedBookingRepository.updateBookingSessionDetails.mockResolvedValue(
      detailsUpdatedBooking as never
    )
    mockedBookingRepository.updateBookingStatus.mockResolvedValue(confirmedBooking as never)
    mockedNotificationService.notifyUser.mockResolvedValue({ id: "notification-1" } as never)

    const result = await respondToBooking("provider-1", "booking-1", "accept", {
      meetingPlatform: MeetingPlatform.GOOGLE_MEET,
      meetingLink: "https://meet.example/session",
    })

    expect(mockedBookingRepository.updateBookingSessionDetails).toHaveBeenCalledWith(
      "booking-1",
      expect.objectContaining({
        meetingPlatform: MeetingPlatform.GOOGLE_MEET,
        meetingLink: "https://meet.example/session",
      })
    )
    expect(mockedBookingRepository.updateBookingStatus).toHaveBeenCalledWith(
      "booking-1",
      BookingStatus.CONFIRMED
    )
    expect(mockedNotificationService.notifyUser).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "requester-1",
        type: "BOOKING_CONFIRMED",
      })
    )
    expect(result).toEqual(expect.objectContaining({ status: BookingStatus.CONFIRMED }))
  })

  it("cancels a confirmed booking and refunds held requester credits", async () => {
    const confirmedBooking = createBookingRecord({
      status: BookingStatus.CONFIRMED,
      requesterHeldCredits: 8,
      paymentStatus: PaymentStatus.HELD,
    })
    const cancelledBooking = createBookingRecord({
      status: BookingStatus.CANCELLED,
      outcome: BookingOutcome.CANCELLED_BY_REQUESTER,
      requesterHeldCredits: 0,
      paymentStatus: PaymentStatus.REFUNDED,
    })
    mockedBookingRepository.findBookingById.mockResolvedValue(confirmedBooking as never)
    mockedWalletService.refundBookingCredits.mockResolvedValue(undefined as never)
    mockedBookingRepository.updateBookingOutcome.mockResolvedValue(cancelledBooking as never)
    mockedNotificationService.notifyUser.mockResolvedValue({ id: "notification-1" } as never)

    const result = await cancelBooking("requester-1", "booking-1")

    expect(mockedWalletService.refundBookingCredits).toHaveBeenCalledWith({
      bookingId: "booking-1",
      userId: "requester-1",
      amount: 8,
      counterpartyUserId: "provider-1",
      role: "requester",
      reason: "Booking cancelled and funds refunded",
    })
    expect(mockedBookingRepository.updateBookingOutcome).toHaveBeenCalledWith(
      "booking-1",
      expect.objectContaining({
        status: BookingStatus.CANCELLED,
        outcome: BookingOutcome.CANCELLED_BY_REQUESTER,
        paymentStatus: PaymentStatus.REFUNDED,
        requesterHeldCredits: 0,
        providerHeldCredits: 0,
      })
    )
    expect(result).toEqual(expect.objectContaining({ status: BookingStatus.CANCELLED }))
  })

  it("lets the provider complete a confirmed booking and releases held credits", async () => {
    const confirmedBooking = createBookingRecord({
      status: BookingStatus.CONFIRMED,
      requesterHeldCredits: 8,
      paymentStatus: PaymentStatus.HELD,
    })
    const completedBooking = createBookingRecord({
      status: BookingStatus.COMPLETED,
      outcome: BookingOutcome.COMPLETED,
      requesterHeldCredits: 0,
      paymentStatus: PaymentStatus.RELEASED,
    })
    mockedBookingRepository.findBookingById.mockResolvedValue(confirmedBooking as never)
    mockedWalletService.releaseHeldBookingCredits.mockResolvedValue(undefined as never)
    mockedBookingRepository.updateBookingOutcome.mockResolvedValue(completedBooking as never)
    mockedNotificationService.notifyUser.mockResolvedValue({ id: "notification-1" } as never)

    const result = await completeBooking("provider-1", "booking-1")

    expect(mockedWalletService.releaseHeldBookingCredits).toHaveBeenCalledWith({
      bookingId: "booking-1",
      payerUserId: "requester-1",
      recipientUserId: "provider-1",
      skillTitle: "React",
      amount: 8,
      role: "requester",
    })
    expect(mockedBookingRepository.updateBookingOutcome).toHaveBeenCalledWith(
      "booking-1",
      expect.objectContaining({
        status: BookingStatus.COMPLETED,
        outcome: BookingOutcome.COMPLETED,
        paymentStatus: PaymentStatus.RELEASED,
      })
    )
    expect(result).toEqual(expect.objectContaining({ status: BookingStatus.COMPLETED }))
  })
})
