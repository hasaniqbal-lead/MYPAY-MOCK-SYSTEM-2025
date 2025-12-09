const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const { testConnection } = require('./config/database');
const { simpleValidation, validateCheckoutParams } = require('./middleware/validation');
const { requireAuth } = require('./middleware/auth');
const checkoutController = require('./controllers/checkoutController');
const paymentController = require('./controllers/paymentController');
const webhookService = require('./services/webhookService');
const portalAuthController = require('./controllers/portalAuthController');
const portalMerchantController = require('./controllers/portalMerchantController');
const portalTransactionsController = require('./controllers/portalTransactionsController');
const portalDashboardController = require('./controllers/portalDashboardController');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        service: 'Dummy Payment API',
        timestamp: new Date().toISOString()
    });
});

// API Routes

// Checkout API endpoint
app.post('/checkouts', 
    simpleValidation, 
    validateCheckoutParams, 
    checkoutController.createCheckout
);

// Get checkout details
app.get('/checkouts/:checkoutId', 
    simpleValidation, 
    checkoutController.getCheckout
);

// Get transaction status by reference
app.get('/transactions/:reference', 
    simpleValidation, 
    checkoutController.getTransactionStatus
);

// Payment page routes (no auth required)
app.get('/payment/:sessionId', (req, res) => paymentController.renderPaymentPage(req, res));
app.post('/payment/:sessionId/complete', (req, res) => paymentController.completePayment(req, res));

// Test scenarios endpoint (for documentation)
app.get('/test-scenarios', paymentController.getTestScenarios);

// Webhook testing endpoints
app.post('/webhooks/test', async (req, res) => {
    const { checkoutId } = req.body;
    
    if (!checkoutId) {
        return res.status(400).json({
            success: false,
            error: 'checkoutId is required'
        });
    }
    
    const success = await webhookService.sendWebhook(checkoutId);
    
    res.json({
        success: success,
        message: success ? 'Webhook sent successfully' : 'Webhook failed'
    });
});

// Process pending webhooks manually
app.post('/webhooks/process-pending', simpleValidation, async (req, res) => {
    await webhookService.processPendingWebhooks();
    res.json({
        success: true,
        message: 'Processing pending webhooks'
    });
});

// ============================================
// Portal API Routes
// ============================================

// Authentication routes (no auth required)
app.post('/api/portal/auth/register', portalAuthController.register);
app.post('/api/portal/auth/login', portalAuthController.login);
app.post('/api/portal/auth/logout', portalAuthController.logout);

// Merchant profile routes (auth required)
app.get('/api/portal/merchant/profile', requireAuth, portalMerchantController.getProfile);
app.put('/api/portal/merchant/profile', requireAuth, portalMerchantController.updateProfile);

// Credentials routes (auth required)
app.get('/api/portal/merchant/credentials', requireAuth, portalMerchantController.getCredentials);
app.post('/api/portal/merchant/credentials', requireAuth, portalMerchantController.generateApiKey);

// Transactions routes (auth required)
app.get('/api/portal/transactions', requireAuth, portalTransactionsController.list);
app.get('/api/portal/transactions/:id', requireAuth, portalTransactionsController.get);
app.get('/api/portal/transactions/export/:format', requireAuth, portalTransactionsController.export);

// Dashboard routes (auth required)
app.get('/api/portal/dashboard/stats', requireAuth, portalDashboardController.getStats);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found'
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

// Start server
async function startServer() {
    try {
        // Test database connection
        await testConnection();
        
        const PORT = process.env.PORT || 3000;
        
        app.listen(PORT, () => {
            console.log(`
╔════════════════════════════════════════════╗
║       DUMMY PAYMENT API SERVER             ║
╠════════════════════════════════════════════╣
║  🚀 Server running on port ${PORT}          ║
║  📍 Base URL: http://localhost:${PORT}      ║
║  🔐 API Key: test-api-key-123              ║
╚════════════════════════════════════════════╝

📚 Available Endpoints:
- POST   /checkouts                 - Create checkout session
- GET    /checkouts/:checkoutId     - Get checkout details
- GET    /transactions/:reference   - Get transaction status
- GET    /payment/:sessionId        - Payment page
- POST   /payment/:sessionId/complete - Complete payment
- GET    /test-scenarios           - View test scenarios
- POST   /webhooks/test            - Test webhook sending

🔐 Portal API Endpoints:
- POST   /api/portal/auth/register - Merchant registration
- POST   /api/portal/auth/login    - Merchant login
- GET    /api/portal/dashboard/stats - Dashboard statistics
- GET    /api/portal/transactions - List transactions
- GET    /api/portal/merchant/credentials - Get API credentials
            `);
            
            // Process pending webhooks every minute
            setInterval(() => {
                webhookService.processPendingWebhooks();
            }, 60000);
        });
        
    } catch (error) {
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

module.exports = app;
