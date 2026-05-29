import { jest, describe, it, expect, beforeEach } from "@jest/globals"
import { ReportTargetType } from "@prisma/client"
import {
  deleteUserAsAdmin,
  getAdminDashboard,
  getAllUsersForAdmin,
  moderateContentAsAdmin,
} from "../../src/services/adminService"
import {
  deleteUserByAdminController,
  getAdminDashboardController,
  getAllUsersController,
  moderateContentController,
} from "../../src/controllers/adminController"

jest.mock("../../src/services/adminService", () => ({
  deleteUserAsAdmin: jest.fn(),
  getAdminDashboard: jest.fn(),
  getAdminModerationQueue: jest.fn(),
  getAllReportsForAdmin: jest.fn(),
  getAllUsersForAdmin: jest.fn(),
  moderateContentAsAdmin: jest.fn(),
  updateReportStatusAsAdmin: jest.fn(),
}))

const mockedGetAdminDashboard = getAdminDashboard as jest.MockedFunction<typeof getAdminDashboard>
const mockedGetAllUsersForAdmin = getAllUsersForAdmin as jest.MockedFunction<typeof getAllUsersForAdmin>
const mockedDeleteUserAsAdmin = deleteUserAsAdmin as jest.MockedFunction<typeof deleteUserAsAdmin>
const mockedModerateContentAsAdmin = moderateContentAsAdmin as jest.MockedFunction<typeof moderateContentAsAdmin>

const createResponse = () => ({
  json: jest.fn(),
})

const runController = async (
  controller: (req: any, res: any, next: any) => void,
  req: any,
  res: any,
  next: any
) => {
  controller(req, res, next)
  await Promise.resolve()
  await Promise.resolve()
}

describe("adminController", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("returns the admin dashboard response", async () => {
    const dashboard = { users: { total: 4 } }
    const res = createResponse()
    const next = jest.fn()
    mockedGetAdminDashboard.mockResolvedValue(dashboard as never)

    await runController(getAdminDashboardController, {}, res, next)

    expect(mockedGetAdminDashboard).toHaveBeenCalledWith()
    expect(res.json).toHaveBeenCalledWith(dashboard)
    expect(next).not.toHaveBeenCalled()
  })

  it("parses admin user query params before calling the service", async () => {
    const serviceResult = { items: [], total: 0, page: 2, limit: 5, totalPages: 0 }
    const res = createResponse()
    const next = jest.fn()
    mockedGetAllUsersForAdmin.mockResolvedValue(serviceResult as never)

    await runController(
      getAllUsersController,
      {
        query: {
          search: "ada",
          role: "Admin",
          includeDeleted: "true",
          page: "2",
          limit: "5",
        },
      },
      res,
      next
    )

    expect(mockedGetAllUsersForAdmin).toHaveBeenCalledWith({
      search: "ada",
      role: "Admin",
      includeDeleted: true,
      page: 2,
      limit: 5,
    })
    expect(res.json).toHaveBeenCalledWith(serviceResult)
  })

  it("passes the authenticated admin id to delete user service", async () => {
    const result = { message: "User deleted successfully" }
    const res = createResponse()
    const next = jest.fn()
    mockedDeleteUserAsAdmin.mockResolvedValue(result as never)

    await runController(
      deleteUserByAdminController,
      {
        user: { userId: "admin-1" },
        params: { userId: "user-1" },
        body: { reason: "policy violation" },
      },
      res,
      next
    )

    expect(mockedDeleteUserAsAdmin).toHaveBeenCalledWith(
      "admin-1",
      "user-1",
      "policy violation"
    )
    expect(res.json).toHaveBeenCalledWith(result)
  })

  it("validates moderation params and forwards validation errors", async () => {
    const res = createResponse()
    const next = jest.fn()

    await runController(
      moderateContentController,
      {
        user: { userId: "admin-1" },
        params: { targetType: ReportTargetType.SKILL, targetId: "not-a-uuid" },
        body: { action: "REMOVE", reason: "spam listing" },
      },
      res,
      next
    )

    expect(mockedModerateContentAsAdmin).not.toHaveBeenCalled()
    expect(res.json).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalledWith(expect.any(Error))
  })

  it("moderates content with parsed route params", async () => {
    const result = { message: "Content removed successfully", item: { id: "skill-1" } }
    const res = createResponse()
    const next = jest.fn()
    const targetId = "11111111-1111-4111-8111-111111111111"
    mockedModerateContentAsAdmin.mockResolvedValue(result as never)

    await runController(
      moderateContentController,
      {
        user: { userId: "admin-1" },
        params: { targetType: ReportTargetType.SKILL, targetId },
        body: { action: "REMOVE", reason: "spam listing" },
      },
      res,
      next
    )

    expect(mockedModerateContentAsAdmin).toHaveBeenCalledWith(
      "admin-1",
      ReportTargetType.SKILL,
      targetId,
      { action: "REMOVE", reason: "spam listing" }
    )
    expect(res.json).toHaveBeenCalledWith(result)
  })
})
