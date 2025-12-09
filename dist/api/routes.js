"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("./middleware/auth.middleware");
const idempotency_middleware_1 = require("./middleware/idempotency.middleware");
const payouts_controller_1 = require("./controllers/payouts.controller");
const balance_controller_1 = require("./controllers/balance.controller");
const directory_controller_1 = require("./controllers/directory.controller");
const verification_controller_1 = require("./controllers/verification.controller");
const router = (0, express_1.Router)();
// Health check (no auth required)
router.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
});
// All API routes require authentication
router.use(auth_middleware_1.authenticateApiKey);
// Payouts routes
router.post('/payouts', idempotency_middleware_1.idempotencyMiddleware, payouts_controller_1.createPayout);
router.get('/payouts', payouts_controller_1.listPayouts);
router.get('/payouts/:id', payouts_controller_1.getPayout);
router.post('/payouts/:id/reinitiate', idempotency_middleware_1.idempotencyMiddleware, payouts_controller_1.reinitiatePayout);
// Balance routes
router.get('/balance', balance_controller_1.getBalance);
router.get('/balance/history', balance_controller_1.getBalanceHistory);
// Directory route
router.get('/directory', directory_controller_1.getDirectory);
// Verification route
router.post('/verify-account', idempotency_middleware_1.idempotencyMiddleware, verification_controller_1.verifyAccount);
exports.default = router;
//# sourceMappingURL=routes.js.map