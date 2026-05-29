import { jest, describe, it, expect, beforeEach } from "@jest/globals"
import {
  addSkill,
  discoverSkills,
  getSkillRecommendation,
  getUserSkillById,
  getUserSkills,
  removeUserSkill,
  updateUserSkill,
} from "../../src/services/skillService"
import {
  createSkill,
  deleteSkill,
  discoverSkillsController,
  getSkillById,
  getSkills,
  recommendSkill,
  updateSkill,
} from "../../src/controllers/skillsController"

jest.mock("../../src/services/skillService", () => ({
  addSkill: jest.fn(),
  discoverSkills: jest.fn(),
  getUserSkillById: jest.fn(),
  getSkillRecommendation: jest.fn(),
  getUserSkills: jest.fn(),
  removeUserSkill: jest.fn(),
  updateUserSkill: jest.fn(),
}))

const mockedAddSkill = addSkill as jest.MockedFunction<typeof addSkill>
const mockedDiscoverSkills = discoverSkills as jest.MockedFunction<typeof discoverSkills>
const mockedGetUserSkillById = getUserSkillById as jest.MockedFunction<typeof getUserSkillById>
const mockedGetSkillRecommendation = getSkillRecommendation as jest.MockedFunction<
  typeof getSkillRecommendation
>
const mockedGetUserSkills = getUserSkills as jest.MockedFunction<typeof getUserSkills>
const mockedRemoveUserSkill = removeUserSkill as jest.MockedFunction<typeof removeUserSkill>
const mockedUpdateUserSkill = updateUserSkill as jest.MockedFunction<typeof updateUserSkill>

const createResponse = () => ({
  status: jest.fn().mockReturnThis(),
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

describe("skillController", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("creates a skill with status 201", async () => {
    const body = {
      title: "React",
      description: "Learn practical React with hooks",
      category: "FRONTEND" as const,
      level: "INTERMEDIATE" as const,
      creditCost: 5,
    }
    const skill = { id: "skill-1", ...body }
    const res = createResponse()
    mockedAddSkill.mockResolvedValue(skill as never)

    await runController(createSkill, { user: { userId: "user-1" }, body }, res, jest.fn())

    expect(mockedAddSkill).toHaveBeenCalledWith("user-1", body)
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith(skill)
  })

  it("lists the authenticated user's skills", async () => {
    const skills = [{ id: "skill-1" }]
    const res = createResponse()
    mockedGetUserSkills.mockResolvedValue(skills as never)

    await runController(getSkills, { user: { userId: "user-1" } }, res, jest.fn())

    expect(mockedGetUserSkills).toHaveBeenCalledWith("user-1")
    expect(res.json).toHaveBeenCalledWith(skills)
  })

  it("parses discover query strings before calling the service", async () => {
    const result = { items: [], total: 0, page: 2, totalPages: 0 }
    const res = createResponse()
    mockedDiscoverSkills.mockResolvedValue(result as never)

    await runController(
      discoverSkillsController,
      {
        query: {
          search: "react",
          category: "FRONTEND",
          isBarter: "false",
          minCreditCost: "2",
          maxCreditCost: "10",
          page: "2",
          limit: "5",
        },
      },
      res,
      jest.fn()
    )

    expect(mockedDiscoverSkills).toHaveBeenCalledWith({
      search: "react",
      category: "FRONTEND",
      isBarter: false,
      minCreditCost: 2,
      maxCreditCost: 10,
      page: 2,
      limit: 5,
    })
    expect(res.json).toHaveBeenCalledWith(result)
  })

  it("forwards invalid discover query errors", async () => {
    const res = createResponse()
    const next = jest.fn()

    await runController(
      discoverSkillsController,
      { query: { minCreditCost: "20", maxCreditCost: "10" } },
      res,
      next
    )

    expect(mockedDiscoverSkills).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalledWith(expect.any(Error))
  })

  it("gets, updates, deletes, and recommends using authenticated user id", async () => {
    const res = createResponse()
    mockedGetUserSkillById.mockResolvedValue({ id: "skill-1" } as never)
    mockedUpdateUserSkill.mockResolvedValue({ id: "skill-1", title: "Node" } as never)
    mockedRemoveUserSkill.mockResolvedValue({ message: "Skill deleted successfully" } as never)
    mockedGetSkillRecommendation.mockResolvedValue({ recommendation: "TypeScript" } as never)

    await runController(
      getSkillById,
      { user: { userId: "user-1" }, params: { skillId: "skill-1" } },
      res,
      jest.fn()
    )
    await runController(
      updateSkill,
      { user: { userId: "user-1" }, params: { skillId: "skill-1" }, body: { title: "Node" } },
      res,
      jest.fn()
    )
    await runController(
      deleteSkill,
      { user: { userId: "user-1" }, params: { skillId: "skill-1" } },
      res,
      jest.fn()
    )
    await runController(recommendSkill, { user: { userId: "user-1" } }, res, jest.fn())

    expect(mockedGetUserSkillById).toHaveBeenCalledWith("user-1", "skill-1")
    expect(mockedUpdateUserSkill).toHaveBeenCalledWith("user-1", "skill-1", { title: "Node" })
    expect(mockedRemoveUserSkill).toHaveBeenCalledWith("user-1", "skill-1")
    expect(mockedGetSkillRecommendation).toHaveBeenCalledWith("user-1")
  })
})
