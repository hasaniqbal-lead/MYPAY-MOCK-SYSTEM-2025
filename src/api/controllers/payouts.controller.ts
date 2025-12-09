import { Request, Response } from 'express';
import { prisma } from '../../shared/database';
import {
  formatAmount,
  calculateAvailableBalance,
  determinePayoutStatus,
  isValidBankCode,
  isValidWalletCode,
  isValidAccountNumber,
  isValidCurrency,
  formatErrorResponse,
  formatSuccessResponse,
} from '../../shared/utils';
import { MerchantRequest, CreatePayoutRequest, PayoutResponse } from '../../shared/types';
import { logTransaction } from '../middleware/audit.logger';

/**
 * Create a new payout
 */
export async function createPayout(
  req: MerchantRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.merchant) {
      res.status(401).json(formatErrorResponse('Unauthorized', 'UNAUTHORIZED'));
      return;
    }

    const merchantId = req.merchant.id;
    const body: CreatePayoutRequest = req.body;

    // Validation
    if (!body.merchantReference || !body.amount || !body.destType || !body.accountNumber) {
      res.status(400).json(formatErrorResponse('Missing required fields', 'VALIDATION_ERROR'));
      return;
    }

    if (body.amount <= 0) {
      res.status(400).json(formatErrorResponse('Amount must be greater than 0', 'VALIDATION_ERROR'));
      return;
    }

    if (!isValidCurrency(body.currency || 'PKR')) {
      res.status(400).json(formatErrorResponse('Invalid currency. Only PKR is supported', 'VALIDATION_ERROR'));
      return;
    }

    if (!isValidAccountNumber(body.accountNumber)) {
      res.status(400).json(formatErrorResponse('Invalid account number format', 'VALIDATION_ERROR'));
      return;
    }

    if (body.destType === 'BANK' && (!body.bankCode || !isValidBankCode(body.bankCode))) {
      res.status(400).json(formatErrorResponse('Invalid or missing bank code', 'VALIDATION_ERROR'));
      return;
    }

    if (body.destType === 'WALLET' && (!body.walletCode || !isValidWalletCode(body.walletCode))) {
      res.status(400).json(formatErrorResponse('Invalid or missing wallet code', 'VALIDATION_ERROR'));
      return;
    }

    // Check for duplicate merchant reference
    const existingPayout = await prisma.payout.findUnique({
      where: {
        merchantId_merchantReference: {
          merchantId,
          merchantReference: body.merchantReference,
        },
      },
    });

    if (existingPayout) {
      res.status(409).json(formatErrorResponse('Payout with this merchant reference already exists', 'DUPLICATE_REFERENCE'));
      return;
    }

    // Get merchant balance with optimistic locking
    const balance = await prisma.merchantBalance.findUnique({
      where: { merchantId },
    });

    if (!balance) {
      res.status(500).json(formatErrorResponse('Merchant balance not found', 'BALANCE_ERROR'));
      return;
    }

    const availableBalance = parseFloat(
      calculateAvailableBalance(balance.balance.toString(), balance.lockedBalance.toString())
    );

    if (availableBalance < body.amount) {
      res.status(400).json(formatErrorResponse('Insufficient balance', 'INSUFFICIENT_BALANCE'));
      return;
    }

    // Create payout in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Lock balance row
      const lockedBalance = await tx.merchantBalance.findUnique({
        where: { merchantId },
      });

      if (!lockedBalance || lockedBalance.version !== balance.version) {
        throw new Error('Balance version mismatch');
      }

      // Update balance
      await tx.merchantBalance.update({
        where: { merchantId },
        data: {
          lockedBalance: {
            increment: body.amount,
          },
          version: {
            increment: 1,
          },
        },
      });

      // Create payout
      const payout = await tx.payout.create({
        data: {
          merchantId,
          merchantReference: body.merchantReference,
          amount: body.amount,
          currency: body.currency || 'PKR',
          destType: body.destType,
          bankCode: body.bankCode,
          walletCode: body.walletCode,
          accountNumber: body.accountNumber,
          accountTitle: body.accountTitle || 'Account Holder',
          status: 'PENDING',
        },
      });

      // Create ledger entry
      await tx.ledgerEntry.create({
        data: {
          merchantId,
          payoutId: payout.id,
          type: 'DEBIT',
          amount: body.amount,
          balance: (parseFloat(lockedBalance.balance.toString()) - body.amount).toString(),
          description: `Payout created: ${body.merchantReference}`,
          metadata: JSON.stringify({
            payoutId: payout.id,
            merchantReference: body.merchantReference,
          }),
        },
      });

      // Create outbox event
      await tx.outboxEvent.create({
        data: {
          merchantId,
          eventType: 'PAYOUT_CREATED',
          payload: JSON.stringify({
            payoutId: payout.id,
            merchantReference: body.merchantReference,
            amount: body.amount,
            status: 'PENDING',
          }),
        },
      });

      return payout;
    });

    // Log transaction for audit trail
    logTransaction('PAYOUT_CREATED', {
      payout_id: result.id,
      merchant_id: merchantId,
      merchant_reference: body.merchantReference,
      amount: body.amount,
      currency: body.currency || 'PKR',
      dest_type: body.destType,
      bank_code: body.bankCode,
      wallet_code: body.walletCode,
      account_number_masked: `${body.accountNumber.substring(0, 3)}***${body.accountNumber.substring(body.accountNumber.length - 2)}`,
      status: 'PENDING',
    });

    const response: PayoutResponse = {
      id: result.id,
      merchantId: result.merchantId,
      merchantReference: result.merchantReference,
      amount: formatAmount(result.amount.toString()),
      currency: result.currency,
      destType: result.destType,
      bankCode: result.bankCode || undefined,
      walletCode: result.walletCode || undefined,
      accountNumber: result.accountNumber,
      accountTitle: result.accountTitle,
      status: result.status,
      failureReason: result.failureReason || undefined,
      pspReference: result.pspReference || undefined,
      processedAt: result.processedAt?.toISOString(),
      createdAt: result.createdAt.toISOString(),
      updatedAt: result.updatedAt.toISOString(),
    };

    res.status(201).json(formatSuccessResponse(response, 'Payout created successfully'));
  } catch (error: any) {
    console.error('Create payout error:', error);
    if (error.message === 'Balance version mismatch') {
      res.status(409).json(formatErrorResponse('Balance conflict. Please retry', 'BALANCE_CONFLICT'));
    } else {
      res.status(500).json(formatErrorResponse('Failed to create payout', 'INTERNAL_ERROR'));
    }
  }
}

/**
 * Get payout by ID
 */
export async function getPayout(req: MerchantRequest, res: Response): Promise<void> {
  try {
    if (!req.merchant) {
      res.status(401).json(formatErrorResponse('Unauthorized', 'UNAUTHORIZED'));
      return;
    }

    const { id } = req.params;
    const merchantId = req.merchant.id;

    const payout = await prisma.payout.findFirst({
      where: {
        id,
        merchantId,
      },
    });

    if (!payout) {
      res.status(404).json(formatErrorResponse('Payout not found', 'NOT_FOUND'));
      return;
    }

    const response: PayoutResponse = {
      id: payout.id,
      merchantId: payout.merchantId,
      merchantReference: payout.merchantReference,
      amount: formatAmount(payout.amount.toString()),
      currency: payout.currency,
      destType: payout.destType,
      bankCode: payout.bankCode || undefined,
      walletCode: payout.walletCode || undefined,
      accountNumber: payout.accountNumber,
      accountTitle: payout.accountTitle,
      status: payout.status,
      failureReason: payout.failureReason || undefined,
      pspReference: payout.pspReference || undefined,
      processedAt: payout.processedAt?.toISOString(),
      createdAt: payout.createdAt.toISOString(),
      updatedAt: payout.updatedAt.toISOString(),
    };

    res.json(formatSuccessResponse(response));
  } catch (error) {
    console.error('Get payout error:', error);
    res.status(500).json(formatErrorResponse('Failed to get payout', 'INTERNAL_ERROR'));
  }
}

/**
 * List payouts
 */
export async function listPayouts(req: MerchantRequest, res: Response): Promise<void> {
  try {
    if (!req.merchant) {
      res.status(401).json(formatErrorResponse('Unauthorized', 'UNAUTHORIZED'));
      return;
    }

    const merchantId = req.merchant.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const skip = (page - 1) * limit;
    const status = req.query.status as string | undefined;

    const where: any = { merchantId };
    if (status) {
      where.status = status;
    }

    const [payouts, total] = await Promise.all([
      prisma.payout.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.payout.count({ where }),
    ]);

    const response = payouts.map((payout) => ({
      id: payout.id,
      merchantId: payout.merchantId,
      merchantReference: payout.merchantReference,
      amount: formatAmount(payout.amount.toString()),
      currency: payout.currency,
      destType: payout.destType,
      bankCode: payout.bankCode || undefined,
      walletCode: payout.walletCode || undefined,
      accountNumber: payout.accountNumber,
      accountTitle: payout.accountTitle,
      status: payout.status,
      failureReason: payout.failureReason || undefined,
      pspReference: payout.pspReference || undefined,
      processedAt: payout.processedAt?.toISOString(),
      createdAt: payout.createdAt.toISOString(),
      updatedAt: payout.updatedAt.toISOString(),
    }));

    res.json(
      formatSuccessResponse({
        payouts: response,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      })
    );
  } catch (error) {
    console.error('List payouts error:', error);
    res.status(500).json(formatErrorResponse('Failed to list payouts', 'INTERNAL_ERROR'));
  }
}

/**
 * Reinitiate failed payout
 */
export async function reinitiatePayout(req: MerchantRequest, res: Response): Promise<void> {
  try {
    if (!req.merchant) {
      res.status(401).json(formatErrorResponse('Unauthorized', 'UNAUTHORIZED'));
      return;
    }

    const { id } = req.params;
    const merchantId = req.merchant.id;

    const payout = await prisma.payout.findFirst({
      where: {
        id,
        merchantId,
      },
    });

    if (!payout) {
      res.status(404).json(formatErrorResponse('Payout not found', 'NOT_FOUND'));
      return;
    }

    if (payout.status !== 'FAILED') {
      res.status(400).json(formatErrorResponse('Only failed payouts can be reinitiated', 'INVALID_STATUS'));
      return;
    }

    // Update payout status to PENDING
    const updated = await prisma.payout.update({
      where: { id },
      data: {
        status: 'PENDING',
        failureReason: null,
      },
    });

    // Create outbox event
    await prisma.outboxEvent.create({
      data: {
        merchantId,
        eventType: 'PAYOUT_REINITIATED',
        payload: JSON.stringify({
          payoutId: payout.id,
          merchantReference: payout.merchantReference,
        }),
      },
    });

    const response: PayoutResponse = {
      id: updated.id,
      merchantId: updated.merchantId,
      merchantReference: updated.merchantReference,
      amount: formatAmount(updated.amount.toString()),
      currency: updated.currency,
      destType: updated.destType,
      bankCode: updated.bankCode || undefined,
      walletCode: updated.walletCode || undefined,
      accountNumber: updated.accountNumber,
      accountTitle: updated.accountTitle,
      status: updated.status,
      failureReason: updated.failureReason || undefined,
      pspReference: updated.pspReference || undefined,
      processedAt: updated.processedAt?.toISOString(),
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };

    res.json(formatSuccessResponse(response, 'Payout reinitiated successfully'));
  } catch (error) {
    console.error('Reinitiate payout error:', error);
    res.status(500).json(formatErrorResponse('Failed to reinitiate payout', 'INTERNAL_ERROR'));
  }
}

