import { jest, describe, it, expect, beforeEach } from "@jest/globals"
import { createReport } from "../../src/services/adminService"
import { createReportController } from "../../src/controllers/reportController"

jest.mock("../../src/services/adminService", () => ({
  createReport: jest.fn(),
}))

const mockedCreateReport = createReport as jest.MockedFunction<typeof createReport>
const createResponse = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() })
const runController = async (controller: any, req: any, res: any, next = jest.fn()) => {
  controller(req, res, next)
  await Promise.resolve()
  await Promise.resolve()
}

describe("reportController", () => {
  beforeEach(() => jest.clearAllMocks())

  it("creates a report for the authenticated reporter", async () => {
    const report = { id: "report-1" }
    const payload = { targetType: "USER", targetId: "user-2", reason: "abuse" }
    const res = createResponse()
    mockedCreateReport.mockResolvedValue(report as never)
    await runController(
      createReportController,
      { user: { userId: "user-1" }, body: payload },
      res
    )
    expect(mockedCreateReport).toHaveBeenCalledWith("user-1", payload)
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith(report)
  })
})
