import { Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../config/database';
import { AuthenticatedRequest } from '../types';

class PortalMerchantController {
  /**
   * Get merchant profile
   */
  async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const merchantId = req.merchantId;

      const merchant = await prisma.merchant.findUnique({
        where: { id: merchantId },
      });

      if (!merchant) {
        res.status(404).json({
          success: false,
          error: 'Merchant not found',
        });
        return;
      }

      res.json({
        success: true,
        merchant: {
          id: merchant.id,
          email: merchant.email,
          companyName: merchant.company_name,
          status: merchant.status,
          createdAt: merchant.createdAt,
        },
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get profile',
      });
    }
  }

  /**
   * Update merchant profile
   */
  async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const merchantId = req.merchantId;
      const { companyName, email, currentPassword, newPassword } = req.body;

      // If changing password
      if (newPassword) {
        if (!currentPassword) {
          res.status(400).json({
            success: false,
            error: 'Current password is required to change password',
          });
          return;
        }

        if (newPassword.length < 6) {
          res.status(400).json({
            success: false,
            error: 'New password must be at least 6 characters',
          });
          return;
        }

        const merchant = await prisma.merchant.findUnique({
          where: { id: merchantId },
        });

        if (!merchant) {
          res.status(404).json({
            success: false,
            error: 'Merchant not found',
          });
          return;
        }

        // Verify current password
        const isValid = merchant.password_hash ? await bcrypt.compare(currentPassword, merchant.password_hash) : false;

        if (!isValid) {
          res.status(401).json({
            success: false,
            error: 'Current password is incorrect',
          });
          return;
        }

        // Hash new password
        const newPasswordHash = await bcrypt.hash(newPassword, 10);

        // Update password
        await prisma.merchant.update({
          where: { id: merchantId },
          data: { password_hash: newPasswordHash },
        });
      }

      // Build update data
      const updateData: { company_name?: string; email?: string } = {};

      if (companyName) {
        updateData.company_name = companyName;
      }

      if (email) {
        // Check if email is already taken
        const existing = await prisma.merchant.findFirst({
          where: {
            email,
            NOT: { id: merchantId },
          },
        });

        if (existing) {
          res.status(400).json({
            success: false,
            error: 'Email already in use',
          });
          return;
        }

        updateData.email = email;
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.merchant.update({
          where: { id: merchantId },
          data: updateData,
        });
      }

      // Get updated merchant
      const updatedMerchant = await prisma.merchant.findUnique({
        where: { id: merchantId },
      });

      res.json({
        success: true,
        merchant: {
          id: updatedMerchant!.id,
          email: updatedMerchant!.email,
          companyName: updatedMerchant!.company_name,
          status: updatedMerchant!.status,
        },
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update profile',
      });
    }
  }

  /**
   * Get API credentials
   */
  async getCredentials(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const merchantId = req.merchantId;

      const apiKey = await prisma.apiKey.findFirst({
        where: {
          merchant_id: merchantId,
          is_active: true,
        },
      });

      if (!apiKey) {
        res.status(404).json({
          success: false,
          error: 'No active API credentials found',
        });
        return;
      }

      // Get merchant for payout API key
      const merchant = await prisma.merchant.findUnique({
        where: { id: merchantId },
      });

      res.json({
        success: true,
        credentials: {
          merchantId: apiKey.vendor_id,
          paymentApiKey: apiKey.api_key,
          payoutApiKey: merchant?.apiKeyPlain || '', // Return plain key, not hashed
          createdAt: apiKey.created_at?.toISOString() || new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('Get credentials error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get credentials',
      });
    }
  }

  /**
   * Generate new API key (additive — does NOT deactivate old keys)
   */
  async generateApiKey(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const merchantId = req.merchantId;
      const { label, allowedMethods } = req.body || {};
      const orgSlug = process.env.ORG_SLUG || 'pay';

      const keyType = req.body.keyType || 'pk';
      const validTypes = ['pk', 'sk'];
      if (!validTypes.includes(keyType)) {
        res.status(400).json({ success: false, error: 'keyType must be "pk" or "sk"' });
        return;
      }

      // Count existing keys by type (limit 3 auto-approved per type)
      const keyCount = await prisma.apiKey.count({ where: { merchant_id: merchantId, key_type: keyType } });
      const needsApproval = keyCount >= 3;
      if (keyCount >= 10) {
        res.status(400).json({ success: false, error: `Maximum 10 ${keyType} keys per merchant` });
        return;
      }

      // Generate new key with proper format
      const prefix = keyType === 'sk' ? 'sk' : 'pk';
      const vendorId = `MERCHANT_${merchantId!.toString().padStart(6, '0')}_${prefix.toUpperCase()}${keyCount + 1}`;
      const apiKey = `${orgSlug}_${prefix}_${crypto.randomBytes(32).toString('hex')}`;
      const apiSecret = `${orgSlug}_secret_${crypto.randomBytes(16).toString('hex')}`;

      const created = await prisma.apiKey.create({
        data: {
          vendor_id: vendorId,
          api_key: apiKey,
          api_secret: apiSecret,
          merchant_id: merchantId!,
          is_active: !needsApproval,
          label: label || 'Default',
          key_type: keyType,
          allowed_methods: keyType === 'pk' ? (allowedMethods || ['easypaisa', 'jazzcash', 'card']) : null,
          approval_status: needsApproval ? 'pending_approval' : 'approved',
        },
      });

      res.json({
        success: true,
        key: {
          id: created.id,
          vendorId: vendorId,
          apiKey: needsApproval ? null : apiKey, // Don't show key until approved
          label: created.label || 'Default',
          keyType: created.key_type,
          allowedMethods: created.allowed_methods,
          isActive: created.is_active,
          approvalStatus: created.approval_status,
          createdAt: created.created_at,
        },
        needsApproval,
        message: needsApproval ? 'Key request submitted for admin approval (exceeded 3 keys)' : 'Key created successfully',
      });
    } catch (error) {
      console.error('Generate API key error:', error);
      res.status(500).json({ success: false, error: 'Failed to generate API key' });
    }
  }

  /**
   * List all API keys for merchant
   */
  async listKeys(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const merchantId = req.merchantId;

      const keys = await prisma.apiKey.findMany({
        where: { merchant_id: merchantId },
        orderBy: { created_at: 'desc' },
      });

      const merchant = await prisma.merchant.findUnique({ where: { id: merchantId! } });

      const pkKeys = keys.filter(k => (k.key_type || 'pk') === 'pk');
      const skKeys = keys.filter(k => k.key_type === 'sk');

      res.json({
        success: true,
        keys: pkKeys.map(k => ({
          id: k.id, vendorId: k.vendor_id,
          apiKey: k.api_key.substring(0, 12) + '...' + k.api_key.slice(-4),
          apiKeyFull: k.approval_status === 'approved' ? k.api_key : null,
          label: k.label || 'Default', keyType: 'pk',
          allowedMethods: k.allowed_methods || ['easypaisa', 'jazzcash', 'card'],
          isActive: k.is_active, approvalStatus: k.approval_status || 'approved',
          createdAt: k.created_at,
        })),
        sendKeys: skKeys.map(k => ({
          id: k.id, vendorId: k.vendor_id,
          apiKey: k.api_key.substring(0, 12) + '...' + k.api_key.slice(-4),
          apiKeyFull: k.approval_status === 'approved' ? k.api_key : null,
          label: k.label || 'Default', keyType: 'sk',
          isActive: k.is_active, approvalStatus: k.approval_status || 'approved',
          createdAt: k.created_at,
        })),
        // Legacy: also return the merchant-level payout key
        payoutKey: merchant?.apiKeyPlain
          ? merchant.apiKeyPlain.substring(0, 12) + '...' + merchant.apiKeyPlain.slice(-4)
          : null,
        payoutKeyFull: merchant?.apiKeyPlain || null,
      });
    } catch (error) {
      console.error('List keys error:', error);
      res.status(500).json({ success: false, error: 'Failed to list keys' });
    }
  }

  /**
   * Toggle API key active status
   */
  async toggleKey(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const merchantId = req.merchantId;
      const { id } = req.params;
      const { isActive, label, allowedMethods } = req.body || {};

      const key = await prisma.apiKey.findFirst({
        where: { id: Number(id), merchant_id: merchantId },
      });

      if (!key) {
        res.status(404).json({ success: false, error: 'Key not found' });
        return;
      }

      const data: any = {};
      if (isActive !== undefined) data.is_active = isActive;
      else data.is_active = !key.is_active; // Toggle if not explicitly set
      if (label !== undefined) data.label = label;
      if (allowedMethods !== undefined) data.allowed_methods = allowedMethods;

      const updated = await prisma.apiKey.update({
        where: { id: Number(id) },
        data,
      });

      res.json({
        success: true,
        key: { id: updated.id, isActive: updated.is_active, label: updated.label, allowedMethods: updated.allowed_methods },
      });
    } catch (error) {
      console.error('Toggle key error:', error);
      res.status(500).json({ success: false, error: 'Failed to toggle key' });
    }
  }

  /**
   * Regenerate payout (sk) key
   */
  async regeneratePayoutKey(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const merchantId = req.merchantId;
      const orgSlug = process.env.ORG_SLUG || 'pay';

      const newSk = `${orgSlug}_sk_${crypto.randomBytes(32).toString('hex')}`;
      const skHash = crypto.createHash('sha256').update(newSk).digest('hex');

      await prisma.merchant.update({
        where: { id: merchantId! },
        data: { apiKey: skHash, apiKeyPlain: newSk },
      });

      res.json({
        success: true,
        payoutKey: newSk,
        message: 'Payout key regenerated. Old key is now invalid.',
      });
    } catch (error) {
      console.error('Regenerate payout key error:', error);
      res.status(500).json({ success: false, error: 'Failed to regenerate payout key' });
    }
  }

  /**
   * Delete API key (soft — deactivates)
   */
  async deleteKey(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const merchantId = req.merchantId;
      const { id } = req.params;

      // Ensure at least one key remains active
      const activeKeys = await prisma.apiKey.count({
        where: { merchant_id: merchantId, is_active: true, id: { not: Number(id) } },
      });

      if (activeKeys === 0) {
        res.status(400).json({ success: false, error: 'Cannot delete last active key' });
        return;
      }

      await prisma.apiKey.delete({ where: { id: Number(id) } });

      res.json({ success: true, message: 'Key deleted' });
    } catch (error) {
      console.error('Delete key error:', error);
      res.status(500).json({ success: false, error: 'Failed to delete key' });
    }
  }
}

export const portalMerchantController = new PortalMerchantController();

