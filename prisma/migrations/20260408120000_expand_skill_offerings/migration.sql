-- CreateEnum
CREATE TYPE "SkillCategory" AS ENUM (
    'FRONTEND',
    'BACKEND',
    'FULLSTACK',
    'MOBILE',
    'DEVOPS',
    'DATA_SCIENCE',
    'AI_ML',
    'UI_UX',
    'CYBERSECURITY',
    'CLOUD',
    'QA',
    'OTHER_TECH'
);

-- AlterTable
ALTER TABLE "Skill"
ADD COLUMN "availability" JSONB,
ADD COLUMN "category" "SkillCategory" NOT NULL DEFAULT 'OTHER_TECH',
ADD COLUMN "description" TEXT NOT NULL DEFAULT '',
ADD COLUMN "isBarter" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "price" DOUBLE PRECISION,
ADD COLUMN "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "title" TEXT NOT NULL DEFAULT '',
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Backfill
UPDATE "Skill"
SET
    "title" = "name",
    "description" = COALESCE(NULLIF("name", ''), 'Skill offering'),
    "category" = 'OTHER_TECH',
    "tags" = ARRAY[]::TEXT[],
    "updatedAt" = CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Skill"
ALTER COLUMN "title" DROP DEFAULT,
ALTER COLUMN "description" DROP DEFAULT,
ALTER COLUMN "category" DROP DEFAULT,
ALTER COLUMN "tags" SET DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "Skill" DROP COLUMN "name";
