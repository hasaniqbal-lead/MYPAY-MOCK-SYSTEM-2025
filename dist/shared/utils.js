"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateWebhookSignature = generateWebhookSignature;
exports.verifyWebhookSignature = verifyWebhookSignature;
exports.generateApiKey = generateApiKey;
exports.hashApiKey = hashApiKey;
exports.formatAmount = formatAmount;
exports.getAccountSuffix = getAccountSuffix;
exports.determinePayoutStatus = determinePayoutStatus;
exports.getFailureReason = getFailureReason;
exports.sleep = sleep;
exports.generatePspReference = generatePspReference;
exports.isValidBankCode = isValidBankCode;
exports.isValidWalletCode = isValidWalletCode;
exports.isValidAccountNumber = isValidAccountNumber;
exports.getAccountTitle = getAccountTitle;
exports.createWebhookPayload = createWebhookPayload;
exports.calculateAvailableBalance = calculateAvailableBalance;
exports.isValidCurrency = isValidCurrency;
exports.hashIdempotencyKey = hashIdempotencyKey;
exports.isIdempotencyKeyExpired = isIdempotencyKeyExpired;
exports.formatErrorResponse = formatErrorResponse;
exports.formatSuccessResponse = formatSuccessResponse;
exports.isValidEmail = isValidEmail;
exports.sanitizeString = sanitizeString;
exports.generateMerchantReference = generateMerchantReference;
const crypto_1 = __importDefault(require("crypto"));
/**
 * Generate HMAC signature for webhook payload
 */
function generateWebhookSignature(payload, secret) {
    return crypto_1.default
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');
}
/**
 * Verify HMAC signature
 */
function verifyWebhookSignature(payload, signature, secret) {
    const expectedSignature = generateWebhookSignature(payload, secret);
    return crypto_1.default.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}
/**
 * Generate API key
 */
function generateApiKey() {
    return `mypay_${crypto_1.default.randomBytes(32).toString('hex')}`;
}
/**
 * Hash API key for storage
 */
function hashApiKey(apiKey) {
    return crypto_1.default.createHash('sha256').update(apiKey).digest('hex');
}
/**
 * Format amount to 2 decimal places
 */
function formatAmount(amount) {
    return Number(amount).toFixed(2);
}
/**
 * Parse account number suffix for test scenarios
 */
function getAccountSuffix(accountNumber) {
    return accountNumber.slice(-4);
}
/**
 * Determine payout status based on test scenario
 */
function determinePayoutStatus(accountNumber, amount) {
    const suffix = getAccountSuffix(accountNumber);
    // Large amounts go to review
    if (amount >= 100000) {
        return { status: 'IN_REVIEW' };
    }
    // Test scenarios based on suffix
    switch (suffix) {
        case '0001':
            return { status: 'SUCCESS' };
        case '0002':
            return { status: 'RETRY', shouldRetry: true };
        case '0003':
            return { status: 'FAILED' };
        case '0004':
            return { status: 'PENDING' };
        case '0005':
            return { status: 'ON_HOLD' };
        default:
            return { status: 'SUCCESS' };
    }
}
/**
 * Generate failure reason based on status
 */
function getFailureReason(status) {
    switch (status) {
        case 'FAILED':
            return 'Account validation failed';
        case 'ON_HOLD':
            return 'Account is blocked or restricted';
        default:
            return null;
    }
}
/**
 * Sleep utility for delays
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
/**
 * Generate PSP reference
 */
function generatePspReference() {
    return `PSP${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}
/**
 * Validate bank code
 */
function isValidBankCode(code) {
    const validCodes = [
        'HBL', 'UBL', 'MCB', 'ABL', 'JSBL', 'BAHL', 'MEEZAN', 'ASKARI',
        'BANKALHABIB', 'SONERI', 'FBL', 'BOP', 'NBP', 'SBP'
    ];
    return validCodes.includes(code.toUpperCase());
}
/**
 * Validate wallet code
 */
function isValidWalletCode(code) {
    const validCodes = ['EASYPAISA', 'JAZZCASH', 'SADAPAY', 'NAYAPAY'];
    return validCodes.includes(code.toUpperCase());
}
/**
 * Validate account number format
 */
function isValidAccountNumber(accountNumber) {
    // Pakistani account numbers are typically 10-16 digits
    return /^\d{10,16}$/.test(accountNumber);
}
/**
 * Get account title for test scenarios
 */
function getAccountTitle(accountNumber) {
    const suffix = getAccountSuffix(accountNumber);
    const names = {
        '0001': 'Test User Success',
        '0002': 'Test User Retry',
        '0003': 'Test User Failed',
        '0004': 'Test User Pending',
        '0005': 'Test User Blocked',
    };
    return names[suffix] || 'Test User';
}
/**
 * Create webhook payload
 */
function createWebhookPayload(event, payout) {
    return JSON.stringify({
        event,
        payout: {
            id: payout.id,
            merchantId: payout.merchantId,
            merchantReference: payout.merchantReference,
            amount: payout.amount.toString(),
            currency: payout.currency,
            destType: payout.destType,
            bankCode: payout.bankCode,
            walletCode: payout.walletCode,
            accountNumber: payout.accountNumber,
            accountTitle: payout.accountTitle,
            status: payout.status,
            failureReason: payout.failureReason,
            pspReference: payout.pspReference,
            processedAt: payout.processedAt?.toISOString(),
            createdAt: payout.createdAt.toISOString(),
            updatedAt: payout.updatedAt.toISOString(),
        },
        timestamp: new Date().toISOString(),
    });
}
/**
 * Calculate available balance
 */
function calculateAvailableBalance(balance, lockedBalance) {
    const bal = typeof balance === 'string' ? parseFloat(balance) : balance;
    const locked = typeof lockedBalance === 'string' ? parseFloat(lockedBalance) : lockedBalance;
    return Math.max(0, bal - locked).toFixed(2);
}
/**
 * Validate currency
 */
function isValidCurrency(currency) {
    return currency === 'PKR';
}
/**
 * Generate idempotency key hash
 */
function hashIdempotencyKey(merchantId, key, body) {
    const content = `${merchantId}:${key}:${JSON.stringify(body)}`;
    return crypto_1.default.createHash('sha256').update(content).digest('hex');
}
/**
 * Check if idempotency key is expired
 */
function isIdempotencyKeyExpired(expiresAt) {
    return new Date() > expiresAt;
}
/**
 * Format error response
 */
function formatErrorResponse(message, code) {
    return {
        error: {
            message,
            code: code || 'INTERNAL_ERROR',
            timestamp: new Date().toISOString(),
        },
    };
}
/**
 * Format success response
 */
function formatSuccessResponse(data, message) {
    return {
        success: true,
        message,
        data,
    };
}
/**
 * Validate email format
 */
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
/**
 * Sanitize string input
 */
function sanitizeString(input) {
    return input.trim().replace(/[<>]/g, '');
}
/**
 * Generate merchant reference if not provided
 */
function generateMerchantReference() {
    return `REF${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
}
//# sourceMappingURL=utils.js.map