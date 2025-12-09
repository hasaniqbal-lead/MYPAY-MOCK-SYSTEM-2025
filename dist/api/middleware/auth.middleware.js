"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateApiKey = authenticateApiKey;
const database_1 = require("../../shared/database");
const utils_1 = require("../../shared/utils");
async function authenticateApiKey(req, res, next) {
    try {
        const apiKey = req.headers['x-api-key'];
        if (!apiKey) {
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
            res.status(401).json({
                error: {
                    message: 'Invalid API key',
                    code: 'INVALID_API_KEY',
                },
            });
            return;
        }
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
        res.status(500).json({
            error: {
                message: 'Authentication failed',
                code: 'AUTH_ERROR',
            },
        });
    }
}
//# sourceMappingURL=auth.middleware.js.map