import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { testConnection, prisma } from './config/database';
import { simpleValidation, validateCheckoutParams } from './middleware/validation';
import { requireAuth } from './middleware/auth';
import { auditRequestLogger, auditResponseLogger } from './middleware/auditLogger';
import { checkoutController } from './controllers/checkoutController';
import { paymentController } from './controllers/paymentController';
import { portalAuthController } from './controllers/portalAuthController';
import { portalMerchantController } from './controllers/portalMerchantController';
import { portalTransactionsController } from './controllers/portalTransactionsController';
import { portalPayoutsController } from './controllers/portalPayoutsController';
import { portalDashboardController } from './controllers/portalDashboardController';
import { adminAuthController } from './controllers/adminAuthController';
import { adminMerchantsController } from './controllers/adminMerchantsController';
import { paymentPageConfigController } from './controllers/paymentPageConfigController';
import { adminPaymentPageController } from './controllers/adminPaymentPageController';
import { requireAdminAuth } from './middleware/adminAuth';
import { webhookService } from './services/webhookService';
import { AuthenticatedRequest } from './types';
import { rateLimitMiddleware, getRateLimitInfo } from './middleware/rateLimit';
import { requireFeature } from './middleware/featureGate';
import { enforceTransactionCap, enforceVolumeCap, enforceMerchantLimit } from './middleware/limitsEnforcement';
import { refundController } from './controllers/refundController';

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
    service: `${process.env.ORG_BRAND_NAME || 'Payment'} API`,
    timestamp: new Date().toISOString(),
  });
});

// Rate limiting (applied to all API routes below)
apiRouter.use(rateLimitMiddleware as express.RequestHandler);

// Rate limit info endpoint (for merchant portal display)
apiRouter.get(
  '/portal/rate-limits',
  requireAuth as express.RequestHandler,
  (req: Request, res: Response) => {
    const info = getRateLimitInfo(req);
    res.json({ success: true, ...info });
  }
);

// ============================================
// Checkout API Routes
// ============================================

// Create checkout session
apiRouter.post(
  '/checkouts',
  requireFeature('payments') as express.RequestHandler,
  enforceTransactionCap as express.RequestHandler,
  enforceVolumeCap as express.RequestHandler,
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

// API Key management routes
apiRouter.get(
  '/portal/merchant/keys',
  requireAuth as express.RequestHandler,
  (req: Request, res: Response) => portalMerchantController.listKeys(req as AuthenticatedRequest, res)
);

apiRouter.put(
  '/portal/merchant/keys/:id',
  requireAuth as express.RequestHandler,
  (req: Request, res: Response) => portalMerchantController.toggleKey(req as AuthenticatedRequest, res)
);

apiRouter.delete(
  '/portal/merchant/keys/:id',
  requireAuth as express.RequestHandler,
  (req: Request, res: Response) => portalMerchantController.deleteKey(req as AuthenticatedRequest, res)
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

// Transaction receipt
apiRouter.get(
  '/portal/transactions/:id/receipt',
  requireAuth as express.RequestHandler,
  (req: Request, res: Response) => portalTransactionsController.getReceipt(req as AuthenticatedRequest, res)
);

// Payout routes (auth required, feature-gated)
apiRouter.get(
  '/portal/payouts',
  requireFeature('payouts') as express.RequestHandler,
  requireAuth as express.RequestHandler,
  (req: Request, res: Response) => portalPayoutsController.list(req as AuthenticatedRequest, res)
);

apiRouter.get(
  '/portal/payouts/:id',
  requireAuth as express.RequestHandler,
  (req: Request, res: Response) => portalPayoutsController.get(req as AuthenticatedRequest, res)
);

apiRouter.get(
  '/portal/payouts/export/:format',
  requireAuth as express.RequestHandler,
  (req: Request, res: Response) => portalPayoutsController.export(req as AuthenticatedRequest, res)
);

// Dashboard routes (auth required)
apiRouter.get(
  '/portal/dashboard/stats',
  requireAuth as express.RequestHandler,
  (req: Request, res: Response) => portalDashboardController.getStats(req as AuthenticatedRequest, res)
);

// ============================================
// Portal Payment Page Configuration Routes
// ============================================

// List merchant payment page configurations
apiRouter.get(
  '/portal/payment-page/configs',
  requireAuth as express.RequestHandler,
  (req: Request, res: Response) => paymentPageConfigController.listConfigs(req as AuthenticatedRequest, res)
);

// Get default configuration
apiRouter.get(
  '/portal/payment-page/configs/default',
  requireAuth as express.RequestHandler,
  (req: Request, res: Response) => paymentPageConfigController.getDefaultConfig(req as AuthenticatedRequest, res)
);

// Get single configuration
apiRouter.get(
  '/portal/payment-page/configs/:id',
  requireAuth as express.RequestHandler,
  (req: Request, res: Response) => paymentPageConfigController.getConfig(req as AuthenticatedRequest, res)
);

// Create configuration
apiRouter.post(
  '/portal/payment-page/configs',
  requireAuth as express.RequestHandler,
  (req: Request, res: Response) => paymentPageConfigController.createConfig(req as AuthenticatedRequest, res)
);

// Create configuration from template
apiRouter.post(
  '/portal/payment-page/configs/from-template',
  requireAuth as express.RequestHandler,
  (req: Request, res: Response) => paymentPageConfigController.createFromTemplate(req as AuthenticatedRequest, res)
);

// Update configuration
apiRouter.put(
  '/portal/payment-page/configs/:id',
  requireAuth as express.RequestHandler,
  (req: Request, res: Response) => paymentPageConfigController.updateConfig(req as AuthenticatedRequest, res)
);

// Delete configuration
apiRouter.delete(
  '/portal/payment-page/configs/:id',
  requireAuth as express.RequestHandler,
  (req: Request, res: Response) => paymentPageConfigController.deleteConfig(req as AuthenticatedRequest, res)
);

// Activate configuration
apiRouter.post(
  '/portal/payment-page/configs/:id/activate',
  requireAuth as express.RequestHandler,
  (req: Request, res: Response) => paymentPageConfigController.activateConfig(req as AuthenticatedRequest, res)
);

// List available templates
apiRouter.get(
  '/portal/payment-page/templates',
  requireAuth as express.RequestHandler,
  (req: Request, res: Response) => paymentPageConfigController.listTemplates(req as AuthenticatedRequest, res)
);

// Get admin rules (for frontend to know what's locked)
apiRouter.get(
  '/portal/payment-page/rules',
  requireAuth as express.RequestHandler,
  (req: Request, res: Response) => paymentPageConfigController.getRules(req as AuthenticatedRequest, res)
);

// ============================================
// Portal Refund Routes
// ============================================

apiRouter.post(
  '/portal/refunds',
  requireAuth as express.RequestHandler,
  (req: Request, res: Response) => refundController.create(req as AuthenticatedRequest, res)
);

apiRouter.get(
  '/portal/refunds',
  requireAuth as express.RequestHandler,
  (req: Request, res: Response) => refundController.list(req as AuthenticatedRequest, res)
);

apiRouter.get(
  '/portal/refunds/:id',
  requireAuth as express.RequestHandler,
  (req: Request, res: Response) => refundController.get(req as AuthenticatedRequest, res)
);

// ============================================
// Admin Auth Routes
// ============================================

// Admin login (public)
apiRouter.post(
  '/admin/auth/login',
  (req: Request, res: Response) => adminAuthController.login(req, res)
);

// Admin dashboard stats
apiRouter.get(
  '/admin/stats',
  requireAdminAuth as express.RequestHandler,
  async (_req: Request, res: Response) => {
    try {
      const [
        totalMerchants,
        activeMerchants,
        transactions,
        payouts,
      ] = await Promise.all([
        prisma.merchant.count(),
        prisma.merchant.count({ where: { isActive: true } }),
        prisma.paymentTransaction.groupBy({
          by: ['status'],
          _count: true,
          _sum: { amount: true },
        }),
        prisma.payout.groupBy({
          by: ['status'],
          _count: true,
          _sum: { amount: true },
        }),
      ]);

      const txMap: Record<string, { count: number; sum: number }> = {};
      for (const t of transactions) {
        txMap[t.status] = { count: t._count, sum: Number(t._sum.amount || 0) };
      }
      const payoutMap: Record<string, { count: number; sum: number }> = {};
      for (const p of payouts) {
        payoutMap[p.status] = { count: p._count, sum: Number(p._sum.amount || 0) };
      }

      const totalPayments = Object.values(txMap).reduce((s, v) => s + v.count, 0);
      const totalPaymentVolume = Object.values(txMap).reduce((s, v) => s + v.sum, 0);
      const totalPayoutCount = Object.values(payoutMap).reduce((s, v) => s + v.count, 0);
      const totalPayoutVolume = Object.values(payoutMap).reduce((s, v) => s + v.sum, 0);
      const successfulPayments = txMap['completed']?.count || txMap['success']?.count || 0;
      const successRate = totalPayments > 0 ? Math.round((successfulPayments / totalPayments) * 1000) / 10 : 0;

      res.json({
        success: true,
        stats: {
          totalMerchants,
          activeMerchants,
          totalPaymentTransactions: totalPayments,
          totalPayoutTransactions: totalPayoutCount,
          paymentVolume: totalPaymentVolume,
          payoutVolume: totalPayoutVolume,
          successfulPayments,
          failedPayments: txMap['failed']?.count || 0,
          pendingPayments: txMap['pending']?.count || 0,
          successfulPayouts: payoutMap['COMPLETED']?.count || 0,
          failedPayouts: payoutMap['FAILED']?.count || 0,
          pendingPayouts: payoutMap['PROCESSING']?.count || payoutMap['PENDING']?.count || 0,
          successRate,
        },
      });
    } catch (error) {
      console.error('Admin stats error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch stats' });
    }
  }
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
  enforceMerchantLimit as express.RequestHandler,
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

apiRouter.post(
  '/admin/merchants/:id/reset-password',
  requireAdminAuth as express.RequestHandler,
  (req: Request, res: Response) => adminMerchantsController.resetMerchantPassword(req as any, res)
);

apiRouter.put(
  '/admin/merchants/:id/email',
  requireAdminAuth as express.RequestHandler,
  (req: Request, res: Response) => adminMerchantsController.updateMerchantEmail(req as any, res)
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
// Admin Payment Page Routes
// ============================================

// Rules management
apiRouter.get(
  '/admin/payment-page/rules',
  requireAdminAuth as express.RequestHandler,
  (req: Request, res: Response) => adminPaymentPageController.listRules(req as any, res)
);

apiRouter.get(
  '/admin/payment-page/rules/:id',
  requireAdminAuth as express.RequestHandler,
  (req: Request, res: Response) => adminPaymentPageController.getRule(req as any, res)
);

apiRouter.post(
  '/admin/payment-page/rules',
  requireAdminAuth as express.RequestHandler,
  (req: Request, res: Response) => adminPaymentPageController.createRule(req as any, res)
);

apiRouter.put(
  '/admin/payment-page/rules/:id',
  requireAdminAuth as express.RequestHandler,
  (req: Request, res: Response) => adminPaymentPageController.updateRule(req as any, res)
);

apiRouter.delete(
  '/admin/payment-page/rules/:id',
  requireAdminAuth as express.RequestHandler,
  (req: Request, res: Response) => adminPaymentPageController.deleteRule(req as any, res)
);

apiRouter.post(
  '/admin/payment-page/rules/:id/toggle',
  requireAdminAuth as express.RequestHandler,
  (req: Request, res: Response) => adminPaymentPageController.toggleRule(req as any, res)
);

// Templates management
apiRouter.get(
  '/admin/payment-page/templates',
  requireAdminAuth as express.RequestHandler,
  (req: Request, res: Response) => adminPaymentPageController.listTemplates(req as any, res)
);

apiRouter.get(
  '/admin/payment-page/templates/:id',
  requireAdminAuth as express.RequestHandler,
  (req: Request, res: Response) => adminPaymentPageController.getTemplate(req as any, res)
);

apiRouter.post(
  '/admin/payment-page/templates',
  requireAdminAuth as express.RequestHandler,
  (req: Request, res: Response) => adminPaymentPageController.createTemplate(req as any, res)
);

apiRouter.put(
  '/admin/payment-page/templates/:id',
  requireAdminAuth as express.RequestHandler,
  (req: Request, res: Response) => adminPaymentPageController.updateTemplate(req as any, res)
);

apiRouter.delete(
  '/admin/payment-page/templates/:id',
  requireAdminAuth as express.RequestHandler,
  (req: Request, res: Response) => adminPaymentPageController.deleteTemplate(req as any, res)
);

// Merchant configs oversight
apiRouter.get(
  '/admin/payment-page/configs',
  requireAdminAuth as express.RequestHandler,
  (req: Request, res: Response) => adminPaymentPageController.listAllConfigs(req as any, res)
);

apiRouter.get(
  '/admin/payment-page/configs/:id',
  requireAdminAuth as express.RequestHandler,
  (req: Request, res: Response) => adminPaymentPageController.getConfigById(req as any, res)
);


// Admin Refund Routes
apiRouter.get(
  '/admin/refunds',
  requireAdminAuth as express.RequestHandler,
  (req: Request, res: Response) => refundController.adminList(req as AuthenticatedRequest, res)
);

apiRouter.put(
  '/admin/refunds/:id/status',
  requireAdminAuth as express.RequestHandler,
  (req: Request, res: Response) => refundController.adminUpdateStatus(req as AuthenticatedRequest, res)
);

// ============================================
// Public Payment Page Session Routes
// ============================================

// Get payment session with configuration (for payment page frontend)
apiRouter.get('/payment-page/session/:checkoutId', async (req: Request, res: Response) => {
  try {
    const { checkoutId } = req.params;
    const { prisma } = await import('./config/database');

    // Get the transaction with merchant info
    const transaction = await prisma.paymentTransaction.findUnique({
      where: { checkout_id: checkoutId },
      include: {
        merchant: {
          select: {
            id: true,
            name: true,
            company_name: true,
          },
        },
      },
    });

    if (!transaction) {
      res.status(404).json({
        success: false,
        error: 'Payment session not found',
      });
      return;
    }

    // Get merchant's default payment page configuration
    let config = null;
    if (transaction.merchant_id) {
      // First try to get config by config_id if set on transaction
      if (transaction.config_id) {
        config = await prisma.paymentPageConfig.findUnique({
          where: { id: transaction.config_id },
        });
      }

      // Fall back to merchant's default config
      if (!config) {
        config = await prisma.paymentPageConfig.findFirst({
          where: {
            merchant_id: transaction.merchant_id,
            is_default: true,
            is_active: true,
          },
        });
      }
    }

    // Build the response
    const sessionConfig = {
      checkoutId: transaction.checkout_id,
      reference: transaction.reference,
      amount: Number(transaction.amount),
      currency: 'PKR',
      paymentMethod: transaction.payment_method,
      status: transaction.status,
      merchantId: transaction.merchant_id,
      merchantName: transaction.merchant?.company_name || transaction.merchant?.name || process.env.ORG_BRAND_NAME || 'Payment',
      configuration: config ? {
        id: config.id,
        name: config.name,
        branding: config.branding,
        colors: config.colors,
        typography: config.typography,
        layout: config.layout,
        channels: config.channels,
        text: config.text,
        legal: config.legal,
        resultPages: config.result_pages,
        advanced: config.advanced,
        visibility: config.visibility,
        formConfig: config.form_config,
        otpConfig: config.otp_config,
      } : null,
    };

    res.json({
      success: true,
      session: sessionConfig,
    });
  } catch (error) {
    console.error('Get payment session error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get payment session',
    });
  }
});

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

