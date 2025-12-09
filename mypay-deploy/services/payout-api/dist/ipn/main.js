"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const database_1 = require("../shared/database");
const utils_1 = require("../shared/utils");
const app = (0, express_1.default)();
const PORT = process.env.IPN_PORT || 3001;
// Middleware
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
/**
 * IPN endpoint - receives callbacks from PSP
 * This is a mock endpoint for testing purposes
 */
app.post('/ipn/callback', async (req, res) => {
    try {
        const { payoutId, status, pspReference, failureReason } = req.body;
        if (!payoutId || !status) {
            res.status(400).json((0, utils_1.formatErrorResponse)('Missing required fields', 'VALIDATION_ERROR'));
            return;
        }
        // Find payout
        const payout = await database_1.prisma.payout.findUnique({
            where: { id: payoutId },
        });
        if (!payout) {
            res.status(404).json((0, utils_1.formatErrorResponse)('Payout not found', 'NOT_FOUND'));
            return;
        }
        // Update payout status
        const updatedPayout = await database_1.prisma.payout.update({
            where: { id: payoutId },
            data: {
                status,
                pspReference: pspReference || payout.pspReference,
                failureReason: failureReason || payout.failureReason,
                processedAt: status === 'SUCCESS' || status === 'FAILED' ? new Date() : payout.processedAt,
            },
        });
        // Create outbox event
        await database_1.prisma.outboxEvent.create({
            data: {
                merchantId: payout.merchantId,
                eventType: 'PAYOUT_UPDATED',
                payload: JSON.stringify({
                    payoutId: payout.id,
                    status,
                    pspReference,
                    failureReason,
                }),
            },
        });
        res.json((0, utils_1.formatSuccessResponse)({ payoutId: updatedPayout.id, status: updatedPayout.status }));
    }
    catch (error) {
        console.error('IPN callback error:', error);
        res.status(500).json((0, utils_1.formatErrorResponse)('Failed to process IPN callback', 'INTERNAL_ERROR'));
    }
});
// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
});
// Start server
app.listen(PORT, () => {
    console.log(`📡 IPN service running on port ${PORT}`);
    console.log(`📍 IPN endpoint: http://localhost:${PORT}/ipn/callback`);
});
//# sourceMappingURL=main.js.map