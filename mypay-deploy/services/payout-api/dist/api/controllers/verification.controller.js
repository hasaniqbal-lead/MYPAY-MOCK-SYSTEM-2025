"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyAccount = verifyAccount;
const database_1 = require("../../shared/database");
const utils_1 = require("../../shared/utils");
/**
 * Verify account details
 */
async function verifyAccount(req, res) {
    try {
        if (!req.merchant) {
            res.status(401).json((0, utils_1.formatErrorResponse)('Unauthorized', 'UNAUTHORIZED'));
            return;
        }
        const body = req.body;
        // Validation
        if (!body.destType || !body.accountNumber) {
            res.status(400).json((0, utils_1.formatErrorResponse)('Missing required fields', 'VALIDATION_ERROR'));
            return;
        }
        if (!(0, utils_1.isValidAccountNumber)(body.accountNumber)) {
            res.status(400).json((0, utils_1.formatErrorResponse)('Invalid account number format', 'VALIDATION_ERROR'));
            return;
        }
        if (body.destType === 'BANK') {
            if (!body.bankCode || !(0, utils_1.isValidBankCode)(body.bankCode)) {
                res.status(400).json((0, utils_1.formatErrorResponse)('Invalid or missing bank code', 'VALIDATION_ERROR'));
                return;
            }
            // Check if bank exists in directory
            const bank = await database_1.prisma.bankDirectory.findUnique({
                where: { code: body.bankCode.toUpperCase() },
            });
            if (!bank || !bank.isActive) {
                res.status(400).json((0, utils_1.formatErrorResponse)('Bank not found or inactive', 'VALIDATION_ERROR'));
                return;
            }
        }
        if (body.destType === 'WALLET') {
            if (!body.walletCode || !(0, utils_1.isValidWalletCode)(body.walletCode)) {
                res.status(400).json((0, utils_1.formatErrorResponse)('Invalid or missing wallet code', 'VALIDATION_ERROR'));
                return;
            }
            // Check if wallet exists in directory
            const wallet = await database_1.prisma.walletDirectory.findUnique({
                where: { code: body.walletCode.toUpperCase() },
            });
            if (!wallet || !wallet.isActive) {
                res.status(400).json((0, utils_1.formatErrorResponse)('Wallet not found or inactive', 'VALIDATION_ERROR'));
                return;
            }
        }
        // Mock verification - use test scenarios
        const accountSuffix = body.accountNumber.slice(-4);
        let isValid = true;
        let accountTitle = 'Account Holder';
        let message = 'Account verified successfully';
        // Test scenarios
        if (accountSuffix === '0003' || accountSuffix === '0005') {
            isValid = false;
            message = accountSuffix === '0003'
                ? 'Account validation failed'
                : 'Account is blocked or restricted';
        }
        else {
            accountTitle = (0, utils_1.getAccountTitle)(body.accountNumber);
        }
        const response = {
            isValid,
            accountTitle: isValid ? accountTitle : undefined,
            message,
        };
        res.json((0, utils_1.formatSuccessResponse)(response));
    }
    catch (error) {
        console.error('Verify account error:', error);
        res.status(500).json((0, utils_1.formatErrorResponse)('Failed to verify account', 'INTERNAL_ERROR'));
    }
}
//# sourceMappingURL=verification.controller.js.map