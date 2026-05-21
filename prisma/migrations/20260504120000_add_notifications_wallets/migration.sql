CREATE TYPE "NotificationType" AS ENUM (
  'BOOKING_CREATED',
  'BOOKING_CONFIRMED',
  'BOOKING_REJECTED',
  'BOOKING_COMPLETED',
  'NEW_MESSAGE',
  'WALLET_CREDIT',
  'WALLET_DEBIT'
);

CREATE TYPE "TransactionType" AS ENUM (
  'CREDIT',
  'DEBIT'
);

CREATE TYPE "TransactionStatus" AS ENUM (
  'PENDING',
  'COMPLETED',
  'FAILED',
  'CANCELLED'
);

CREATE TABLE "Notification" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" "NotificationType" NOT NULL,
  "message" TEXT NOT NULL,
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  "relatedBookingId" TEXT,
  "relatedMessageId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Wallet" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "balance" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WalletTransaction" (
  "id" TEXT NOT NULL,
  "walletId" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "type" "TransactionType" NOT NULL,
  "status" "TransactionStatus" NOT NULL DEFAULT 'COMPLETED',
  "description" TEXT,
  "referenceBookingId" TEXT,
  "counterpartyUserId" TEXT,
  "balanceAfter" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WalletTransaction_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Skill"
ADD COLUMN "creditCost" INTEGER;

CREATE UNIQUE INDEX "Wallet_userId_key" ON "Wallet"("userId");
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");
CREATE INDEX "Notification_relatedBookingId_idx" ON "Notification"("relatedBookingId");
CREATE INDEX "Notification_relatedMessageId_idx" ON "Notification"("relatedMessageId");
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");
CREATE INDEX "WalletTransaction_walletId_idx" ON "WalletTransaction"("walletId");
CREATE INDEX "WalletTransaction_walletId_type_idx" ON "WalletTransaction"("walletId", "type");
CREATE INDEX "WalletTransaction_walletId_status_idx" ON "WalletTransaction"("walletId", "status");
CREATE INDEX "WalletTransaction_referenceBookingId_idx" ON "WalletTransaction"("referenceBookingId");
CREATE INDEX "WalletTransaction_createdAt_idx" ON "WalletTransaction"("createdAt");
CREATE UNIQUE INDEX "WalletTransaction_walletId_referenceBookingId_type_key" ON "WalletTransaction"("walletId", "referenceBookingId", "type");

ALTER TABLE "Notification"
ADD CONSTRAINT "Notification_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Wallet"
ADD CONSTRAINT "Wallet_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "WalletTransaction"
ADD CONSTRAINT "WalletTransaction_walletId_fkey"
FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
