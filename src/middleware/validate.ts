import { NextFunction, Request, Response } from "express"
import { ZodTypeAny } from "zod"
import { CustomError } from "../utils/CustomError"

type ValidationTarget = "body" | "query" | "params"

export const validate = (schema: ZodTypeAny, target: ValidationTarget = "body") => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[target])

    if (!result.success) {
      const errors = result.error.issues.map((err) => ({
        field: err.path.join(".") || target,
        message: err.message,
      }))

      return next(
        new CustomError("Validation failed", 400, {
          type: "VALIDATION_ERROR",
          errors,
        })
      )
    }

    req[target] = result.data as Request[typeof target]
    next()
  }
}
