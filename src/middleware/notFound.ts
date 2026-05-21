import { NextFunction, Request, Response } from "express"
import { CustomError } from "../utils/CustomError"

export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  next(
    new CustomError(`Route not found: ${req.method} ${req.originalUrl}`, 404, {
      type: "NOT_FOUND",
    })
  )
}
