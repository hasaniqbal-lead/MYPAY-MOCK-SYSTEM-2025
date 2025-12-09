import { Response } from 'express';
import { prisma } from '../config/database';
import { AuthenticatedRequest } from '../types';

class PortalDashboardController {
  /**
   * Get dashboard statistics
   */
  async getStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const merchantId = req.merchantId;

      // Get total transactions
      const totalTransactions = await prisma.paymentTransaction.count({
        where: { merchant_id: merchantId },
      });

      // Get successful transactions
      const successfulTransactions = await prisma.paymentTransaction.count({
        where: {
          merchant_id: merchantId,
          status: 'completed',
        },
      });

      // Get failed transactions
      const failedTransactions = await prisma.paymentTransaction.count({
        where: {
          merchant_id: merchantId,
          status: 'failed',
        },
      });

      // Get total amount (completed transactions)
      const amountResult = await prisma.paymentTransaction.aggregate({
        where: {
          merchant_id: merchantId,
          status: 'completed',
        },
        _sum: {
          amount: true,
        },
      });

      const totalAmount = Number(amountResult._sum.amount || 0);

      // Calculate success rate
      const successRate =
        totalTransactions > 0 ? (successfulTransactions / totalTransactions) * 100 : 0;

      res.json({
        success: true,
        stats: {
          totalTransactions,
          successfulTransactions,
          failedTransactions,
          successRate: parseFloat(successRate.toFixed(2)),
          totalAmount,
        },
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

