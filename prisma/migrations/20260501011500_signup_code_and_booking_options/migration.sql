-- CreateEnum
CREATE TYPE "BookingType" AS ENUM (
    'LEARN',
    'SWAP'
);

-- AlterTable
ALTER TABLE "User"
ADD COLUMN "fullName" TEXT;

-- Backfill existing users before dropping old name columns.
UPDATE "User"
SET "fullName" = TRIM(CONCAT("firstName", ' ', COALESCE("lastName", '')));

-- AlterTable
ALTER TABLE "User"
RENAME COLUMN "verificationToken" TO "verificationCode";

-- AlterTable
ALTER TABLE "User"
RENAME COLUMN "verificationTokenExpires" TO "verificationCodeExpires";

-- AlterTable
ALTER TABLE "User"
ALTER COLUMN "username" DROP NOT NULL,
ALTER COLUMN "fullName" SET NOT NULL,
DROP COLUMN "firstName",
DROP COLUMN "lastName";

-- CreateTable
CREATE TABLE "PendingRegistration" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "verificationCode" TEXT NOT NULL,
    "verificationCodeExpires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PendingRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PendingRegistration_email_key" ON "PendingRegistration"("email");

-- AlterTable
ALTER TABLE "Booking"
ADD COLUMN "offeredSkillId" TEXT,
ADD COLUMN "type" "BookingType" NOT NULL DEFAULT 'LEARN';

-- CreateIndex
CREATE INDEX "Booking_offeredSkillId_idx" ON "Booking"("offeredSkillId");

-- CreateIndex
CREATE INDEX "Booking_type_idx" ON "Booking"("type");

-- AddForeignKey
ALTER TABLE "Booking"
ADD CONSTRAINT "Booking_offeredSkillId_fkey" FOREIGN KEY ("offeredSkillId") REFERENCES "Skill"("id") ON DELETE SET NULL ON UPDATE CASCADE;
