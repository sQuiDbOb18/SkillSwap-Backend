import { jest, describe, it, expect, beforeEach } from "@jest/globals"
import {
  creditWallet,
  debitWallet,
  getWalletSummary,
  getWalletTransactions,
} from "../../src/services/walletService"
import {
  creditWalletController,
  debitWalletController,
  getWalletController,
  getWalletTransactionsController,
} from "../../src/controllers/walletController"

jest.mock("../../src/services/walletService", () => ({
  creditWallet: jest.fn(),
  debitWallet: jest.fn(),
  getWalletSummary: jest.fn(),
  getWalletTransactions: jest.fn(),
}))

const mockedGetWalletSummary = getWalletSummary as jest.MockedFunction<typeof getWalletSummary>
const mockedGetWalletTransactions = getWalletTransactions as jest.MockedFunction<
  typeof getWalletTransactions
>
const mockedCreditWallet = creditWallet as jest.MockedFunction<typeof creditWallet>
const mockedDebitWallet = debitWallet as jest.MockedFunction<typeof debitWallet>

const createResponse = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() })
const runController = async (controller: any, req: any, res: any, next = jest.fn()) => {
  controller(req, res, next)
  await Promise.resolve()
  await Promise.resolve()
}

describe("walletController", () => {
  beforeEach(() => jest.clearAllMocks())

  it("gets wallet summary and transactions for the authenticated user", async () => {
    const res = createResponse()
    mockedGetWalletSummary.mockResolvedValue({ balance: 10 } as never)
    mockedGetWalletTransactions.mockResolvedValue([{ id: "tx-1" }] as never)
    await runController(getWalletController, { user: { userId: "user-1" } }, res)
    await runController(getWalletTransactionsController, { user: { userId: "user-1" } }, res)
    expect(mockedGetWalletSummary).toHaveBeenCalledWith("user-1")
    expect(mockedGetWalletTransactions).toHaveBeenCalledWith("user-1")
  })

  it("credits and debits with status 201", async () => {
    const res = createResponse()
    mockedCreditWallet.mockResolvedValue({ id: "credit-tx" } as never)
    mockedDebitWallet.mockResolvedValue({ id: "debit-tx" } as never)
    await runController(
      creditWalletController,
      { user: { userId: "user-1" }, body: { amount: 5, description: "top up" } },
      res
    )
    await runController(
      debitWalletController,
      { user: { userId: "user-1" }, body: { amount: 3, description: "purchase" } },
      res
    )
    expect(mockedCreditWallet).toHaveBeenCalledWith("user-1", 5, "top up")
    expect(mockedDebitWallet).toHaveBeenCalledWith("user-1", 3, "purchase")
    expect(res.status).toHaveBeenCalledWith(201)
  })
})
