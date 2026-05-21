"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSkillRecommendation = exports.removeUserSkill = exports.updateUserSkill = exports.getUserSkillById = exports.discoverSkills = exports.getUserSkills = exports.addSkill = void 0;
const CustomError_1 = require("../utils/CustomError");
const skillsRepository_1 = require("../repositories/skillsRepository");
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
};
const skillCategoryMatchers = {
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
};
const getRandomItem = (items) => {
    return items[Math.floor(Math.random() * items.length)];
};
const detectCategory = (skillNames) => {
    const matches = new Map();
    for (const skillName of skillNames) {
        const normalizedSkill = skillName.toLowerCase();
        for (const [category, keywords] of Object.entries(skillCategoryMatchers)) {
            const matched = keywords.some((keyword) => normalizedSkill.includes(keyword));
            if (matched) {
                matches.set(category, (matches.get(category) ?? 0) + 1);
            }
        }
    }
    const sortedMatches = [...matches.entries()].sort((a, b) => b[1] - a[1]);
    return sortedMatches[0]?.[0];
};
const addSkill = async (userId, data) => {
    return await (0, skillsRepository_1.createSkill)({
        userId,
        ...data
    });
};
exports.addSkill = addSkill;
const getUserSkills = async (userId) => {
    return await (0, skillsRepository_1.getSkillsByUser)(userId);
};
exports.getUserSkills = getUserSkills;
const discoverSkills = async (filters) => {
    const safeLimit = Math.min(Math.max(filters.limit ?? 10, 1), 50);
    const safePage = Math.max(filters.page ?? 1, 1);
    const searchFilters = {
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
    };
    const result = await (0, skillsRepository_1.searchSkills)(searchFilters);
    return {
        ...result,
        page: safePage,
        totalPages: result.total === 0 ? 0 : Math.ceil(result.total / safeLimit),
    };
};
exports.discoverSkills = discoverSkills;
const getUserSkillById = async (userId, skillId) => {
    const skill = await (0, skillsRepository_1.findSkillByIdAndUser)(skillId, userId);
    if (!skill) {
        throw new CustomError_1.CustomError("Skill not found", 404);
    }
    return skill;
};
exports.getUserSkillById = getUserSkillById;
const updateUserSkill = async (userId, skillId, data) => {
    const skill = await (0, skillsRepository_1.findSkillByIdAndUser)(skillId, userId);
    if (!skill) {
        throw new CustomError_1.CustomError("Skill not found", 404);
    }
    const nextIsBarter = data.isBarter ?? skill.isBarter;
    const nextCreditCost = data.creditCost !== undefined ? data.creditCost : skill.creditCost;
    if (!nextIsBarter && (nextCreditCost === null || nextCreditCost === undefined)) {
        throw new CustomError_1.CustomError("Credit cost is required for non-barter skills", 400);
    }
    return await (0, skillsRepository_1.updateSkillById)(skillId, data);
};
exports.updateUserSkill = updateUserSkill;
const removeUserSkill = async (userId, skillId) => {
    const skill = await (0, skillsRepository_1.findSkillByIdAndUser)(skillId, userId);
    if (!skill) {
        throw new CustomError_1.CustomError("Skill not found", 404);
    }
    await (0, skillsRepository_1.deleteSkillById)(skillId);
    return { message: "Skill deleted successfully" };
};
exports.removeUserSkill = removeUserSkill;
const getSkillRecommendation = async (userId) => {
    const userSkills = await (0, skillsRepository_1.getSkillsByUser)(userId);
    const existingSkillNames = userSkills.map((skill) => skill.title);
    const normalizedExistingSkills = new Set(existingSkillNames.map((skillName) => skillName.trim().toLowerCase()));
    const skillKeywords = userSkills.flatMap((skill) => [
        skill.title,
        ...skill.tags,
        skill.category
    ]);
    const detectedCategory = detectCategory(skillKeywords);
    const recommendationPool = detectedCategory
        ? skillRecommendations[detectedCategory]
        : skillRecommendations.OTHER_TECH;
    const availableCategoryRecommendations = recommendationPool.filter((skill) => !normalizedExistingSkills.has(skill.toLowerCase()));
    const fallbackPool = Object.values(skillRecommendations)
        .flat()
        .filter((skill) => !normalizedExistingSkills.has(skill.toLowerCase()));
    const recommendationSource = availableCategoryRecommendations.length > 0
        ? availableCategoryRecommendations
        : fallbackPool.length > 0
            ? fallbackPool
            : recommendationPool;
    const recommendation = getRandomItem(recommendationSource);
    return {
        recommendation,
        basedOn: detectedCategory ? "your existing skill categories" : "random suggestion",
        detectedCategory: detectedCategory ?? null,
        currentSkillsCount: userSkills.length
    };
};
exports.getSkillRecommendation = getSkillRecommendation;
