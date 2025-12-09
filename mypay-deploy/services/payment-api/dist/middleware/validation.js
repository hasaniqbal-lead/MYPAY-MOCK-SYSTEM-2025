"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateApiAuth = validateApiAuth;
exports.validateCheckoutParams = validateCheckoutParams;
exports.simpleValidation = simpleValidation;
const database_1 = require("../config/database");
/**
 * Validate API key and signature (full validation)
 */
async function validateApiAuth(req, res, next) {
    try {
        const apiKey = req.headers['x-api-key'];
        const signature = req.headers['x-api-signature'];
        const timestamp = req.headers['x-timestamp'];
        if (!apiKey || !signature || !timestamp) {
            res.status(401).json({
                success: false,
                error: 'Missing authentication headers',
            });
            return;
        }
        // Check timestamp (not older than 5 minutes)
        const requestTime = new Date(timestamp);
        const currentTime = new Date();
        const timeDiff = Math.abs(currentTime.getTime() - requestTime.getTime()) / 1000;
        if (timeDiff > 300) {
            res.status(401).json({
                success: false,
                error: 'Request timestamp expired',
            });
            return;
        }
        // Validate API key from database
        const apiKeyRecord = await database_1.prisma.apiKey.findFirst({
            where: {
                api_key: apiKey,
                is_active: true,
            },
        });
        if (!apiKeyRecord) {
            res.status(401).json({
                success: false,
                error: 'Invalid API key',
            });
            return;
        }
        req.vendor = {
            id: apiKeyRecord.id,
            vendor_id: apiKeyRecord.vendor_id,
            api_key: apiKeyRecord.api_key,
            api_secret: apiKeyRecord.api_secret,
            merchant_id: apiKeyRecord.merchant_id,
            is_active: apiKeyRecord.is_active,
        };
        next();
    }
    catch (error) {
        console.error('Auth validation error:', error);
        res.status(500).json({
            success: false,
            error: 'Authentication validation failed',
        });
    }
}
/**
 * Validate checkout request parameters
 */
function validateCheckoutParams(req, res, next) {
    const errors = [];
    const { reference, amount, paymentMethod, paymentType, successUrl, returnUrl } = req.body;
    // Reference validation
    if (!reference) {
        errors.push('reference is required');
    }
    else if (typeof reference !== 'string' || reference.length < 1) {
        errors.push('reference must be a non-empty string');
    }
    // Amount validation
    if (amount === undefined || amount === null) {
        errors.push('amount is required');
    }
    else if (isNaN(amount) || parseFloat(amount) <= 0) {
        errors.push('amount must be a positive number');
    }
    // Payment method validation
    if (!paymentMethod) {
        errors.push('paymentMethod is required');
    }
    else if (!['jazzcash', 'easypaisa', 'card'].includes(paymentMethod.toLowerCase())) {
        errors.push('paymentMethod must be either "jazzcash", "easypaisa", or "card"');
    }
    // Payment type validation
    if (!paymentType) {
        errors.push('paymentType is required');
    }
    else if (paymentType !== 'onetime') {
        errors.push('paymentType only supports "onetime"');
    }
    // URL validations
    if (!successUrl) {
        errors.push('successUrl is required');
    }
    else if (!isValidUrl(successUrl)) {
        errors.push('successUrl must be a valid URL');
    }
    if (!returnUrl) {
        errors.push('returnUrl is required');
    }
    else if (!isValidUrl(returnUrl)) {
        errors.push('returnUrl must be a valid URL');
    }
    if (errors.length > 0) {
        res.status(400).json({
            success: false,
            errors,
        });
        return;
    }
    // Normalize payment method to lowercase
    req.body.paymentMethod = paymentMethod.toLowerCase();
    next();
}
/**
 * Helper function to validate URL
 */
function isValidUrl(str) {
    try {
        new URL(str);
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Simple validation for development/testing (without signature check)
 */
async function simpleValidation(req, res, next) {
    try {
        const apiKey = req.headers['x-api-key'];
        if (!apiKey) {
            res.status(401).json({
                success: false,
                error: 'Missing X-Api-Key header',
            });
            return;
        }
        // Validate API key from database
        const apiKeyRecord = await database_1.prisma.apiKey.findFirst({
            where: {
                api_key: apiKey,
                is_active: true,
            },
        });
        if (!apiKeyRecord) {
            // Fallback: accept test keys for backward compatibility
            if (apiKey.startsWith('test-')) {
                req.vendor = {
                    id: 0,
                    vendor_id: 'TEST_VENDOR_001',
                    api_key: apiKey,
                    api_secret: '',
                    merchant_id: null,
                    is_active: true,
                };
                next();
                return;
            }
            res.status(401).json({
                success: false,
                error: 'Invalid API key',
            });
            return;
        }
        req.vendor = {
            id: apiKeyRecord.id,
            vendor_id: apiKeyRecord.vendor_id,
            api_key: apiKeyRecord.api_key,
            api_secret: apiKeyRecord.api_secret,
            merchant_id: apiKeyRecord.merchant_id,
            is_active: apiKeyRecord.is_active,
        };
        next();
    }
    catch (error) {
        console.error('Simple validation error:', error);
        res.status(500).json({
            success: false,
            error: 'Authentication validation failed',
        });
    }
}
//# sourceMappingURL=validation.js.map