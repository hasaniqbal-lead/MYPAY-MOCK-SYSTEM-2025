import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../shared/database';
import { hashIdempotencyKey, isIdempotencyKeyExpired } from '../../shared/utils';
import { MerchantRequest } from '../../shared/types';

const IDEMPOTENCY_KEY_TTL_HOURS = 24;

export async function idempotencyMiddleware(
  req: MerchantRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  // Only apply to POST, PUT, PATCH requests
  if (!['POST', 'PUT', 'PATCH'].includes(req.method)) {
    next();
    return;
  }

  try {
    const idempotencyKey = req.headers['x-idempotency-key'] as string;

    if (!idempotencyKey) {
      res.status(400).json({
        error: {
          message: 'X-Idempotency-Key header is required',
          code: 'MISSING_IDEMPOTENCY_KEY',
        },
      });
      return;
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(idempotencyKey)) {
      res.status(400).json({
        error: {
          message: 'X-Idempotency-Key must be a valid UUID',
          code: 'INVALID_IDEMPOTENCY_KEY',
        },
      });
      return;
    }

    if (!req.merchant) {
      res.status(401).json({
        error: {
          message: 'Authentication required',
          code: 'UNAUTHORIZED',
        },
      });
      return;
    }

    const merchantId = req.merchant.id;
    const requestHash = hashIdempotencyKey(merchantId, idempotencyKey, req.body);

    // Check if key exists
    const existingKey = await prisma.payoutIdempotencyKey.findUnique({
      where: {
        merchantId_key: {
          merchantId,
          key: idempotencyKey,
        },
      },
    });

    if (existingKey) {
      // Check if expired
      if (isIdempotencyKeyExpired(existingKey.expiresAt)) {
        // Delete expired key
        await prisma.payoutIdempotencyKey.delete({
          where: { id: existingKey.id },
        });
      } else {
        // Check if request hash matches
        if (existingKey.requestHash === requestHash && existingKey.response) {
          // Return cached response
          const cachedResponse = JSON.parse(existingKey.response);
          res.status(cachedResponse.statusCode || 200).json(cachedResponse.body);
          return;
        } else {
          // Different request with same key
          res.status(409).json({
            error: {
              message: 'Idempotency key already used with different request',
              code: 'IDEMPOTENCY_KEY_CONFLICT',
            },
          });
          return;
        }
      }
    }

    // Store idempotency key
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + IDEMPOTENCY_KEY_TTL_HOURS);

    await prisma.payoutIdempotencyKey.create({
      data: {
        merchantId,
        key: idempotencyKey,
        requestHash,
        expiresAt,
      },
    });

    // Store original json method to capture response
    const originalJson = res.json.bind(res);
    res.json = function (body: any) {
      // Store response in idempotency key
      prisma.payoutIdempotencyKey
        .update({
          where: {
            merchantId_key: {
              merchantId,
              key: idempotencyKey,
            },
          },
          data: {
            response: JSON.stringify({
              statusCode: res.statusCode,
              body,
            }),
          },
        })
        .catch(console.error);

      return originalJson(body);
    };

    next();
  } catch (error) {
    console.error('Idempotency middleware error:', error);
    res.status(500).json({
      error: {
        message: 'Idempotency check failed',
        code: 'IDEMPOTENCY_ERROR',
      },
    });
  }
}

