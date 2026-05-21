"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compensateBookingNoShow = exports.releaseHeldBookingCredits = exports.refundBookingCredits = exports.holdBookingCredits = exports.debitWallet = exports.creditWallet = exports.ensureUserHasCredits = exports.getWalletTransactions = exports.getWalletSummary = void 0;
const client_1 = require("@prisma/client");
const walletRepository_1 = require("../repositories/walletRepository");
const userRepository_1 = require("../repositories/userRepository");
const notificationService_1 = require("./notificationService");
const CustomError_1 = require("../utils/CustomError");
const ensurePositiveAmount = (amount) => {
    if (!Number.isInteger(amount) || amount <= 0) {
        throw new CustomError_1.CustomError("Amount must be a positive integer", 400);
    }
};
const getWalletSummary = async (userId) => {
    return (0, walletRepository_1.getOrCreateWalletByUserId)(userId);
};
exports.getWalletSummary = getWalletSummary;
const getWalletTransactions = async (userId) => {
    await (0, walletRepository_1.getOrCreateWalletByUserId)(userId);
    return (0, walletRepository_1.listWalletTransactions)(userId);
};
exports.getWalletTransactions = getWalletTransactions;
const ensureUserHasCredits = async (userId, amount) => {
    ensurePositiveAmount(amount);
    const balance = await (0, walletRepository_1.getWalletBalanceByUserId)(userId);
    if (balance < amount) {
        throw new CustomError_1.CustomError(`You need ${amount} credits to book this session, but your wallet balance is ${balance}.`, 400);
    }
    return { balance };
};
exports.ensureUserHasCredits = ensureUserHasCredits;
const creditWallet = async (userId, amount, description) => {
    ensurePositiveAmount(amount);
    const user = await (0, userRepository_1.findUserById)(userId);
    if (!user) {
        throw new CustomError_1.CustomError("User not found", 404);
    }
    const result = await (0, walletRepository_1.applyWalletTransaction)({
        userId,
        amount,
        type: client_1.TransactionType.CREDIT,
        description: description?.trim() || "Wallet credit",
    });
    await (0, notificationService_1.notifyUser)({
        userId,
        type: "WALLET_CREDIT",
        message: `${amount} credits added to your wallet.`,
    });
    return result;
};
exports.creditWallet = creditWallet;
const debitWallet = async (userId, amount, description) => {
    ensurePositiveAmount(amount);
    const user = await (0, userRepository_1.findUserById)(userId);
    if (!user) {
        throw new CustomError_1.CustomError("User not found", 404);
    }
    try {
        const result = await (0, walletRepository_1.applyWalletTransaction)({
            userId,
            amount,
            type: client_1.TransactionType.DEBIT,
            description: description?.trim() || "Wallet debit",
        });
        await (0, notificationService_1.notifyUser)({
            userId,
            type: "WALLET_DEBIT",
            message: `${amount} credits deducted from your wallet.`,
        });
        return result;
    }
    catch (error) {
        if (error?.message === "INSUFFICIENT_WALLET_BALANCE") {
            throw new CustomError_1.CustomError("Insufficient wallet balance", 400);
        }
        throw error;
    }
};
exports.debitWallet = debitWallet;
const debitBookingHold = async (params) => {
    ensurePositiveAmount(params.amount);
    const existingDebit = await (0, walletRepository_1.findWalletTransactionByBookingAndType)({
        userId: params.payerUserId,
        bookingId: params.bookingId,
        type: client_1.TransactionType.DEBIT,
        referenceType: params.referenceType,
    });
    if (existingDebit) {
        return {
            alreadyHeld: true,
        };
    }
    try {
        const result = await (0, walletRepository_1.applyWalletTransaction)({
            userId: params.payerUserId,
            amount: params.amount,
            type: client_1.TransactionType.DEBIT,
            description: params.description,
            referenceBookingId: params.bookingId,
            counterpartyUserId: params.counterpartyUserId,
            referenceType: params.referenceType,
        });
        await (0, notificationService_1.notifyUser)({
            userId: params.payerUserId,
            type: "WALLET_DEBIT",
            message: `${params.amount} credits have been held for your booking.`,
            relatedBookingId: params.bookingId,
        });
        return {
            alreadyHeld: false,
            ...result,
        };
    }
    catch (error) {
        if (error?.message === "INSUFFICIENT_WALLET_BALANCE") {
            throw new CustomError_1.CustomError("Insufficient wallet balance", 400);
        }
        throw error;
    }
};
const holdBookingCredits = async (params) => {
    const referenceType = params.role === "requester"
        ? client_1.WalletTransactionReferenceType.BOOKING_REQUESTER_HOLD
        : client_1.WalletTransactionReferenceType.BOOKING_PROVIDER_HOLD;
    return debitBookingHold({
        bookingId: params.bookingId,
        payerUserId: params.payerUserId,
        counterpartyUserId: params.counterpartyUserId,
        amount: params.amount,
        description: `Credits held for ${params.role} booking payment`,
        referenceType,
    });
};
exports.holdBookingCredits = holdBookingCredits;
const refundBookingCredits = async (params) => {
    ensurePositiveAmount(params.amount);
    const referenceType = params.role === "requester"
        ? client_1.WalletTransactionReferenceType.BOOKING_REQUESTER_REFUND
        : client_1.WalletTransactionReferenceType.BOOKING_PROVIDER_REFUND;
    const existingRefund = await (0, walletRepository_1.findWalletTransactionByBookingAndType)({
        userId: params.userId,
        bookingId: params.bookingId,
        type: client_1.TransactionType.CREDIT,
        referenceType,
    });
    if (existingRefund) {
        return {
            alreadyRefunded: true,
        };
    }
    const result = await (0, walletRepository_1.applyWalletTransaction)({
        userId: params.userId,
        amount: params.amount,
        type: client_1.TransactionType.CREDIT,
        description: params.reason,
        referenceBookingId: params.bookingId,
        counterpartyUserId: params.counterpartyUserId,
        referenceType,
    });
    await (0, notificationService_1.notifyUser)({
        userId: params.userId,
        type: "WALLET_CREDIT",
        message: `${params.amount} credits were refunded for your booking.`,
        relatedBookingId: params.bookingId,
    });
    return {
        alreadyRefunded: false,
        ...result,
    };
};
exports.refundBookingCredits = refundBookingCredits;
const releaseHeldBookingCredits = async (params) => {
    ensurePositiveAmount(params.amount);
    const existingCredit = await (0, walletRepository_1.findWalletTransactionByBookingAndType)({
        userId: params.recipientUserId,
        bookingId: params.bookingId,
        type: client_1.TransactionType.CREDIT,
        referenceType: params.role === "requester"
            ? client_1.WalletTransactionReferenceType.BOOKING_PROVIDER_PAYOUT
            : client_1.WalletTransactionReferenceType.BOOKING_REQUESTER_PAYOUT,
    });
    if (existingCredit) {
        return {
            alreadyReleased: true,
        };
    }
    const result = await (0, walletRepository_1.applyWalletTransaction)({
        userId: params.recipientUserId,
        amount: params.amount,
        type: client_1.TransactionType.CREDIT,
        description: `Booking payout released for ${params.skillTitle}`,
        referenceBookingId: params.bookingId,
        counterpartyUserId: params.payerUserId,
        referenceType: params.role === "requester"
            ? client_1.WalletTransactionReferenceType.BOOKING_PROVIDER_PAYOUT
            : client_1.WalletTransactionReferenceType.BOOKING_REQUESTER_PAYOUT,
    });
    await (0, notificationService_1.notifyUser)({
        userId: params.recipientUserId,
        type: "WALLET_CREDIT",
        message: `${params.amount} credits were released for your completed session.`,
        relatedBookingId: params.bookingId,
    });
    return {
        alreadyReleased: false,
        ...result,
    };
};
exports.releaseHeldBookingCredits = releaseHeldBookingCredits;
const compensateBookingNoShow = async (params) => {
    ensurePositiveAmount(params.amount);
    const existingCompensation = await (0, walletRepository_1.findWalletTransactionByBookingAndType)({
        userId: params.compensatedUserId,
        bookingId: params.bookingId,
        type: client_1.TransactionType.CREDIT,
        referenceType: client_1.WalletTransactionReferenceType.BOOKING_NO_SHOW_COMPENSATION,
    });
    if (existingCompensation) {
        return {
            alreadyCompensated: true,
        };
    }
    const result = await (0, walletRepository_1.applyWalletTransaction)({
        userId: params.compensatedUserId,
        amount: params.amount,
        type: client_1.TransactionType.CREDIT,
        description: params.description,
        referenceBookingId: params.bookingId,
        counterpartyUserId: params.noShowUserId,
        referenceType: client_1.WalletTransactionReferenceType.BOOKING_NO_SHOW_COMPENSATION,
    });
    await (0, notificationService_1.notifyUser)({
        userId: params.compensatedUserId,
        type: "WALLET_CREDIT",
        message: `${params.amount} credits were added as no-show compensation.`,
        relatedBookingId: params.bookingId,
    });
    return {
        alreadyCompensated: false,
        ...result,
    };
};
exports.compensateBookingNoShow = compensateBookingNoShow;
