import { NextFunction, Request, Response } from "express"
import { CustomError } from "../utils/CustomError"

type RateLimitOptions = {
  max: number
  windowMs: number
  message?: string
  type?: string
  keyPrefix?: string
}

type Entry = {
  count: number
  resetAt: number
}

const store = new Map<string, Entry>()

const getClientKey = (req: Request, keyPrefix: string) => {
  const ip = req.ip || req.socket.remoteAddress || "unknown"
  return `${keyPrefix}:${ip}`
}

export const rateLimit = ({
  max,
  windowMs,
  message = "Too many requests. Please try again later.",
  type = "RATE_LIMIT_ERROR",
  keyPrefix = "global",
}: RateLimitOptions) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now()
    const key = getClientKey(req, keyPrefix)
    const current = store.get(key)

    if (!current || current.resetAt <= now) {
      const resetAt = now + windowMs

      store.set(key, {
        count: 1,
        resetAt,
      })

      res.setHeader("X-RateLimit-Limit", max.toString())
      res.setHeader("X-RateLimit-Remaining", Math.max(0, max - 1).toString())
      res.setHeader("X-RateLimit-Reset", Math.ceil(resetAt / 1000).toString())

      return next()
    }

    current.count += 1
    store.set(key, current)

    const remaining = Math.max(0, max - current.count)
    res.setHeader("X-RateLimit-Limit", max.toString())
    res.setHeader("X-RateLimit-Remaining", remaining.toString())
    res.setHeader("X-RateLimit-Reset", Math.ceil(current.resetAt / 1000).toString())

    if (current.count > max) {
      return next(
        new CustomError(message, 429, {
          type,
        })
      )
    }

    next()
  }
}
