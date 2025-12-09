import { Router, RequestHandler } from 'express';
import { authenticateApiKey } from './middleware/auth.middleware';
import { idempotencyMiddleware } from './middleware/idempotency.middleware';
import {
  createPayout,
  getPayout,
  listPayouts,
  reinitiatePayout,
} from './controllers/payouts.controller';
import { getBalance, getBalanceHistory } from './controllers/balance.controller';
import { getDirectory } from './controllers/directory.controller';
import { verifyAccount } from './controllers/verification.controller';

const router = Router();

// Health check (no auth required)
router.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// All API routes require authentication
router.use(authenticateApiKey as RequestHandler);

// Payouts routes
router.post('/payouts', idempotencyMiddleware as RequestHandler, createPayout as RequestHandler);
router.get('/payouts', listPayouts as RequestHandler);
router.get('/payouts/:id', getPayout as RequestHandler);
router.post('/payouts/:id/reinitiate', idempotencyMiddleware as RequestHandler, reinitiatePayout as RequestHandler);

// Balance routes
router.get('/balance', getBalance as RequestHandler);
router.get('/balance/history', getBalanceHistory as RequestHandler);

// Directory route
router.get('/directory', getDirectory as RequestHandler);

// Verification route
router.post('/verify-account', idempotencyMiddleware as RequestHandler, verifyAccount as RequestHandler);

export default router;

