import { Response } from 'express';
import { prisma } from '../config/database';
import { AuthenticatedRequest } from '../types';

class RefundController {
  /**
   * Create a refund request (merchant)
   */
  async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const merchantId = req.merchantId;
      const { transactionId, amount, reason } = req.body;

      if (!transactionId) {
        res.status(400).json({ success: false, error: 'transactionId is required' });
        return;
      }

      // Find the transaction
      const transaction = await prisma.paymentTransaction.findFirst({
        where: { checkout_id: transactionId, merchant_id: merchantId },
      });

      if (!transaction) {
        res.status(404).json({ success: false, error: 'Transaction not found' });
        return;
      }

      // Only completed transactions can be refunded
      if (transaction.status !== 'completed' && transaction.status !== 'success') {
        res.status(400).json({ success: false, error: `Cannot refund a ${transaction.status} transaction` });
        return;
      }

      const originalAmount = Number(transaction.amount);

      // Calculate already refunded amount
      const existingRefunds = await prisma.refund.findMany({
        where: { checkout_id: transactionId, status: { in: ['pending', 'approved', 'completed'] } },
      });
      const totalRefunded = existingRefunds.reduce((sum, r) => sum + Number(r.amount), 0);

      // Determine refund amount
      const refundAmount = amount ? Number(amount) : (originalAmount - totalRefunded);

      if (refundAmount <= 0) {
        res.status(400).json({ success: false, error: 'Invalid refund amount' });
        return;
      }

      if (totalRefunded + refundAmount > originalAmount) {
        res.status(400).json({
          success: false,
          error: `Refund amount exceeds remaining refundable amount (PKR ${(originalAmount - totalRefunded).toFixed(2)})`,
        });
        return;
      }

      const isPartial = refundAmount < (originalAmount - totalRefunded);

      const refund = await prisma.refund.create({
        data: {
          transaction_id: transaction.id,
          merchant_id: merchantId!,
          checkout_id: transactionId,
          amount: refundAmount,
          original_amount: originalAmount,
          type: isPartial ? 'partial' : 'full',
          reason: reason || null,
          status: 'pending',
        },
      });

      // In sandbox, auto-complete refunds
      if (process.env.NODE_ENV !== 'production') {
        await prisma.refund.update({
          where: { id: refund.id },
          data: { status: 'completed' },
        });

        // Update transaction status if fully refunded
        if (totalRefunded + refundAmount >= originalAmount) {
          await prisma.paymentTransaction.update({
            where: { id: transaction.id },
            data: { status: 'refunded' },
          });
        }

        refund.status = 'completed';
      }

      res.status(201).json({
        success: true,
        refund: {
          id: refund.id,
          transactionId: refund.checkout_id,
          amount: Number(refund.amount),
          originalAmount: Number(refund.original_amount),
          type: refund.type,
          status: refund.status,
          reason: refund.reason,
          createdAt: refund.created_at,
        },
      });
    } catch (error) {
      console.error('Create refund error:', error);
      res.status(500).json({ success: false, error: 'Failed to create refund' });
    }
  }

  /**
   * List refunds for merchant
   */
  async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const merchantId = req.merchantId;
      const { page = 1, limit = 20 } = req.query;

      const [refunds, total] = await Promise.all([
        prisma.refund.findMany({
          where: { merchant_id: merchantId! },
          orderBy: { created_at: 'desc' },
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
        }),
        prisma.refund.count({ where: { merchant_id: merchantId! } }),
      ]);

      res.json({
        success: true,
        refunds: refunds.map((r) => ({
          id: r.id,
          transactionId: r.checkout_id,
          amount: Number(r.amount),
          originalAmount: Number(r.original_amount),
          type: r.type,
          status: r.status,
          reason: r.reason,
          createdAt: r.created_at,
        })),
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
        },
      });
    } catch (error) {
      console.error('List refunds error:', error);
      res.status(500).json({ success: false, error: 'Failed to list refunds' });
    }
  }

  /**
   * Get single refund
   */
  async get(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const merchantId = req.merchantId;
      const { id } = req.params;

      const refund = await prisma.refund.findFirst({
        where: { id: Number(id), merchant_id: merchantId! },
      });

      if (!refund) {
        res.status(404).json({ success: false, error: 'Refund not found' });
        return;
      }

      res.json({
        success: true,
        refund: {
          id: refund.id,
          transactionId: refund.checkout_id,
          amount: Number(refund.amount),
          originalAmount: Number(refund.original_amount),
          type: refund.type,
          status: refund.status,
          reason: refund.reason,
          adminNote: refund.admin_note,
          createdAt: refund.created_at,
          updatedAt: refund.updated_at,
        },
      });
    } catch (error) {
      console.error('Get refund error:', error);
      res.status(500).json({ success: false, error: 'Failed to get refund' });
    }
  }

  /**
   * Admin: List all refunds
   */
  async adminList(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 20, status } = req.query;

      const where: any = {};
      if (status && status !== 'all') where.status = status;

      const [refunds, total] = await Promise.all([
        prisma.refund.findMany({
          where,
          include: { merchant: { select: { name: true, company_name: true, email: true } } },
          orderBy: { created_at: 'desc' },
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
        }),
        prisma.refund.count({ where }),
      ]);

      res.json({
        success: true,
        refunds: refunds.map((r) => ({
          id: r.id,
          transactionId: r.checkout_id,
          amount: Number(r.amount),
          originalAmount: Number(r.original_amount),
          type: r.type,
          status: r.status,
          reason: r.reason,
          merchantName: r.merchant?.company_name || r.merchant?.name,
          merchantEmail: r.merchant?.email,
          createdAt: r.created_at,
        })),
        pagination: { page: Number(page), limit: Number(limit), total },
      });
    } catch (error) {
      console.error('Admin list refunds error:', error);
      res.status(500).json({ success: false, error: 'Failed to list refunds' });
    }
  }

  /**
   * Admin: Approve or reject a refund
   */
  async adminUpdateStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status, adminNote } = req.body;

      if (!['approved', 'completed', 'rejected'].includes(status)) {
        res.status(400).json({ success: false, error: 'Invalid status. Use: approved, completed, rejected' });
        return;
      }

      const refund = await prisma.refund.findUnique({ where: { id: Number(id) } });
      if (!refund) {
        res.status(404).json({ success: false, error: 'Refund not found' });
        return;
      }

      const updated = await prisma.refund.update({
        where: { id: Number(id) },
        data: { status, admin_note: adminNote || refund.admin_note },
      });

      // If completed, update transaction status
      if (status === 'completed') {
        const totalRefunded = await prisma.refund.aggregate({
          where: { checkout_id: refund.checkout_id, status: 'completed' },
          _sum: { amount: true },
        });

        if (Number(totalRefunded._sum.amount || 0) >= Number(refund.original_amount)) {
          await prisma.paymentTransaction.updateMany({
            where: { checkout_id: refund.checkout_id },
            data: { status: 'refunded' },
          });
        }
      }

      res.json({
        success: true,
        refund: {
          id: updated.id,
          status: updated.status,
          adminNote: updated.admin_note,
        },
      });
    } catch (error) {
      console.error('Admin update refund error:', error);
      res.status(500).json({ success: false, error: 'Failed to update refund' });
    }
  }
}

export const refundController = new RefundController();
