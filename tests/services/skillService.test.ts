import { jest, describe, it, expect, beforeEach } from "@jest/globals"
import * as skillsRepository from "../../src/repositories/skillsRepository"
import {
  addSkill,
  deleteSavedSkillSearch,
  discoverSkills,
  favoriteSkill,
  getFavoriteSkills,
  getSavedSkillSearches,
  getSkillSearchHistory,
  getSkillRecommendation,
  getUserSkillById,
  removeUserSkill,
  saveSkillSearch,
  unfavoriteSkill,
  updateUserSkill,
} from "../../src/services/skillService"

jest.mock("../../src/repositories/skillsRepository", () => ({
  createSkill: jest.fn(),
  createSkillFavorite: jest.fn(),
  deleteSavedSkillSearchById: jest.fn(),
  deleteSkillById: jest.fn(),
  deleteSkillFavorite: jest.fn(),
  findPublicSkillById: jest.fn(),
  findSkillByIdAndUser: jest.fn(),
  getFavoriteSkillsByUser: jest.fn(),
  getSavedSkillSearchesByUser: jest.fn(),
  getSkillsByUser: jest.fn(),
  getSkillSearchHistoryByUser: jest.fn(),
  addSkillSearchHistory: jest.fn(),
  searchSkills: jest.fn(),
  updateSkillById: jest.fn(),
  upsertSavedSkillSearch: jest.fn(),
}))

const mockedSkillsRepository = skillsRepository as jest.Mocked<typeof skillsRepository>

describe("skillService", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("adds a skill with the authenticated user's id", async () => {
    const payload = {
      title: "TypeScript",
      description: "Learn practical TypeScript",
      category: "FRONTEND" as const,
      level: "INTERMEDIATE" as const,
      creditCost: 5,
    }
    const created = { id: "skill-1", ...payload, userId: "user-1" }
    mockedSkillsRepository.createSkill.mockResolvedValue(created as never)

    await expect(addSkill("user-1", payload)).resolves.toBe(created)
    expect(mockedSkillsRepository.createSkill).toHaveBeenCalledWith({
      userId: "user-1",
      ...payload,
    })
  })

  it("normalizes discovery pagination before searching", async () => {
    mockedSkillsRepository.searchSkills.mockResolvedValue({
      items: [{ id: "skill-1" }],
      total: 120,
      limit: 50,
      offset: 0,
    } as never)

    const result = await discoverSkills({ search: "react", page: -2, limit: 80 })

    expect(mockedSkillsRepository.searchSkills).toHaveBeenCalledWith(
      expect.objectContaining({
        search: "react",
        limit: 50,
        offset: 0,
      })
    )
    expect(result).toEqual({
      items: [{ id: "skill-1" }],
      total: 120,
      limit: 50,
      offset: 0,
      page: 1,
      totalPages: 3,
    })
  })

  it("records authenticated discovery searches", async () => {
    mockedSkillsRepository.searchSkills.mockResolvedValue({
      items: [],
      total: 0,
      limit: 10,
      offset: 0,
    } as never)
    mockedSkillsRepository.addSkillSearchHistory.mockResolvedValue({ id: "history-1" } as never)

    await discoverSkills({ search: "react", page: 1 }, "user-1")

    expect(mockedSkillsRepository.addSkillSearchHistory).toHaveBeenCalledWith("user-1", {
      search: "react",
      page: 1,
    })
  })

  it("favorites a public skill that is not owned by the user", async () => {
    const favorite = { id: "favorite-1", skillId: "skill-1" }
    mockedSkillsRepository.findPublicSkillById.mockResolvedValue({
      id: "skill-1",
      userId: "owner-1",
    } as never)
    mockedSkillsRepository.createSkillFavorite.mockResolvedValue(favorite as never)

    await expect(favoriteSkill("user-1", "skill-1")).resolves.toBe(favorite)
    expect(mockedSkillsRepository.createSkillFavorite).toHaveBeenCalledWith("user-1", "skill-1")
  })

  it("prevents users from favoriting their own skill", async () => {
    mockedSkillsRepository.findPublicSkillById.mockResolvedValue({
      id: "skill-1",
      userId: "user-1",
    } as never)

    await expect(favoriteSkill("user-1", "skill-1")).rejects.toMatchObject({
      message: "You cannot favorite your own skill",
      statusCode: 400,
    })
    expect(mockedSkillsRepository.createSkillFavorite).not.toHaveBeenCalled()
  })

  it("lists and removes favorites", async () => {
    mockedSkillsRepository.getFavoriteSkillsByUser.mockResolvedValue([
      { id: "favorite-1", createdAt: new Date("2026-01-01T00:00:00.000Z"), skill: { id: "skill-1" } },
    ] as never)
    mockedSkillsRepository.deleteSkillFavorite.mockResolvedValue({ count: 1 } as never)

    await expect(getFavoriteSkills("user-1")).resolves.toEqual([
      {
        id: "favorite-1",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        skill: { id: "skill-1" },
      },
    ])
    await expect(unfavoriteSkill("user-1", "skill-1")).resolves.toEqual({
      message: "Skill removed from favorites",
    })
  })

  it("manages saved searches and search history", async () => {
    mockedSkillsRepository.getSkillSearchHistoryByUser.mockResolvedValue([{ id: "history-1" }] as never)
    mockedSkillsRepository.upsertSavedSkillSearch.mockResolvedValue({ id: "saved-1" } as never)
    mockedSkillsRepository.getSavedSkillSearchesByUser.mockResolvedValue([{ id: "saved-1" }] as never)
    mockedSkillsRepository.deleteSavedSkillSearchById.mockResolvedValue({ count: 1 } as never)

    await expect(getSkillSearchHistory("user-1")).resolves.toEqual([{ id: "history-1" }])
    await expect(
      saveSkillSearch("user-1", { name: "React", query: { search: "react", limit: 5 } })
    ).resolves.toEqual({ id: "saved-1" })
    expect(mockedSkillsRepository.upsertSavedSkillSearch).toHaveBeenCalledWith({
      userId: "user-1",
      name: "React",
      query: { search: "react", limit: 5 },
    })
    await expect(getSavedSkillSearches("user-1")).resolves.toEqual([{ id: "saved-1" }])
    await expect(deleteSavedSkillSearch("user-1", "saved-1")).resolves.toEqual({
      message: "Saved search deleted successfully",
    })
  })

  it("throws when a user's skill cannot be found", async () => {
    mockedSkillsRepository.findSkillByIdAndUser.mockResolvedValue(null)

    await expect(getUserSkillById("user-1", "missing-skill")).rejects.toMatchObject({
      message: "Skill not found",
      statusCode: 404,
    })
  })

  it("requires a credit cost when updating a non-barter skill", async () => {
    mockedSkillsRepository.findSkillByIdAndUser.mockResolvedValue({
      id: "skill-1",
      isBarter: true,
      creditCost: null,
    } as never)

    await expect(
      updateUserSkill("user-1", "skill-1", { isBarter: false })
    ).rejects.toMatchObject({
      message: "Credit cost is required for non-barter skills",
      statusCode: 400,
    })
    expect(mockedSkillsRepository.updateSkillById).not.toHaveBeenCalled()
  })

  it("deletes an owned skill", async () => {
    mockedSkillsRepository.findSkillByIdAndUser.mockResolvedValue({ id: "skill-1" } as never)
    mockedSkillsRepository.deleteSkillById.mockResolvedValue({ id: "skill-1" } as never)

    await expect(removeUserSkill("user-1", "skill-1")).resolves.toEqual({
      message: "Skill deleted successfully",
    })
    expect(mockedSkillsRepository.deleteSkillById).toHaveBeenCalledWith("skill-1")
  })

  it("recommends a skill based on existing skill categories", async () => {
    jest.spyOn(Math, "random").mockReturnValueOnce(0)
    mockedSkillsRepository.getSkillsByUser.mockResolvedValue([
      { title: "React", tags: ["frontend"], category: "FRONTEND" },
    ] as never)

    await expect(getSkillRecommendation("user-1")).resolves.toEqual({
      recommendation: "TypeScript",
      basedOn: "your existing skill categories",
      detectedCategory: "FRONTEND",
      currentSkillsCount: 1,
    })
  })
})
