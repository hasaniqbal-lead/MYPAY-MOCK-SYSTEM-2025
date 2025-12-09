import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generate HMAC signature for webhook payload
 */
export function generateWebhookSignature(payload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

/**
 * Verify HMAC signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = generateWebhookSignature(payload, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Generate API key
 */
export function generateApiKey(): string {
  return `mypay_${crypto.randomBytes(32).toString('hex')}`;
}

/**
 * Hash API key for storage
 */
export function hashApiKey(apiKey: string): string {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}

/**
 * Format amount to 2 decimal places
 */
export function formatAmount(amount: number | string): string {
  return Number(amount).toFixed(2);
}

/**
 * Parse account number suffix for test scenarios
 */
export function getAccountSuffix(accountNumber: string): string {
  return accountNumber.slice(-4);
}

/**
 * Determine payout status based on test scenario
 */
export function determinePayoutStatus(
  accountNumber: string,
  amount: number
): { status: string; shouldRetry?: boolean } {
  const suffix = getAccountSuffix(accountNumber);

  // Large amounts go to review
  if (amount >= 100000) {
    return { status: 'IN_REVIEW' };
  }

  // Test scenarios based on suffix
  switch (suffix) {
    case '0001':
      return { status: 'SUCCESS' };
    case '0002':
      return { status: 'RETRY', shouldRetry: true };
    case '0003':
      return { status: 'FAILED' };
    case '0004':
      return { status: 'PENDING' };
    case '0005':
      return { status: 'ON_HOLD' };
    default:
      return { status: 'SUCCESS' };
  }
}

/**
 * Generate failure reason based on status
 */
export function getFailureReason(status: string): string | null {
  switch (status) {
    case 'FAILED':
      return 'Account validation failed';
    case 'ON_HOLD':
      return 'Account is blocked or restricted';
    default:
      return null;
  }
}

/**
 * Sleep utility for delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate PSP reference
 */
export function generatePspReference(): string {
  return `PSP${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}

/**
 * Validate bank code
 */
export function isValidBankCode(code: string): boolean {
  const validCodes = [
    'HBL', 'UBL', 'MCB', 'ABL', 'JSBL', 'BAHL', 'MEEZAN', 'ASKARI',
    'BANKALHABIB', 'SONERI', 'FBL', 'BOP', 'NBP', 'SBP'
  ];
  return validCodes.includes(code.toUpperCase());
}

/**
 * Validate wallet code
 */
export function isValidWalletCode(code: string): boolean {
  const validCodes = ['EASYPAISA', 'JAZZCASH', 'SADAPAY', 'NAYAPAY'];
  return validCodes.includes(code.toUpperCase());
}

/**
 * Validate account number format
 */
export function isValidAccountNumber(accountNumber: string): boolean {
  // Pakistani account numbers are typically 10-16 digits
  return /^\d{10,16}$/.test(accountNumber);
}

/**
 * Get account title for test scenarios
 */
export function getAccountTitle(accountNumber: string): string {
  const suffix = getAccountSuffix(accountNumber);
  const names: Record<string, string> = {
    '0001': 'Test User Success',
    '0002': 'Test User Retry',
    '0003': 'Test User Failed',
    '0004': 'Test User Pending',
    '0005': 'Test User Blocked',
  };
  return names[suffix] || 'Test User';
}

/**
 * Create webhook payload
 */
export function createWebhookPayload(
  event: string,
  payout: any
): string {
  return JSON.stringify({
    event,
    payout: {
      id: payout.id,
      merchantId: payout.merchantId,
      merchantReference: payout.merchantReference,
      amount: payout.amount.toString(),
      currency: payout.currency,
      destType: payout.destType,
      bankCode: payout.bankCode,
      walletCode: payout.walletCode,
      accountNumber: payout.accountNumber,
      accountTitle: payout.accountTitle,
      status: payout.status,
      failureReason: payout.failureReason,
      pspReference: payout.pspReference,
      processedAt: payout.processedAt?.toISOString(),
      createdAt: payout.createdAt.toISOString(),
      updatedAt: payout.updatedAt.toISOString(),
    },
    timestamp: new Date().toISOString(),
  });
}

/**
 * Calculate available balance
 */
export function calculateAvailableBalance(
  balance: number | string,
  lockedBalance: number | string
): string {
  const bal = typeof balance === 'string' ? parseFloat(balance) : balance;
  const locked = typeof lockedBalance === 'string' ? parseFloat(lockedBalance) : lockedBalance;
  return Math.max(0, bal - locked).toFixed(2);
}

/**
 * Validate currency
 */
export function isValidCurrency(currency: string): boolean {
  return currency === 'PKR';
}

/**
 * Generate idempotency key hash
 */
export function hashIdempotencyKey(merchantId: number, key: string, body: any): string {
  const content = `${merchantId}:${key}:${JSON.stringify(body)}`;
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Check if idempotency key is expired
 */
export function isIdempotencyKeyExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}

/**
 * Format error response
 */
export function formatErrorResponse(message: string, code?: string) {
  return {
    error: {
      message,
      code: code || 'INTERNAL_ERROR',
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Format success response
 */
export function formatSuccessResponse(data: any, message?: string) {
  return {
    success: true,
    message,
    data,
  };
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Sanitize string input
 */
export function sanitizeString(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

/**
 * Generate merchant reference if not provided
 */
export function generateMerchantReference(): string {
  return `REF${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
}

