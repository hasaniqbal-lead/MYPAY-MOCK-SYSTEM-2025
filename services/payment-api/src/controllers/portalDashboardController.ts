import { Response } from 'express';
import { prisma } from '../config/database';
import { AuthenticatedRequest } from '../types';

// Simple in-memory cache with 5-minute TTL
interface CacheEntry {
  data: any;
  expiry: number;
}

const statsCache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

class PortalDashboardController {
  /**
   * Get dashboard statistics (with caching)
   */
  async getStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const merchantId = req.merchantId;
      const cacheKey = `dashboard_stats_${merchantId}`;

      // Check cache first
      const cached = statsCache.get(cacheKey);
      if (cached && cached.expiry > Date.now()) {
        res.json({
          success: true,
          stats: cached.data,
          cached: true,
        });
        return;
      }

      // Run queries in parallel for better performance
      const [totalTransactions, successfulTransactions, failedTransactions, amountResult] =
        await Promise.all([
          prisma.paymentTransaction.count({
            where: { merchant_id: merchantId },
          }),
          prisma.paymentTransaction.count({
            where: {
              merchant_id: merchantId,
              status: 'completed',
            },
          }),
          prisma.paymentTransaction.count({
            where: {
              merchant_id: merchantId,
              status: 'failed',
            },
          }),
          prisma.paymentTransaction.aggregate({
            where: {
              merchant_id: merchantId,
              status: 'completed',
            },
            _sum: {
              amount: true,
            },
          }),
        ]);

      const totalAmount = Number(amountResult._sum.amount || 0);

      // Calculate success rate
      const successRate =
        totalTransactions > 0 ? (successfulTransactions / totalTransactions) * 100 : 0;

      const stats = {
        totalTransactions,
        successfulTransactions,
        failedTransactions,
        successRate: parseFloat(successRate.toFixed(2)),
        totalAmount,
      };

      // Cache the result
      statsCache.set(cacheKey, {
        data: stats,
        expiry: Date.now() + CACHE_TTL,
      });

      res.json({
        success: true,
        stats,
        cached: false,
      });
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get dashboard statistics',
      });
    }
  }
}

export const portalDashboardController = new PortalDashboardController();

