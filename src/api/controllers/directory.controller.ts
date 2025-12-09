import { Request, Response } from 'express';
import { prisma } from '../../shared/database';
import { formatErrorResponse, formatSuccessResponse } from '../../shared/utils';
import { MerchantRequest, DirectoryItem } from '../../shared/types';

/**
 * Get directory (banks and wallets)
 */
export async function getDirectory(req: MerchantRequest, res: Response): Promise<void> {
  try {
    if (!req.merchant) {
      res.status(401).json(formatErrorResponse('Unauthorized', 'UNAUTHORIZED'));
      return;
    }

    const [banks, wallets] = await Promise.all([
      prisma.bankDirectory.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      }),
      prisma.walletDirectory.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      }),
    ]);

    const banksResponse: DirectoryItem[] = banks.map((bank) => ({
      code: bank.code,
      name: bank.name,
      isActive: bank.isActive,
    }));

    const walletsResponse: DirectoryItem[] = wallets.map((wallet) => ({
      code: wallet.code,
      name: wallet.name,
      isActive: wallet.isActive,
    }));

    res.json(
      formatSuccessResponse({
        banks: banksResponse,
        wallets: walletsResponse,
      })
    );
  } catch (error) {
    console.error('Get directory error:', error);
    res.status(500).json(formatErrorResponse('Failed to get directory', 'INTERNAL_ERROR'));
  }
}

