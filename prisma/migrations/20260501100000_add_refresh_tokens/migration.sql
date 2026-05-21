-- AlterTable
ALTER TABLE "User"
ADD COLUMN "refreshTokenHash" TEXT,
ADD COLUMN "refreshTokenExpires" TIMESTAMP(3);
