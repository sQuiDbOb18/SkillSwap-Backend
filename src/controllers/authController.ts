import { Request, Response } from "express"
import { asyncHandler } from "../utils/asyncHandler"
import { registerUser, verifyEmail, loginUser, logoutUser, refreshUserTokens, resendVerificationCode, loginWithGoogle } from "../services/authService"
import { clearRefreshTokenCookie, getRefreshTokenFromRequest, setRefreshTokenCookie } from "../utils/refreshTokenCookie"

export const register = asyncHandler(async( req: Request, res: Response) => {
    const result = await registerUser(req.body)
    res.status(201).json(result)
})

export const verifyEmailController = asyncHandler(async( req: Request, res: Response) => {
    const { code } = req.body
    const result = await verifyEmail(code)
    setRefreshTokenCookie(res, result.refreshToken)
    res.status(201).json(result)
})

export const resendVerificationController = asyncHandler(async( req: Request, res: Response) => {
    const { email } = req.body
    const result = await resendVerificationCode(email)
    res.json(result)
})

export const login = asyncHandler(async( req: Request, res: Response) => {
    const result = await loginUser(req.body)
    setRefreshTokenCookie(res, result.refreshToken)
    res.json(result)
})

export const googleAuth = asyncHandler(async( req: Request, res: Response) => {
    const result = await loginWithGoogle(req.body)
    setRefreshTokenCookie(res, result.refreshToken)
    res.status(200).json(result)
})

export const refreshTokens = asyncHandler(async( req: Request, res: Response) => {
    const refreshToken = getRefreshTokenFromRequest(req)
    const result = await refreshUserTokens(refreshToken)
    setRefreshTokenCookie(res, result.refreshToken)
    res.json(result)
})

export const logout = asyncHandler(async( req: any, res: Response) => {
    const result = await logoutUser(req.user.userId)
    clearRefreshTokenCookie(res)
    res.json(result)
})
