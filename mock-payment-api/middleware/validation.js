const crypto = require('crypto');
const { pool } = require('../config/database');

// Validate API key and signature
async function validateApiAuth(req, res, next) {
    try {
        const apiKey = req.headers['x-api-key'];
        const signature = req.headers['x-api-signature'];
        const timestamp = req.headers['x-timestamp'];

        // Check if headers exist
        if (!apiKey || !signature || !timestamp) {
            return res.status(401).json({
                success: false,
                error: 'Missing authentication headers'
            });
        }

        // Check timestamp (not older than 5 minutes)
        const requestTime = new Date(timestamp);
        const currentTime = new Date();
        const timeDiff = Math.abs(currentTime - requestTime) / 1000; // in seconds

        if (timeDiff > 300) { // 5 minutes
            return res.status(401).json({
                success: false,
                error: 'Request timestamp expired'
            });
        }

        // Validate API key from database
        const [apiKeyRows] = await pool.query(
            'SELECT * FROM api_keys WHERE api_key = ? AND is_active = TRUE',
            [apiKey]
        );

        if (apiKeyRows.length === 0) {
            return res.status(401).json({
                success: false,
                error: 'Invalid API key'
            });
        }

        // Store vendor info in request
        req.vendor = apiKeyRows[0];

        // TODO: Implement RSA signature validation
        // For now, we'll skip signature validation in dummy system

        next();
    } catch (error) {
        console.error('Auth validation error:', error);
        res.status(500).json({
            success: false,
            error: 'Authentication validation failed'
        });
    }
}

// Validate checkout request parameters
function validateCheckoutParams(req, res, next) {
    const errors = [];
    const { reference, amount, paymentMethod, paymentType, successUrl, returnUrl } = req.body;

    // Reference validation
    if (!reference) {
        errors.push('reference is required');
    } else if (typeof reference !== 'string' || reference.length < 1) {
        errors.push('reference must be a non-empty string');
    }

    // Amount validation
    if (amount === undefined || amount === null) {
        errors.push('amount is required');
    } else if (isNaN(amount) || parseFloat(amount) <= 0) {
        errors.push('amount must be a positive number');
    }

    // Payment method validation
    if (!paymentMethod) {
        errors.push('paymentMethod is required');
    } else if (!['jazzcash', 'easypaisa', 'card'].includes(paymentMethod.toLowerCase())) {
        errors.push('paymentMethod must be either "jazzcash", "easypaisa", or "card"');
    }

    // Payment type validation
    if (!paymentType) {
        errors.push('paymentType is required');
    } else if (paymentType !== 'onetime') {
        errors.push('paymentType only supports "onetime"');
    }

    // URL validations
    if (!successUrl) {
        errors.push('successUrl is required');
    } else if (!isValidUrl(successUrl)) {
        errors.push('successUrl must be a valid URL');
    }

    if (!returnUrl) {
        errors.push('returnUrl is required');
    } else if (!isValidUrl(returnUrl)) {
        errors.push('returnUrl must be a valid URL');
    }

    // If there are errors, return them
    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            errors: errors
        });
    }

    // Normalize payment method to lowercase
    req.body.paymentMethod = paymentMethod.toLowerCase();

    next();
}

// Helper function to validate URL
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

// Simple validation for development/testing (without signature check)
async function simpleValidation(req, res, next) {
    try {
        const apiKey = req.headers['x-api-key'];
        
        if (!apiKey) {
            return res.status(401).json({
                success: false,
                error: 'Missing X-Api-Key header'
            });
        }

        // Validate API key from database
        const [apiKeyRows] = await pool.query(
            'SELECT * FROM api_keys WHERE api_key = ? AND is_active = TRUE',
            [apiKey]
        );

        if (apiKeyRows.length === 0) {
            // Fallback: accept test keys for backward compatibility
            if (apiKey.startsWith('test-')) {
                req.vendor = {
                    vendor_id: 'TEST_VENDOR_001',
                    api_key: apiKey,
                    merchant_id: null
                };
                return next();
            }
            
            return res.status(401).json({
                success: false,
                error: 'Invalid API key'
            });
        }

        // Store vendor info from database
        req.vendor = apiKeyRows[0];

        next();
    } catch (error) {
        console.error('Simple validation error:', error);
        res.status(500).json({
            success: false,
            error: 'Authentication validation failed'
        });
    }
}

module.exports = {
    validateApiAuth,
    validateCheckoutParams,
    simpleValidation
};
