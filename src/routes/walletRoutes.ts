import express from "express"
import {
  creditWalletController,
  debitWalletController,
  getWalletController,
  getWalletTransactionsController,
} from "../controllers/walletController"
import { authMiddleware } from "../middleware/authMiddleware"
import { restrictTo } from "../middleware/roleMiddleware"
import { validate } from "../middleware/validate"
import { walletTransactionSchema } from "../validations/walletValidation"

const router = express.Router()

router.get("/", authMiddleware, getWalletController)
router.get("/transactions", authMiddleware, getWalletTransactionsController)
router.post("/credit", authMiddleware, restrictTo("Admin"), validate(walletTransactionSchema), creditWalletController)
router.post("/debit", authMiddleware, restrictTo("Admin"), validate(walletTransactionSchema), debitWalletController)

export default router
