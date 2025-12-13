import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';
import { AuthenticatedAdminRequest } from '../middleware/adminAuth';
import crypto from 'crypto';

class AdminMerchantsController {
  /**
   * Get all merchants with statistics
   */
  async getAllMerchants(req: AuthenticatedAdminRequest, res: Response): Promise<void> {
    try {
      if (!req.admin) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      // Fetch all merchants with their transaction counts and volumes
      const merchants = await prisma.merchant.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          transactions: {
            select: {
              id: true,
              amount: true,
              status: true,
            },
          },
          payouts: {
            select: {
              id: true,
              amount: true,
              status: true,
            },
          },
        },
      });

      // Transform data to include statistics
      const merchantsWithStats = merchants.map((merchant) => {
        const completedTransactions = merchant.transactions.filter(
          (t) => t.status === 'completed'
        );
        const totalVolume = completedTransactions.reduce(
          (sum, t) => sum + parseFloat(t.amount.toString()),
          0
        );

        const completedPayouts = merchant.payouts.filter(
          (p) => p.status === 'SUCCESS' || p.status === 'COMPLETED'
        );
        const totalPayoutVolume = completedPayouts.reduce(
          (sum, p) => sum + parseFloat(p.amount.toString()),
          0
        );

        return {
          id: merchant.id,
          merchant_id: `MERCHANT_${String(merchant.id).padStart(4, '0')}`,
          name: merchant.name,
          email: merchant.email,
          company_name: merchant.company_name || merchant.name,
          status: merchant.status,
          isActive: merchant.isActive,
          createdAt: merchant.createdAt,
          updatedAt: merchant.updatedAt,
          // Statistics
          transactionCount: merchant.transactions.length,
          totalVolume: totalVolume,
          payoutCount: merchant.payouts.length,
          totalPayoutVolume: totalPayoutVolume,
          webhookUrl: merchant.webhookUrl,
        };
      });

      res.json({
        success: true,
        merchants: merchantsWithStats,
        total: merchantsWithStats.length,
      });
    } catch (error) {
      console.error('Get merchants error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch merchants' });
    }
  }

  /**
   * Get single merchant by ID with detailed information
   */
  async getMerchantById(req: AuthenticatedAdminRequest, res: Response): Promise<void> {
    try {
      if (!req.admin) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const merchantId = parseInt(req.params.id);
      if (isNaN(merchantId)) {
        res.status(400).json({ success: false, error: 'Invalid merchant ID' });
        return;
      }

      const merchant = await prisma.merchant.findUnique({
        where: { id: merchantId },
        include: {
          transactions: {
            select: {
              id: true,
              amount: true,
              status: true,
              created_at: true,
            },
            orderBy: { created_at: 'desc' },
            take: 10,
          },
          payouts: {
            select: {
              id: true,
              amount: true,
              status: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
          apiKeys: {
            select: {
              api_key: true,
              is_active: true,
              created_at: true,
            },
          },
        },
      });

      if (!merchant) {
        res.status(404).json({ success: false, error: 'Merchant not found' });
        return;
      }

      res.json({
        success: true,
        merchant: {
          id: merchant.id,
          merchant_id: `MERCHANT_${String(merchant.id).padStart(4, '0')}`,
          name: merchant.name,
          email: merchant.email,
          company_name: merchant.company_name || merchant.name,
          status: merchant.status,
          isActive: merchant.isActive,
          webhookUrl: merchant.webhookUrl,
          createdAt: merchant.createdAt,
          updatedAt: merchant.updatedAt,
          recentTransactions: merchant.transactions,
          recentPayouts: merchant.payouts,
          apiKeys: merchant.apiKeys,
        },
      });
    } catch (error) {
      console.error('Get merchant by ID error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch merchant' });
    }
  }

  /**
   * Create new merchant
   */
  async createMerchant(req: AuthenticatedAdminRequest, res: Response): Promise<void> {
    try {
      if (!req.admin) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const { email, name, company_name, webhookUrl } = req.body;

      // Validation
      if (!email || !name) {
        res.status(400).json({
          success: false,
          error: 'Email and name are required',
        });
        return;
      }

      // Check if merchant already exists
      const existingMerchant = await prisma.merchant.findUnique({
        where: { email },
      });

      if (existingMerchant) {
        res.status(400).json({
          success: false,
          error: 'Merchant with this email already exists',
        });
        return;
      }

      // Generate random password
      const password = crypto.randomBytes(8).toString('hex');
      const passwordHash = await bcrypt.hash(password, 10);

      // Generate Payment API key (for checkouts)
      const paymentApiKey = `mypay_${crypto.randomBytes(32).toString('hex')}`;

      // Generate Payout API key (plain and hashed)
      const payoutApiKeyPlain = `mypay_${crypto.randomBytes(32).toString('hex')}`;
      const payoutApiKeyHash = await bcrypt.hash(payoutApiKeyPlain, 10);

      // Create merchant
      const merchant = await prisma.merchant.create({
        data: {
          email,
          name,
          company_name: company_name || name,
          password_hash: passwordHash,
          apiKey: payoutApiKeyHash,
          apiKeyPlain: payoutApiKeyPlain,
          webhookUrl: webhookUrl || null,
          isActive: true,
          status: 'active',
        },
      });

      // Create Payment API key record
      await prisma.apiKey.create({
        data: {
          merchant_id: merchant.id,
          api_key: paymentApiKey,
          is_active: true,
        },
      });

      // Create initial merchant balance for payouts
      await prisma.merchantBalance.create({
        data: {
          merchantId: merchant.id,
          balance: 10000000, // 10M PKR initial balance for testing
          lockedBalance: 0,
          version: 0,
        },
      });

      res.status(201).json({
        success: true,
        message: 'Merchant created successfully',
        merchant: {
          id: merchant.id,
          merchant_id: `MERCHANT_${String(merchant.id).padStart(4, '0')}`,
          email: merchant.email,
          name: merchant.name,
          company_name: merchant.company_name,
          status: merchant.status,
          isActive: merchant.isActive,
          webhookUrl: merchant.webhookUrl,
          createdAt: merchant.createdAt,
        },
        credentials: {
          email: merchant.email,
          password: password,
          payment_api_key: paymentApiKey,
          payout_api_key: payoutApiKeyPlain,
        },
      });
    } catch (error) {
      console.error('Create merchant error:', error);
      res.status(500).json({ success: false, error: 'Failed to create merchant' });
    }
  }

  /**
   * Update merchant details
   */
  async updateMerchant(req: AuthenticatedAdminRequest, res: Response): Promise<void> {
    try {
      if (!req.admin) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const merchantId = parseInt(req.params.id);
      if (isNaN(merchantId)) {
        res.status(400).json({ success: false, error: 'Invalid merchant ID' });
        return;
      }

      const { name, company_name, webhookUrl, status, isActive } = req.body;

      // Check if merchant exists
      const existingMerchant = await prisma.merchant.findUnique({
        where: { id: merchantId },
      });

      if (!existingMerchant) {
        res.status(404).json({ success: false, error: 'Merchant not found' });
        return;
      }

      // Update merchant
      const updatedMerchant = await prisma.merchant.update({
        where: { id: merchantId },
        data: {
          name: name || existingMerchant.name,
          company_name: company_name !== undefined ? company_name : existingMerchant.company_name,
          webhookUrl: webhookUrl !== undefined ? webhookUrl : existingMerchant.webhookUrl,
          status: status || existingMerchant.status,
          isActive: isActive !== undefined ? isActive : existingMerchant.isActive,
        },
      });

      res.json({
        success: true,
        message: 'Merchant updated successfully',
        merchant: {
          id: updatedMerchant.id,
          merchant_id: `MERCHANT_${String(updatedMerchant.id).padStart(4, '0')}`,
          name: updatedMerchant.name,
          email: updatedMerchant.email,
          company_name: updatedMerchant.company_name,
          status: updatedMerchant.status,
          isActive: updatedMerchant.isActive,
          webhookUrl: updatedMerchant.webhookUrl,
          updatedAt: updatedMerchant.updatedAt,
        },
      });
    } catch (error) {
      console.error('Update merchant error:', error);
      res.status(500).json({ success: false, error: 'Failed to update merchant' });
    }
  }

  /**
   * Toggle merchant active status
   */
  async toggleMerchantStatus(req: AuthenticatedAdminRequest, res: Response): Promise<void> {
    try {
      if (!req.admin) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const merchantId = parseInt(req.params.id);
      if (isNaN(merchantId)) {
        res.status(400).json({ success: false, error: 'Invalid merchant ID' });
        return;
      }

      const merchant = await prisma.merchant.findUnique({
        where: { id: merchantId },
      });

      if (!merchant) {
        res.status(404).json({ success: false, error: 'Merchant not found' });
        return;
      }

      const updatedMerchant = await prisma.merchant.update({
        where: { id: merchantId },
        data: {
          isActive: !merchant.isActive,
          status: !merchant.isActive ? 'active' : 'inactive',
        },
      });

      res.json({
        success: true,
        message: `Merchant ${updatedMerchant.isActive ? 'activated' : 'deactivated'} successfully`,
        merchant: {
          id: updatedMerchant.id,
          isActive: updatedMerchant.isActive,
          status: updatedMerchant.status,
        },
      });
    } catch (error) {
      console.error('Toggle merchant status error:', error);
      res.status(500).json({ success: false, error: 'Failed to toggle merchant status' });
    }
  }

  /**
   * Get merchant transactions with optional filtering
   */
  async getMerchantTransactions(req: AuthenticatedAdminRequest, res: Response): Promise<void> {
    try {
      if (!req.admin) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const merchantId = req.query.merchantId ? parseInt(req.query.merchantId as string) : undefined;
      const status = req.query.status as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

      const where: any = {};
      if (merchantId) {
        where.merchant_id = merchantId;
      }
      if (status) {
        where.status = status;
      }

      const transactions = await prisma.paymentTransaction.findMany({
        where,
        include: {
          merchant: {
            select: {
              id: true,
              name: true,
              email: true,
              company_name: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        take: limit,
      });

      res.json({
        success: true,
        transactions: transactions.map((t) => ({
          id: t.id,
          checkout_id: t.checkout_id,
          reference: t.reference,
          amount: parseFloat(t.amount.toString()),
          currency: t.currency,
          status: t.status,
          payment_method: t.payment_method,
          created_at: t.created_at,
          updated_at: t.updated_at,
          merchant: {
            id: t.merchant.id,
            merchant_id: `MERCHANT_${String(t.merchant.id).padStart(4, '0')}`,
            name: t.merchant.name,
            company_name: t.merchant.company_name,
          },
        })),
        total: transactions.length,
      });
    } catch (error) {
      console.error('Get merchant transactions error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch transactions' });
    }
  }

  /**
   * Get merchant payouts with optional filtering
   */
  async getMerchantPayouts(req: AuthenticatedAdminRequest, res: Response): Promise<void> {
    try {
      if (!req.admin) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const merchantId = req.query.merchantId ? parseInt(req.query.merchantId as string) : undefined;
      const status = req.query.status as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

      const where: any = {};
      if (merchantId) {
        where.merchantId = merchantId;
      }
      if (status) {
        where.status = status;
      }

      const payouts = await prisma.payout.findMany({
        where,
        include: {
          merchant: {
            select: {
              id: true,
              name: true,
              email: true,
              company_name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      res.json({
        success: true,
        payouts: payouts.map((p) => ({
          id: p.id,
          merchantReference: p.merchantReference,
          amount: parseFloat(p.amount.toString()),
          currency: p.currency,
          destType: p.destType,
          bankCode: p.bankCode,
          walletCode: p.walletCode,
          accountNumber: p.accountNumber,
          accountTitle: p.accountTitle,
          status: p.status,
          failureReason: p.failureReason,
          createdAt: p.createdAt,
          processedAt: p.processedAt,
          merchant: {
            id: p.merchant.id,
            merchant_id: `MERCHANT_${String(p.merchant.id).padStart(4, '0')}`,
            name: p.merchant.name,
            company_name: p.merchant.company_name,
          },
        })),
        total: payouts.length,
      });
    } catch (error) {
      console.error('Get merchant payouts error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch payouts' });
    }
  }
}

export const adminMerchantsController = new AdminMerchantsController();

