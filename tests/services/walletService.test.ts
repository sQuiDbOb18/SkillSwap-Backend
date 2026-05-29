import { jest, describe, it, expect, beforeEach } from "@jest/globals"
import { TransactionType, WalletTransactionReferenceType } from "@prisma/client"
import * as walletRepository from "../../src/repositories/walletRepository"
import * as userRepository from "../../src/repositories/userRepository"
import * as notificationService from "../../src/services/notificationService"
import {
  creditWallet,
  debitWallet,
  ensureUserHasCredits,
  getWalletSummary,
  getWalletTransactions,
  holdBookingCredits,
  refundBookingCredits,
  releaseHeldBookingCredits,
} from "../../src/services/walletService"

jest.mock("../../src/repositories/walletRepository", () => ({
  applyWalletTransaction: jest.fn(),
  findWalletTransactionByBookingAndType: jest.fn(),
  getOrCreateWalletByUserId: jest.fn(),
  getWalletBalanceByUserId: jest.fn(),
  listWalletTransactions: jest.fn(),
}))

jest.mock("../../src/repositories/userRepository", () => ({
  findUserById: jest.fn(),
}))

jest.mock("../../src/services/notificationService", () => ({
  notifyUser: jest.fn(),
}))

const mockedWalletRepository = walletRepository as jest.Mocked<typeof walletRepository>
const mockedUserRepository = userRepository as jest.Mocked<typeof userRepository>
const mockedNotificationService = notificationService as jest.Mocked<typeof notificationService>

describe("walletService", () => {
  beforeEach(() => jest.clearAllMocks())

  it("gets wallet summary and transactions", async () => {
    mockedWalletRepository.getOrCreateWalletByUserId.mockResolvedValue({ balance: 10 } as never)
    mockedWalletRepository.listWalletTransactions.mockResolvedValue([{ id: "tx-1" }] as never)
    await expect(getWalletSummary("user-1")).resolves.toEqual({ balance: 10 })
    await expect(getWalletTransactions("user-1")).resolves.toEqual([{ id: "tx-1" }])
  })

  it("ensures a user has enough credits", async () => {
    mockedWalletRepository.getWalletBalanceByUserId.mockResolvedValue(7 as never)
    await expect(ensureUserHasCredits("user-1", 5)).resolves.toEqual({ balance: 7 })
    await expect(ensureUserHasCredits("user-1", 8)).rejects.toMatchObject({
      message: "You need 8 credits to book this session, but your wallet balance is 7.",
      statusCode: 400,
    })
  })

  it("credits and debits a wallet with notifications", async () => {
    mockedUserRepository.findUserById.mockResolvedValue({ id: "user-1" } as never)
    mockedWalletRepository.applyWalletTransaction
      .mockResolvedValueOnce({ id: "credit-tx" } as never)
      .mockResolvedValueOnce({ id: "debit-tx" } as never)
    mockedNotificationService.notifyUser.mockResolvedValue({ id: "notification-1" } as never)

    await expect(creditWallet("user-1", 5, " top up ")).resolves.toEqual({ id: "credit-tx" })
    await expect(debitWallet("user-1", 3, " purchase ")).resolves.toEqual({ id: "debit-tx" })

    expect(mockedWalletRepository.applyWalletTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        amount: 5,
        type: TransactionType.CREDIT,
        description: "top up",
      })
    )
    expect(mockedWalletRepository.applyWalletTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        amount: 3,
        type: TransactionType.DEBIT,
        description: "purchase",
      })
    )
  })

  it("is idempotent when holding booking credits", async () => {
    mockedWalletRepository.findWalletTransactionByBookingAndType.mockResolvedValue({
      id: "existing-hold",
    } as never)
    await expect(
      holdBookingCredits({
        bookingId: "booking-1",
        payerUserId: "payer-1",
        counterpartyUserId: "provider-1",
        amount: 5,
        role: "requester",
      })
    ).resolves.toEqual({ alreadyHeld: true })
    expect(mockedWalletRepository.findWalletTransactionByBookingAndType).toHaveBeenCalledWith({
      userId: "payer-1",
      bookingId: "booking-1",
      type: TransactionType.DEBIT,
      referenceType: WalletTransactionReferenceType.BOOKING_REQUESTER_HOLD,
    })
  })

  it("refunds and releases booking credits", async () => {
    mockedWalletRepository.findWalletTransactionByBookingAndType.mockResolvedValue(null)
    mockedWalletRepository.applyWalletTransaction
      .mockResolvedValueOnce({ id: "refund-tx" } as never)
      .mockResolvedValueOnce({ id: "release-tx" } as never)
    mockedNotificationService.notifyUser.mockResolvedValue({ id: "notification-1" } as never)

    await expect(
      refundBookingCredits({
        bookingId: "booking-1",
        userId: "requester-1",
        amount: 5,
        counterpartyUserId: "provider-1",
        role: "requester",
        reason: "refund",
      })
    ).resolves.toEqual({ alreadyRefunded: false, id: "refund-tx" })

    await expect(
      releaseHeldBookingCredits({
        bookingId: "booking-1",
        payerUserId: "requester-1",
        recipientUserId: "provider-1",
        skillTitle: "React",
        amount: 5,
        role: "requester",
      })
    ).resolves.toEqual({ alreadyReleased: false, id: "release-tx" })
  })
})
