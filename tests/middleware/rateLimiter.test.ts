import { jest, describe, it, expect, beforeEach } from "@jest/globals"
import { rateLimit } from "../../src/middleware/rateLimiter"
import { getRedisClient } from "../../src/config/redis"

jest.mock("../../src/config/env", () => ({
  env: {
    NODE_ENV: "production",
  },
}))

jest.mock("../../src/config/redis", () => ({
  getRedisClient: jest.fn(),
}))

const mockedGetRedisClient = getRedisClient as jest.MockedFunction<typeof getRedisClient>

const createRedisClient = (count: number, ttl = 60) => {
  const chain = {
    incr: jest.fn().mockReturnThis(),
    expire: jest.fn().mockReturnThis(),
    ttl: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue([
      [null, count],
      [null, 1],
      [null, ttl],
    ] as never),
  }

  return {
    multi: jest.fn(() => chain),
    chain,
  }
}

const createResponse = () => ({
  setHeader: jest.fn(),
})

describe("rateLimit middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("uses Redis when REDIS_URL is configured and allows requests under the limit", async () => {
    const redis = createRedisClient(1)
    mockedGetRedisClient.mockReturnValue(redis as never)
    const limiter = rateLimit({ max: 2, windowMs: 60_000, keyPrefix: "test" })
    const res = createResponse()
    const next = jest.fn()

    await limiter(
      { ip: "127.0.0.1", socket: {} } as any,
      res as any,
      next
    )

    expect(redis.multi).toHaveBeenCalled()
    expect(redis.chain.incr).toHaveBeenCalledWith("rate-limit:test:127.0.0.1")
    expect(redis.chain.expire).toHaveBeenCalledWith("rate-limit:test:127.0.0.1", 60, "NX")
    expect(res.setHeader).toHaveBeenCalledWith("X-RateLimit-Limit", "2")
    expect(res.setHeader).toHaveBeenCalledWith("X-RateLimit-Remaining", "1")
    expect(next).toHaveBeenCalledWith()
  })

  it("blocks requests over the Redis-backed limit", async () => {
    const redis = createRedisClient(3)
    mockedGetRedisClient.mockReturnValue(redis as never)
    const limiter = rateLimit({ max: 2, windowMs: 60_000, keyPrefix: "test" })
    const res = createResponse()
    const next = jest.fn()

    await limiter(
      { ip: "127.0.0.1", socket: {} } as any,
      res as any,
      next
    )

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 429,
        message: "Too many requests. Please try again later.",
      })
    )
  })
})
