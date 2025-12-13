import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { testConnection } from './config/database';
import { simpleValidation, validateCheckoutParams } from './middleware/validation';
import { requireAuth } from './middleware/auth';
import { auditRequestLogger, auditResponseLogger } from './middleware/auditLogger';
import { checkoutController } from './controllers/checkoutController';
import { paymentController } from './controllers/paymentController';
import { portalAuthController } from './controllers/portalAuthController';
import { portalMerchantController } from './controllers/portalMerchantController';
import { portalTransactionsController } from './controllers/portalTransactionsController';
import { portalDashboardController } from './controllers/portalDashboardController';
import { adminAuthController } from './controllers/adminAuthController';
import { adminMerchantsController } from './controllers/adminMerchantsController';
import { requireAdminAuth } from './middleware/adminAuth';
import { webhookService } from './services/webhookService';
import { AuthenticatedRequest } from './types';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Audit logging middleware
app.use(auditRequestLogger);
app.use(auditResponseLogger);

// ============================================
// API v1 Routes (under /api/v1 prefix)
// ============================================

const apiRouter = express.Router();

// Health check endpoint
apiRouter.get('/health', (_req: Request, res: Response) => {
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
apiRouter.post(
  '/checkouts',
  simpleValidation as express.RequestHandler,
  validateCheckoutParams as express.RequestHandler,
  (req: Request, res: Response) => checkoutController.createCheckout(req as AuthenticatedRequest, res)
);

// Get checkout details
apiRouter.get(
  '/checkouts/:checkoutId',
  simpleValidation as express.RequestHandler,
  (req: Request, res: Response) => checkoutController.getCheckout(req as AuthenticatedRequest, res)
);

// Get transaction status by reference
apiRouter.get(
  '/transactions/:reference',
  simpleValidation as express.RequestHandler,
  (req: Request, res: Response) => checkoutController.getTransactionStatus(req as AuthenticatedRequest, res)
);

// ============================================
// Webhook Routes
// ============================================

apiRouter.post('/webhooks/test', async (req: Request, res: Response) => {
  const { checkoutId } = req.body;

  if (!checkoutId) {
    res.status(400).json({
      error: {
        message: 'checkoutId is required',
        code: 'VALIDATION_ERROR',
      },
    });
    return;
  }

  const success = await webhookService.sendWebhook(checkoutId);

  res.json({
    success,
    message: success ? 'Webhook sent successfully' : 'Webhook failed',
  });
});

apiRouter.post(
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
apiRouter.post('/portal/auth/register', (req: Request, res: Response) =>
  portalAuthController.register(req, res)
);

apiRouter.post('/portal/auth/login', (req: Request, res: Response) =>
  portalAuthController.login(req, res)
);

apiRouter.post('/portal/auth/logout', (req: Request, res: Response) =>
  portalAuthController.logout(req, res)
);

// Merchant profile routes (auth required)
apiRouter.get(
  '/portal/merchant/profile',
  requireAuth as express.RequestHandler,
  (req: Request, res: Response) => portalMerchantController.getProfile(req as AuthenticatedRequest, res)
);

apiRouter.put(
  '/portal/merchant/profile',
  requireAuth as express.RequestHandler,
  (req: Request, res: Response) => portalMerchantController.updateProfile(req as AuthenticatedRequest, res)
);

// Credentials routes (auth required)
apiRouter.get(
  '/portal/merchant/credentials',
  requireAuth as express.RequestHandler,
  (req: Request, res: Response) => portalMerchantController.getCredentials(req as AuthenticatedRequest, res)
);

apiRouter.post(
  '/portal/merchant/credentials',
  requireAuth as express.RequestHandler,
  (req: Request, res: Response) => portalMerchantController.generateApiKey(req as AuthenticatedRequest, res)
);

// Transactions routes (auth required)
apiRouter.get(
  '/portal/transactions',
  requireAuth as express.RequestHandler,
  (req: Request, res: Response) => portalTransactionsController.list(req as AuthenticatedRequest, res)
);

apiRouter.get(
  '/portal/transactions/:id',
  requireAuth as express.RequestHandler,
  (req: Request, res: Response) => portalTransactionsController.get(req as AuthenticatedRequest, res)
);

apiRouter.get(
  '/portal/transactions/export/:format',
  requireAuth as express.RequestHandler,
  (req: Request, res: Response) => portalTransactionsController.export(req as AuthenticatedRequest, res)
);

// Dashboard routes (auth required)
apiRouter.get(
  '/portal/dashboard/stats',
  requireAuth as express.RequestHandler,
  (req: Request, res: Response) => portalDashboardController.getStats(req as AuthenticatedRequest, res)
);

// ============================================
// Admin Auth Routes
// ============================================

// Admin login (public)
apiRouter.post(
  '/admin/auth/login',
  (req: Request, res: Response) => adminAuthController.login(req, res)
);

// Admin protected routes - Merchant Management
apiRouter.get(
  '/admin/merchants',
  requireAdminAuth as express.RequestHandler,
  (req: Request, res: Response) => adminMerchantsController.getAllMerchants(req as any, res)
);

apiRouter.get(
  '/admin/merchants/:id',
  requireAdminAuth as express.RequestHandler,
  (req: Request, res: Response) => adminMerchantsController.getMerchantById(req as any, res)
);

apiRouter.post(
  '/admin/merchants',
  requireAdminAuth as express.RequestHandler,
  (req: Request, res: Response) => adminMerchantsController.createMerchant(req as any, res)
);

apiRouter.put(
  '/admin/merchants/:id',
  requireAdminAuth as express.RequestHandler,
  (req: Request, res: Response) => adminMerchantsController.updateMerchant(req as any, res)
);

apiRouter.post(
  '/admin/merchants/:id/toggle-status',
  requireAdminAuth as express.RequestHandler,
  (req: Request, res: Response) => adminMerchantsController.toggleMerchantStatus(req as any, res)
);

// Admin protected routes - Transactions & Payouts
apiRouter.get(
  '/admin/transactions',
  requireAdminAuth as express.RequestHandler,
  (req: Request, res: Response) => adminMerchantsController.getMerchantTransactions(req as any, res)
);

apiRouter.get(
  '/admin/payouts',
  requireAdminAuth as express.RequestHandler,
  (req: Request, res: Response) => adminMerchantsController.getMerchantPayouts(req as any, res)
);


// ============================================
// Test & Developer Routes (Public)
// ============================================

// Test scenarios endpoint (public - for developers)
apiRouter.get('/test-scenarios', (req: Request, res: Response) =>
  paymentController.getTestScenarios(req, res)
);

// Mount API v1 router
app.use('/api/v1', apiRouter);

// ============================================
// Public Payment Page Routes (no prefix - public facing)
// ============================================

app.get('/payment/:sessionId', (req: Request, res: Response) =>
  paymentController.renderPaymentPage(req, res)
);

app.post('/payment/:sessionId/complete', (req: Request, res: Response) =>
  paymentController.completePayment(req, res)
);

// ============================================
// Error Handlers
// ============================================

// ============================================
// Error Handlers (Standardized with Payout API)
// ============================================

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: {
      message: 'Route not found',
      code: 'NOT_FOUND',
    },
  });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
    },
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
      console.log(`🚀 API server running on port ${PORT}`);
      console.log(`📍 Health check: http://localhost:${PORT}/api/v1/health`);
      console.log(`📍 API base: http://localhost:${PORT}/api/v1`);
      console.log(`📍 Payment pages: http://localhost:${PORT}/payment`);
      console.log(``);
      console.log(`📚 API v1 Endpoints:`);
      console.log(`- GET    /api/v1/health                    - Health check`);
      console.log(`- POST   /api/v1/checkouts                - Create checkout session`);
      console.log(`- GET    /api/v1/checkouts/:checkoutId    - Get checkout details`);
      console.log(`- GET    /api/v1/transactions/:reference  - Get transaction status`);
      console.log(``);
      console.log(`🔐 Portal API Endpoints:`);
      console.log(`- POST   /api/v1/portal/auth/register     - Merchant registration`);
      console.log(`- POST   /api/v1/portal/auth/login        - Merchant login`);
      console.log(`- GET    /api/v1/portal/dashboard/stats   - Dashboard statistics`);
      console.log(`- GET    /api/v1/portal/transactions      - List transactions`);
      console.log(`- GET    /api/v1/portal/merchant/credentials - Get API credentials`);

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

