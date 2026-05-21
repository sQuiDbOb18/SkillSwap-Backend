"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.debitWalletController = exports.creditWalletController = exports.getWalletTransactionsController = exports.getWalletController = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const walletService_1 = require("../services/walletService");
exports.getWalletController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const wallet = await (0, walletService_1.getWalletSummary)(req.user.userId);
    res.json(wallet);
});
exports.getWalletTransactionsController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const transactions = await (0, walletService_1.getWalletTransactions)(req.user.userId);
    res.json(transactions);
});
exports.creditWalletController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const result = await (0, walletService_1.creditWallet)(req.user.userId, req.body.amount, req.body.description);
    res.status(201).json(result);
});
exports.debitWalletController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const result = await (0, walletService_1.debitWallet)(req.user.userId, req.body.amount, req.body.description);
    res.status(201).json(result);
});
