const { pool } = require('../config/database');

class PortalTransactionsController {
    // List transactions with filters
    async list(req, res) {
        try {
            const merchantId = req.merchantId;
            const {
                page = 1,
                limit = 20,
                status,
                startDate,
                endDate,
                paymentMethod
            } = req.query;

            const offset = (parseInt(page) - 1) * parseInt(limit);

            // Build query
            let query = 'SELECT * FROM transactions WHERE merchant_id = ?';
            const params = [merchantId];

            if (status) {
                query += ' AND status = ?';
                params.push(status);
            }

            if (startDate) {
                query += ' AND created_at >= ?';
                params.push(startDate);
            }

            if (endDate) {
                query += ' AND created_at <= ?';
                params.push(endDate + ' 23:59:59');
            }

            if (paymentMethod) {
                query += ' AND payment_method = ?';
                params.push(paymentMethod);
            }

            query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
            params.push(parseInt(limit), offset);

            // Get transactions
            const [transactions] = await pool.query(query, params);

            // Get total count
            let countQuery = 'SELECT COUNT(*) as total FROM transactions WHERE merchant_id = ?';
            const countParams = [merchantId];

            if (status) {
                countQuery += ' AND status = ?';
                countParams.push(status);
            }

            if (startDate) {
                countQuery += ' AND created_at >= ?';
                countParams.push(startDate);
            }

            if (endDate) {
                countQuery += ' AND created_at <= ?';
                countParams.push(endDate + ' 23:59:59');
            }

            if (paymentMethod) {
                countQuery += ' AND payment_method = ?';
                countParams.push(paymentMethod);
            }

            const [countResult] = await pool.query(countQuery, countParams);
            const total = countResult[0].total;

            // Format transactions
            const formattedTransactions = transactions.map(tx => ({
                checkout_id: tx.checkout_id,
                reference: tx.reference,
                amount: parseFloat(tx.amount),
                status: tx.status,
                status_code: tx.status_code,
                payment_method: tx.payment_method,
                payment_type: tx.payment_type,
                mobile_number: tx.mobile_number,
                created_at: tx.created_at,
                updated_at: tx.updated_at
            }));

            res.json({
                success: true,
                transactions: formattedTransactions,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: total,
                    pages: Math.ceil(total / parseInt(limit))
                }
            });

        } catch (error) {
            console.error('List transactions error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get transactions'
            });
        }
    }

    // Get single transaction
    async get(req, res) {
        try {
            const merchantId = req.merchantId;
            const { id } = req.params;

            const [transactions] = await pool.query(
                'SELECT * FROM transactions WHERE checkout_id = ? AND merchant_id = ?',
                [id, merchantId]
            );

            if (transactions.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Transaction not found'
                });
            }

            const tx = transactions[0];

            res.json({
                success: true,
                transaction: {
                    checkout_id: tx.checkout_id,
                    reference: tx.reference,
                    amount: parseFloat(tx.amount),
                    status: tx.status,
                    status_code: tx.status_code,
                    payment_method: tx.payment_method,
                    payment_type: tx.payment_type,
                    mobile_number: tx.mobile_number,
                    success_url: tx.success_url,
                    return_url: tx.return_url,
                    webhook_status: tx.webhook_status,
                    created_at: tx.created_at,
                    updated_at: tx.updated_at
                }
            });

        } catch (error) {
            console.error('Get transaction error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get transaction'
            });
        }
    }

    // Export transactions
    async export(req, res) {
        try {
            const merchantId = req.merchantId;
            const { format } = req.params;
            const { status, startDate, endDate } = req.query;

            if (!['csv', 'json'].includes(format)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid format. Use csv or json'
                });
            }

            // Build query (same as list)
            let query = 'SELECT * FROM transactions WHERE merchant_id = ?';
            const params = [merchantId];

            if (status) {
                query += ' AND status = ?';
                params.push(status);
            }

            if (startDate) {
                query += ' AND created_at >= ?';
                params.push(startDate);
            }

            if (endDate) {
                query += ' AND created_at <= ?';
                params.push(endDate + ' 23:59:59');
            }

            query += ' ORDER BY created_at DESC';

            const [transactions] = await pool.query(query, params);

            if (format === 'csv') {
                // Generate CSV
                const headers = ['Reference', 'Amount', 'Status', 'Payment Method', 'Date'];
                const rows = transactions.map(tx => [
                    tx.reference,
                    tx.amount,
                    tx.status,
                    tx.payment_method,
                    tx.created_at
                ]);

                let csv = headers.join(',') + '\n';
                rows.forEach(row => {
                    csv += row.map(cell => `"${cell}"`).join(',') + '\n';
                });

                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');
                res.send(csv);

            } else if (format === 'json') {
                // Generate JSON
                const formatted = transactions.map(tx => ({
                    checkout_id: tx.checkout_id,
                    reference: tx.reference,
                    amount: parseFloat(tx.amount),
                    status: tx.status,
                    status_code: tx.status_code,
                    payment_method: tx.payment_method,
                    created_at: tx.created_at
                }));

                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Content-Disposition', 'attachment; filename=transactions.json');
                res.json(formatted);
            }

        } catch (error) {
            console.error('Export transactions error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to export transactions'
            });
        }
    }
}

module.exports = new PortalTransactionsController();

