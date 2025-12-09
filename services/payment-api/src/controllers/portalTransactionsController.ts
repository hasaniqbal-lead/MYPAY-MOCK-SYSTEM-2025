import { Response } from 'express';
import { prisma } from '../config/database';
import { AuthenticatedRequest, PaginationParams } from '../types';

class PortalTransactionsController {
  /**
   * List transactions with filters
   */
  async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const merchantId = req.merchantId;
      const {
        page = 1,
        limit = 20,
        status,
        startDate,
        endDate,
        paymentMethod,
      } = req.query as unknown as PaginationParams;

      const offset = (Number(page) - 1) * Number(limit);

      // Build where clause
      const where: {
        merchant_id?: number;
        status?: string;
        payment_method?: string;
        created_at?: { gte?: Date; lte?: Date };
      } = {
        merchant_id: merchantId,
      };

      if (status) {
        where.status = status;
      }

      if (paymentMethod) {
        where.payment_method = paymentMethod;
      }

      if (startDate || endDate) {
        where.created_at = {};
        if (startDate) {
          where.created_at.gte = new Date(startDate);
        }
        if (endDate) {
          where.created_at.lte = new Date(endDate + ' 23:59:59');
        }
      }

      // Get transactions
      const transactions = await prisma.paymentTransaction.findMany({
        where,
        orderBy: { created_at: 'desc' },
        take: Number(limit),
        skip: offset,
      });

      // Get total count
      const total = await prisma.paymentTransaction.count({ where });

      // Format transactions
      const formattedTransactions = transactions.map((tx: any) => ({
        checkout_id: tx.checkout_id,
        reference: tx.reference,
        amount: Number(tx.amount),
        status: tx.status,
        status_code: tx.status_code,
        payment_method: tx.payment_method,
        payment_type: tx.payment_type,
        mobile_number: tx.mobile_number,
        created_at: tx.created_at,
        updated_at: tx.updated_at,
      }));

      res.json({
        success: true,
        transactions: formattedTransactions,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      console.error('List transactions error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get transactions',
      });
    }
  }

  /**
   * Get single transaction
   */
  async get(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const merchantId = req.merchantId;
      const { id } = req.params;

      const transaction = await prisma.paymentTransaction.findFirst({
        where: {
          checkout_id: id,
          merchant_id: merchantId,
        },
      });

      if (!transaction) {
        res.status(404).json({
          success: false,
          error: 'Transaction not found',
        });
        return;
      }

      res.json({
        success: true,
        transaction: {
          checkout_id: transaction.checkout_id,
          reference: transaction.reference,
          amount: Number(transaction.amount),
          status: transaction.status,
          status_code: transaction.status_code,
          payment_method: transaction.payment_method,
          payment_type: transaction.payment_type,
          mobile_number: transaction.mobile_number,
          success_url: transaction.success_url,
          return_url: transaction.return_url,
          webhook_status: transaction.webhook_status,
          created_at: transaction.created_at,
          updated_at: transaction.updated_at,
        },
      });
    } catch (error) {
      console.error('Get transaction error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get transaction',
      });
    }
  }

  /**
   * Export transactions
   */
  async export(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const merchantId = req.merchantId;
      const { format } = req.params;
      const { status, startDate, endDate } = req.query as {
        status?: string;
        startDate?: string;
        endDate?: string;
      };

      if (!['csv', 'json'].includes(format)) {
        res.status(400).json({
          success: false,
          error: 'Invalid format. Use csv or json',
        });
        return;
      }

      // Build where clause
      const where: {
        merchant_id?: number;
        status?: string;
        created_at?: { gte?: Date; lte?: Date };
      } = {
        merchant_id: merchantId,
      };

      if (status) {
        where.status = status;
      }

      if (startDate || endDate) {
        where.created_at = {};
        if (startDate) {
          where.created_at.gte = new Date(startDate);
        }
        if (endDate) {
          where.created_at.lte = new Date(endDate + ' 23:59:59');
        }
      }

      const transactions = await prisma.paymentTransaction.findMany({
        where,
        orderBy: { created_at: 'desc' },
      });

      if (format === 'csv') {
        // Generate CSV
        const headers = ['Reference', 'Amount', 'Status', 'Payment Method', 'Date'];
        const rows = transactions.map((tx: any) => [
          tx.reference,
          tx.amount,
          tx.status,
          tx.payment_method,
          tx.created_at,
        ]);

        let csv = headers.join(',') + '\n';
        rows.forEach((row: any) => {
          csv += row.map((cell: any) => `"${cell}"`).join(',') + '\n';
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');
        res.send(csv);
      } else if (format === 'json') {
        // Generate JSON
        const formatted = transactions.map((tx: any) => ({
          checkout_id: tx.checkout_id,
          reference: tx.reference,
          amount: Number(tx.amount),
          status: tx.status,
          status_code: tx.status_code,
          payment_method: tx.payment_method,
          created_at: tx.created_at,
        }));

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=transactions.json');
        res.json(formatted);
      }
    } catch (error) {
      console.error('Export transactions error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to export transactions',
      });
    }
  }
}

export const portalTransactionsController = new PortalTransactionsController();

