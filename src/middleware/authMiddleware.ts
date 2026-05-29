import { NextFunction, Request, Response } from "express"
import { findUserForAuthById } from "../repositories/userRepository"
import { verifyAccessToken } from "../utils/authToken"

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(" ")[1]
    if (!token) {
        return res.status(401).json({ message: "No token provided" })
    }

    try {
        const decoded: any = verifyAccessToken(token)
        const user = await findUserForAuthById(decoded.userId)

        if (!user || user.deletedAt) {
            return res.status(401).json({ message: "Account is no longer active" })
        }

        if (decoded.tokenVersion !== user.tokenVersion) {
            return res.status(401).json({ message: "Session expired. Please log in again." })
        }

        req.user = decoded
        next()
    } catch (err) {
        return res.status(401).json({ message: "Invalid token" })
    }
}

export const optionalAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(" ")[1]
    if (!token) {
        return next()
    }

    try {
        const decoded = verifyAccessToken(token)
        const user = await findUserForAuthById(decoded.userId)

        if (user && !user.deletedAt && decoded.tokenVersion === user.tokenVersion) {
            req.user = decoded
        }
    } catch (err) {
        req.user = undefined
    }

    next()
}
