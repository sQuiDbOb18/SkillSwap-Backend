import { Prisma, TransactionStatus, TransactionType, WalletTransactionReferenceType } from "@prisma/client"
import prisma from "../config/db"

const prismaClient = prisma as any

const walletInclude = {
  transactions: {
    orderBy: {
      createdAt: "desc",
    },
  },
} satisfies Prisma.WalletInclude

export const getOrCreateWalletByUserId = (userId: string) => {
  return prismaClient.wallet.upsert({
    where: { userId },
    update: {},
    create: { userId },
    include: walletInclude,
  })
}

export const getWalletByUserId = (userId: string) => {
  return prismaClient.wallet.findUnique({
    where: { userId },
    include: walletInclude,
  })
}

export const listWalletTransactions = async (userId: string) => {
  const wallet = await prismaClient.wallet.findUnique({
    where: { userId },
    select: { id: true },
  })

  if (!wallet) {
    return []
  }

  return prismaClient.walletTransaction.findMany({
    where: { walletId: wallet.id },
    orderBy: { createdAt: "desc" },
  })
}

export const findWalletTransactionByBookingAndType = (params: {
  userId: string
  bookingId: string
  type: TransactionType
  referenceType?: WalletTransactionReferenceType
}) => {
  return prismaClient.walletTransaction.findFirst({
    where: {
      referenceBookingId: params.bookingId,
      type: params.type,
      ...(params.referenceType ? { referenceType: params.referenceType } : {}),
      wallet: {
        userId: params.userId,
      },
    },
  })
}

export const getWalletBalanceByUserId = async (userId: string) => {
  const wallet = await prismaClient.wallet.findUnique({
    where: { userId },
    select: { balance: true },
  })

  return wallet?.balance ?? 0
}

export const applyWalletTransaction = async (params: {
  userId: string
  amount: number
  type: TransactionType
  description?: string
  status?: TransactionStatus
  referenceBookingId?: string
  counterpartyUserId?: string
  referenceType?: WalletTransactionReferenceType
}) => {
  return prisma.$transaction(async (tx) => {
    const transactionClient = tx as any
    const wallet = await transactionClient.wallet.upsert({
      where: { userId: params.userId },
      update: {},
      create: { userId: params.userId },
    })

    const nextBalance =
      params.type === TransactionType.CREDIT
        ? wallet.balance + params.amount
        : wallet.balance - params.amount

    if (nextBalance < 0) {
      throw new Error("INSUFFICIENT_WALLET_BALANCE")
    }

    const updatedWallet = await transactionClient.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: nextBalance,
      },
    })

    const transaction = await transactionClient.walletTransaction.create({
      data: {
        walletId: wallet.id,
        amount: params.amount,
        type: params.type,
        status: params.status ?? TransactionStatus.COMPLETED,
        referenceType: params.referenceType,
        description: params.description,
        referenceBookingId: params.referenceBookingId,
        counterpartyUserId: params.counterpartyUserId,
        balanceAfter: updatedWallet.balance,
      },
    })

    return {
      wallet: updatedWallet,
      transaction,
    }
  })
}

export const transferBookingCredits = async (params: {
  fromUserId: string
  toUserId: string
  bookingId: string
  amount: number
  description: string
  debitReferenceType: WalletTransactionReferenceType
  creditReferenceType: WalletTransactionReferenceType
}) => {
  return prisma.$transaction(async (tx) => {
    const transactionClient = tx as any

    const [fromWallet, toWallet] = await Promise.all([
      transactionClient.wallet.upsert({
        where: { userId: params.fromUserId },
        update: {},
        create: { userId: params.fromUserId },
      }),
      transactionClient.wallet.upsert({
        where: { userId: params.toUserId },
        update: {},
        create: { userId: params.toUserId },
      }),
    ])

    const [existingDebit, existingCredit] = await Promise.all([
      transactionClient.walletTransaction.findFirst({
        where: {
          walletId: fromWallet.id,
          referenceBookingId: params.bookingId,
          type: TransactionType.DEBIT,
          referenceType: params.debitReferenceType,
        },
      }),
      transactionClient.walletTransaction.findFirst({
        where: {
          walletId: toWallet.id,
          referenceBookingId: params.bookingId,
          type: TransactionType.CREDIT,
          referenceType: params.creditReferenceType,
        },
      }),
    ])

    if (existingDebit || existingCredit) {
      throw new Error("BOOKING_CREDITS_ALREADY_SETTLED")
    }

    if (fromWallet.balance < params.amount) {
      throw new Error("INSUFFICIENT_WALLET_BALANCE")
    }

    const updatedFromWallet = await transactionClient.wallet.update({
      where: { id: fromWallet.id },
      data: {
        balance: fromWallet.balance - params.amount,
      },
    })

    const updatedToWallet = await transactionClient.wallet.update({
      where: { id: toWallet.id },
      data: {
        balance: toWallet.balance + params.amount,
      },
    })

    const debitTransaction = await transactionClient.walletTransaction.create({
      data: {
        walletId: fromWallet.id,
        amount: params.amount,
        type: TransactionType.DEBIT,
        status: TransactionStatus.COMPLETED,
        referenceType: params.debitReferenceType,
        description: params.description,
        referenceBookingId: params.bookingId,
        counterpartyUserId: params.toUserId,
        balanceAfter: updatedFromWallet.balance,
      },
    })

    const creditTransaction = await transactionClient.walletTransaction.create({
      data: {
        walletId: toWallet.id,
        amount: params.amount,
        type: TransactionType.CREDIT,
        status: TransactionStatus.COMPLETED,
        referenceType: params.creditReferenceType,
        description: params.description,
        referenceBookingId: params.bookingId,
        counterpartyUserId: params.fromUserId,
        balanceAfter: updatedToWallet.balance,
      },
    })

    return {
      fromWallet: updatedFromWallet,
      toWallet: updatedToWallet,
      debitTransaction,
      creditTransaction,
    }
  })
}
