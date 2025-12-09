import express from 'express';
import { prisma } from '../shared/database';
import { formatErrorResponse, formatSuccessResponse } from '../shared/utils';

const app = express();
const PORT = process.env.IPN_PORT || 3001;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * IPN endpoint - receives callbacks from PSP
 * This is a mock endpoint for testing purposes
 */
app.post('/ipn/callback', async (req, res) => {
  try {
    const { payoutId, status, pspReference, failureReason } = req.body;

    if (!payoutId || !status) {
      res.status(400).json(formatErrorResponse('Missing required fields', 'VALIDATION_ERROR'));
      return;
    }

    // Find payout
    const payout = await prisma.payout.findUnique({
      where: { id: payoutId },
    });

    if (!payout) {
      res.status(404).json(formatErrorResponse('Payout not found', 'NOT_FOUND'));
      return;
    }

    // Update payout status
    const updatedPayout = await prisma.payout.update({
      where: { id: payoutId },
      data: {
        status,
        pspReference: pspReference || payout.pspReference,
        failureReason: failureReason || payout.failureReason,
        processedAt: status === 'SUCCESS' || status === 'FAILED' ? new Date() : payout.processedAt,
      },
    });

    // Create outbox event
    await prisma.outboxEvent.create({
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

    res.json(formatSuccessResponse({ payoutId: updatedPayout.id, status: updatedPayout.status }));
  } catch (error) {
    console.error('IPN callback error:', error);
    res.status(500).json(formatErrorResponse('Failed to process IPN callback', 'INTERNAL_ERROR'));
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

