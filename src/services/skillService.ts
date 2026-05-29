import { Prisma } from "@prisma/client";
import { CustomError } from "../utils/CustomError";
import {
    createSkill,
    createSkillFavorite,
    deleteSavedSkillSearchById,
    deleteSkillById,
    deleteSkillFavorite,
    findPublicSkillById,
    findSkillByIdAndUser,
    getFavoriteSkillsByUser,
    getSavedSkillSearchesByUser,
    getSkillsByUser,
    getSkillSearchHistoryByUser,
    addSkillSearchHistory,
    searchSkills,
    updateSkillById,
    upsertSavedSkillSearch
} from "../repositories/skillsRepository";
import {
    AvailabilityDay,
    SkillCategory,
    SkillPayload,
    SkillSearchFilters,
    SkillUpdatePayload
} from "../types/skill";

const skillRecommendations = {
    FRONTEND: ["TypeScript", "React", "Next.js", "Tailwind CSS", "Vue"],
    BACKEND: ["Node.js", "Express", "PostgreSQL", "GraphQL", "REST APIs"],
    FULLSTACK: ["TypeScript", "Next.js", "Prisma", "System Design", "Authentication"],
    MOBILE: ["React Native", "Flutter", "Android", "iOS", "Expo"],
    DEVOPS: ["Docker", "Kubernetes", "CI/CD", "Terraform", "Linux"],
    DATA_SCIENCE: ["Python", "Pandas", "NumPy", "SQL", "Data Visualization"],
    AI_ML: ["Machine Learning", "Deep Learning", "PyTorch", "TensorFlow", "LLM Apps"],
    UI_UX: ["Figma", "Design Systems", "Wireframing", "Prototyping", "User Research"],
    CYBERSECURITY: ["Network Security", "OWASP", "Penetration Testing", "IAM", "Threat Modeling"],
    CLOUD: ["AWS", "Azure", "Google Cloud", "Serverless", "Cloud Architecture"],
    QA: ["Test Automation", "Jest", "Cypress", "Playwright", "API Testing"],
    OTHER_TECH: ["Git", "Agile", "Technical Writing", "Debugging", "Problem Solving"]
} as const

const skillCategoryMatchers: Record<string, readonly string[]> = {
    FRONTEND: ["html", "css", "javascript", "typescript", "react", "vue", "angular", "next", "frontend"],
    BACKEND: ["node", "express", "api", "sql", "postgres", "mongodb", "prisma", "graphql", "backend", "server"],
    FULLSTACK: ["fullstack", "full stack", "end-to-end", "auth", "architecture"],
    MOBILE: ["react native", "flutter", "swift", "kotlin", "android", "ios", "mobile", "expo"],
    DEVOPS: ["docker", "kubernetes", "cicd", "ci/cd", "terraform", "linux", "devops", "deployment"],
    DATA_SCIENCE: ["data", "analysis", "analytics", "pandas", "numpy", "visualization", "statistics"],
    AI_ML: ["machine learning", "deep learning", "ai", "ml", "tensorflow", "pytorch", "llm"],
    UI_UX: ["figma", "design", "ui", "ux", "wireframe", "prototype", "usability"],
    CYBERSECURITY: ["security", "cyber", "owasp", "penetration", "iam", "vulnerability", "threat"],
    CLOUD: ["aws", "azure", "gcp", "cloud", "serverless", "lambda", "kubernetes"],
    QA: ["testing", "qa", "jest", "cypress", "playwright", "automation", "quality"]
}

const getRandomItem = <T>(items: readonly T[]) => {
    return items[Math.floor(Math.random() * items.length)]
}

const toSearchQueryJson = (query: Record<string, unknown>) => {
    return Object.fromEntries(
        Object.entries(query).filter(([, value]) => value !== undefined)
    ) as Prisma.JsonObject
}

const detectCategory = (skillNames: string[]) => {
    const matches = new Map<string, number>()

    for (const skillName of skillNames) {
        const normalizedSkill = skillName.toLowerCase()

        for (const [category, keywords] of Object.entries(skillCategoryMatchers)) {
            const matched = keywords.some((keyword) => normalizedSkill.includes(keyword))
            if (matched) {
                matches.set(category, (matches.get(category) ?? 0) + 1)
            }
        }
    }

    const sortedMatches = [...matches.entries()].sort((a, b) => b[1] - a[1])
    return sortedMatches[0]?.[0]
}

export const addSkill = async (userId: string, data: SkillPayload) => {
    return await createSkill({
        userId,
        ...data
    })
}

export const getUserSkills = async (userId: string) => {
    return await getSkillsByUser(userId)
}

export const discoverSkills = async (filters: {
    search?: string
    category?: SkillCategory
    minRating?: number
    availabilityDay?: AvailabilityDay
    level?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT"
    tag?: string
    isBarter?: boolean
    minCreditCost?: number
    maxCreditCost?: number
    sortBy?: "newest" | "rating" | "creditCostAsc" | "creditCostDesc"
    page?: number
    limit?: number
}, userId?: string) => {
    const safeLimit = Math.min(Math.max(filters.limit ?? 10, 1), 50)
    const safePage = Math.max(filters.page ?? 1, 1)
    const searchFilters: SkillSearchFilters = {
        search: filters.search,
        category: filters.category,
        minRating: filters.minRating,
        availabilityDay: filters.availabilityDay,
        level: filters.level,
        tag: filters.tag,
        isBarter: filters.isBarter,
        minCreditCost: filters.minCreditCost,
        maxCreditCost: filters.maxCreditCost,
        sortBy: filters.sortBy,
        limit: safeLimit,
        offset: (safePage - 1) * safeLimit,
    }

    if (userId && Object.keys(toSearchQueryJson(filters)).length > 0) {
        await addSkillSearchHistory(userId, toSearchQueryJson(filters))
    }

    const result = await searchSkills(searchFilters)

    return {
        ...result,
        page: safePage,
        totalPages: result.total === 0 ? 0 : Math.ceil(result.total / safeLimit),
    }
}

export const favoriteSkill = async (userId: string, skillId: string) => {
    const skill = await findPublicSkillById(skillId)

    if (!skill) {
        throw new CustomError("Skill not found", 404)
    }

    if (skill.userId === userId) {
        throw new CustomError("You cannot favorite your own skill", 400)
    }

    return createSkillFavorite(userId, skillId)
}

export const unfavoriteSkill = async (userId: string, skillId: string) => {
    await deleteSkillFavorite(userId, skillId)
    return { message: "Skill removed from favorites" }
}

export const getFavoriteSkills = async (userId: string) => {
    const favorites = await getFavoriteSkillsByUser(userId)
    return favorites.map((favorite) => ({
        id: favorite.id,
        createdAt: favorite.createdAt,
        skill: favorite.skill,
    }))
}

export const getSkillSearchHistory = async (userId: string) => {
    return getSkillSearchHistoryByUser(userId)
}

export const saveSkillSearch = async (
    userId: string,
    data: {
        name: string
        query: Record<string, unknown>
    }
) => {
    return upsertSavedSkillSearch({
        userId,
        name: data.name,
        query: toSearchQueryJson(data.query),
    })
}

export const getSavedSkillSearches = async (userId: string) => {
    return getSavedSkillSearchesByUser(userId)
}

export const deleteSavedSkillSearch = async (userId: string, savedSearchId: string) => {
    await deleteSavedSkillSearchById(userId, savedSearchId)
    return { message: "Saved search deleted successfully" }
}

export const getUserSkillById = async (userId: string, skillId: string) => {
    const skill = await findSkillByIdAndUser(skillId, userId)

    if (!skill) {
        throw new CustomError("Skill not found", 404)
    }

    return skill
}

export const updateUserSkill = async (
    userId: string,
    skillId: string,
    data: SkillUpdatePayload
) => {
    const skill = await findSkillByIdAndUser(skillId, userId)

    if (!skill) {
        throw new CustomError("Skill not found", 404)
    }

    const nextIsBarter = data.isBarter ?? skill.isBarter
    const nextCreditCost = data.creditCost !== undefined ? data.creditCost : skill.creditCost

    if (!nextIsBarter && (nextCreditCost === null || nextCreditCost === undefined)) {
        throw new CustomError("Credit cost is required for non-barter skills", 400)
    }

    return await updateSkillById(skillId, data)
}

export const removeUserSkill = async (userId: string, skillId: string) => {
    const skill = await findSkillByIdAndUser(skillId, userId)

    if (!skill) {
        throw new CustomError("Skill not found", 404)
    }

    await deleteSkillById(skillId)

    return { message: "Skill deleted successfully" }
}

export const getSkillRecommendation = async (userId: string) => {
    const userSkills = await getSkillsByUser(userId)
    const existingSkillNames = userSkills.map((skill: { title: string }) => skill.title)
    const normalizedExistingSkills = new Set(
        existingSkillNames.map((skillName: string) => skillName.trim().toLowerCase())
    )
    const skillKeywords = userSkills.flatMap((skill: { title: string; tags: string[]; category: string }) => [
        skill.title,
        ...skill.tags,
        skill.category
    ])

    const detectedCategory = detectCategory(skillKeywords)
    const recommendationPool = detectedCategory
        ? skillRecommendations[detectedCategory as keyof typeof skillRecommendations]
        : skillRecommendations.OTHER_TECH

    const availableCategoryRecommendations = recommendationPool.filter(
        (skill) => !normalizedExistingSkills.has(skill.toLowerCase())
    )

    const fallbackPool = Object.values(skillRecommendations)
        .flat()
        .filter((skill) => !normalizedExistingSkills.has(skill.toLowerCase()))

    const recommendationSource = availableCategoryRecommendations.length > 0
        ? availableCategoryRecommendations
        : fallbackPool.length > 0
            ? fallbackPool
            : recommendationPool

    const recommendation = getRandomItem(recommendationSource)

    return {
        recommendation,
        basedOn: detectedCategory ? "your existing skill categories" : "random suggestion",
        detectedCategory: detectedCategory ?? null,
        currentSkillsCount: userSkills.length
    }
}
