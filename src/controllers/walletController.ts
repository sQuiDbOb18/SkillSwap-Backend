import { asyncHandler } from "../utils/asyncHandler"
import {
  creditWallet,
  debitWallet,
  getWalletSummary,
  getWalletTransactions,
} from "../services/walletService"

export const getWalletController = asyncHandler(async (req: any, res: any) => {
  const wallet = await getWalletSummary(req.user.userId)
  res.json(wallet)
})

export const getWalletTransactionsController = asyncHandler(async (req: any, res: any) => {
  const transactions = await getWalletTransactions(req.user.userId)
  res.json(transactions)
})

export const creditWalletController = asyncHandler(async (req: any, res: any) => {
  const result = await creditWallet(req.user.userId, req.body.amount, req.body.description)
  res.status(201).json(result)
})

export const debitWalletController = asyncHandler(async (req: any, res: any) => {
  const result = await debitWallet(req.user.userId, req.body.amount, req.body.description)
  res.status(201).json(result)
})
