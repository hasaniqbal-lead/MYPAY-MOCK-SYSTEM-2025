"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JWT_SECRET = void 0;
exports.requireAuth = requireAuth;
exports.generateToken = generateToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../config/database");
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
exports.JWT_SECRET = JWT_SECRET;
/**
 * Middleware to require authentication
 */
async function requireAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                success: false,
                error: 'Unauthorized - No token provided',
            });
            return;
        }
        const token = authHeader.replace('Bearer ', '');
        // Verify token
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        // Get merchant from database
        const merchant = await database_1.prisma.merchant.findFirst({
            where: {
                id: decoded.merchantId,
                status: 'active',
            },
        });
        if (!merchant) {
            res.status(401).json({
                success: false,
                error: 'Unauthorized - Merchant not found or inactive',
            });
            return;
        }
        // Attach merchant to request
        req.merchant = {
            id: merchant.id,
            email: merchant.email,
            company_name: merchant.company_name || '',
            status: merchant.status,
        };
        req.merchantId = decoded.merchantId;
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError || error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            res.status(401).json({
                success: false,
                error: 'Unauthorized - Invalid or expired token',
            });
            return;
        }
        console.error('Auth middleware error:', error);
        res.status(500).json({
            success: false,
            error: 'Authentication error',
        });
    }
}
/**
 * Generate JWT token
 */
function generateToken(merchantId) {
    return jsonwebtoken_1.default.sign({ merchantId }, JWT_SECRET, { expiresIn: '7d' });
}
//# sourceMappingURL=auth.js.map