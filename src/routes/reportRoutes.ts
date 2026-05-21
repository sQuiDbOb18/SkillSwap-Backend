import express from "express"
import { createReportController } from "../controllers/reportController"
import { authMiddleware } from "../middleware/authMiddleware"
import { rateLimit } from "../middleware/rateLimiter"
import { validate } from "../middleware/validate"
import { createReportSchema } from "../validations/adminValidation"

const router = express.Router()
const reportLimiter = rateLimit({
  max: 5,
  windowMs: 10 * 60 * 1000,
  message: "Too many reports submitted. Please try again later.",
  keyPrefix: "create-report",
})

router.post("/", authMiddleware, reportLimiter, validate(createReportSchema), createReportController)

export default router
