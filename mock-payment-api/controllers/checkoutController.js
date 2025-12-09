const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');

class CheckoutController {
    // Create checkout session
    async createCheckout(req, res) {
        try {
            const {
                reference,
                amount,
                paymentMethod,
                paymentType,
                successUrl,
                returnUrl,
                user
            } = req.body;

            // Check if reference already exists
            const [existingTransactions] = await pool.query(
                'SELECT id FROM transactions WHERE reference = ?',
                [reference]
            );

            if (existingTransactions.length > 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Duplicate reference. Transaction with this reference already exists.'
                });
            }

            // Generate checkout ID
            const checkoutId = uuidv4();

            // Get merchant_id from API key if available
            let merchantId = null;
            if (req.vendor && req.vendor.vendor_id) {
                const [apiKeys] = await pool.query(
                    'SELECT merchant_id FROM api_keys WHERE vendor_id = ?',
                    [req.vendor.vendor_id]
                );
                if (apiKeys.length > 0 && apiKeys[0].merchant_id) {
                    merchantId = apiKeys[0].merchant_id;
                }
            }

            // Prepare user_data - store as JSON if provided
            const userData = user ? JSON.stringify(user) : null;

            // Save transaction to database
            await pool.query(
                `INSERT INTO transactions 
                (checkout_id, vendor_id, reference, amount, payment_method, payment_type, 
                success_url, return_url, user_data, status, merchant_id) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    checkoutId,
                    req.vendor?.vendor_id || null,
                    reference,
                    amount,
                    paymentMethod,
                    paymentType,
                    successUrl,
                    returnUrl,
                    userData,
                    'pending',
                    merchantId
                ]
            );

            // Generate checkout URL
            const checkoutUrl = `${process.env.CHECKOUT_BASE_URL}/${checkoutId}`;

            // Return success response
            res.status(200).json({
                success: true,
                checkoutUrl: checkoutUrl,
                checkoutId: checkoutId,
                expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutes
            });

        } catch (error) {
            console.error('Checkout creation error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to create checkout session'
            });
        }
    }

    // Get checkout details
    async getCheckout(req, res) {
        try {
            const { checkoutId } = req.params;

            const [transactions] = await pool.query(
                'SELECT * FROM transactions WHERE checkout_id = ?',
                [checkoutId]
            );

            if (transactions.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Checkout session not found'
                });
            }

            const transaction = transactions[0];

            res.json({
                success: true,
                checkout: {
                    checkoutId: transaction.checkout_id,
                    reference: transaction.reference,
                    amount: parseFloat(transaction.amount),
                    paymentMethod: transaction.payment_method,
                    status: transaction.status,
                    createdAt: transaction.created_at
                }
            });

        } catch (error) {
            console.error('Get checkout error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve checkout session'
            });
        }
    }

    // Get transaction status
    async getTransactionStatus(req, res) {
        try {
            const { reference } = req.params;

            const [transactions] = await pool.query(
                'SELECT * FROM transactions WHERE reference = ?',
                [reference]
            );

            if (transactions.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Transaction not found'
                });
            }

            const transaction = transactions[0];

            res.json({
                success: true,
                transaction: {
                    reference: transaction.reference,
                    checkoutId: transaction.checkout_id,
                    amount: parseFloat(transaction.amount),
                    paymentMethod: transaction.payment_method,
                    status: transaction.status,
                    statusCode: transaction.status_code,
                    createdAt: transaction.created_at,
                    updatedAt: transaction.updated_at
                }
            });

        } catch (error) {
            console.error('Get transaction status error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve transaction status'
            });
        }
    }
}

module.exports = new CheckoutController();
