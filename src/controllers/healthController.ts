import { Request, Response } from "express"
import prisma from "../config/db"
import { asyncHandler } from "../utils/asyncHandler"

export const healthCheck = asyncHandler(async (req: Request, res: Response) => {
  const startedAt = Date.now()

  await prisma.$queryRaw`SELECT 1`

  res.json({
    status: "ok",
    uptimeSeconds: Math.round(process.uptime()),
    database: "ok",
    checkedAt: new Date().toISOString(),
    latencyMs: Date.now() - startedAt,
  })
})

export const readinessCheck = asyncHandler(async (req: Request, res: Response) => {
  await prisma.$queryRaw`SELECT 1`
  res.status(204).send()
})
