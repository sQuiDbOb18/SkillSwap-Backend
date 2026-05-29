import { NextFunction, Request, Response } from "express"
import prisma from "../config/db"
import { env } from "../config/env"
import { getRedisClient } from "../config/redis"
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

const setRateLimitHeaders = (
  res: Response,
  max: number,
  remaining: number,
  resetAt: number
) => {
  res.setHeader("X-RateLimit-Limit", max.toString())
  res.setHeader("X-RateLimit-Remaining", Math.max(0, remaining).toString())
  res.setHeader("X-RateLimit-Reset", Math.ceil(resetAt / 1000).toString())
}

const rejectRateLimit = (next: NextFunction, message: string, type: string) => {
  return next(
    new CustomError(message, 429, {
      type,
    })
  )
}

const applyMemoryRateLimit = (
  key: string,
  max: number,
  windowMs: number,
  message: string,
  type: string,
  res: Response,
  next: NextFunction
) => {
  const now = Date.now()
  const current = store.get(key)

  if (!current || current.resetAt <= now) {
    const resetAt = now + windowMs

    store.set(key, {
      count: 1,
      resetAt,
    })

    setRateLimitHeaders(res, max, max - 1, resetAt)
    return next()
  }

  current.count += 1
  store.set(key, current)

  setRateLimitHeaders(res, max, max - current.count, current.resetAt)

  if (current.count > max) {
    return rejectRateLimit(next, message, type)
  }

  return next()
}

const applyRedisRateLimit = async (
  key: string,
  max: number,
  windowMs: number,
  message: string,
  type: string,
  res: Response,
  next: NextFunction
) => {
  const redis = getRedisClient()

  if (!redis) {
    return false
  }

  const redisKey = `rate-limit:${key}`
  const windowSeconds = Math.ceil(windowMs / 1000)
  const [count, ttl] = await redis
    .multi()
    .incr(redisKey)
    .expire(redisKey, windowSeconds, "NX")
    .ttl(redisKey)
    .exec()
    .then((results) => {
      const countResult = results?.[0]?.[1]
      const ttlResult = results?.[2]?.[1]
      return [Number(countResult ?? 1), Number(ttlResult ?? windowSeconds)]
    })

  const resetAt = Date.now() + Math.max(ttl, 0) * 1000
  setRateLimitHeaders(res, max, max - count, resetAt)

  if (count > max) {
    rejectRateLimit(next, message, type)
    return true
  }

  next()
  return true
}

export const rateLimit = ({
  max,
  windowMs,
  message = "Too many requests. Please try again later.",
  type = "RATE_LIMIT_ERROR",
  keyPrefix = "global",
}: RateLimitOptions) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now()
    const key = getClientKey(req, keyPrefix)

    if (env.NODE_ENV === "test") {
      return applyMemoryRateLimit(key, max, windowMs, message, type, res, next)
    }

    const redisHandled = await applyRedisRateLimit(key, max, windowMs, message, type, res, next)
    if (redisHandled) {
      return
    }

    const resetAtDate = new Date(now + windowMs)
    const current = await prisma.rateLimitEntry.findUnique({
      where: { key },
    })

    if (!current || current.resetAt.getTime() <= now) {
      const resetAt = now + windowMs

      await prisma.rateLimitEntry.upsert({
        where: { key },
        update: {
          count: 1,
          resetAt: resetAtDate,
        },
        create: {
          key,
          count: 1,
          resetAt: resetAtDate,
        },
      })

      void prisma.rateLimitEntry.deleteMany({
        where: {
          resetAt: {
            lt: new Date(now - windowMs),
          },
        },
      }).catch(() => undefined)

      setRateLimitHeaders(res, max, max - 1, resetAt)

      return next()
    }

    const updated = await prisma.rateLimitEntry.update({
      where: { key },
      data: {
        count: {
          increment: 1,
        },
      },
    })

    const remaining = Math.max(0, max - updated.count)
    setRateLimitHeaders(res, max, remaining, updated.resetAt.getTime())

    if (updated.count > max) {
      return rejectRateLimit(next, message, type)
    }

    next()
  }
}

export const clearTestRateLimitStore = () => {
  store.clear()
}
