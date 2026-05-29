-- CreateTable
CREATE TABLE "SkillFavorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SkillFavorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillSearchHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "query" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SkillSearchHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedSkillSearch" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "query" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedSkillSearch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimitEntry" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "resetAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimitEntry_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "SkillFavorite_userId_skillId_key" ON "SkillFavorite"("userId", "skillId");

-- CreateIndex
CREATE INDEX "SkillFavorite_userId_idx" ON "SkillFavorite"("userId");

-- CreateIndex
CREATE INDEX "SkillFavorite_skillId_idx" ON "SkillFavorite"("skillId");

-- CreateIndex
CREATE INDEX "SkillSearchHistory_userId_createdAt_idx" ON "SkillSearchHistory"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SavedSkillSearch_userId_name_key" ON "SavedSkillSearch"("userId", "name");

-- CreateIndex
CREATE INDEX "SavedSkillSearch_userId_idx" ON "SavedSkillSearch"("userId");

-- CreateIndex
CREATE INDEX "RateLimitEntry_resetAt_idx" ON "RateLimitEntry"("resetAt");

-- AddForeignKey
ALTER TABLE "SkillFavorite" ADD CONSTRAINT "SkillFavorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillFavorite" ADD CONSTRAINT "SkillFavorite_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillSearchHistory" ADD CONSTRAINT "SkillSearchHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedSkillSearch" ADD CONSTRAINT "SavedSkillSearch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
