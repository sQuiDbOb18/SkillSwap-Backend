import { jest, describe, it, expect, beforeEach } from "@jest/globals"
import { BookingOutcome, BookingType, MeetingPlatform, SessionMode } from "@prisma/client"
import {
  cancelBooking,
  completeBooking,
  listUserBookings,
  reportBookingOutcome,
  requestBookingExtension,
  requestSession,
  respondToBooking,
  respondToBookingExtension,
} from "../../src/services/bookingService"
import {
  cancelBookingController,
  completeBookingController,
  createBooking,
  getBookings,
  reportBookingOutcomeController,
  requestBookingExtensionController,
  respondToBookingController,
  respondToBookingExtensionController,
} from "../../src/controllers/bookingController"

jest.mock("../../src/services/bookingService", () => ({
  cancelBooking: jest.fn(),
  completeBooking: jest.fn(),
  listUserBookings: jest.fn(),
  reportBookingOutcome: jest.fn(),
  requestBookingExtension: jest.fn(),
  requestSession: jest.fn(),
  respondToBooking: jest.fn(),
  respondToBookingExtension: jest.fn(),
}))

const mockedCancelBooking = cancelBooking as jest.MockedFunction<typeof cancelBooking>
const mockedCompleteBooking = completeBooking as jest.MockedFunction<typeof completeBooking>
const mockedListUserBookings = listUserBookings as jest.MockedFunction<typeof listUserBookings>
const mockedReportBookingOutcome = reportBookingOutcome as jest.MockedFunction<
  typeof reportBookingOutcome
>
const mockedRequestBookingExtension = requestBookingExtension as jest.MockedFunction<
  typeof requestBookingExtension
>
const mockedRequestSession = requestSession as jest.MockedFunction<typeof requestSession>
const mockedRespondToBooking = respondToBooking as jest.MockedFunction<typeof respondToBooking>
const mockedRespondToBookingExtension = respondToBookingExtension as jest.MockedFunction<
  typeof respondToBookingExtension
>

const createResponse = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
})

const runController = async (
  controller: (req: any, res: any, next: any) => void,
  req: any,
  res: any,
  next: any
) => {
  controller(req, res, next)
  await Promise.resolve()
  await Promise.resolve()
}

describe("bookingController", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("creates a booking with status 201", async () => {
    const booking = { id: "booking-1" }
    const body = {
      skillId: "skill-1",
      date: "2026-06-01T10:00:00.000Z",
      type: BookingType.LEARN,
      offeredSkillId: undefined,
      sessionMode: SessionMode.EXTERNAL_LINK,
      durationMinutes: 60,
      meetingPlatform: MeetingPlatform.ZOOM,
      meetingLink: "https://zoom.example/session",
      sessionNotes: "Bring questions",
    }
    const res = createResponse()
    mockedRequestSession.mockResolvedValue(booking as never)

    await runController(createBooking, { user: { userId: "user-1" }, body }, res, jest.fn())

    expect(mockedRequestSession).toHaveBeenCalledWith(
      "user-1",
      body.skillId,
      body.date,
      body.type,
      body.offeredSkillId,
      body.sessionMode,
      body.durationMinutes,
      body.meetingPlatform,
      body.meetingLink,
      body.sessionNotes
    )
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith(booking)
  })

  it("lists bookings for the authenticated user", async () => {
    const bookings = [{ id: "booking-1" }]
    const res = createResponse()
    mockedListUserBookings.mockResolvedValue(bookings as never)

    await runController(getBookings, { user: { userId: "user-1" } }, res, jest.fn())

    expect(mockedListUserBookings).toHaveBeenCalledWith("user-1")
    expect(res.json).toHaveBeenCalledWith(bookings)
  })

  it("responds to a booking with session details", async () => {
    const booking = { id: "booking-1", status: "CONFIRMED" }
    const res = createResponse()
    mockedRespondToBooking.mockResolvedValue(booking as never)

    await runController(
      respondToBookingController,
      {
        user: { userId: "provider-1" },
        params: { bookingId: "booking-1" },
        body: {
          action: "accept",
          meetingPlatform: MeetingPlatform.GOOGLE_MEET,
          meetingLink: "https://meet.example/session",
          sessionNotes: "See you there",
        },
      },
      res,
      jest.fn()
    )

    expect(mockedRespondToBooking).toHaveBeenCalledWith("provider-1", "booking-1", "accept", {
      meetingPlatform: MeetingPlatform.GOOGLE_MEET,
      meetingLink: "https://meet.example/session",
      sessionNotes: "See you there",
    })
    expect(res.json).toHaveBeenCalledWith(booking)
  })

  it("passes booking actions to the matching services", async () => {
    const res = createResponse()
    mockedCompleteBooking.mockResolvedValue({ id: "booking-1", status: "COMPLETED" } as never)
    mockedCancelBooking.mockResolvedValue({ id: "booking-1", status: "CANCELLED" } as never)
    mockedRequestBookingExtension.mockResolvedValue({ id: "booking-1" } as never)
    mockedRespondToBookingExtension.mockResolvedValue({ id: "booking-1" } as never)
    mockedReportBookingOutcome.mockResolvedValue({ id: "booking-1" } as never)

    await runController(
      completeBookingController,
      { user: { userId: "user-1" }, params: { bookingId: "booking-1" } },
      res,
      jest.fn()
    )
    await runController(
      cancelBookingController,
      { user: { userId: "user-1" }, params: { bookingId: "booking-1" } },
      res,
      jest.fn()
    )
    await runController(
      requestBookingExtensionController,
      {
        user: { userId: "user-1" },
        params: { bookingId: "booking-1" },
        body: { extraMinutes: 30, extraCreditCost: 4 },
      },
      res,
      jest.fn()
    )
    await runController(
      respondToBookingExtensionController,
      { user: { userId: "user-1" }, params: { bookingId: "booking-1" }, body: { action: "approve" } },
      res,
      jest.fn()
    )
    await runController(
      reportBookingOutcomeController,
      {
        user: { userId: "user-1" },
        params: { bookingId: "booking-1" },
        body: { outcome: BookingOutcome.REQUESTER_NO_SHOW },
      },
      res,
      jest.fn()
    )

    expect(mockedCompleteBooking).toHaveBeenCalledWith("user-1", "booking-1")
    expect(mockedCancelBooking).toHaveBeenCalledWith("user-1", "booking-1")
    expect(mockedRequestBookingExtension).toHaveBeenCalledWith("user-1", "booking-1", 30, 4)
    expect(mockedRespondToBookingExtension).toHaveBeenCalledWith("user-1", "booking-1", "approve")
    expect(mockedReportBookingOutcome).toHaveBeenCalledWith(
      "user-1",
      "booking-1",
      BookingOutcome.REQUESTER_NO_SHOW
    )
  })
})
