import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { testConnection } from './config/database';
import { simpleValidation, validateCheckoutParams } from './middleware/validation';
import { requireAuth } from './middleware/auth';
import { checkoutController } from './controllers/checkoutController';
import { paymentController } from './controllers/paymentController';
import { portalAuthController } from './controllers/portalAuthController';
import { portalMerchantController } from './controllers/portalMerchantController';
import { portalTransactionsController } from './controllers/portalTransactionsController';
import { portalDashboardController } from './controllers/portalDashboardController';
import { webhookService } from './services/webhookService';
import { AuthenticatedRequest } from './types';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
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
app.post(
  '/checkouts',
  simpleValidation as express.RequestHandler,
  validateCheckoutParams as express.RequestHandler,
  (req: Request, res: Response) => checkoutController.createCheckout(req as AuthenticatedRequest, res)
);

// Get checkout details
app.get(
  '/checkouts/:checkoutId',
  simpleValidation as express.RequestHandler,
  (req: Request, res: Response) => checkoutController.getCheckout(req as AuthenticatedRequest, res)
);

// Get transaction status by reference
app.get(
  '/transactions/:reference',
  simpleValidation as express.RequestHandler,
  (req: Request, res: Response) => checkoutController.getTransactionStatus(req as AuthenticatedRequest, res)
);

// ============================================
// Payment Page Routes (no auth required)
// ============================================

app.get('/payment/:sessionId', (req: Request, res: Response) =>
  paymentController.renderPaymentPage(req, res)
);

app.post('/payment/:sessionId/complete', (req: Request, res: Response) =>
  paymentController.completePayment(req, res)
);

// Test scenarios endpoint
app.get('/test-scenarios', (req: Request, res: Response) =>
  paymentController.getTestScenarios(req, res)
);

// ============================================
// Webhook Routes
// ============================================

app.post('/webhooks/test', async (req: Request, res: Response) => {
  const { checkoutId } = req.body;

  if (!checkoutId) {
    res.status(400).json({
      success: false,
      error: 'checkoutId is required',
    });
    return;
  }

  const success = await webhookService.sendWebhook(checkoutId);

  res.json({
    success,
    message: success ? 'Webhook sent successfully' : 'Webhook failed',
  });
});

app.post(
  '/webhooks/process-pending',
  simpleValidation as express.RequestHandler,
  async (_req: Request, res: Response) => {
    await webhookService.processPendingWebhooks();
    res.json({
      success: true,
      message: 'Processing pending webhooks',
    });
  }
);

// ============================================
// Portal API Routes
// ============================================

// Authentication routes (no auth required)
app.post('/api/portal/auth/register', (req: Request, res: Response) =>
  portalAuthController.register(req, res)
);

app.post('/api/portal/auth/login', (req: Request, res: Response) =>
  portalAuthController.login(req, res)
);

app.post('/api/portal/auth/logout', (req: Request, res: Response) =>
  portalAuthController.logout(req, res)
);

// Merchant profile routes (auth required)
app.get(
  '/api/portal/merchant/profile',
  requireAuth as express.RequestHandler,
  (req: Request, res: Response) => portalMerchantController.getProfile(req as AuthenticatedRequest, res)
);

app.put(
  '/api/portal/merchant/profile',
  requireAuth as express.RequestHandler,
  (req: Request, res: Response) => portalMerchantController.updateProfile(req as AuthenticatedRequest, res)
);

// Credentials routes (auth required)
app.get(
  '/api/portal/merchant/credentials',
  requireAuth as express.RequestHandler,
  (req: Request, res: Response) => portalMerchantController.getCredentials(req as AuthenticatedRequest, res)
);

app.post(
  '/api/portal/merchant/credentials',
  requireAuth as express.RequestHandler,
  (req: Request, res: Response) => portalMerchantController.generateApiKey(req as AuthenticatedRequest, res)
);

// Transactions routes (auth required)
app.get(
  '/api/portal/transactions',
  requireAuth as express.RequestHandler,
  (req: Request, res: Response) => portalTransactionsController.list(req as AuthenticatedRequest, res)
);

app.get(
  '/api/portal/transactions/:id',
  requireAuth as express.RequestHandler,
  (req: Request, res: Response) => portalTransactionsController.get(req as AuthenticatedRequest, res)
);

app.get(
  '/api/portal/transactions/export/:format',
  requireAuth as express.RequestHandler,
  (req: Request, res: Response) => portalTransactionsController.export(req as AuthenticatedRequest, res)
);

// Dashboard routes (auth required)
app.get(
  '/api/portal/dashboard/stats',
  requireAuth as express.RequestHandler,
  (req: Request, res: Response) => portalDashboardController.getStats(req as AuthenticatedRequest, res)
);

// ============================================
// Error Handlers
// ============================================

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
  });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
});

// ============================================
// Start Server
// ============================================

async function startServer(): Promise<void> {
  try {
    // Test database connection
    await testConnection();

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

export default app;

