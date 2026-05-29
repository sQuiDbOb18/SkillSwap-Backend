import Redis from "ioredis"
import { env } from "./env"

let redis: Redis | null = null

export const getRedisClient = () => {
  if (!env.REDIS_URL) {
    return null
  }

  if (!redis) {
    redis = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 2,
      lazyConnect: true,
    })
  }

  return redis
}

export const closeRedisClient = async () => {
  if (!redis) {
    return
  }

  await redis.quit()
  redis = null
}
