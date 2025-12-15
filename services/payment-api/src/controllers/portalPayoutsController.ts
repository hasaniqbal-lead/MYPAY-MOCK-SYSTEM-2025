import { Response } from 'express';
import { prisma } from '../config/database';
import { AuthenticatedRequest, PaginationParams } from '../types';

class PortalPayoutsController {
  /**
   * List payouts for the authenticated merchant
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
      } = req.query as unknown as PaginationParams;

      const offset = (Number(page) - 1) * Number(limit);

      // Build where clause
      const where: {
        merchantId?: number;
        status?: string;
        createdAt?: { gte?: Date; lte?: Date };
      } = {
        merchantId: merchantId,
      };

      if (status) {
        where.status = status;
      }

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) {
          where.createdAt.gte = new Date(startDate);
        }
        if (endDate) {
          where.createdAt.lte = new Date(endDate + ' 23:59:59');
        }
      }

      // Get payouts
      const payouts = await prisma.payout.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: Number(limit),
        skip: offset,
      });

      // Get total count
      const total = await prisma.payout.count({ where });

      // Format payouts
      const formattedPayouts = payouts.map((payout: any) => ({
        id: payout.id,
        merchantReference: payout.merchantReference,
        amount: Number(payout.amount),
        currency: payout.currency,
        status: payout.status,
        destType: payout.destType,
        bankCode: payout.bankCode,
        walletCode: payout.walletCode,
        accountNumber: payout.accountNumber,
        accountTitle: payout.accountTitle,
        failureReason: payout.failureReason,
        pspReference: payout.pspReference,
        processedAt: payout.processedAt,
        createdAt: payout.createdAt,
        updatedAt: payout.updatedAt,
      }));

      res.json({
        success: true,
        payouts: formattedPayouts,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      console.error('Failed to list payouts:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve payouts',
      });
    }
  }

  /**
   * Get a specific payout by ID
   */
  async get(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const merchantId = req.merchantId;
      const { id } = req.params;

      // Get payout and verify it belongs to the merchant
      const payout = await prisma.payout.findFirst({
        where: {
          id,
          merchantId,
        },
      });

      if (!payout) {
        res.status(404).json({
          success: false,
          error: 'Payout not found',
        });
        return;
      }

      // Format payout
      const formattedPayout = {
        id: payout.id,
        merchantReference: payout.merchantReference,
        amount: Number(payout.amount),
        currency: payout.currency,
        status: payout.status,
        destType: payout.destType,
        bankCode: payout.bankCode,
        walletCode: payout.walletCode,
        accountNumber: payout.accountNumber,
        accountTitle: payout.accountTitle,
        failureReason: payout.failureReason,
        pspReference: payout.pspReference,
        processedAt: payout.processedAt,
        createdAt: payout.createdAt,
        updatedAt: payout.updatedAt,
      };

      res.json({
        success: true,
        payout: formattedPayout,
      });
    } catch (error) {
      console.error('Failed to get payout:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve payout',
      });
    }
  }

  /**
   * Export payouts to CSV or JSON
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

      // Build where clause
      const where: {
        merchantId?: number;
        status?: string;
        createdAt?: { gte?: Date; lte?: Date };
      } = {
        merchantId,
      };

      if (status) {
        where.status = status;
      }

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) {
          where.createdAt.gte = new Date(startDate);
        }
        if (endDate) {
          where.createdAt.lte = new Date(endDate + ' 23:59:59');
        }
      }

      // Get all payouts (no pagination for export)
      const payouts = await prisma.payout.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });

      if (format === 'json') {
        // JSON Export
        const formattedPayouts = payouts.map((payout: any) => ({
          id: payout.id,
          merchantReference: payout.merchantReference,
          amount: Number(payout.amount),
          currency: payout.currency,
          status: payout.status,
          destType: payout.destType,
          bankCode: payout.bankCode,
          walletCode: payout.walletCode,
          accountNumber: payout.accountNumber,
          accountTitle: payout.accountTitle,
          failureReason: payout.failureReason,
          pspReference: payout.pspReference,
          processedAt: payout.processedAt,
          createdAt: payout.createdAt,
          updatedAt: payout.updatedAt,
        }));

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=payouts.json');
        res.json(formattedPayouts);
      } else if (format === 'csv') {
        // CSV Export
        const csvHeaders = [
          'ID',
          'Merchant Reference',
          'Amount',
          'Currency',
          'Status',
          'Destination Type',
          'Bank Code',
          'Wallet Code',
          'Account Number',
          'Account Title',
          'Failure Reason',
          'PSP Reference',
          'Processed At',
          'Created At',
          'Updated At',
        ].join(',');

        const csvRows = payouts.map((payout: any) => {
          return [
            payout.id,
            payout.merchantReference,
            Number(payout.amount),
            payout.currency,
            payout.status,
            payout.destType,
            payout.bankCode || '',
            payout.walletCode || '',
            payout.accountNumber,
            `"${payout.accountTitle}"`, // Quoted in case of commas in name
            payout.failureReason || '',
            payout.pspReference || '',
            payout.processedAt || '',
            payout.createdAt,
            payout.updatedAt,
          ].join(',');
        });

        const csvContent = [csvHeaders, ...csvRows].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=payouts.csv');
        res.send(csvContent);
      } else {
        res.status(400).json({
          success: false,
          error: 'Invalid export format. Use csv or json.',
        });
      }
    } catch (error) {
      console.error('Failed to export payouts:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to export payouts',
      });
    }
  }
}

export const portalPayoutsController = new PortalPayoutsController();

