import { Response } from 'express';
import { prisma } from '../config/database';
import { AuthenticatedRequest } from '../types';

class PSPController {
  // ============ PSP CRUD ============

  async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const psps = await prisma.pSP.findMany({
        include: { credentials: true, rates: { where: { is_active: true } } },
        orderBy: { created_at: 'desc' },
      });
      res.json({
        success: true,
        psps: psps.map(p => ({
          id: p.id, name: p.name, code: p.code, logoUrl: p.logo_url,
          isActive: p.is_active, environment: p.environment, createdAt: p.created_at,
          credentials: p.credentials.map(c => ({
            id: c.id, environment: c.environment, merchantId: c.merchant_id,
            hasApiKey: !!c.api_key, hasApiSecret: !!c.api_secret,
            webhookUrl: c.webhook_url, isActive: c.is_active,
          })),
          rates: p.rates.map(r => ({
            id: r.id, paymentMethod: r.payment_method,
            ratePercent: Number(r.rate_percent), fixedFee: Number(r.fixed_fee),
            currency: r.currency, effectiveFrom: r.effective_from,
          })),
        })),
      });
    } catch (error) {
      console.error('List PSPs error:', error);
      res.status(500).json({ success: false, error: 'Failed to list PSPs' });
    }
  }

  async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { name, code, logoUrl, environment } = req.body;
      if (!name || !code) {
        res.status(400).json({ success: false, error: 'name and code are required' }); return;
      }
      const psp = await prisma.pSP.create({
        data: { name, code, logo_url: logoUrl, environment: environment || 'sandbox', is_active: true },
      });
      res.status(201).json({ success: true, psp: { id: psp.id, name: psp.name, code: psp.code } });
    } catch (error: any) {
      if (error.code === 'P2002') res.status(409).json({ success: false, error: 'PSP code already exists' });
      else res.status(500).json({ success: false, error: 'Failed to create PSP' });
    }
  }

  async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, logoUrl, isActive, environment } = req.body;
      const data: any = {};
      if (name !== undefined) data.name = name;
      if (logoUrl !== undefined) data.logo_url = logoUrl;
      if (isActive !== undefined) data.is_active = isActive;
      if (environment !== undefined) data.environment = environment;
      await prisma.pSP.update({ where: { id: Number(id) }, data });
      res.json({ success: true, message: 'PSP updated' });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to update PSP' });
    }
  }

  // ============ CREDENTIALS ============

  async upsertCredential(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params; // psp_id
      const { environment, apiKey, apiSecret, merchantId, webhookUrl, extraConfig } = req.body;
      const env = environment || 'sandbox';

      await prisma.pSPCredential.upsert({
        where: { psp_id_environment: { psp_id: Number(id), environment: env } },
        update: {
          api_key: apiKey, api_secret: apiSecret, merchant_id: merchantId,
          webhook_url: webhookUrl, extra_config: extraConfig, is_active: true,
        },
        create: {
          psp_id: Number(id), environment: env,
          api_key: apiKey, api_secret: apiSecret, merchant_id: merchantId,
          webhook_url: webhookUrl, extra_config: extraConfig, is_active: true,
        },
      });
      res.json({ success: true, message: 'Credentials saved' });
    } catch (error) {
      console.error('Upsert cred error:', error);
      res.status(500).json({ success: false, error: 'Failed to save credentials' });
    }
  }

  // ============ RATES ============

  async setRate(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params; // psp_id
      const { paymentMethod, ratePercent, fixedFee } = req.body;
      if (!paymentMethod || ratePercent === undefined) {
        res.status(400).json({ success: false, error: 'paymentMethod and ratePercent are required' }); return;
      }

      // Deactivate old rate for this method
      await prisma.pSPRate.updateMany({
        where: { psp_id: Number(id), payment_method: paymentMethod },
        data: { is_active: false },
      });

      // Create new rate
      const rate = await prisma.pSPRate.create({
        data: {
          psp_id: Number(id), payment_method: paymentMethod,
          rate_percent: ratePercent, fixed_fee: fixedFee || 0,
          is_active: true,
        },
      });
      res.json({ success: true, rate: { id: rate.id, ratePercent: Number(rate.rate_percent), fixedFee: Number(rate.fixed_fee) } });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to set rate' });
    }
  }

  // ============ MERCHANT RATES ============

  async listMerchantRates(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { merchantId } = req.params;
      const rates = await prisma.merchantRate.findMany({
        where: { merchant_id: Number(merchantId), is_active: true },
      });
      res.json({
        success: true,
        rates: rates.map(r => ({
          id: r.id, paymentMethod: r.payment_method,
          ratePercent: Number(r.rate_percent), fixedFee: Number(r.fixed_fee),
          effectiveFrom: r.effective_from,
        })),
      });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to list merchant rates' });
    }
  }

  async setMerchantRate(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { merchantId } = req.params;
      const { paymentMethod, ratePercent, fixedFee } = req.body;
      if (!paymentMethod || ratePercent === undefined) {
        res.status(400).json({ success: false, error: 'paymentMethod and ratePercent are required' }); return;
      }

      // Deactivate old rate
      await prisma.merchantRate.updateMany({
        where: { merchant_id: Number(merchantId), payment_method: paymentMethod },
        data: { is_active: false },
      });

      await prisma.merchantRate.create({
        data: {
          merchant_id: Number(merchantId), payment_method: paymentMethod,
          rate_percent: ratePercent, fixed_fee: fixedFee || 0, is_active: true,
        },
      });
      res.json({ success: true, message: 'Merchant rate set' });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to set merchant rate' });
    }
  }

  // ============ MARGIN CALCULATOR ============

  async getMargins(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Get all active PSP rates
      const pspRates = await prisma.pSPRate.findMany({
        where: { is_active: true },
        include: { psp: { select: { name: true, code: true } } },
      });

      // Get all active merchant rates
      const merchantRates = await prisma.merchantRate.findMany({
        where: { is_active: true },
        include: { merchant: { select: { name: true, company_name: true } } },
      });

      // Default merchant rates (if not set per merchant)
      const defaultMerchantRates: Record<string, number> = {
        easypaisa: 2.5, jazzcash: 2.5, card: 3.0,
      };

      // Calculate margins
      const margins = pspRates.map(pr => {
        const method = pr.payment_method;
        const pspRate = Number(pr.rate_percent);
        const merchantRate = defaultMerchantRates[method] || 2.5;
        const margin = merchantRate - pspRate;

        return {
          pspName: pr.psp?.name,
          paymentMethod: method,
          pspRate,
          merchantRate,
          margin,
          fixedFee: Number(pr.fixed_fee),
        };
      });

      res.json({ success: true, margins, pspRates: pspRates.length, merchantRates: merchantRates.length });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to calculate margins' });
    }
  }
}

export const pspController = new PSPController();
