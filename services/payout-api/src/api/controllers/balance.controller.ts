import { Request, Response } from 'express';
import { prisma } from '../../shared/database';
import { calculateAvailableBalance, formatErrorResponse, formatSuccessResponse } from '../../shared/utils';
import { MerchantRequest, BalanceResponse, LedgerEntryResponse } from '../../shared/types';

/**
 * Get merchant balance
 */
export async function getBalance(req: MerchantRequest, res: Response): Promise<void> {
  try {
    if (!req.merchant) {
      res.status(401).json(formatErrorResponse('Unauthorized', 'UNAUTHORIZED'));
      return;
    }

    const merchantId = req.merchant.id;

    const balance = await prisma.merchantBalance.findUnique({
      where: { merchantId },
    });

    if (!balance) {
      res.status(404).json(formatErrorResponse('Balance not found', 'NOT_FOUND'));
      return;
    }

    const availableBalance = calculateAvailableBalance(
      balance.balance.toString(),
      balance.lockedBalance.toString()
    );

    const response: BalanceResponse = {
      balance: balance.balance.toString(),
      lockedBalance: balance.lockedBalance.toString(),
      availableBalance,
    };

    res.json(formatSuccessResponse(response));
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json(formatErrorResponse('Failed to get balance', 'INTERNAL_ERROR'));
  }
}

/**
 * Get balance history (ledger entries)
 */
export async function getBalanceHistory(req: MerchantRequest, res: Response): Promise<void> {
  try {
    if (!req.merchant) {
      res.status(401).json(formatErrorResponse('Unauthorized', 'UNAUTHORIZED'));
      return;
    }

    const merchantId = req.merchant.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const skip = (page - 1) * limit;

    const [entries, total] = await Promise.all([
      prisma.ledgerEntry.findMany({
        where: { merchantId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.ledgerEntry.count({ where: { merchantId } }),
    ]);

    const response: LedgerEntryResponse[] = entries.map((entry: any) => ({
      id: entry.id,
      type: entry.type,
      amount: entry.amount.toString(),
      balance: entry.balance.toString(),
      description: entry.description,
      metadata: entry.metadata || undefined,
      createdAt: entry.createdAt.toISOString(),
    }));

    res.json(
      formatSuccessResponse({
        entries: response,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      })
    );
  } catch (error) {
    console.error('Get balance history error:', error);
    res.status(500).json(formatErrorResponse('Failed to get balance history', 'INTERNAL_ERROR'));
  }
}

