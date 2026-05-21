import express from "express"
import {
  createReviewController,
  getUserReviewsController,
} from "../controllers/reviewController"
import { authMiddleware } from "../middleware/authMiddleware"
import { validate } from "../middleware/validate"
import { createReviewSchema } from "../validations/reviewValidation"

const router = express.Router()

router.post("/", authMiddleware, validate(createReviewSchema), createReviewController)
router.get("/users/:userId", getUserReviewsController)

export default router
