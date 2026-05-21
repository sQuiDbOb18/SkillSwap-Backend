import {
  TransactionType,
  WalletTransactionReferenceType,
} from "@prisma/client"
import {
  applyWalletTransaction,
  findWalletTransactionByBookingAndType,
  getOrCreateWalletByUserId,
  getWalletBalanceByUserId,
  listWalletTransactions,
} from "../repositories/walletRepository"
import { findUserById } from "../repositories/userRepository"
import { notifyUser } from "./notificationService"
import { CustomError } from "../utils/CustomError"

const ensurePositiveAmount = (amount: number) => {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new CustomError("Amount must be a positive integer", 400)
  }
}

export const getWalletSummary = async (userId: string) => {
  return getOrCreateWalletByUserId(userId)
}

export const getWalletTransactions = async (userId: string) => {
  await getOrCreateWalletByUserId(userId)
  return listWalletTransactions(userId)
}

export const ensureUserHasCredits = async (userId: string, amount: number) => {
  ensurePositiveAmount(amount)

  const balance = await getWalletBalanceByUserId(userId)

  if (balance < amount) {
    throw new CustomError(
      `You need ${amount} credits to book this session, but your wallet balance is ${balance}.`,
      400
    )
  }

  return { balance }
}

export const creditWallet = async (
  userId: string,
  amount: number,
  description?: string
) => {
  ensurePositiveAmount(amount)

  const user = await findUserById(userId)

  if (!user) {
    throw new CustomError("User not found", 404)
  }

  const result = await applyWalletTransaction({
    userId,
    amount,
    type: TransactionType.CREDIT,
    description: description?.trim() || "Wallet credit",
  })

  await notifyUser({
    userId,
    type: "WALLET_CREDIT",
    message: `${amount} credits added to your wallet.`,
  })

  return result
}

export const debitWallet = async (
  userId: string,
  amount: number,
  description?: string
) => {
  ensurePositiveAmount(amount)

  const user = await findUserById(userId)

  if (!user) {
    throw new CustomError("User not found", 404)
  }

  try {
    const result = await applyWalletTransaction({
      userId,
      amount,
      type: TransactionType.DEBIT,
      description: description?.trim() || "Wallet debit",
    })

    await notifyUser({
      userId,
      type: "WALLET_DEBIT",
      message: `${amount} credits deducted from your wallet.`,
    })

    return result
  } catch (error: any) {
    if (error?.message === "INSUFFICIENT_WALLET_BALANCE") {
      throw new CustomError("Insufficient wallet balance", 400)
    }

    throw error
  }
}

const debitBookingHold = async (params: {
  bookingId: string
  payerUserId: string
  amount: number
  description: string
  counterpartyUserId: string
  referenceType: WalletTransactionReferenceType
}) => {
  ensurePositiveAmount(params.amount)

  const existingDebit = await findWalletTransactionByBookingAndType({
    userId: params.payerUserId,
    bookingId: params.bookingId,
    type: TransactionType.DEBIT,
    referenceType: params.referenceType,
  })

  if (existingDebit) {
    return {
      alreadyHeld: true,
    }
  }

  try {
    const result = await applyWalletTransaction({
      userId: params.payerUserId,
      amount: params.amount,
      type: TransactionType.DEBIT,
      description: params.description,
      referenceBookingId: params.bookingId,
      counterpartyUserId: params.counterpartyUserId,
      referenceType: params.referenceType,
    })

    await notifyUser({
      userId: params.payerUserId,
      type: "WALLET_DEBIT",
      message: `${params.amount} credits have been held for your booking.`,
      relatedBookingId: params.bookingId,
    })

    return {
      alreadyHeld: false,
      ...result,
    }
  } catch (error: any) {
    if (error?.message === "INSUFFICIENT_WALLET_BALANCE") {
      throw new CustomError("Insufficient wallet balance", 400)
    }

    throw error
  }
}

export const holdBookingCredits = async (params: {
  bookingId: string
  payerUserId: string
  counterpartyUserId: string
  amount: number
  role: "requester" | "provider"
}) => {
  const referenceType =
    params.role === "requester"
      ? WalletTransactionReferenceType.BOOKING_REQUESTER_HOLD
      : WalletTransactionReferenceType.BOOKING_PROVIDER_HOLD

  return debitBookingHold({
    bookingId: params.bookingId,
    payerUserId: params.payerUserId,
    counterpartyUserId: params.counterpartyUserId,
    amount: params.amount,
    description: `Credits held for ${params.role} booking payment`,
    referenceType,
  })
}

export const refundBookingCredits = async (params: {
  bookingId: string
  userId: string
  amount: number
  counterpartyUserId: string
  role: "requester" | "provider"
  reason: string
}) => {
  ensurePositiveAmount(params.amount)

  const referenceType =
    params.role === "requester"
      ? WalletTransactionReferenceType.BOOKING_REQUESTER_REFUND
      : WalletTransactionReferenceType.BOOKING_PROVIDER_REFUND

  const existingRefund = await findWalletTransactionByBookingAndType({
    userId: params.userId,
    bookingId: params.bookingId,
    type: TransactionType.CREDIT,
    referenceType,
  })

  if (existingRefund) {
    return {
      alreadyRefunded: true,
    }
  }

  const result = await applyWalletTransaction({
    userId: params.userId,
    amount: params.amount,
    type: TransactionType.CREDIT,
    description: params.reason,
    referenceBookingId: params.bookingId,
    counterpartyUserId: params.counterpartyUserId,
    referenceType,
  })

  await notifyUser({
    userId: params.userId,
    type: "WALLET_CREDIT",
    message: `${params.amount} credits were refunded for your booking.`,
    relatedBookingId: params.bookingId,
  })

  return {
    alreadyRefunded: false,
    ...result,
  }
}

export const releaseHeldBookingCredits = async (params: {
  bookingId: string
  payerUserId: string
  recipientUserId: string
  skillTitle: string
  amount: number
  role: "requester" | "provider"
}) => {
  ensurePositiveAmount(params.amount)

  const existingCredit = await findWalletTransactionByBookingAndType({
    userId: params.recipientUserId,
    bookingId: params.bookingId,
    type: TransactionType.CREDIT,
    referenceType:
      params.role === "requester"
        ? WalletTransactionReferenceType.BOOKING_PROVIDER_PAYOUT
        : WalletTransactionReferenceType.BOOKING_REQUESTER_PAYOUT,
  })

  if (existingCredit) {
    return {
      alreadyReleased: true,
    }
  }

  const result = await applyWalletTransaction({
    userId: params.recipientUserId,
    amount: params.amount,
    type: TransactionType.CREDIT,
    description: `Booking payout released for ${params.skillTitle}`,
    referenceBookingId: params.bookingId,
    counterpartyUserId: params.payerUserId,
    referenceType:
      params.role === "requester"
        ? WalletTransactionReferenceType.BOOKING_PROVIDER_PAYOUT
        : WalletTransactionReferenceType.BOOKING_REQUESTER_PAYOUT,
  })

  await notifyUser({
    userId: params.recipientUserId,
    type: "WALLET_CREDIT",
    message: `${params.amount} credits were released for your completed session.`,
    relatedBookingId: params.bookingId,
  })

  return {
    alreadyReleased: false,
    ...result,
  }
}

export const compensateBookingNoShow = async (params: {
  bookingId: string
  noShowUserId: string
  compensatedUserId: string
  amount: number
  description: string
}) => {
  ensurePositiveAmount(params.amount)

  const existingCompensation = await findWalletTransactionByBookingAndType({
    userId: params.compensatedUserId,
    bookingId: params.bookingId,
    type: TransactionType.CREDIT,
    referenceType: WalletTransactionReferenceType.BOOKING_NO_SHOW_COMPENSATION,
  })

  if (existingCompensation) {
    return {
      alreadyCompensated: true,
    }
  }

  const result = await applyWalletTransaction({
    userId: params.compensatedUserId,
    amount: params.amount,
    type: TransactionType.CREDIT,
    description: params.description,
    referenceBookingId: params.bookingId,
    counterpartyUserId: params.noShowUserId,
    referenceType: WalletTransactionReferenceType.BOOKING_NO_SHOW_COMPENSATION,
  })

  await notifyUser({
    userId: params.compensatedUserId,
    type: "WALLET_CREDIT",
    message: `${params.amount} credits were added as no-show compensation.`,
    relatedBookingId: params.bookingId,
  })

  return {
    alreadyCompensated: false,
    ...result,
  }
}
