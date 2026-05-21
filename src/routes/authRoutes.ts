import express from "express"
import {
  register,
  verifyEmailController,
  login,
  refreshTokens,
  logout
} from "../controllers/authController"
import { validate } from "../middleware/validate"
import { authMiddleware } from "../middleware/authMiddleware"
import { rateLimit } from "../middleware/rateLimiter"
import { loginSchema, registerSchema } from "../validations/authValidation"
import { verifyEmailTokenSchema } from "../validations/userValidation"

const router = express.Router()
const authWriteLimiter = rateLimit({
  max: 10,
  windowMs: 15 * 60 * 1000,
  message: "Too many authentication requests. Please try again later.",
  keyPrefix: "auth-write",
})
const loginLimiter = rateLimit({
  max: 5,
  windowMs: 15 * 60 * 1000,
  message: "Too many login attempts. Please try again later.",
  keyPrefix: "auth-login",
})

router.post("/register", authWriteLimiter, validate(registerSchema), register)
router.post("/verify-email", authWriteLimiter, validate(verifyEmailTokenSchema), verifyEmailController)
router.post("/login", loginLimiter, validate(loginSchema), login)
router.post("/refresh", authWriteLimiter, refreshTokens)
router.post("/logout", authMiddleware, logout)

export default router
