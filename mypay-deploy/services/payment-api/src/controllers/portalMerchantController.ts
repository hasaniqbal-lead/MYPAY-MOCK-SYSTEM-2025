import { Response } from 'express';
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

      res.json({
        success: true,
        credentials: {
          vendorId: apiKey.vendor_id,
          apiKey: apiKey.api_key,
          apiSecret: apiKey.api_secret,
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
   * Generate new API key
   */
  async generateApiKey(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const merchantId = req.merchantId;

      // Deactivate old keys
      await prisma.apiKey.updateMany({
        where: { merchant_id: merchantId },
        data: { is_active: false },
      });

      // Generate new key
      const vendorId = `VENDOR_${merchantId!.toString().padStart(6, '0')}`;
      const apiKey = `api-key-${uuidv4().substring(0, 8)}`;
      const apiSecret = `api-secret-${uuidv4()}`;

      await prisma.apiKey.create({
        data: {
          vendor_id: vendorId,
          api_key: apiKey,
          api_secret: apiSecret,
          merchant_id: merchantId!,
          is_active: true,
        },
      });

      res.json({
        success: true,
        credentials: {
          vendorId,
          apiKey,
          apiSecret,
        },
      });
    } catch (error) {
      console.error('Generate API key error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate API key',
      });
    }
  }
}

export const portalMerchantController = new PortalMerchantController();

