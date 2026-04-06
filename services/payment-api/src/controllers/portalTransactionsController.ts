import { Response } from 'express';
import fs from 'fs';
import path from 'path';
import { prisma } from '../config/database';
import { AuthenticatedRequest, PaginationParams } from '../types';

// Load receipt logo as base64 at startup
let receiptLogoBase64 = '';
try {
  const logoPath = path.join(__dirname, '..', 'assets', 'receipt-logo.png');
  if (fs.existsSync(logoPath)) {
    receiptLogoBase64 = fs.readFileSync(logoPath).toString('base64');
  }
} catch {}

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
  /**
   * Download transaction receipt as printable HTML
   */
  async getReceipt(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const merchantId = req.merchantId;

      const transaction = await prisma.paymentTransaction.findFirst({
        where: { checkout_id: id, merchant_id: merchantId },
        include: { merchant: true },
      });

      if (!transaction) {
        res.status(404).json({ success: false, error: 'Transaction not found' });
        return;
      }

      const brandName = process.env.ORG_BRAND_NAME || 'Payment Platform';
      const date = new Date(transaction.created_at).toLocaleString('en-PK', { dateStyle: 'long', timeStyle: 'short' });
      const status = transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1);
      const method = (transaction.payment_method || 'N/A').charAt(0).toUpperCase() + (transaction.payment_method || 'N/A').slice(1);

      const logoImg = receiptLogoBase64 ? `<img src="data:image/png;base64,${receiptLogoBase64}" alt="${brandName}" style="height:40px;margin-bottom:8px;" />` : '';

      const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Receipt - ${transaction.reference}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #fff; color: #1a1a1a; padding: 40px; max-width: 600px; margin: 0 auto; }
  .header { text-align: center; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 24px; }
  .header h1 { font-size: 20px; font-weight: 600; color: #111; margin-top: 8px; }
  .header p { font-size: 12px; color: #6b7280; margin-top: 4px; }
  .amount { text-align: center; padding: 24px 0; }
  .amount .value { font-size: 36px; font-weight: 700; }
  .amount .status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-top: 8px; }
  .status-completed, .status-success { background: #dcfce7; color: #166534; }
  .status-pending { background: #fef9c3; color: #854d0e; }
  .status-failed { background: #fee2e2; color: #991b1b; }
  .status-refunded { background: #f3e8ff; color: #7c3aed; }
  .details { margin: 24px 0; }
  .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f3f4f6; }
  .row .label { color: #6b7280; font-size: 13px; }
  .row .val { font-size: 13px; font-weight: 500; text-align: right; max-width: 300px; word-break: break-all; }
  .footer { text-align: center; margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; }
  @media print { body { padding: 20px; } .no-print { display: none; } }
  @page { size: A5; margin: 10mm; }
</style></head><body>
<div class="header">${logoImg}<h1>${brandName}</h1><p>Transaction Receipt</p></div>
<div class="amount"><div class="value">PKR ${Number(transaction.amount).toLocaleString()}</div><div class="status status-${transaction.status.toLowerCase()}">${status}</div></div>
<div class="details">
<div class="row"><span class="label">Transaction ID</span><span class="val">${transaction.checkout_id}</span></div>
<div class="row"><span class="label">Reference</span><span class="val">${transaction.reference}</span></div>
<div class="row"><span class="label">Payment Method</span><span class="val">${method}</span></div>
<div class="row"><span class="label">Date</span><span class="val">${date}</span></div>
<div class="row"><span class="label">Merchant</span><span class="val">${transaction.merchant?.company_name || transaction.merchant?.name || brandName}</span></div>
</div>
<div class="footer">${logoImg ? `<img src="data:image/png;base64,${receiptLogoBase64}" alt="${brandName}" style="height:20px;margin-bottom:4px;opacity:0.5;" /><br/>` : ''}<p>This is a system-generated receipt.</p><p>${brandName} &mdash; ${new Date().getFullYear()}</p></div>
<script>window.onload=function(){window.print()}</script>
</body></html>`;

      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      console.error('Receipt error:', error);
      res.status(500).json({ success: false, error: 'Failed to generate receipt' });
    }
  }
}

export const portalTransactionsController = new PortalTransactionsController();

