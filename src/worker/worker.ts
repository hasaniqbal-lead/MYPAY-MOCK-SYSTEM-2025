import { prisma } from '../shared/database';
import {
  determinePayoutStatus,
  getFailureReason,
  generatePspReference,
  sleep,
  createWebhookPayload,
  generateWebhookSignature,
} from '../shared/utils';

const WORKER_INTERVAL_MS = 5000; // 5 seconds
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'default-webhook-secret';

/**
 * Process pending payouts
 */
async function processPayouts(): Promise<void> {
  try {
    // Get pending payouts
    const payouts = await prisma.payout.findMany({
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
  } catch (error) {
    console.error('Error processing payouts:', error);
  }
}

/**
 * Process a single payout
 */
async function processPayout(payoutId: string): Promise<void> {
  try {
    // Update status to PROCESSING
    const payout = await prisma.payout.update({
      where: { id: payoutId },
      data: { status: 'PROCESSING' },
    });

    // Simulate processing delay
    await sleep(1000);

    // Determine status based on test scenarios
    const { status, shouldRetry } = determinePayoutStatus(
      payout.accountNumber,
      parseFloat(payout.amount.toString())
    );

    const failureReason = getFailureReason(status);
    const pspReference = status === 'SUCCESS' ? generatePspReference() : null;

    // Update payout status
    const updatedPayout = await prisma.payout.update({
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
      await prisma.$transaction(async (tx) => {
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
        } else {
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
    await prisma.outboxEvent.create({
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
      await sleep(2000);
      await processPayout(payoutId);
    }
  } catch (error) {
    console.error(`Error processing payout ${payoutId}:`, error);
    // Mark as failed on error
    await prisma.payout.update({
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
async function processOutboxEvents(): Promise<void> {
  try {
    const events = await prisma.outboxEvent.findMany({
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
  } catch (error) {
    console.error('Error processing outbox events:', error);
  }
}

/**
 * Send webhook to merchant
 */
async function processWebhook(
  eventId: string,
  merchantId: string,
  eventType: string,
  payload: string
): Promise<void> {
  try {
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
    });

    if (!merchant || !merchant.webhookUrl) {
      // Mark as processed if no webhook URL
      await prisma.outboxEvent.update({
        where: { id: eventId },
        data: { processed: true, processedAt: new Date() },
      });
      return;
    }

    // Get payout details for webhook payload
    const payloadData = JSON.parse(payload);
    const payout = await prisma.payout.findUnique({
      where: { id: payloadData.payoutId },
    });

    if (!payout) {
      await prisma.outboxEvent.update({
        where: { id: eventId },
        data: { processed: true, processedAt: new Date() },
      });
      return;
    }

    // Create webhook payload
    const webhookPayload = createWebhookPayload(eventType, payout);
    const signature = generateWebhookSignature(webhookPayload, WEBHOOK_SECRET);

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
    await prisma.outboxEvent.update({
      where: { id: eventId },
      data: {
        processed: true,
        processedAt: new Date(),
      },
    });

    // Record webhook delivery
    await prisma.webhookDelivery.create({
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
  } catch (error: any) {
    console.error(`Error sending webhook for event ${eventId}:`, error);

    // Record failed delivery
    await prisma.webhookDelivery.create({
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
async function runWorker(): Promise<void> {
  console.log('🔄 Worker service started');

  while (true) {
    try {
      await processPayouts();
      await processOutboxEvents();
    } catch (error) {
      console.error('Worker loop error:', error);
    }

    await sleep(WORKER_INTERVAL_MS);
  }
}

// Start worker
runWorker().catch((error) => {
  console.error('Fatal worker error:', error);
  process.exit(1);
});

