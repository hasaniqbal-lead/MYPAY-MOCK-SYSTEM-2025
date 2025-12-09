import axios from 'axios';
import { prisma } from '../config/database';
import { WebhookPayload } from '../types';

class WebhookService {
  private retryAttempts: number;
  private retryDelay: number;

  constructor() {
    this.retryAttempts = parseInt(process.env.WEBHOOK_RETRY_ATTEMPTS || '3');
    this.retryDelay = parseInt(process.env.WEBHOOK_RETRY_DELAY || '5000');
  }

  /**
   * Send webhook notification
   */
  async sendWebhook(checkoutId: string): Promise<boolean> {
    try {
      const transaction = await prisma.paymentTransaction.findUnique({
        where: { checkout_id: checkoutId },
      });

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      // Prepare webhook payload
      const payload: WebhookPayload = {
        id: transaction.checkout_id,
        vendorId: transaction.vendor_id || 'TEST_VENDOR_001',
        checkoutId: transaction.checkout_id,
        reference: transaction.reference,
        paymentMethod: transaction.payment_method,
        status: transaction.status,
        statusCode: transaction.status_code || '',
        createdAt: transaction.created_at,
        updatedAt: transaction.updated_at,
        amount: Number(transaction.amount),
        acknowledged: false,
        tokenId: transaction.checkout_id,
        message: this.getStatusMessage(transaction.status_code || ''),
      };

      // Include user data if exists
      if (transaction.user_data) {
        try {
          payload.user = typeof transaction.user_data === 'string' 
            ? JSON.parse(transaction.user_data) 
            : transaction.user_data;
        } catch {
          // Ignore JSON parse errors
        }
      }

      // Send webhook with retry logic
      await this.sendWithRetry(transaction.success_url, payload, transaction.checkout_id);

      // Update webhook status
      await prisma.paymentTransaction.update({
        where: { checkout_id: checkoutId },
        data: { webhook_status: 'sent' },
      });

      console.log(`✅ Webhook sent successfully for checkout: ${checkoutId}`);
      return true;
    } catch (error) {
      console.error(`❌ Webhook failed for checkout ${checkoutId}:`, (error as Error).message);

      // Update webhook status to failed
      await prisma.paymentTransaction.update({
        where: { checkout_id: checkoutId },
        data: { webhook_status: 'failed' },
      });

      return false;
    }
  }

  /**
   * Send webhook with retry logic
   */
  private async sendWithRetry(
    url: string,
    payload: WebhookPayload,
    checkoutId: string,
    attempt = 1
  ): Promise<void> {
    try {
      const response = await axios.post(url, payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Source': 'mypay-payment-api',
        },
        timeout: 10000,
      });

      // Log successful webhook
      await this.logWebhook(
        checkoutId,
        url,
        payload,
        response.status,
        response.data,
        null,
        attempt
      );
    } catch (error) {
      const axiosError = error as { response?: { status: number; data: unknown }; message: string };
      const errorMessage = axiosError.message;
      const responseStatus = axiosError.response?.status || null;
      const responseBody = axiosError.response?.data || null;

      // Log failed attempt
      await this.logWebhook(
        checkoutId,
        url,
        payload,
        responseStatus,
        responseBody,
        errorMessage,
        attempt
      );

      // Retry if attempts remaining
      if (attempt < this.retryAttempts) {
        console.log(`Retrying webhook for ${checkoutId}, attempt ${attempt + 1}...`);

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, this.retryDelay));

        return this.sendWithRetry(url, payload, checkoutId, attempt + 1);
      }

      throw error;
    }
  }

  /**
   * Log webhook attempt
   */
  private async logWebhook(
    checkoutId: string,
    url: string,
    payload: WebhookPayload,
    responseStatus: number | null,
    responseBody: unknown,
    errorMessage: string | null,
    attemptNumber: number
  ): Promise<void> {
    try {
      await prisma.paymentWebhookLog.create({
        data: {
          checkout_id: checkoutId,
          url,
          payload: JSON.stringify(payload),
          response_status: responseStatus,
          response_body: responseBody ? JSON.stringify(responseBody) : null,
          error_message: errorMessage,
          attempt_number: attemptNumber,
        },
      });
    } catch (error) {
      console.error('Failed to log webhook:', (error as Error).message);
    }
  }

  /**
   * Get status message based on status code
   */
  private getStatusMessage(statusCode: string): string {
    const messages: Record<string, string> = {
      SUCCESS: 'Payment completed successfully',
      FAILED: 'Transaction failed',
      TIMEOUT: 'Transaction timed out',
      REJECTED: 'Customer rejected the transaction',
      INVALID_OTP: 'Invalid OTP entered',
      INSUFFICIENT_FUNDS: 'Insufficient funds in wallet',
      ACCOUNT_DEACTIVATED: 'Wallet account is deactivated',
      NO_RESPONSE: 'No response from wallet partner',
      INVALID_MPIN: 'Invalid MPIN entered',
      NOT_APPROVED: 'Customer did not approve the transaction',
    };

    return messages[statusCode] || 'Transaction processing failed';
  }

  /**
   * Process pending webhooks (for background processing)
   */
  async processPendingWebhooks(): Promise<void> {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

      const pendingTransactions = await prisma.paymentTransaction.findMany({
        where: {
          webhook_status: 'pending',
          created_at: {
            gte: oneHourAgo,
          },
        },
        take: 10,
      });

      for (const transaction of pendingTransactions) {
        await this.sendWebhook(transaction.checkout_id);
      }
    } catch (error) {
      console.error('Error processing pending webhooks:', (error as Error).message);
    }
  }
}

export const webhookService = new WebhookService();

