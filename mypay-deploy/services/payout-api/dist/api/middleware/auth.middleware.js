"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateApiKey = authenticateApiKey;
const database_1 = require("../../shared/database");
const utils_1 = require("../../shared/utils");
const audit_logger_1 = require("./audit.logger");
async function authenticateApiKey(req, res, next) {
    try {
        const apiKey = req.headers['x-api-key'];
        const clientIp = (req.headers['x-forwarded-for'] || req.ip || 'unknown').split(',')[0].trim();
        if (!apiKey) {
            (0, audit_logger_1.logAuthAttempt)(false, undefined, 'MISSING_API_KEY', clientIp);
            res.status(401).json({
                error: {
                    message: 'API key is required',
                    code: 'MISSING_API_KEY',
                },
            });
            return;
        }
        // Hash the provided API key
        const hashedKey = (0, utils_1.hashApiKey)(apiKey);
        // Find merchant by API key
        const merchant = await database_1.prisma.merchant.findFirst({
            where: {
                apiKey: hashedKey,
                isActive: true,
            },
        });
        if (!merchant) {
            (0, audit_logger_1.logAuthAttempt)(false, apiKey, 'INVALID_API_KEY', clientIp);
            res.status(401).json({
                error: {
                    message: 'Invalid API key',
                    code: 'INVALID_API_KEY',
                },
            });
            return;
        }
        // Log successful authentication
        (0, audit_logger_1.logAuthAttempt)(true, apiKey, 'SUCCESS', clientIp);
        // Attach merchant to request
        req.merchant = {
            id: merchant.id,
            name: merchant.name,
            email: merchant.email,
            apiKey: merchant.apiKey,
            webhookUrl: merchant.webhookUrl || undefined,
        };
        next();
    }
    catch (error) {
        console.error('Authentication error:', error);
        (0, audit_logger_1.logAuthAttempt)(false, req.headers['x-api-key'], 'AUTH_ERROR', req.ip);
        res.status(500).json({
            error: {
                message: 'Authentication failed',
                code: 'AUTH_ERROR',
            },
        });
    }
}
//# sourceMappingURL=auth.middleware.js.map