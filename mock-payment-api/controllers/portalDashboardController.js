const { pool } = require('../config/database');

class PortalDashboardController {
    // Get dashboard statistics
    async getStats(req, res) {
        try {
            const merchantId = req.merchantId;

            // Get total transactions
            const [totalResult] = await pool.query(
                'SELECT COUNT(*) as total FROM transactions WHERE merchant_id = ?',
                [merchantId]
            );
            const totalTransactions = totalResult[0].total;

            // Get successful transactions
            const [successResult] = await pool.query(
                'SELECT COUNT(*) as total FROM transactions WHERE merchant_id = ? AND status = ?',
                [merchantId, 'completed']
            );
            const successfulTransactions = successResult[0].total;

            // Get failed transactions
            const [failedResult] = await pool.query(
                'SELECT COUNT(*) as total FROM transactions WHERE merchant_id = ? AND status = ?',
                [merchantId, 'failed']
            );
            const failedTransactions = failedResult[0].total;

            // Get total amount (completed transactions)
            const [amountResult] = await pool.query(
                'SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE merchant_id = ? AND status = ?',
                [merchantId, 'completed']
            );
            const totalAmount = parseFloat(amountResult[0].total);

            // Calculate success rate
            const successRate = totalTransactions > 0
                ? (successfulTransactions / totalTransactions) * 100
                : 0;

            res.json({
                success: true,
                stats: {
                    totalTransactions,
                    successfulTransactions,
                    failedTransactions,
                    successRate: parseFloat(successRate.toFixed(2)),
                    totalAmount
                }
            });

        } catch (error) {
            console.error('Get dashboard stats error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get dashboard statistics'
            });
        }
    }
}

module.exports = new PortalDashboardController();

