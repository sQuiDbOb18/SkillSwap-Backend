import { NextFunction, Request, Response } from "express"
import { ZodError } from "zod"
import { CustomError } from "../utils/CustomError"

export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof ZodError) {
    err = new CustomError("Validation failed", 400, {
      type: "VALIDATION_ERROR",
      errors: err.issues.map((issue) => ({
        field: issue.path.join(".") || "request",
        message: issue.message,
      })),
    })
  }

  if (err instanceof SyntaxError && "body" in err) {
    err = new CustomError("Invalid JSON payload", 400, {
      type: "INVALID_JSON",
    })
  }

  const statusCode = err.statusCode || 500
  const message = err.message || "Internal Server Error"

  if (statusCode >= 500) {
    console.error(err)
  }

  res.status(statusCode).json({
    success: false,
    type: err.type ?? (statusCode >= 500 ? "INTERNAL_ERROR" : "REQUEST_ERROR"),
    message,
    ...(err.errors ? { errors: err.errors } : {}),
  })
}
