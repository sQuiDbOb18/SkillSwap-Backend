-- AlterTable
ALTER TABLE "Message" ADD COLUMN "deliveredAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Message_receiverId_deliveredAt_idx" ON "Message"("receiverId", "deliveredAt");
