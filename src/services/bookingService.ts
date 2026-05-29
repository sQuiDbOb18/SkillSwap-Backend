import {
  BookingOutcome,
  BookingStatus,
  BookingType,
  ExtensionStatus,
  MeetingPlatform,
  PaymentStatus,
  SessionMode,
} from "@prisma/client"
import { emailConfig } from "../config/email"
import { CustomError } from "../utils/CustomError"
import {
  sendSwapRequestAcceptedEmail,
  sendSwapRequestReceivedEmail,
} from "./emailService"
import {
  createBooking,
  deleteBooking,
  findBookingById,
  findPotentialBookingConflicts,
  findSkillById,
  getBookingsForUser,
  resolveBookingExtension,
  setPendingBookingExtension,
  updateBookingOutcome,
  updateBookingPaymentState,
  updateBookingSessionDetails,
  updateBookingStatus,
} from "../repositories/bookingRepository"
import { notifyUser } from "./notificationService"
import {
  ensureUserHasCredits,
  holdBookingCredits,
  refundBookingCredits,
  releaseHeldBookingCredits,
  compensateBookingNoShow,
} from "./walletService"

type BookingRecord = any

const sanitizeBookingForResponse = <T extends Record<string, any>>(booking: T) => {
  if (
    booking.status === BookingStatus.CONFIRMED ||
    booking.status === BookingStatus.COMPLETED
  ) {
    return booking
  }

  return {
    ...booking,
    meetingLink: null,
    meetingPlatform: null,
  }
}

const isRequester = (booking: BookingRecord, userId: string) => booking.userId === userId
const isProvider = (booking: BookingRecord, userId: string) => booking.skill.userId === userId
const isParticipant = (booking: BookingRecord, userId: string) =>
  isRequester(booking, userId) || isProvider(booking, userId)

const getHalf = (amount: number) => Math.floor(amount / 2)

const assertParticipantsAreAvailable = async (params: {
  requesterId: string
  providerId: string
  startsAt: Date
  durationMinutes: number
}) => {
  const endsAt = new Date(params.startsAt.getTime() + params.durationMinutes * 60 * 1000)
  const candidates = await findPotentialBookingConflicts({
    participantUserIds: [params.requesterId, params.providerId],
    startsBefore: endsAt,
  })

  const conflict = candidates.find((booking) => {
    const bookingEndsAt = new Date(
      booking.date.getTime() + booking.durationMinutes * 60 * 1000
    )

    return bookingEndsAt > params.startsAt
  })

  if (conflict) {
    throw new CustomError(
      `Booking conflicts with an existing session for ${conflict.skill.title}.`,
      409
    )
  }
}

const refundRequester = async (booking: BookingRecord, amount: number, reason: string) => {
  if (amount <= 0) {
    return
  }

  await refundBookingCredits({
    bookingId: booking.id,
    userId: booking.userId,
    amount,
    counterpartyUserId: booking.skill.userId,
    role: "requester",
    reason,
  })
}

const refundProvider = async (booking: BookingRecord, amount: number, reason: string) => {
  if (amount <= 0) {
    return
  }

  await refundBookingCredits({
    bookingId: booking.id,
    userId: booking.skill.userId,
    amount,
    counterpartyUserId: booking.userId,
    role: "provider",
    reason,
  })
}

const releaseRequesterHoldToProvider = async (booking: BookingRecord, amount: number) => {
  if (amount <= 0) {
    return
  }

  await releaseHeldBookingCredits({
    bookingId: booking.id,
    payerUserId: booking.userId,
    recipientUserId: booking.skill.userId,
    skillTitle: booking.skill.title,
    amount,
    role: "requester",
  })
}

const releaseProviderHoldToRequester = async (booking: BookingRecord, amount: number) => {
  if (amount <= 0) {
    return
  }

  await releaseHeldBookingCredits({
    bookingId: booking.id,
    payerUserId: booking.skill.userId,
    recipientUserId: booking.userId,
    skillTitle: booking.offeredSkill?.title ?? "swap session",
    amount,
    role: "provider",
  })
}

const setHeldState = async (
  bookingId: string,
  requesterHeldCredits: number,
  providerHeldCredits: number,
  paymentStatus: PaymentStatus
) => {
  return updateBookingPaymentState(bookingId, {
    requesterHeldCredits,
    providerHeldCredits,
    paymentStatus,
  })
}

const holdRequesterPayment = async (booking: BookingRecord, amount: number) => {
  if (amount <= 0) {
    return booking
  }

  await holdBookingCredits({
    bookingId: booking.id,
    payerUserId: booking.userId,
    counterpartyUserId: booking.skill.userId,
    amount,
    role: "requester",
  })

  const nextPaymentStatus =
    booking.type === BookingType.SWAP ? PaymentStatus.PARTIALLY_HELD : PaymentStatus.HELD

  return setHeldState(
    booking.id,
    booking.requesterHeldCredits + amount,
    booking.providerHeldCredits,
    nextPaymentStatus
  )
}

const holdProviderPayment = async (booking: BookingRecord, amount: number) => {
  if (amount <= 0) {
    return booking
  }

  await holdBookingCredits({
    bookingId: booking.id,
    payerUserId: booking.skill.userId,
    counterpartyUserId: booking.userId,
    amount,
    role: "provider",
  })

  return setHeldState(
    booking.id,
    booking.requesterHeldCredits,
    booking.providerHeldCredits + amount,
    PaymentStatus.HELD
  )
}

const refundAllHeldFunds = async (booking: BookingRecord, reason: string) => {
  await Promise.all([
    refundRequester(booking, booking.requesterHeldCredits, reason),
    refundProvider(booking, booking.providerHeldCredits, reason),
  ])
}

export const requestSession = async (
  userId: string,
  skillId: string,
  date: string,
  type: BookingType,
  offeredSkillId: string | undefined,
  sessionMode: SessionMode,
  durationMinutes: number,
  meetingPlatform?: MeetingPlatform,
  meetingLink?: string,
  sessionNotes?: string
) => {
  const skill = await findSkillById(skillId)

  if (!skill) {
    throw new CustomError("Skill not found", 404)
  }

  if (skill.userId === userId) {
    throw new CustomError("You cannot book your own skill", 400)
  }

  const baseCreditCost =
    type === BookingType.SWAP
      ? skill.creditCost ?? 0
      : !skill.isBarter
        ? skill.creditCost ?? 0
        : 0

  if (baseCreditCost > 0) {
    await ensureUserHasCredits(userId, baseCreditCost)
  }

  let validOfferedSkillId: string | undefined
  let counterpartyBaseCreditCost = 0

  if (type === BookingType.SWAP) {
    if (!offeredSkillId) {
      throw new CustomError("Offered skill is required for swap requests", 400)
    }

    const offeredSkill = await findSkillById(offeredSkillId)

    if (!offeredSkill) {
      throw new CustomError("Offered skill not found", 404)
    }

    if (offeredSkill.userId !== userId) {
      throw new CustomError("You can only offer one of your own skills in a swap request", 403)
    }

    if (offeredSkill.id === skill.id) {
      throw new CustomError("Requested skill and offered skill must be different", 400)
    }

    if (offeredSkill.userId === skill.userId) {
      throw new CustomError("Swap requests must be between different users", 400)
    }

    if (skill.creditCost == null || offeredSkill.creditCost == null) {
      throw new CustomError(
        "Both skills must have a credit cost before they can be booked as a paid swap",
        400
      )
    }

    if (skill.creditCost <= 0 || offeredSkill.creditCost <= 0) {
      throw new CustomError("Swap skills must have a credit cost greater than zero", 400)
    }

    validOfferedSkillId = offeredSkill.id
    counterpartyBaseCreditCost = offeredSkill.creditCost
  }

  const startsAt = new Date(date)
  await assertParticipantsAreAvailable({
    requesterId: userId,
    providerId: skill.userId,
    startsAt,
    durationMinutes,
  })

  let booking = await createBooking({
    userId,
    skillId,
    offeredSkillId: validOfferedSkillId,
    date: startsAt,
    type,
    sessionMode,
    meetingPlatform,
    meetingLink,
    durationMinutes,
    sessionNotes,
    baseCreditCost,
    counterpartyBaseCreditCost,
  })

  try {
    booking = await holdRequesterPayment(booking, baseCreditCost)
  } catch (error) {
    await deleteBooking(booking.id)
    throw error
  }

  if (booking.type === BookingType.SWAP && booking.offeredSkill && booking.skill.user.email) {
    await sendSwapRequestReceivedEmail({
      email: booking.skill.user.email,
      name: booking.skill.user.fullName,
      otherUserName: booking.user.fullName,
      requestedSkillTitle: booking.skill.title,
      offeredSkillTitle: booking.offeredSkill.title,
      actionUrl: emailConfig.bookingsPageUrl,
    })
  }

  await notifyUser({
    userId: booking.skill.userId,
    type: "BOOKING_CREATED",
    message: `${booking.user.fullName} requested a ${booking.type.toLowerCase()} session for ${booking.skill.title}.`,
    relatedBookingId: booking.id,
  })

  return sanitizeBookingForResponse(booking)
}

export const listUserBookings = async (userId: string) => {
  const bookings = await getBookingsForUser(userId)
  return bookings.map((booking: BookingRecord) => sanitizeBookingForResponse(booking))
}

export const respondToBooking = async (
  currentUserId: string,
  bookingId: string,
  action: "accept" | "reject",
  details?: {
    meetingPlatform?: MeetingPlatform
    meetingLink?: string
    sessionNotes?: string
  }
) => {
  let booking: BookingRecord = await findBookingById(bookingId)

  if (!booking) {
    throw new CustomError("Booking not found", 404)
  }

  if (!isProvider(booking, currentUserId)) {
    throw new CustomError("Only the skill owner can respond to this booking", 403)
  }

  if (booking.status !== BookingStatus.PENDING) {
    throw new CustomError("Only pending bookings can be updated", 400)
  }

  if (action === "accept") {
    const nextMeetingLink = details?.meetingLink ?? booking.meetingLink ?? undefined
    const nextMeetingPlatform =
      details?.meetingPlatform ?? booking.meetingPlatform ?? undefined

    if (booking.sessionMode === SessionMode.EXTERNAL_LINK && !nextMeetingLink) {
      throw new CustomError(
        "An external session must include a meeting link before it can be accepted",
        400
      )
    }

    if (booking.sessionMode === SessionMode.EXTERNAL_LINK && !nextMeetingPlatform) {
      throw new CustomError(
        "An external session must include a meeting platform before it can be accepted",
        400
      )
    }

    if (booking.type === BookingType.SWAP && booking.counterpartyBaseCreditCost > 0) {
      await ensureUserHasCredits(currentUserId, booking.counterpartyBaseCreditCost)
      booking = await holdProviderPayment(booking, booking.counterpartyBaseCreditCost)
    }

    if (details?.meetingLink || details?.meetingPlatform || details?.sessionNotes) {
      booking = await updateBookingSessionDetails(bookingId, {
        meetingLink: details.meetingLink ?? booking.meetingLink ?? undefined,
        meetingPlatform: details.meetingPlatform ?? booking.meetingPlatform ?? undefined,
        sessionNotes: details.sessionNotes ?? booking.sessionNotes ?? undefined,
      })
    }

    const updatedBooking = await updateBookingStatus(bookingId, BookingStatus.CONFIRMED)

    if (
      updatedBooking.type === BookingType.SWAP &&
      updatedBooking.offeredSkill &&
      updatedBooking.user.email
    ) {
      await sendSwapRequestAcceptedEmail({
        email: updatedBooking.user.email,
        name: updatedBooking.user.fullName,
        otherUserName: updatedBooking.skill.user.fullName,
        requestedSkillTitle: updatedBooking.skill.title,
        offeredSkillTitle: updatedBooking.offeredSkill.title,
        actionUrl: emailConfig.bookingsPageUrl,
      })
    }

    await notifyUser({
      userId: updatedBooking.userId,
      type: "BOOKING_CONFIRMED",
      message: `Your booking for ${updatedBooking.skill.title} was accepted.`,
      relatedBookingId: updatedBooking.id,
    })

    return sanitizeBookingForResponse(updatedBooking)
  }

  await refundAllHeldFunds(booking, "Booking rejected and funds refunded")

  const updatedBooking = await updateBookingOutcome(bookingId, {
    status: BookingStatus.REJECTED,
    outcome: BookingOutcome.CANCELLED_BY_PROVIDER,
    paymentStatus: PaymentStatus.REFUNDED,
    requesterHeldCredits: 0,
    providerHeldCredits: 0,
    cancelledAt: new Date(),
  })

  await notifyUser({
    userId: updatedBooking.userId,
    type: "BOOKING_REJECTED",
    message: `Your booking for ${updatedBooking.skill.title} was rejected and refunded.`,
    relatedBookingId: updatedBooking.id,
  })

  return sanitizeBookingForResponse(updatedBooking)
}

export const cancelBooking = async (currentUserId: string, bookingId: string) => {
  const booking = await findBookingById(bookingId)

  if (!booking) {
    throw new CustomError("Booking not found", 404)
  }

  if (!isParticipant(booking, currentUserId)) {
    throw new CustomError("Only booking participants can cancel this booking", 403)
  }

  const cancellableStatuses: BookingStatus[] = [BookingStatus.PENDING, BookingStatus.CONFIRMED]
  if (!cancellableStatuses.includes(booking.status)) {
    throw new CustomError("Only pending or confirmed bookings can be cancelled", 400)
  }

  await refundAllHeldFunds(booking, "Booking cancelled and funds refunded")

  const outcome = isRequester(booking, currentUserId)
    ? BookingOutcome.CANCELLED_BY_REQUESTER
    : BookingOutcome.CANCELLED_BY_PROVIDER

  const updatedBooking = await updateBookingOutcome(bookingId, {
    status: BookingStatus.CANCELLED,
    outcome,
    paymentStatus: PaymentStatus.REFUNDED,
    requesterHeldCredits: 0,
    providerHeldCredits: 0,
    cancelledAt: new Date(),
  })

  await notifyUser({
    userId: isRequester(booking, currentUserId) ? booking.skill.userId : booking.userId,
    type: "BOOKING_REJECTED",
    message: `The booking for ${booking.skill.title} was cancelled and refunded.`,
    relatedBookingId: booking.id,
  })

  return sanitizeBookingForResponse(updatedBooking)
}

export const completeBooking = async (currentUserId: string, bookingId: string) => {
  const booking = await findBookingById(bookingId)

  if (!booking) {
    throw new CustomError("Booking not found", 404)
  }

  if (!isProvider(booking, currentUserId)) {
    throw new CustomError("Only the skill owner can complete this booking", 403)
  }

  if (booking.status !== BookingStatus.CONFIRMED) {
    throw new CustomError("Only confirmed bookings can be marked as completed", 400)
  }

  await releaseRequesterHoldToProvider(booking, booking.requesterHeldCredits)

  if (booking.type === BookingType.SWAP) {
    await releaseProviderHoldToRequester(booking, booking.providerHeldCredits)
  }

  const updatedBooking = await updateBookingOutcome(bookingId, {
    status: BookingStatus.COMPLETED,
    outcome: BookingOutcome.COMPLETED,
    paymentStatus: PaymentStatus.RELEASED,
    requesterHeldCredits: 0,
    providerHeldCredits: 0,
    completedAt: new Date(),
  })

  await notifyUser({
    userId: updatedBooking.userId,
    type: "BOOKING_COMPLETED",
    message: `Your booking for ${updatedBooking.skill.title} has been completed.`,
    relatedBookingId: updatedBooking.id,
  })

  return sanitizeBookingForResponse(updatedBooking)
}

export const requestBookingExtension = async (
  currentUserId: string,
  bookingId: string,
  extraMinutes: number,
  extraCreditCost?: number
) => {
  const booking = await findBookingById(bookingId)

  if (!booking) {
    throw new CustomError("Booking not found", 404)
  }

  if (booking.status !== BookingStatus.CONFIRMED) {
    throw new CustomError("Only confirmed bookings can be extended", 400)
  }

  if (booking.extensionStatus === ExtensionStatus.PENDING) {
    throw new CustomError("There is already a pending extension request for this booking", 400)
  }

  const resolvedExtraCreditCost = extraCreditCost ?? 0

  if (booking.type === BookingType.LEARN) {
    if (!isRequester(booking, currentUserId)) {
      throw new CustomError(
        "Only the learner who booked the session can request extra time for a paid session",
        403
      )
    }

    if (resolvedExtraCreditCost <= 0) {
      throw new CustomError(
        "Paid learning sessions must include an extra credit cost for additional time",
        400
      )
    }

    const updatedBooking = await setPendingBookingExtension(bookingId, {
      pendingExtensionMinutes: extraMinutes,
      pendingExtensionCreditCost: resolvedExtraCreditCost,
      pendingCounterpartyExtensionCreditCost: 0,
      extensionRequestedById: currentUserId,
      extensionStatus: "PENDING",
      extensionRequestedAt: new Date(),
      extensionRespondedAt: null,
    })

    return sanitizeBookingForResponse(updatedBooking)
  }

  if (!isParticipant(booking, currentUserId)) {
    throw new CustomError("Only booking participants can request swap extensions", 403)
  }

  if (resolvedExtraCreditCost <= 0 || resolvedExtraCreditCost % 2 !== 0) {
    throw new CustomError(
      "Swap session extension cost must be a positive even number so it can be split evenly",
      400
    )
  }

  const splitCost = resolvedExtraCreditCost / 2

  const updatedBooking = await setPendingBookingExtension(bookingId, {
    pendingExtensionMinutes: extraMinutes,
    pendingExtensionCreditCost: splitCost,
    pendingCounterpartyExtensionCreditCost: splitCost,
    extensionRequestedById: currentUserId,
    extensionStatus: "PENDING",
    extensionRequestedAt: new Date(),
    extensionRespondedAt: null,
  })

  return sanitizeBookingForResponse(updatedBooking)
}

export const respondToBookingExtension = async (
  currentUserId: string,
  bookingId: string,
  action: "approve" | "reject"
) => {
  let booking: BookingRecord = await findBookingById(bookingId)

  if (!booking) {
    throw new CustomError("Booking not found", 404)
  }

  if (!isParticipant(booking, currentUserId)) {
    throw new CustomError("Only booking participants can respond to extension requests", 403)
  }

  if (booking.extensionRequestedById === currentUserId) {
    throw new CustomError("You cannot respond to your own extension request", 403)
  }

  if (booking.status !== BookingStatus.CONFIRMED) {
    throw new CustomError("Only confirmed bookings can be extended", 400)
  }

  const pendingExtensionMinutes = booking.pendingExtensionMinutes

  if (
    booking.extensionStatus !== ExtensionStatus.PENDING ||
    !pendingExtensionMinutes
  ) {
    throw new CustomError("There is no pending extension request for this booking", 400)
  }

  if (action === "approve") {
    const requesterIncrement =
      booking.type === BookingType.SWAP
        ? booking.pendingExtensionCreditCost ?? 0
        : booking.pendingExtensionCreditCost ?? 0
    const providerIncrement =
      booking.type === BookingType.SWAP
        ? booking.pendingCounterpartyExtensionCreditCost ?? 0
        : 0

    if (requesterIncrement > 0) {
      await ensureUserHasCredits(booking.userId, requesterIncrement)
      booking = await holdRequesterPayment(booking, requesterIncrement)
    }

    if (providerIncrement > 0) {
      await ensureUserHasCredits(booking.skill.userId, providerIncrement)
      booking = await holdProviderPayment(booking, providerIncrement)
    }

    const updatedBooking = await resolveBookingExtension(bookingId, {
      extensionStatus: "APPROVED",
      extensionMinutes: { increment: pendingExtensionMinutes },
      extensionCreditCost: { increment: requesterIncrement },
      counterpartyExtensionCreditCost: { increment: providerIncrement },
      pendingExtensionMinutes: null,
      pendingExtensionCreditCost: null,
      pendingCounterpartyExtensionCreditCost: null,
      extensionRequestedById: null,
      extensionRespondedAt: new Date(),
    })

    return sanitizeBookingForResponse(updatedBooking)
  }

  const updatedBooking = await resolveBookingExtension(bookingId, {
    extensionStatus: "REJECTED",
    pendingExtensionMinutes: null,
    pendingExtensionCreditCost: null,
    pendingCounterpartyExtensionCreditCost: null,
    extensionRequestedById: null,
    extensionRespondedAt: new Date(),
  })

  return sanitizeBookingForResponse(updatedBooking)
}

export const reportBookingOutcome = async (
  currentUserId: string,
  bookingId: string,
  outcome: "REQUESTER_NO_SHOW" | "PROVIDER_NO_SHOW" | "BOTH_NO_SHOW"
) => {
  const booking = await findBookingById(bookingId)

  if (!booking) {
    throw new CustomError("Booking not found", 404)
  }

  if (!isParticipant(booking, currentUserId)) {
    throw new CustomError("Only booking participants can report session outcomes", 403)
  }

  if (booking.status !== BookingStatus.CONFIRMED) {
    throw new CustomError("Only confirmed bookings can be marked with a no-show outcome", 400)
  }

  if (outcome === "REQUESTER_NO_SHOW" && isRequester(booking, currentUserId)) {
    throw new CustomError("You cannot report yourself as the person who showed up", 400)
  }

  if (outcome === "PROVIDER_NO_SHOW" && isProvider(booking, currentUserId)) {
    throw new CustomError("You cannot report yourself as the person who showed up", 400)
  }

  let paymentStatus: PaymentStatus = PaymentStatus.REFUNDED

  if (booking.type === BookingType.LEARN) {
    if (outcome === "REQUESTER_NO_SHOW") {
      const payout = getHalf(booking.requesterHeldCredits)
      const refund = booking.requesterHeldCredits - payout

      await releaseRequesterHoldToProvider(booking, payout)
      await refundRequester(booking, refund, "Partial refund after learner no-show")
      paymentStatus = PaymentStatus.PARTIALLY_RELEASED
    } else {
      await refundRequester(booking, booking.requesterHeldCredits, "Refund after provider no-show")
      paymentStatus = PaymentStatus.REFUNDED
    }
  } else {
    if (outcome === "BOTH_NO_SHOW") {
      await refundAllHeldFunds(booking, "Swap session missed by both users and fully refunded")
      paymentStatus = PaymentStatus.REFUNDED
    } else if (outcome === "REQUESTER_NO_SHOW") {
      await refundProvider(booking, booking.providerHeldCredits, "Your swap hold was refunded")
      await compensateBookingNoShow({
        bookingId: booking.id,
        noShowUserId: booking.userId,
        compensatedUserId: booking.skill.userId,
        amount: getHalf(booking.requesterHeldCredits),
        description: "No-show compensation for attending the swap session",
      })
      paymentStatus = PaymentStatus.PARTIALLY_RELEASED
    } else {
      await refundRequester(booking, booking.requesterHeldCredits, "Your swap hold was refunded")
      await compensateBookingNoShow({
        bookingId: booking.id,
        noShowUserId: booking.skill.userId,
        compensatedUserId: booking.userId,
        amount: getHalf(booking.providerHeldCredits),
        description: "No-show compensation for attending the swap session",
      })
      paymentStatus = PaymentStatus.PARTIALLY_RELEASED
    }
  }

  const updatedBooking = await updateBookingOutcome(bookingId, {
    status: BookingStatus.CANCELLED,
    outcome: BookingOutcome[outcome],
    paymentStatus,
    requesterHeldCredits: 0,
    providerHeldCredits: 0,
    cancelledAt: new Date(),
  })

  return sanitizeBookingForResponse(updatedBooking)
}
