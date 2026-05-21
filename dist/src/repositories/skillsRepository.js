"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchSkills = exports.deleteSkillById = exports.updateSkillById = exports.findSkillByIdAndUser = exports.getSkillsByUser = exports.createSkill = void 0;
const client_1 = require("@prisma/client");
const db_1 = __importDefault(require("../config/db"));
const skill_1 = require("../types/skill");
const createSkill = (data) => {
    return db_1.default.skill.create({
        data: {
            ...data,
            tags: data.tags ?? [],
            availability: (0, skill_1.toAvailabilityJson)(data.availability),
            price: data.price ?? null,
            creditCost: data.creditCost ?? null,
            isBarter: data.isBarter ?? false,
        },
    });
};
exports.createSkill = createSkill;
const getSkillsByUser = (userId) => {
    return db_1.default.skill.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
    });
};
exports.getSkillsByUser = getSkillsByUser;
const findSkillByIdAndUser = (id, userId) => {
    return db_1.default.skill.findFirst({
        where: { id, userId },
    });
};
exports.findSkillByIdAndUser = findSkillByIdAndUser;
const updateSkillById = (id, data) => {
    const updateData = {
        ...data,
        ...(data.availability !== undefined
            ? { availability: (0, skill_1.toAvailabilityJson)(data.availability) }
            : {}),
    };
    return db_1.default.skill.update({
        where: { id },
        data: updateData,
    });
};
exports.updateSkillById = updateSkillById;
const deleteSkillById = (id) => {
    return db_1.default.skill.delete({
        where: { id },
    });
};
exports.deleteSkillById = deleteSkillById;
const searchSkills = async (filters) => {
    const limit = filters.limit ?? 10;
    const offset = filters.offset ?? 0;
    const searchTerm = filters.search?.trim() ? `%${filters.search.trim()}%` : null;
    const category = filters.category ?? null;
    const minRating = filters.minRating ?? null;
    const availabilityDay = filters.availabilityDay ?? null;
    const level = filters.level ?? null;
    const tag = filters.tag?.trim() ? `%${filters.tag.trim()}%` : null;
    const isBarter = filters.isBarter ?? null;
    const minCreditCost = filters.minCreditCost ?? null;
    const maxCreditCost = filters.maxCreditCost ?? null;
    const sortBy = filters.sortBy ?? "newest";
    const orderByClause = sortBy === "rating"
        ? client_1.Prisma.sql `COALESCE(AVG(r.rating), 0) DESC, s."createdAt" DESC`
        : sortBy === "creditCostAsc"
            ? client_1.Prisma.sql `COALESCE(s."creditCost", 2147483647) ASC, s."createdAt" DESC`
            : sortBy === "creditCostDesc"
                ? client_1.Prisma.sql `COALESCE(s."creditCost", 0) DESC, s."createdAt" DESC`
                : client_1.Prisma.sql `s."createdAt" DESC`;
    const rows = await db_1.default.$queryRaw `
    SELECT
      s.id,
      s.title,
      s.description,
      s.category,
      s.level,
      s.tags,
      s.availability,
      s.price,
      s."creditCost",
      s."isBarter",
      s."userId",
      s."createdAt",
      s."updatedAt",
      u.id AS "ownerId",
      u.username AS "ownerUsername",
      u."fullName" AS "ownerFullName",
      u."profileImage" AS "ownerProfileImage",
      AVG(r.rating)::float AS "averageRating",
      COUNT(r.id)::bigint AS "totalReviews"
    FROM "Skill" s
    INNER JOIN "User" u ON u.id = s."userId"
    LEFT JOIN "Review" r ON r."targetUserId" = u.id
    WHERE u."deletedAt" IS NULL
      AND s."moderationStatus" != 'REMOVED'
      AND (${searchTerm}::text IS NULL
        OR s.title ILIKE ${searchTerm}
        OR s.description ILIKE ${searchTerm}
        OR u."fullName" ILIKE ${searchTerm}
        OR COALESCE(u.username, '') ILIKE ${searchTerm}
        OR EXISTS (
          SELECT 1
          FROM unnest(s.tags) AS tag_item
          WHERE tag_item ILIKE ${searchTerm}
        ))
      AND (${category}::"SkillCategory" IS NULL OR s.category = ${category}::"SkillCategory")
      AND (${level}::text IS NULL OR s.level = ${level})
      AND (${tag}::text IS NULL OR EXISTS (
        SELECT 1
        FROM unnest(s.tags) AS tag_item
        WHERE tag_item ILIKE ${tag}
      ))
      AND (${isBarter}::boolean IS NULL OR s."isBarter" = ${isBarter})
      AND (${minCreditCost}::integer IS NULL OR COALESCE(s."creditCost", 0) >= ${minCreditCost})
      AND (${maxCreditCost}::integer IS NULL OR COALESCE(s."creditCost", 0) <= ${maxCreditCost})
      AND (${availabilityDay}::text IS NULL
        OR EXISTS (
          SELECT 1
          FROM jsonb_array_elements(COALESCE(s.availability, '[]'::jsonb)) AS slot
          WHERE slot ->> 'day' = ${availabilityDay}
        ))
    GROUP BY s.id, u.id
    HAVING (${minRating}::double precision IS NULL OR COALESCE(AVG(r.rating), 0) >= ${minRating})
    ORDER BY ${orderByClause}
    LIMIT ${limit}
    OFFSET ${offset};
  `;
    const totalRows = await db_1.default.$queryRaw `
    SELECT COUNT(*)::bigint AS count
    FROM (
      SELECT s.id
      FROM "Skill" s
      INNER JOIN "User" u ON u.id = s."userId"
      LEFT JOIN "Review" r ON r."targetUserId" = u.id
      WHERE u."deletedAt" IS NULL
        AND s."moderationStatus" != 'REMOVED'
        AND (${searchTerm}::text IS NULL
          OR s.title ILIKE ${searchTerm}
          OR s.description ILIKE ${searchTerm}
          OR u."fullName" ILIKE ${searchTerm}
          OR COALESCE(u.username, '') ILIKE ${searchTerm}
          OR EXISTS (
            SELECT 1
            FROM unnest(s.tags) AS tag_item
            WHERE tag_item ILIKE ${searchTerm}
          ))
        AND (${category}::"SkillCategory" IS NULL OR s.category = ${category}::"SkillCategory")
        AND (${level}::text IS NULL OR s.level = ${level})
        AND (${tag}::text IS NULL OR EXISTS (
          SELECT 1
          FROM unnest(s.tags) AS tag_item
          WHERE tag_item ILIKE ${tag}
        ))
        AND (${isBarter}::boolean IS NULL OR s."isBarter" = ${isBarter})
        AND (${minCreditCost}::integer IS NULL OR COALESCE(s."creditCost", 0) >= ${minCreditCost})
        AND (${maxCreditCost}::integer IS NULL OR COALESCE(s."creditCost", 0) <= ${maxCreditCost})
        AND (${availabilityDay}::text IS NULL
          OR EXISTS (
            SELECT 1
            FROM jsonb_array_elements(COALESCE(s.availability, '[]'::jsonb)) AS slot
            WHERE slot ->> 'day' = ${availabilityDay}
          ))
      GROUP BY s.id, u.id
      HAVING (${minRating}::double precision IS NULL OR COALESCE(AVG(r.rating), 0) >= ${minRating})
    ) AS filtered_skills;
  `;
    return {
        items: rows.map((row) => ({
            id: row.id,
            title: row.title,
            description: row.description,
            category: row.category,
            level: row.level,
            tags: row.tags,
            availability: row.availability,
            price: row.price,
            creditCost: row.creditCost,
            isBarter: row.isBarter,
            userId: row.userId,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            user: {
                id: row.ownerId,
                username: row.ownerUsername,
                fullName: row.ownerFullName,
                profileImage: row.ownerProfileImage,
            },
            averageRating: row.averageRating === null ? null : Number(row.averageRating.toFixed(2)),
            totalReviews: Number(row.totalReviews),
        })),
        total: Number(totalRows[0]?.count ?? 0),
        limit,
        offset,
    };
};
exports.searchSkills = searchSkills;
