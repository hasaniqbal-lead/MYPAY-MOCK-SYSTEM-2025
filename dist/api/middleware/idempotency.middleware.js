"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.idempotencyMiddleware = idempotencyMiddleware;
const database_1 = require("../../shared/database");
const utils_1 = require("../../shared/utils");
const IDEMPOTENCY_KEY_TTL_HOURS = 24;
async function idempotencyMiddleware(req, res, next) {
    // Only apply to POST, PUT, PATCH requests
    if (!['POST', 'PUT', 'PATCH'].includes(req.method)) {
        next();
        return;
    }
    try {
        const idempotencyKey = req.headers['x-idempotency-key'];
        if (!idempotencyKey) {
            res.status(400).json({
                error: {
                    message: 'X-Idempotency-Key header is required',
                    code: 'MISSING_IDEMPOTENCY_KEY',
                },
            });
            return;
        }
        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(idempotencyKey)) {
            res.status(400).json({
                error: {
                    message: 'X-Idempotency-Key must be a valid UUID',
                    code: 'INVALID_IDEMPOTENCY_KEY',
                },
            });
            return;
        }
        if (!req.merchant) {
            res.status(401).json({
                error: {
                    message: 'Authentication required',
                    code: 'UNAUTHORIZED',
                },
            });
            return;
        }
        const merchantId = req.merchant.id;
        const requestHash = (0, utils_1.hashIdempotencyKey)(merchantId, idempotencyKey, req.body);
        // Check if key exists
        const existingKey = await database_1.prisma.idempotencyKey.findUnique({
            where: {
                merchantId_key: {
                    merchantId,
                    key: idempotencyKey,
                },
            },
        });
        if (existingKey) {
            // Check if expired
            if ((0, utils_1.isIdempotencyKeyExpired)(existingKey.expiresAt)) {
                // Delete expired key
                await database_1.prisma.idempotencyKey.delete({
                    where: { id: existingKey.id },
                });
            }
            else {
                // Check if request hash matches
                if (existingKey.requestHash === requestHash && existingKey.response) {
                    // Return cached response
                    const cachedResponse = JSON.parse(existingKey.response);
                    res.status(cachedResponse.statusCode || 200).json(cachedResponse.body);
                    return;
                }
                else {
                    // Different request with same key
                    res.status(409).json({
                        error: {
                            message: 'Idempotency key already used with different request',
                            code: 'IDEMPOTENCY_KEY_CONFLICT',
                        },
                    });
                    return;
                }
            }
        }
        // Store idempotency key
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + IDEMPOTENCY_KEY_TTL_HOURS);
        await database_1.prisma.idempotencyKey.create({
            data: {
                merchantId,
                key: idempotencyKey,
                requestHash,
                expiresAt,
            },
        });
        // Store original json method to capture response
        const originalJson = res.json.bind(res);
        res.json = function (body) {
            // Store response in idempotency key
            database_1.prisma.idempotencyKey
                .update({
                where: {
                    merchantId_key: {
                        merchantId,
                        key: idempotencyKey,
                    },
                },
                data: {
                    response: JSON.stringify({
                        statusCode: res.statusCode,
                        body,
                    }),
                },
            })
                .catch(console.error);
            return originalJson(body);
        };
        next();
    }
    catch (error) {
        console.error('Idempotency middleware error:', error);
        res.status(500).json({
            error: {
                message: 'Idempotency check failed',
                code: 'IDEMPOTENCY_ERROR',
            },
        });
    }
}
//# sourceMappingURL=idempotency.middleware.js.map