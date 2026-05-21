import express from "express"
import { 
    getProfile, 
    updateProfile,
    changePasswordController,
    changeEmailController,
    verifyEmailChange,
    verifyEmailChangeRedirect,
    forgotPasswordController,
    verifyResetPasswordCodeController,
    resetPasswordController,
    deleteAccountController,
    restoreAccountController
} from "../controllers/userController"
import { authMiddleware } from "../middleware/authMiddleware"
import { rateLimit } from "../middleware/rateLimiter"
import { validate } from "../middleware/validate"
import {
    resetPasswordSchema,
    forgotPasswordSchema,
    verifyResetPasswordCodeSchema,
    changePasswordSchema,
    updateProfileSchema,
    changeEmailSchema,
    verifyEmailTokenSchema,
    deleteAccountSchema,
    restoreAccountSchema
} from "../validations/userValidation"

const router = express.Router()
const passwordRecoveryLimiter = rateLimit({
    max: 5,
    windowMs: 15 * 60 * 1000,
    message: "Too many password recovery attempts. Please try again later.",
    keyPrefix: "password-recovery",
})
const accountRecoveryLimiter = rateLimit({
    max: 3,
    windowMs: 60 * 60 * 1000,
    message: "Too many account recovery attempts. Please try again later.",
    keyPrefix: "account-recovery",
})

router.get("/verify-email", verifyEmailChangeRedirect)
router.get("/profile", authMiddleware, getProfile)
router.put("/profile", authMiddleware, validate(updateProfileSchema), updateProfile)
router.put("/password", authMiddleware, validate(changePasswordSchema), changePasswordController)
router.put("/email", authMiddleware, validate(changeEmailSchema), changeEmailController)
router.post("/verify-email", passwordRecoveryLimiter, validate(verifyEmailTokenSchema), verifyEmailChange)
router.post("/forgot-password", passwordRecoveryLimiter, validate(forgotPasswordSchema), forgotPasswordController)
router.post("/reset-password/verify-code", passwordRecoveryLimiter, validate(verifyResetPasswordCodeSchema), verifyResetPasswordCodeController)
router.post("/reset-password", passwordRecoveryLimiter, validate(resetPasswordSchema), resetPasswordController)
router.post("/restore-account", accountRecoveryLimiter, validate(restoreAccountSchema), restoreAccountController)
router.delete("/account", authMiddleware, validate(deleteAccountSchema), deleteAccountController)

export default router
