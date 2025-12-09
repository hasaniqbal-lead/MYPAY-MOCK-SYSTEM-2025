import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../config/database';
import { AuthenticatedRequest } from '../types';

class CheckoutController {
  /**
   * Create checkout session
   */
  async createCheckout(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { reference, amount, paymentMethod, paymentType, successUrl, returnUrl, user } =
        req.body;

      // Check if reference already exists
      const existingTransaction = await prisma.paymentTransaction.findFirst({
        where: { reference },
      });

      if (existingTransaction) {
        res.status(400).json({
          success: false,
          error: 'Duplicate reference. Transaction with this reference already exists.',
        });
        return;
      }

      // Generate checkout ID
      const checkoutId = uuidv4();

      // Get merchant_id from API key if available
      let merchantId: number | null = null;
      if (req.vendor?.vendor_id) {
        const apiKey = await prisma.apiKey.findFirst({
          where: { vendor_id: req.vendor.vendor_id },
        });
        if (apiKey?.merchant_id) {
          merchantId = apiKey.merchant_id;
        }
      }

      // Prepare user_data - store as JSON if provided
      const userData = user ? user : undefined;

      // Save transaction to database
      await prisma.paymentTransaction.create({
        data: {
          checkout_id: checkoutId,
          vendor_id: req.vendor?.vendor_id || null,
          reference,
          amount,
          payment_method: paymentMethod,
          payment_type: paymentType,
          success_url: successUrl,
          return_url: returnUrl,
          user_data: userData,
          status: 'pending',
          merchant_id: merchantId,
        },
      });

      // Generate checkout URL
      const baseUrl = process.env.CHECKOUT_BASE_URL || `http://localhost:${process.env.PORT || 3000}/payment`;
      const checkoutUrl = `${baseUrl}/${checkoutId}`;

      // Return success response
      res.status(200).json({
        success: true,
        checkoutUrl,
        checkoutId,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
      });
    } catch (error) {
      console.error('Checkout creation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create checkout session',
      });
    }
  }

  /**
   * Get checkout details
   */
  async getCheckout(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { checkoutId } = req.params;

      const transaction = await prisma.paymentTransaction.findUnique({
        where: { checkout_id: checkoutId },
      });

      if (!transaction) {
        res.status(404).json({
          success: false,
          error: 'Checkout session not found',
        });
        return;
      }

      res.json({
        success: true,
        checkout: {
          checkoutId: transaction.checkout_id,
          reference: transaction.reference,
          amount: Number(transaction.amount),
          paymentMethod: transaction.payment_method,
          status: transaction.status,
          createdAt: transaction.created_at,
        },
      });
    } catch (error) {
      console.error('Get checkout error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve checkout session',
      });
    }
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { reference } = req.params;

      const transaction = await prisma.paymentTransaction.findFirst({
        where: { reference },
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
          reference: transaction.reference,
          checkoutId: transaction.checkout_id,
          amount: Number(transaction.amount),
          paymentMethod: transaction.payment_method,
          status: transaction.status,
          statusCode: transaction.status_code,
          createdAt: transaction.created_at,
          updatedAt: transaction.updated_at,
        },
      });
    } catch (error) {
      console.error('Get transaction status error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve transaction status',
      });
    }
  }
}

export const checkoutController = new CheckoutController();

