"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBalance = getBalance;
exports.getBalanceHistory = getBalanceHistory;
const database_1 = require("../../shared/database");
const utils_1 = require("../../shared/utils");
/**
 * Get merchant balance
 */
async function getBalance(req, res) {
    try {
        if (!req.merchant) {
            res.status(401).json((0, utils_1.formatErrorResponse)('Unauthorized', 'UNAUTHORIZED'));
            return;
        }
        const merchantId = req.merchant.id;
        const balance = await database_1.prisma.merchantBalance.findUnique({
            where: { merchantId },
        });
        if (!balance) {
            res.status(404).json((0, utils_1.formatErrorResponse)('Balance not found', 'NOT_FOUND'));
            return;
        }
        const availableBalance = (0, utils_1.calculateAvailableBalance)(balance.balance.toString(), balance.lockedBalance.toString());
        const response = {
            balance: balance.balance.toString(),
            lockedBalance: balance.lockedBalance.toString(),
            availableBalance,
        };
        res.json((0, utils_1.formatSuccessResponse)(response));
    }
    catch (error) {
        console.error('Get balance error:', error);
        res.status(500).json((0, utils_1.formatErrorResponse)('Failed to get balance', 'INTERNAL_ERROR'));
    }
}
/**
 * Get balance history (ledger entries)
 */
async function getBalanceHistory(req, res) {
    try {
        if (!req.merchant) {
            res.status(401).json((0, utils_1.formatErrorResponse)('Unauthorized', 'UNAUTHORIZED'));
            return;
        }
        const merchantId = req.merchant.id;
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        const skip = (page - 1) * limit;
        const [entries, total] = await Promise.all([
            database_1.prisma.ledgerEntry.findMany({
                where: { merchantId },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            database_1.prisma.ledgerEntry.count({ where: { merchantId } }),
        ]);
        const response = entries.map((entry) => ({
            id: entry.id,
            type: entry.type,
            amount: entry.amount.toString(),
            balance: entry.balance.toString(),
            description: entry.description,
            metadata: entry.metadata || undefined,
            createdAt: entry.createdAt.toISOString(),
        }));
        res.json((0, utils_1.formatSuccessResponse)({
            entries: response,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        }));
    }
    catch (error) {
        console.error('Get balance history error:', error);
        res.status(500).json((0, utils_1.formatErrorResponse)('Failed to get balance history', 'INTERNAL_ERROR'));
    }
}
//# sourceMappingURL=balance.controller.js.map