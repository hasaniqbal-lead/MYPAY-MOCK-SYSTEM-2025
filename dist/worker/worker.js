"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../shared/database");
const utils_1 = require("../shared/utils");
const WORKER_INTERVAL_MS = 5000; // 5 seconds
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'default-webhook-secret';
/**
 * Process pending payouts
 */
async function processPayouts() {
    try {
        // Get pending payouts
        const payouts = await database_1.prisma.payout.findMany({
            where: {
                status: 'PENDING',
            },
            take: 10, // Process 10 at a time
            orderBy: {
                createdAt: 'asc',
            },
        });
        for (const payout of payouts) {
            await processPayout(payout.id);
        }
    }
    catch (error) {
        console.error('Error processing payouts:', error);
    }
}
/**
 * Process a single payout
 */
async function processPayout(payoutId) {
    try {
        // Update status to PROCESSING
        const payout = await database_1.prisma.payout.update({
            where: { id: payoutId },
            data: { status: 'PROCESSING' },
        });
        // Simulate processing delay
        await (0, utils_1.sleep)(1000);
        // Determine status based on test scenarios
        const { status, shouldRetry } = (0, utils_1.determinePayoutStatus)(payout.accountNumber, parseFloat(payout.amount.toString()));
        const failureReason = (0, utils_1.getFailureReason)(status);
        const pspReference = status === 'SUCCESS' ? (0, utils_1.generatePspReference)() : null;
        // Update payout status
        const updatedPayout = await database_1.prisma.payout.update({
            where: { id: payoutId },
            data: {
                status,
                failureReason,
                pspReference,
                processedAt: status === 'SUCCESS' || status === 'FAILED' ? new Date() : null,
            },
        });
        // Update balance if successful or failed
        if (status === 'SUCCESS' || status === 'FAILED') {
            await database_1.prisma.$transaction(async (tx) => {
                const balance = await tx.merchantBalance.findUnique({
                    where: { merchantId: payout.merchantId },
                });
                if (!balance) {
                    throw new Error('Balance not found');
                }
                if (status === 'SUCCESS') {
                    // Deduct from balance and locked balance
                    await tx.merchantBalance.update({
                        where: { merchantId: payout.merchantId },
                        data: {
                            balance: {
                                decrement: payout.amount,
                            },
                            lockedBalance: {
                                decrement: payout.amount,
                            },
                            version: {
                                increment: 1,
                            },
                        },
                    });
                    // Create ledger entry
                    await tx.ledgerEntry.create({
                        data: {
                            merchantId: payout.merchantId,
                            payoutId: payout.id,
                            type: 'DEBIT',
                            amount: payout.amount,
                            balance: (parseFloat(balance.balance.toString()) - parseFloat(payout.amount.toString())).toString(),
                            description: `Payout processed: ${payout.merchantReference}`,
                            metadata: JSON.stringify({
                                payoutId: payout.id,
                                pspReference,
                            }),
                        },
                    });
                }
                else {
                    // Failed - release locked balance
                    await tx.merchantBalance.update({
                        where: { merchantId: payout.merchantId },
                        data: {
                            lockedBalance: {
                                decrement: payout.amount,
                            },
                            version: {
                                increment: 1,
                            },
                        },
                    });
                }
            });
        }
        // Create outbox event for webhook
        await database_1.prisma.outboxEvent.create({
            data: {
                merchantId: payout.merchantId,
                eventType: 'PAYOUT_UPDATED',
                payload: JSON.stringify({
                    payoutId: payout.id,
                    status,
                    failureReason,
                    pspReference,
                }),
            },
        });
        // Handle retry scenario
        if (shouldRetry && status === 'RETRY') {
            // Wait a bit then retry
            await (0, utils_1.sleep)(2000);
            await processPayout(payoutId);
        }
    }
    catch (error) {
        console.error(`Error processing payout ${payoutId}:`, error);
        // Mark as failed on error
        await database_1.prisma.payout.update({
            where: { id: payoutId },
            data: {
                status: 'FAILED',
                failureReason: 'Processing error',
            },
        });
    }
}
/**
 * Process outbox events and send webhooks
 */
async function processOutboxEvents() {
    try {
        const events = await database_1.prisma.outboxEvent.findMany({
            where: {
                processed: false,
            },
            take: 10,
            orderBy: {
                createdAt: 'asc',
            },
            include: {
                merchant: true,
            },
        });
        for (const event of events) {
            await processWebhook(event.id, event.merchantId, event.eventType, event.payload);
        }
    }
    catch (error) {
        console.error('Error processing outbox events:', error);
    }
}
/**
 * Send webhook to merchant
 */
async function processWebhook(eventId, merchantId, eventType, payload) {
    try {
        const merchant = await database_1.prisma.merchant.findUnique({
            where: { id: merchantId },
        });
        if (!merchant || !merchant.webhookUrl) {
            // Mark as processed if no webhook URL
            await database_1.prisma.outboxEvent.update({
                where: { id: eventId },
                data: { processed: true, processedAt: new Date() },
            });
            return;
        }
        // Get payout details for webhook payload
        const payloadData = JSON.parse(payload);
        const payout = await database_1.prisma.payout.findUnique({
            where: { id: payloadData.payoutId },
        });
        if (!payout) {
            await database_1.prisma.outboxEvent.update({
                where: { id: eventId },
                data: { processed: true, processedAt: new Date() },
            });
            return;
        }
        // Create webhook payload
        const webhookPayload = (0, utils_1.createWebhookPayload)(eventType, payout);
        const signature = (0, utils_1.generateWebhookSignature)(webhookPayload, WEBHOOK_SECRET);
        // Send webhook
        const axios = require('axios');
        const response = await axios.post(merchant.webhookUrl, JSON.parse(webhookPayload), {
            headers: {
                'Content-Type': 'application/json',
                'X-MyPay-Signature': signature,
                'X-MyPay-Event': eventType,
            },
            timeout: 10000,
        });
        // Mark event as processed
        await database_1.prisma.outboxEvent.update({
            where: { id: eventId },
            data: {
                processed: true,
                processedAt: new Date(),
            },
        });
        // Record webhook delivery
        await database_1.prisma.webhookDelivery.create({
            data: {
                merchantId,
                eventType,
                payload: webhookPayload,
                signature,
                status: 'SUCCESS',
                statusCode: response.status,
                attempts: 1,
                deliveredAt: new Date(),
            },
        });
    }
    catch (error) {
        console.error(`Error sending webhook for event ${eventId}:`, error);
        // Record failed delivery
        await database_1.prisma.webhookDelivery.create({
            data: {
                merchantId,
                eventType,
                payload,
                signature: '',
                status: 'FAILED',
                statusCode: error.response?.status || null,
                response: error.message,
                attempts: 1,
            },
        });
        // Don't mark as processed - will retry later
    }
}
/**
 * Main worker loop
 */
async function runWorker() {
    console.log('🔄 Worker service started');
    while (true) {
        try {
            await processPayouts();
            await processOutboxEvents();
        }
        catch (error) {
            console.error('Worker loop error:', error);
        }
        await (0, utils_1.sleep)(WORKER_INTERVAL_MS);
    }
}
// Start worker
runWorker().catch((error) => {
    console.error('Fatal worker error:', error);
    process.exit(1);
});
//# sourceMappingURL=worker.js.map