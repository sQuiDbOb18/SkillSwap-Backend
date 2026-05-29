import { jest, describe, it, expect, beforeEach } from "@jest/globals"
import { ModerationActionType, ModerationStatus, ReportStatus, ReportTargetType } from "@prisma/client"
import * as adminRepository from "../../src/repositories/adminRepository"
import * as userRepository from "../../src/repositories/userRepository"
import {
  createReport,
  deleteUserAsAdmin,
  exportModerationAuditCsv,
  getAllUsersForAdmin,
  moderateContentAsAdmin,
  updateReportStatusAsAdmin,
} from "../../src/services/adminService"
import { CustomError } from "../../src/utils/CustomError"

jest.mock("../../src/repositories/adminRepository", () => ({
  createReportRecord: jest.fn(),
  findOpenReportByReporterAndTarget: jest.fn(),
  findReportById: jest.fn(),
  findReviewForModeration: jest.fn(),
  findSkillForModeration: jest.fn(),
  findUserForAdminById: jest.fn(),
  getAdminDashboardCounts: jest.fn(),
  getModerationQueue: jest.fn(),
  getReportsForAdmin: jest.fn(),
  getUsersForAdmin: jest.fn(),
  getModerationLogsForExport: jest.fn(),
  logModerationAction: jest.fn(),
  updateReportById: jest.fn(),
  updateReviewModeration: jest.fn(),
  updateSkillModeration: jest.fn(),
}))

jest.mock("../../src/repositories/userRepository", () => ({
  softDeleteUser: jest.fn(),
}))

const mockedAdminRepository = adminRepository as jest.Mocked<typeof adminRepository>
const mockedUserRepository = userRepository as jest.Mocked<typeof userRepository>

describe("adminService", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("getAllUsersForAdmin", () => {
    it("clamps pagination and returns pagination metadata", async () => {
      mockedAdminRepository.getUsersForAdmin.mockResolvedValue({
        items: [{ id: "user-1" }],
        total: 250,
      } as never)

      const result = await getAllUsersForAdmin({
        search: "ada",
        role: "Admin",
        includeDeleted: true,
        page: 0,
        limit: 150,
      })

      expect(mockedAdminRepository.getUsersForAdmin).toHaveBeenCalledWith({
        search: "ada",
        role: "Admin",
        includeDeleted: true,
        skip: 0,
        take: 100,
      })
      expect(result).toEqual({
        items: [{ id: "user-1" }],
        total: 250,
        page: 1,
        limit: 100,
        totalPages: 3,
      })
    })
  })

  describe("deleteUserAsAdmin", () => {
    it("blocks an admin from deleting their own account", async () => {
      await expect(deleteUserAsAdmin("admin-1", "admin-1", "cleanup")).rejects.toMatchObject({
        message: "Admins cannot delete their own account from this route",
        statusCode: 400,
      })

      expect(mockedAdminRepository.findUserForAdminById).not.toHaveBeenCalled()
      expect(mockedUserRepository.softDeleteUser).not.toHaveBeenCalled()
    })

    it("soft deletes a user and logs the moderation action", async () => {
      const deletedUser = { id: "user-1", deletedAt: new Date("2026-01-01T00:00:00.000Z") }
      mockedAdminRepository.findUserForAdminById.mockResolvedValue({
        id: "user-1",
        deletedAt: null,
      } as never)
      mockedUserRepository.softDeleteUser.mockResolvedValue(deletedUser as never)
      mockedAdminRepository.logModerationAction.mockResolvedValue({ id: "log-1" } as never)

      const result = await deleteUserAsAdmin("admin-1", "user-1", "policy violation")

      expect(mockedUserRepository.softDeleteUser).toHaveBeenCalledWith("user-1", "policy violation")
      expect(mockedAdminRepository.logModerationAction).toHaveBeenCalledWith({
        adminId: "admin-1",
        actionType: ModerationActionType.USER_DELETED,
        targetType: ReportTargetType.USER,
        targetId: "user-1",
        reason: "policy violation",
      })
      expect(result).toEqual({
        message: "User deleted successfully",
        user: deletedUser,
      })
    })
  })

  describe("createReport", () => {
    it("creates a skill report using the skill owner as the target user", async () => {
      const report = { id: "report-1", targetId: "skill-1" }
      mockedAdminRepository.findSkillForModeration.mockResolvedValue({
        id: "skill-1",
        userId: "owner-1",
      } as never)
      mockedAdminRepository.findOpenReportByReporterAndTarget.mockResolvedValue(null)
      mockedAdminRepository.createReportRecord.mockResolvedValue(report as never)

      const result = await createReport("reporter-1", {
        targetType: ReportTargetType.SKILL,
        targetId: "skill-1",
        reason: "spam",
        details: "Looks suspicious",
      })

      expect(mockedAdminRepository.createReportRecord).toHaveBeenCalledWith({
        reporterId: "reporter-1",
        targetType: ReportTargetType.SKILL,
        targetId: "skill-1",
        targetUserId: "owner-1",
        reason: "spam",
        details: "Looks suspicious",
      })
      expect(result).toBe(report)
    })

    it("rejects duplicate active reports", async () => {
      mockedAdminRepository.findUserForAdminById.mockResolvedValue({
        id: "user-2",
      } as never)
      mockedAdminRepository.findOpenReportByReporterAndTarget.mockResolvedValue({
        id: "existing-report",
      } as never)

      await expect(
        createReport("reporter-1", {
          targetType: ReportTargetType.USER,
          targetId: "user-2",
          reason: "abuse",
        })
      ).rejects.toBeInstanceOf(CustomError)

      expect(mockedAdminRepository.createReportRecord).not.toHaveBeenCalled()
    })
  })

  describe("updateReportStatusAsAdmin", () => {
    it("marks resolved reports with resolver metadata and logs the change", async () => {
      const report = {
        id: "report-1",
        targetType: ReportTargetType.REVIEW,
        targetId: "review-1",
      }
      const updatedReport = { ...report, status: ReportStatus.RESOLVED }
      mockedAdminRepository.findReportById.mockResolvedValue(report as never)
      mockedAdminRepository.updateReportById.mockResolvedValue(updatedReport as never)
      mockedAdminRepository.logModerationAction.mockResolvedValue({ id: "log-1" } as never)

      const result = await updateReportStatusAsAdmin("admin-1", "report-1", {
        status: ReportStatus.RESOLVED,
        adminNotes: "Handled",
      })

      expect(mockedAdminRepository.updateReportById).toHaveBeenCalledWith(
        "report-1",
        expect.objectContaining({
          status: ReportStatus.RESOLVED,
          adminNotes: "Handled",
          resolvedAt: expect.any(Date),
          resolvedById: "admin-1",
        })
      )
      expect(mockedAdminRepository.logModerationAction).toHaveBeenCalledWith({
        adminId: "admin-1",
        actionType: ModerationActionType.REPORT_STATUS_UPDATED,
        targetType: ReportTargetType.REVIEW,
        targetId: "review-1",
        reportId: "report-1",
        reason: "Handled",
      })
      expect(result).toBe(updatedReport)
    })
  })

  describe("moderateContentAsAdmin", () => {
    it("rejects user moderation through content moderation", async () => {
      await expect(
        moderateContentAsAdmin("admin-1", ReportTargetType.USER, "user-1", {
          action: "REMOVE",
          reason: "bad actor",
        })
      ).rejects.toMatchObject({
        message: "Use the user management routes for user actions",
        statusCode: 400,
      })
    })

    it("removes a skill, resolves the linked report, and logs the action", async () => {
      const moderatedSkill = {
        id: "skill-1",
        moderationStatus: ModerationStatus.REMOVED,
      }
      mockedAdminRepository.findSkillForModeration.mockResolvedValue({
        id: "skill-1",
        userId: "user-1",
      } as never)
      mockedAdminRepository.updateSkillModeration.mockResolvedValue(moderatedSkill as never)
      mockedAdminRepository.findReportById.mockResolvedValue({
        id: "report-1",
      } as never)
      mockedAdminRepository.updateReportById.mockResolvedValue({ id: "report-1" } as never)
      mockedAdminRepository.logModerationAction.mockResolvedValue({ id: "log-1" } as never)

      const result = await moderateContentAsAdmin("admin-1", ReportTargetType.SKILL, "skill-1", {
        action: "REMOVE",
        reason: "spam listing",
        reportId: "report-1",
      })

      expect(mockedAdminRepository.updateSkillModeration).toHaveBeenCalledWith(
        "skill-1",
        expect.objectContaining({
          moderationStatus: ModerationStatus.REMOVED,
          moderationReason: "spam listing",
          moderatedAt: expect.any(Date),
        })
      )
      expect(mockedAdminRepository.updateReportById).toHaveBeenCalledWith(
        "report-1",
        expect.objectContaining({
          status: ReportStatus.RESOLVED,
          adminNotes: "spam listing",
          resolvedAt: expect.any(Date),
          resolvedById: "admin-1",
        })
      )
      expect(mockedAdminRepository.logModerationAction).toHaveBeenCalledWith({
        adminId: "admin-1",
        actionType: ModerationActionType.CONTENT_REMOVED,
        targetType: ReportTargetType.SKILL,
        targetId: "skill-1",
        reportId: "report-1",
        reason: "spam listing",
      })
      expect(result).toEqual({
        message: "Content removed successfully",
        item: moderatedSkill,
      })
    })
  })

  describe("exportModerationAuditCsv", () => {
    it("exports moderation logs as escaped CSV", async () => {
      mockedAdminRepository.getModerationLogsForExport.mockResolvedValue([
        {
          createdAt: new Date("2026-05-28T12:00:00.000Z"),
          adminId: "admin-1",
          admin: {
            email: "admin@example.com",
            fullName: "Ada Admin",
          },
          actionType: ModerationActionType.CONTENT_REMOVED,
          targetType: ReportTargetType.SKILL,
          targetId: "skill-1",
          reportId: "report-1",
          reason: "spam, misleading",
        },
      ] as never)

      const csv = await exportModerationAuditCsv({ limit: 10 })

      expect(mockedAdminRepository.getModerationLogsForExport).toHaveBeenCalledWith({
        from: undefined,
        to: undefined,
        take: 10,
      })
      expect(csv).toContain("createdAt,adminId,adminEmail,adminName,actionType,targetType,targetId,reportId,reason")
      expect(csv).toContain('2026-05-28T12:00:00.000Z,admin-1,admin@example.com,Ada Admin,CONTENT_REMOVED,SKILL,skill-1,report-1,"spam, misleading"')
    })
  })
})
