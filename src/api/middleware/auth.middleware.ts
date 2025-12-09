import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../shared/database';
import { hashApiKey } from '../../shared/utils';
import { MerchantRequest } from '../../shared/types';
import { logAuthAttempt } from './audit.logger';

export async function authenticateApiKey(
  req: MerchantRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const apiKey = req.headers['x-api-key'] as string;
    const clientIp = (req.headers['x-forwarded-for'] as string || req.ip || 'unknown').split(',')[0].trim();

    if (!apiKey) {
      logAuthAttempt(false, undefined, 'MISSING_API_KEY', clientIp);
      res.status(401).json({
        error: {
          message: 'API key is required',
          code: 'MISSING_API_KEY',
        },
      });
      return;
    }

    // Hash the provided API key
    const hashedKey = hashApiKey(apiKey);

    // Find merchant by API key
    const merchant = await prisma.merchant.findFirst({
      where: {
        apiKey: hashedKey,
        isActive: true,
      },
    });

    if (!merchant) {
      logAuthAttempt(false, apiKey, 'INVALID_API_KEY', clientIp);
      res.status(401).json({
        error: {
          message: 'Invalid API key',
          code: 'INVALID_API_KEY',
        },
      });
      return;
    }

    // Log successful authentication
    logAuthAttempt(true, apiKey, 'SUCCESS', clientIp);

    // Attach merchant to request
    req.merchant = {
      id: merchant.id,
      name: merchant.name,
      email: merchant.email,
      apiKey: merchant.apiKey,
      webhookUrl: merchant.webhookUrl || undefined,
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    logAuthAttempt(false, req.headers['x-api-key'] as string, 'AUTH_ERROR', req.ip);
    res.status(500).json({
      error: {
        message: 'Authentication failed',
        code: 'AUTH_ERROR',
      },
    });
  }
}

