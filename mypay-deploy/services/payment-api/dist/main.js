"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = require("./config/database");
const validation_1 = require("./middleware/validation");
const auth_1 = require("./middleware/auth");
const checkoutController_1 = require("./controllers/checkoutController");
const paymentController_1 = require("./controllers/paymentController");
const portalAuthController_1 = require("./controllers/portalAuthController");
const portalMerchantController_1 = require("./controllers/portalMerchantController");
const portalTransactionsController_1 = require("./controllers/portalTransactionsController");
const portalDashboardController_1 = require("./controllers/portalDashboardController");
const webhookService_1 = require("./services/webhookService");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Request logging middleware
app.use((req, _res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});
// Health check endpoint
app.get('/health', (_req, res) => {
    res.json({
        status: 'OK',
        service: 'MyPay Payment API',
        timestamp: new Date().toISOString(),
    });
});
// ============================================
// Checkout API Routes
// ============================================
// Create checkout session
app.post('/checkouts', validation_1.simpleValidation, validation_1.validateCheckoutParams, (req, res) => checkoutController_1.checkoutController.createCheckout(req, res));
// Get checkout details
app.get('/checkouts/:checkoutId', validation_1.simpleValidation, (req, res) => checkoutController_1.checkoutController.getCheckout(req, res));
// Get transaction status by reference
app.get('/transactions/:reference', validation_1.simpleValidation, (req, res) => checkoutController_1.checkoutController.getTransactionStatus(req, res));
// ============================================
// Payment Page Routes (no auth required)
// ============================================
app.get('/payment/:sessionId', (req, res) => paymentController_1.paymentController.renderPaymentPage(req, res));
app.post('/payment/:sessionId/complete', (req, res) => paymentController_1.paymentController.completePayment(req, res));
// Test scenarios endpoint
app.get('/test-scenarios', (req, res) => paymentController_1.paymentController.getTestScenarios(req, res));
// ============================================
// Webhook Routes
// ============================================
app.post('/webhooks/test', async (req, res) => {
    const { checkoutId } = req.body;
    if (!checkoutId) {
        res.status(400).json({
            success: false,
            error: 'checkoutId is required',
        });
        return;
    }
    const success = await webhookService_1.webhookService.sendWebhook(checkoutId);
    res.json({
        success,
        message: success ? 'Webhook sent successfully' : 'Webhook failed',
    });
});
app.post('/webhooks/process-pending', validation_1.simpleValidation, async (_req, res) => {
    await webhookService_1.webhookService.processPendingWebhooks();
    res.json({
        success: true,
        message: 'Processing pending webhooks',
    });
});
// ============================================
// Portal API Routes
// ============================================
// Authentication routes (no auth required)
app.post('/api/portal/auth/register', (req, res) => portalAuthController_1.portalAuthController.register(req, res));
app.post('/api/portal/auth/login', (req, res) => portalAuthController_1.portalAuthController.login(req, res));
app.post('/api/portal/auth/logout', (req, res) => portalAuthController_1.portalAuthController.logout(req, res));
// Merchant profile routes (auth required)
app.get('/api/portal/merchant/profile', auth_1.requireAuth, (req, res) => portalMerchantController_1.portalMerchantController.getProfile(req, res));
app.put('/api/portal/merchant/profile', auth_1.requireAuth, (req, res) => portalMerchantController_1.portalMerchantController.updateProfile(req, res));
// Credentials routes (auth required)
app.get('/api/portal/merchant/credentials', auth_1.requireAuth, (req, res) => portalMerchantController_1.portalMerchantController.getCredentials(req, res));
app.post('/api/portal/merchant/credentials', auth_1.requireAuth, (req, res) => portalMerchantController_1.portalMerchantController.generateApiKey(req, res));
// Transactions routes (auth required)
app.get('/api/portal/transactions', auth_1.requireAuth, (req, res) => portalTransactionsController_1.portalTransactionsController.list(req, res));
app.get('/api/portal/transactions/:id', auth_1.requireAuth, (req, res) => portalTransactionsController_1.portalTransactionsController.get(req, res));
app.get('/api/portal/transactions/export/:format', auth_1.requireAuth, (req, res) => portalTransactionsController_1.portalTransactionsController.export(req, res));
// Dashboard routes (auth required)
app.get('/api/portal/dashboard/stats', auth_1.requireAuth, (req, res) => portalDashboardController_1.portalDashboardController.getStats(req, res));
// ============================================
// Error Handlers
// ============================================
// 404 handler
app.use((_req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
    });
});
// Error handler
app.use((err, _req, res, _next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
    });
});
// ============================================
// Start Server
// ============================================
async function startServer() {
    try {
        // Test database connection
        await (0, database_1.testConnection)();
        app.listen(PORT, () => {
            console.log(`
╔════════════════════════════════════════════╗
║       MYPAY PAYMENT API SERVER             ║
╠════════════════════════════════════════════╣
║  🚀 Server running on port ${PORT}          ║
║  📍 Base URL: http://localhost:${PORT}      ║
╚════════════════════════════════════════════╝

📚 Available Endpoints:
- POST   /checkouts                 - Create checkout session
- GET    /checkouts/:checkoutId     - Get checkout details
- GET    /transactions/:reference   - Get transaction status
- GET    /payment/:sessionId        - Payment page
- POST   /payment/:sessionId/complete - Complete payment
- GET    /test-scenarios           - View test scenarios

🔐 Portal API Endpoints:
- POST   /api/portal/auth/register - Merchant registration
- POST   /api/portal/auth/login    - Merchant login
- GET    /api/portal/dashboard/stats - Dashboard statistics
- GET    /api/portal/transactions - List transactions
- GET    /api/portal/merchant/credentials - Get API credentials
      `);
            // Process pending webhooks every minute
            setInterval(() => {
                webhookService_1.webhookService.processPendingWebhooks();
            }, 60000);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}
// Start the server
startServer();
// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down gracefully...');
    process.exit(0);
});
exports.default = app;
//# sourceMappingURL=main.js.map