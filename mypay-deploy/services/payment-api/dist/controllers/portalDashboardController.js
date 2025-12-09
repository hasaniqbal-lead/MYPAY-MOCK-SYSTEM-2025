"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.portalDashboardController = void 0;
const database_1 = require("../config/database");
class PortalDashboardController {
    /**
     * Get dashboard statistics
     */
    async getStats(req, res) {
        try {
            const merchantId = req.merchantId;
            // Get total transactions
            const totalTransactions = await database_1.prisma.paymentTransaction.count({
                where: { merchant_id: merchantId },
            });
            // Get successful transactions
            const successfulTransactions = await database_1.prisma.paymentTransaction.count({
                where: {
                    merchant_id: merchantId,
                    status: 'completed',
                },
            });
            // Get failed transactions
            const failedTransactions = await database_1.prisma.paymentTransaction.count({
                where: {
                    merchant_id: merchantId,
                    status: 'failed',
                },
            });
            // Get total amount (completed transactions)
            const amountResult = await database_1.prisma.paymentTransaction.aggregate({
                where: {
                    merchant_id: merchantId,
                    status: 'completed',
                },
                _sum: {
                    amount: true,
                },
            });
            const totalAmount = Number(amountResult._sum.amount || 0);
            // Calculate success rate
            const successRate = totalTransactions > 0 ? (successfulTransactions / totalTransactions) * 100 : 0;
            res.json({
                success: true,
                stats: {
                    totalTransactions,
                    successfulTransactions,
                    failedTransactions,
                    successRate: parseFloat(successRate.toFixed(2)),
                    totalAmount,
                },
            });
        }
        catch (error) {
            console.error('Get dashboard stats error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get dashboard statistics',
            });
        }
    }
}
exports.portalDashboardController = new PortalDashboardController();
//# sourceMappingURL=portalDashboardController.js.map