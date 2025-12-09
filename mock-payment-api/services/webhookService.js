const axios = require('axios');
const { pool } = require('../config/database');

class WebhookService {
    constructor() {
        this.retryAttempts = parseInt(process.env.WEBHOOK_RETRY_ATTEMPTS) || 3;
        this.retryDelay = parseInt(process.env.WEBHOOK_RETRY_DELAY) || 5000;
    }

    // Send webhook notification
    async sendWebhook(checkoutId) {
        try {
            // Get transaction details
            const [transactions] = await pool.query(
                'SELECT * FROM transactions WHERE checkout_id = ?',
                [checkoutId]
            );

            if (transactions.length === 0) {
                throw new Error('Transaction not found');
            }

            const transaction = transactions[0];
            
            // Prepare webhook payload
            const payload = {
                id: transaction.checkout_id,
                vendorId: transaction.vendor_id || 'TEST_VENDOR_001',
                checkoutId: transaction.checkout_id,
                reference: transaction.reference,
                paymentMethod: transaction.payment_method,
                status: transaction.status,
                statusCode: transaction.status_code,
                createdAt: transaction.created_at,
                updatedAt: transaction.updated_at,
                amount: parseFloat(transaction.amount),
                acknowledged: false,
                tokenId: transaction.checkout_id,
                message: this.getStatusMessage(transaction.status_code)
            };

            // Include user data if exists
            if (transaction.user_data) {
                payload.user = transaction.user_data;
            }

            // Send webhook with retry logic
            await this.sendWithRetry(
                transaction.success_url,
                payload,
                transaction.checkout_id
            );

            // Update webhook status
            await pool.query(
                'UPDATE transactions SET webhook_status = ? WHERE checkout_id = ?',
                ['sent', checkoutId]
            );

            console.log(`✅ Webhook sent successfully for checkout: ${checkoutId}`);
            return true;

        } catch (error) {
            console.error(`❌ Webhook failed for checkout ${checkoutId}:`, error.message);
            
            // Update webhook status to failed
            await pool.query(
                'UPDATE transactions SET webhook_status = ? WHERE checkout_id = ?',
                ['failed', checkoutId]
            );

            return false;
        }
    }

    // Send webhook with retry logic
    async sendWithRetry(url, payload, checkoutId, attempt = 1) {
        try {
            const response = await axios.post(url, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Webhook-Source': 'dummy-payment-api'
                },
                timeout: 10000 // 10 seconds timeout
            });

            // Log successful webhook
            await this.logWebhook(checkoutId, url, payload, response.status, response.data, null, attempt);

            return response;

        } catch (error) {
            const errorMessage = error.message;
            const responseStatus = error.response ? error.response.status : null;
            const responseBody = error.response ? error.response.data : null;

            // Log failed attempt
            await this.logWebhook(checkoutId, url, payload, responseStatus, responseBody, errorMessage, attempt);

            // Retry if attempts remaining
            if (attempt < this.retryAttempts) {
                console.log(`Retrying webhook for ${checkoutId}, attempt ${attempt + 1}...`);
                
                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, this.retryDelay));
                
                return this.sendWithRetry(url, payload, checkoutId, attempt + 1);
            }

            throw error;
        }
    }

    // Log webhook attempt
    async logWebhook(checkoutId, url, payload, responseStatus, responseBody, errorMessage, attemptNumber) {
        try {
            await pool.query(
                `INSERT INTO webhook_logs 
                (checkout_id, url, payload, response_status, response_body, error_message, attempt_number) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    checkoutId,
                    url,
                    JSON.stringify(payload),
                    responseStatus,
                    JSON.stringify(responseBody),
                    errorMessage,
                    attemptNumber
                ]
            );
        } catch (error) {
            console.error('Failed to log webhook:', error.message);
        }
    }

    // Get status message based on status code
    getStatusMessage(statusCode) {
        const messages = {
            'SUCCESS': 'Payment completed successfully',
            'FAILED': 'Transaction failed',
            'TIMEOUT': 'Transaction timed out',
            'REJECTED': 'Customer rejected the transaction',
            'INVALID_OTP': 'Invalid OTP entered',
            'INSUFFICIENT_FUNDS': 'Insufficient funds in wallet',
            'ACCOUNT_DEACTIVATED': 'Wallet account is deactivated',
            'NO_RESPONSE': 'No response from wallet partner',
            'INVALID_MPIN': 'Invalid MPIN entered',
            'NOT_APPROVED': 'Customer did not approve the transaction'
        };

        return messages[statusCode] || 'Transaction processing failed';
    }

    // Process pending webhooks (for background processing)
    async processPendingWebhooks() {
        try {
            const [pendingTransactions] = await pool.query(
                `SELECT checkout_id FROM transactions 
                WHERE webhook_status = 'pending' 
                AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
                LIMIT 10`
            );

            for (const transaction of pendingTransactions) {
                await this.sendWebhook(transaction.checkout_id);
            }
        } catch (error) {
            console.error('Error processing pending webhooks:', error.message);
        }
    }
}

module.exports = new WebhookService();
