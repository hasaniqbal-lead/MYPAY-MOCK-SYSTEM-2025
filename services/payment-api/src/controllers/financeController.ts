import { Response } from 'express';
import { prisma } from '../config/database';
import { AuthenticatedRequest } from '../types';

class FinanceController {
  /**
   * Get financial overview — revenue, fees, refunds, net
   */
  async getOverview(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { periodDays = 30 } = req.query;
      const since = new Date();
      since.setDate(since.getDate() - Number(periodDays));

      // Gross revenue (completed transactions)
      const grossResult = await prisma.paymentTransaction.aggregate({
        where: { status: { in: ['completed', 'success'] }, created_at: { gte: since } },
        _sum: { amount: true },
        _count: true,
      });

      // Refunds
      const refundResult = await prisma.refund.aggregate({
        where: { status: { in: ['completed', 'approved'] }, created_at: { gte: since } },
        _sum: { amount: true },
        _count: true,
      });

      // Payouts disbursed
      const payoutResult = await prisma.payout.aggregate({
        where: { status: { in: ['COMPLETED', 'SUCCESS'] }, createdAt: { gte: since } },
        _sum: { amount: true },
        _count: true,
      });

      // Pending settlements
      const pendingSettlements = await prisma.settlement.aggregate({
        where: { status: { in: ['pending', 'in_review', 'approved'] } },
        _sum: { amount: true },
        _count: true,
      });

      // Get PSP rates for fee calculation
      const pspRates = await prisma.pSPRate.findMany({ where: { is_active: true } });
      const avgPspRate = pspRates.length > 0
        ? pspRates.reduce((sum, r) => sum + Number(r.rate_percent), 0) / pspRates.length
        : 1.5;

      const grossRevenue = Number(grossResult._sum.amount || 0);
      const totalRefunds = Number(refundResult._sum.amount || 0);
      const totalPayouts = Number(payoutResult._sum.amount || 0);
      const pspFees = grossRevenue * (avgPspRate / 100);
      const netRevenue = grossRevenue - totalRefunds - pspFees;

      // Merchant rates (default 2.5%)
      const merchantFees = grossRevenue * 0.025;
      const platformMargin = merchantFees - pspFees;

      res.json({
        success: true,
        overview: {
          period: `Last ${periodDays} days`,
          grossRevenue,
          totalTransactions: grossResult._count,
          totalRefunds,
          refundCount: refundResult._count,
          pspFees: Math.round(pspFees * 100) / 100,
          avgPspRate,
          merchantFees: Math.round(merchantFees * 100) / 100,
          platformMargin: Math.round(platformMargin * 100) / 100,
          netRevenue: Math.round(netRevenue * 100) / 100,
          totalPayouts,
          payoutCount: payoutResult._count,
          pendingSettlements: Number(pendingSettlements._sum.amount || 0),
          pendingSettlementCount: pendingSettlements._count,
        },
      });
    } catch (error) {
      console.error('Finance overview error:', error);
      res.status(500).json({ success: false, error: 'Failed to get finance overview' });
    }
  }

  /**
   * Revenue breakdown by payment method
   */
  async getRevenueByMethod(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { periodDays = 30 } = req.query;
      const since = new Date();
      since.setDate(since.getDate() - Number(periodDays));

      const result = await prisma.paymentTransaction.groupBy({
        by: ['payment_method'],
        where: { status: { in: ['completed', 'success'] }, created_at: { gte: since } },
        _sum: { amount: true },
        _count: true,
      });

      // Get PSP rates per method
      const pspRates = await prisma.pSPRate.findMany({ where: { is_active: true } });
      const rateMap: Record<string, number> = {};
      pspRates.forEach(r => { rateMap[r.payment_method] = Number(r.rate_percent); });

      const breakdown = result.map(r => {
        const revenue = Number(r._sum.amount || 0);
        const pspRate = rateMap[r.payment_method] || 1.5;
        const pspCost = revenue * (pspRate / 100);
        const merchantRate = 2.5; // Default
        const merchantFee = revenue * (merchantRate / 100);
        return {
          method: r.payment_method,
          transactions: r._count,
          revenue,
          pspRate,
          pspCost: Math.round(pspCost * 100) / 100,
          merchantRate,
          merchantFee: Math.round(merchantFee * 100) / 100,
          margin: Math.round((merchantFee - pspCost) * 100) / 100,
        };
      });

      res.json({ success: true, breakdown });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to get revenue breakdown' });
    }
  }

  /**
   * Revenue breakdown by merchant
   */
  async getRevenueByMerchant(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { periodDays = 30 } = req.query;
      const since = new Date();
      since.setDate(since.getDate() - Number(periodDays));

      const result = await prisma.paymentTransaction.groupBy({
        by: ['merchant_id'],
        where: { status: { in: ['completed', 'success'] }, created_at: { gte: since }, merchant_id: { not: null } },
        _sum: { amount: true },
        _count: true,
      });

      // Get merchant names
      const merchantIds = result.map(r => r.merchant_id!).filter(Boolean);
      const merchants = await prisma.merchant.findMany({
        where: { id: { in: merchantIds } },
        select: { id: true, name: true, company_name: true },
      });
      const nameMap: Record<number, string> = {};
      merchants.forEach(m => { nameMap[m.id] = m.company_name || m.name; });

      // Get merchant-specific rates
      const merchantRates = await prisma.merchantRate.findMany({
        where: { merchant_id: { in: merchantIds }, is_active: true },
      });
      const rateMap: Record<number, number> = {};
      merchantRates.forEach(r => { rateMap[r.merchant_id] = Number(r.rate_percent); });

      // Refunds per merchant
      const refunds = await prisma.refund.groupBy({
        by: ['merchant_id'],
        where: { status: { in: ['completed', 'approved'] }, created_at: { gte: since } },
        _sum: { amount: true },
      });
      const refundMap: Record<number, number> = {};
      refunds.forEach(r => { refundMap[r.merchant_id] = Number(r._sum.amount || 0); });

      const breakdown = result.map(r => {
        const mid = r.merchant_id!;
        const revenue = Number(r._sum.amount || 0);
        const merchantRate = rateMap[mid] || 2.5;
        const fees = revenue * (merchantRate / 100);
        const refunded = refundMap[mid] || 0;
        const netSettleable = revenue - refunded - fees;
        return {
          merchantId: mid,
          merchantName: nameMap[mid] || `Merchant #${mid}`,
          transactions: r._count,
          grossRevenue: revenue,
          merchantRate,
          platformFees: Math.round(fees * 100) / 100,
          refunds: refunded,
          netSettleable: Math.round(netSettleable * 100) / 100,
        };
      }).sort((a, b) => b.grossRevenue - a.grossRevenue);

      res.json({ success: true, merchants: breakdown });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to get merchant breakdown' });
    }
  }
  /**
   * Get finance rules (from system_config)
   */
  async getRules(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const config = await prisma.systemConfig.findFirst({ where: { key: 'finance_rules' } });
      const defaults = {
        default_merchant_rate: 2.5,
        settlement_period_days: 15,
        min_settlement_amount: 100,
        refund_deduction_percent: 0,
        dispute_hold_days: 7,
        max_transaction_amount: 500000,
        min_transaction_amount: 1,
      };
      const rules = config?.value ? { ...defaults, ...(typeof config.value === 'string' ? JSON.parse(config.value) : config.value) } : defaults;
      res.json({ success: true, rules });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to get finance rules' });
    }
  }

  /**
   * Update finance rules
   */
  async updateRules(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const rules = req.body;
      await prisma.systemConfig.upsert({
        where: { key: 'finance_rules' },
        update: { value: rules },
        create: { key: 'finance_rules', value: rules },
      });
      res.json({ success: true, rules });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to update finance rules' });
    }
  }
}

export const financeController = new FinanceController();
