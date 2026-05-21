"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transferBookingCredits = exports.applyWalletTransaction = exports.getWalletBalanceByUserId = exports.findWalletTransactionByBookingAndType = exports.listWalletTransactions = exports.getWalletByUserId = exports.getOrCreateWalletByUserId = void 0;
const client_1 = require("@prisma/client");
const db_1 = __importDefault(require("../config/db"));
const prismaClient = db_1.default;
const walletInclude = {
    transactions: {
        orderBy: {
            createdAt: "desc",
        },
    },
};
const getOrCreateWalletByUserId = (userId) => {
    return prismaClient.wallet.upsert({
        where: { userId },
        update: {},
        create: { userId },
        include: walletInclude,
    });
};
exports.getOrCreateWalletByUserId = getOrCreateWalletByUserId;
const getWalletByUserId = (userId) => {
    return prismaClient.wallet.findUnique({
        where: { userId },
        include: walletInclude,
    });
};
exports.getWalletByUserId = getWalletByUserId;
const listWalletTransactions = async (userId) => {
    const wallet = await prismaClient.wallet.findUnique({
        where: { userId },
        select: { id: true },
    });
    if (!wallet) {
        return [];
    }
    return prismaClient.walletTransaction.findMany({
        where: { walletId: wallet.id },
        orderBy: { createdAt: "desc" },
    });
};
exports.listWalletTransactions = listWalletTransactions;
const findWalletTransactionByBookingAndType = (params) => {
    return prismaClient.walletTransaction.findFirst({
        where: {
            referenceBookingId: params.bookingId,
            type: params.type,
            ...(params.referenceType ? { referenceType: params.referenceType } : {}),
            wallet: {
                userId: params.userId,
            },
        },
    });
};
exports.findWalletTransactionByBookingAndType = findWalletTransactionByBookingAndType;
const getWalletBalanceByUserId = async (userId) => {
    const wallet = await prismaClient.wallet.findUnique({
        where: { userId },
        select: { balance: true },
    });
    return wallet?.balance ?? 0;
};
exports.getWalletBalanceByUserId = getWalletBalanceByUserId;
const applyWalletTransaction = async (params) => {
    return db_1.default.$transaction(async (tx) => {
        const transactionClient = tx;
        const wallet = await transactionClient.wallet.upsert({
            where: { userId: params.userId },
            update: {},
            create: { userId: params.userId },
        });
        const nextBalance = params.type === client_1.TransactionType.CREDIT
            ? wallet.balance + params.amount
            : wallet.balance - params.amount;
        if (nextBalance < 0) {
            throw new Error("INSUFFICIENT_WALLET_BALANCE");
        }
        const updatedWallet = await transactionClient.wallet.update({
            where: { id: wallet.id },
            data: {
                balance: nextBalance,
            },
        });
        const transaction = await transactionClient.walletTransaction.create({
            data: {
                walletId: wallet.id,
                amount: params.amount,
                type: params.type,
                status: params.status ?? client_1.TransactionStatus.COMPLETED,
                referenceType: params.referenceType,
                description: params.description,
                referenceBookingId: params.referenceBookingId,
                counterpartyUserId: params.counterpartyUserId,
                balanceAfter: updatedWallet.balance,
            },
        });
        return {
            wallet: updatedWallet,
            transaction,
        };
    });
};
exports.applyWalletTransaction = applyWalletTransaction;
const transferBookingCredits = async (params) => {
    return db_1.default.$transaction(async (tx) => {
        const transactionClient = tx;
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
        ]);
        const [existingDebit, existingCredit] = await Promise.all([
            transactionClient.walletTransaction.findFirst({
                where: {
                    walletId: fromWallet.id,
                    referenceBookingId: params.bookingId,
                    type: client_1.TransactionType.DEBIT,
                    referenceType: params.debitReferenceType,
                },
            }),
            transactionClient.walletTransaction.findFirst({
                where: {
                    walletId: toWallet.id,
                    referenceBookingId: params.bookingId,
                    type: client_1.TransactionType.CREDIT,
                    referenceType: params.creditReferenceType,
                },
            }),
        ]);
        if (existingDebit || existingCredit) {
            throw new Error("BOOKING_CREDITS_ALREADY_SETTLED");
        }
        if (fromWallet.balance < params.amount) {
            throw new Error("INSUFFICIENT_WALLET_BALANCE");
        }
        const updatedFromWallet = await transactionClient.wallet.update({
            where: { id: fromWallet.id },
            data: {
                balance: fromWallet.balance - params.amount,
            },
        });
        const updatedToWallet = await transactionClient.wallet.update({
            where: { id: toWallet.id },
            data: {
                balance: toWallet.balance + params.amount,
            },
        });
        const debitTransaction = await transactionClient.walletTransaction.create({
            data: {
                walletId: fromWallet.id,
                amount: params.amount,
                type: client_1.TransactionType.DEBIT,
                status: client_1.TransactionStatus.COMPLETED,
                referenceType: params.debitReferenceType,
                description: params.description,
                referenceBookingId: params.bookingId,
                counterpartyUserId: params.toUserId,
                balanceAfter: updatedFromWallet.balance,
            },
        });
        const creditTransaction = await transactionClient.walletTransaction.create({
            data: {
                walletId: toWallet.id,
                amount: params.amount,
                type: client_1.TransactionType.CREDIT,
                status: client_1.TransactionStatus.COMPLETED,
                referenceType: params.creditReferenceType,
                description: params.description,
                referenceBookingId: params.bookingId,
                counterpartyUserId: params.fromUserId,
                balanceAfter: updatedToWallet.balance,
            },
        });
        return {
            fromWallet: updatedFromWallet,
            toWallet: updatedToWallet,
            debitTransaction,
            creditTransaction,
        };
    });
};
exports.transferBookingCredits = transferBookingCredits;
