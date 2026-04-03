import { Response } from 'express';
import { prisma } from '../config/database';
import { AuthenticatedRequest } from '../types';

class SettlementController {
  /** Request settlement (merchant) */
  async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const merchantId = req.merchantId;
      const { periodStart, periodEnd } = req.body;

      if (!periodStart || !periodEnd) {
        res.status(400).json({ success: false, error: 'periodStart and periodEnd are required' });
        return;
      }

      const start = new Date(periodStart);
      const end = new Date(periodEnd);

      if (end <= start) {
        res.status(400).json({ success: false, error: 'periodEnd must be after periodStart' });
        return;
      }

      // Sandbox: max 1 settlement per day
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayEnd = new Date(today);
      todayEnd.setHours(23, 59, 59, 999);

      const todaySettlements = await prisma.settlement.count({
        where: {
          merchant_id: merchantId!,
          requested_at: { gte: today, lte: todayEnd },
        },
      });

      if (todaySettlements > 0 && process.env.NODE_ENV !== 'production') {
        res.status(429).json({ success: false, error: 'Sandbox: only 1 settlement request per day' });
        return;
      }

      // Calculate eligible amount: completed transactions in period minus refunds
      const txResult = await prisma.paymentTransaction.aggregate({
        where: {
          merchant_id: merchantId!,
          status: { in: ['completed', 'success', 'refunded'] },
          created_at: { gte: start, lte: end },
        },
        _sum: { amount: true },
      });

      const refundResult = await prisma.refund.aggregate({
        where: {
          merchant_id: merchantId!,
          status: { in: ['completed', 'approved'] },
          created_at: { gte: start, lte: end },
        },
        _sum: { amount: true },
      });

      const totalRevenue = Number(txResult._sum.amount || 0);
      const totalRefunds = Number(refundResult._sum.amount || 0);
      const eligibleAmount = Math.max(totalRevenue - totalRefunds, 0);

      if (eligibleAmount === 0) {
        res.status(400).json({ success: false, error: 'No completed transactions found in this period' });
        return;
      }

      const settlement = await prisma.settlement.create({
        data: {
          merchant_id: merchantId!,
          amount: eligibleAmount,
          period_start: start,
          period_end: end,
          status: 'pending',
        },
      });

      res.status(201).json({
        success: true,
        settlement: {
          id: settlement.id,
          amount: Number(settlement.amount),
          periodStart: settlement.period_start,
          periodEnd: settlement.period_end,
          status: settlement.status,
          requestedAt: settlement.requested_at,
        },
      });
    } catch (error) {
      console.error('Create settlement error:', error);
      res.status(500).json({ success: false, error: 'Failed to create settlement' });
    }
  }

  /** List settlements (merchant) */
  async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const merchantId = req.merchantId;

      const settlements = await prisma.settlement.findMany({
        where: { merchant_id: merchantId! },
        orderBy: { requested_at: 'desc' },
      });

      res.json({
        success: true,
        settlements: settlements.map(s => ({
          id: s.id,
          amount: Number(s.amount),
          periodStart: s.period_start,
          periodEnd: s.period_end,
          status: s.status,
          adminNote: s.admin_note,
          requestedAt: s.requested_at,
          completedAt: s.completed_at,
        })),
      });
    } catch (error) {
      console.error('List settlements error:', error);
      res.status(500).json({ success: false, error: 'Failed to list settlements' });
    }
  }

  /** Admin: List all settlements */
  async adminList(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { status } = req.query;
      const where: any = {};
      if (status && status !== 'all') where.status = status;

      const settlements = await prisma.settlement.findMany({
        where,
        orderBy: { requested_at: 'desc' },
        include: { merchant: { select: { name: true, company_name: true, email: true } } },
      });

      res.json({
        success: true,
        settlements: settlements.map(s => ({
          id: s.id,
          amount: Number(s.amount),
          periodStart: s.period_start,
          periodEnd: s.period_end,
          status: s.status,
          merchantName: s.merchant?.company_name || s.merchant?.name,
          merchantEmail: s.merchant?.email,
          requestedAt: s.requested_at,
          completedAt: s.completed_at,
        })),
      });
    } catch (error) {
      console.error('Admin list settlements error:', error);
      res.status(500).json({ success: false, error: 'Failed to list settlements' });
    }
  }

  /** Admin: Update settlement status */
  async adminUpdateStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status, adminNote } = req.body;

      const validStatuses = ['in_review', 'approved', 'completed', 'rejected'];
      if (!validStatuses.includes(status)) {
        res.status(400).json({ success: false, error: `Invalid status. Use: ${validStatuses.join(', ')}` });
        return;
      }

      const data: any = { status, admin_note: adminNote };
      if (status === 'completed') data.completed_at = new Date();

      await prisma.settlement.update({ where: { id: Number(id) }, data });

      res.json({ success: true, message: 'Settlement status updated' });
    } catch (error) {
      console.error('Admin update settlement error:', error);
      res.status(500).json({ success: false, error: 'Failed to update settlement' });
    }
  }
}

export const settlementController = new SettlementController();
