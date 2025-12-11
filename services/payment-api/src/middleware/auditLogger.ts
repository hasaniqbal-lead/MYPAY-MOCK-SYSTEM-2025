import { Request, Response, NextFunction } from 'express';

/**
 * Audit Logger Middleware
 * Logs all API requests with comprehensive details for audit compliance
 */

interface AuditLog {
  timestamp: string;
  request_id: string;
  merchant_id?: number;
  api_key_hash?: string;
  method: string;
  path: string;
  query: any;
  ip_address: string;
  user_agent: string;
  request_body?: any;
  response_status?: number;
  response_time_ms?: number;
  error?: string;
}

// Store request start time
const requestTimes = new Map<string, number>();

/**
 * Hash API key for logging (first 8 chars + last 4 chars)
 */
function hashApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 12) return 'invalid';
  return `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`;
}

/**
 * Sanitize sensitive data from request body
 */
function sanitizeBody(body: any): any {
  if (!body) return body;

  const sanitized = { ...body };

  // Mask sensitive fields
  const sensitiveFields = ['password', 'pin', 'cvv', 'card_number', 'cardNumber', 'cvc'];
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '***REDACTED***';
    }
  }

  // Partially mask phone numbers
  if (sanitized.phone && sanitized.phone.length > 5) {
    const phone = sanitized.phone;
    sanitized.phone = `${phone.substring(0, 3)}${'*'.repeat(phone.length - 5)}${phone.substring(phone.length - 2)}`;
  }

  return sanitized;
}

/**
 * Request Logger - Logs incoming requests
 */
export function auditRequestLogger(req: any, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  const requestId = req.headers['x-request-id'] as string || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  requestTimes.set(requestId, startTime);

  const auditLog: AuditLog = {
    timestamp: new Date().toISOString(),
    request_id: requestId,
    merchant_id: req.merchant?.id,
    api_key_hash: req.headers['x-api-key'] ? hashApiKey(req.headers['x-api-key'] as string) : undefined,
    method: req.method,
    path: req.path,
    query: Object.keys(req.query).length > 0 ? req.query : undefined,
    ip_address: (req.headers['x-forwarded-for'] as string || req.ip || req.socket.remoteAddress || 'unknown').split(',')[0].trim(),
    user_agent: req.headers['user-agent'] || 'unknown',
  };

  // Log request body for POST/PUT/PATCH (sanitized)
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
    auditLog.request_body = sanitizeBody(req.body);
  }

  // Log the request
  console.log(`[AUDIT-REQUEST] ${JSON.stringify(auditLog)}`);

  // Store request ID for response logging
  res.locals.auditRequestId = requestId;
  res.locals.auditStartTime = startTime;

  next();
}

/**
 * Response Logger - Logs outgoing responses
 */
export function auditResponseLogger(req: any, res: Response, next: NextFunction): void {
  const originalSend = res.send;

  res.send = function(data: any): Response {
    const requestId = res.locals.auditRequestId;
    const startTime = res.locals.auditStartTime || Date.now();
    const responseTime = Date.now() - startTime;

    const auditLog: AuditLog = {
      timestamp: new Date().toISOString(),
      request_id: requestId,
      merchant_id: req.merchant?.id,
      method: req.method,
      path: req.path,
      query: {},
      ip_address: (req.headers['x-forwarded-for'] as string || req.ip || 'unknown').split(',')[0].trim(),
      user_agent: req.headers['user-agent'] || 'unknown',
      response_status: res.statusCode,
      response_time_ms: responseTime,
    };

    // Log error details if response is an error
    if (res.statusCode >= 400) {
      try {
        const responseData = typeof data === 'string' ? JSON.parse(data) : data;
        if (responseData.error) {
          auditLog.error = typeof responseData.error === 'string' ? responseData.error : responseData.error.message || responseData.error.code;
        }
      } catch (e) {
        // Ignore parse errors
      }
    }

    console.log(`[AUDIT-RESPONSE] ${JSON.stringify(auditLog)}`);

    // Clean up request time tracking
    if (requestId) {
      requestTimes.delete(requestId);
    }

    return originalSend.call(this, data);
  };

  next();
}

/**
 * Transaction Audit Logger
 * Logs important business transactions (payments, checkouts, etc.)
 */
export function logTransaction(type: string, data: any): void {
  const transactionLog = {
    timestamp: new Date().toISOString(),
    log_type: 'TRANSACTION',
    transaction_type: type,
    data: data,
  };

  console.log(`[AUDIT-TRANSACTION] ${JSON.stringify(transactionLog)}`);
}

/**
 * Authentication Audit Logger
 * Logs authentication attempts and session validation
 */
export function logAuthAttempt(success: boolean, identifier?: string, reason?: string, ip?: string): void {
  const authLog = {
    timestamp: new Date().toISOString(),
    log_type: 'AUTHENTICATION',
    success: success,
    identifier: identifier || 'unknown',
    reason: reason,
    ip_address: ip || 'unknown',
  };

  console.log(`[AUDIT-AUTH] ${JSON.stringify(authLog)}`);
}

