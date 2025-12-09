import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { AuthenticatedRequest } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

interface JwtPayload {
  merchantId: number;
}

/**
 * Middleware to require authentication
 */
export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
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
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    // Get merchant from database
    const merchant = await prisma.merchant.findFirst({
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
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
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
export function generateToken(merchantId: number): string {
  return jwt.sign({ merchantId }, JWT_SECRET, { expiresIn: '7d' });
}

export { JWT_SECRET };

