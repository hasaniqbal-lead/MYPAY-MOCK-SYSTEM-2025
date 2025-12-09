const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

// JWT secret - should be in .env in production
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Middleware to require authentication
async function requireAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized - No token provided'
            });
        }

        const token = authHeader.replace('Bearer ', '');

        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET);

        // Get merchant from database
        const [merchants] = await pool.query(
            'SELECT id, email, company_name, status FROM merchants WHERE id = ? AND status = ?',
            [decoded.merchantId, 'active']
        );

        if (merchants.length === 0) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized - Merchant not found or inactive'
            });
        }

        // Attach merchant to request
        req.merchant = merchants[0];
        req.merchantId = decoded.merchantId;

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized - Invalid or expired token'
            });
        }

        console.error('Auth middleware error:', error);
        return res.status(500).json({
            success: false,
            error: 'Authentication error'
        });
    }
}

// Generate JWT token
function generateToken(merchantId) {
    return jwt.sign(
        { merchantId },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
}

module.exports = {
    requireAuth,
    generateToken,
    JWT_SECRET
};

