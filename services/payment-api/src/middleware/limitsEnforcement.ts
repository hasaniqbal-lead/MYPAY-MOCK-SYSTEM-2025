import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';

/**
 * Middleware: checks TRANSACTION_CAP before allowing new transactions.
 * Counts this month's transactions and rejects if cap is exceeded.
 */
export function enforceTransactionCap(req: Request, res: Response, next: NextFunction): void {
  const cap = process.env.TRANSACTION_CAP;
  if (!cap || cap === '' || cap === '0') return next();

  const limit = parseInt(cap, 10);
  if (isNaN(limit)) return next();

  // Count transactions this month
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  prisma.paymentTransaction.count({
    where: {
      created_at: { gte: monthStart },
    },
  })
    .then((count: number) => {
      if (count >= limit) {
        res.status(429).json({
          success: false,
          error: 'Transaction Cap Exceeded',
          message: `Monthly transaction cap of ${limit} has been reached. Contact your administrator.`,
        });
        return;
      }
      next();
    })
    .catch(() => {
      // On error, allow through (fail-open)
      next();
    });
}

/**
 * Middleware: checks MONTHLY_VOLUME_CAP before allowing new transactions.
 * Sums this month's transaction amounts and rejects if cap is exceeded.
 */
export function enforceVolumeCap(req: Request, res: Response, next: NextFunction): void {
  const cap = process.env.MONTHLY_VOLUME_CAP;
  if (!cap || cap === '' || cap === '0') return next();

  const limit = parseFloat(cap);
  if (isNaN(limit)) return next();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  prisma.paymentTransaction.aggregate({
    _sum: { amount: true },
    where: {
      created_at: { gte: monthStart },
    },
  })
    .then((result: any) => {
      const totalVolume = Number(result._sum.amount || 0);
      if (totalVolume >= limit) {
        res.status(429).json({
          success: false,
          error: 'Volume Cap Exceeded',
          message: `Monthly volume cap of ${limit} has been reached. Contact your administrator.`,
        });
        return;
      }
      next();
    })
    .catch(() => {
      next();
    });
}

/**
 * Middleware: checks MERCHANT_LIMIT before allowing new merchant creation.
 */
export function enforceMerchantLimit(req: Request, res: Response, next: NextFunction): void {
  const cap = process.env.MERCHANT_LIMIT;
  if (!cap || cap === '' || cap === '0') return next();

  const limit = parseInt(cap, 10);
  if (isNaN(limit)) return next();

  prisma.merchant.count({
    where: { status: 'active' },
  })
    .then((count) => {
      if (count >= limit) {
        res.status(429).json({
          success: false,
          error: 'Merchant Limit Exceeded',
          message: `Maximum of ${limit} merchants has been reached. Contact your administrator.`,
        });
        return;
      }
      next();
    })
    .catch(() => {
      next();
    });
}
