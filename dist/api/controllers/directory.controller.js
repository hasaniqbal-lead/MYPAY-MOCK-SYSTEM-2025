"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDirectory = getDirectory;
const database_1 = require("../../shared/database");
const utils_1 = require("../../shared/utils");
/**
 * Get directory (banks and wallets)
 */
async function getDirectory(req, res) {
    try {
        if (!req.merchant) {
            res.status(401).json((0, utils_1.formatErrorResponse)('Unauthorized', 'UNAUTHORIZED'));
            return;
        }
        const [banks, wallets] = await Promise.all([
            database_1.prisma.bankDirectory.findMany({
                where: { isActive: true },
                orderBy: { name: 'asc' },
            }),
            database_1.prisma.walletDirectory.findMany({
                where: { isActive: true },
                orderBy: { name: 'asc' },
            }),
        ]);
        const banksResponse = banks.map((bank) => ({
            code: bank.code,
            name: bank.name,
            isActive: bank.isActive,
        }));
        const walletsResponse = wallets.map((wallet) => ({
            code: wallet.code,
            name: wallet.name,
            isActive: wallet.isActive,
        }));
        res.json((0, utils_1.formatSuccessResponse)({
            banks: banksResponse,
            wallets: walletsResponse,
        }));
    }
    catch (error) {
        console.error('Get directory error:', error);
        res.status(500).json((0, utils_1.formatErrorResponse)('Failed to get directory', 'INTERNAL_ERROR'));
    }
}
//# sourceMappingURL=directory.controller.js.map