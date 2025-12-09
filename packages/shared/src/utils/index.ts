import * as crypto from 'crypto';

/**
 * Generate a random API key
 */
export function generateApiKey(): string {
  return `mypay_${crypto.randomBytes(32).toString('hex')}`;
}

/**
 * Hash an API key for storage
 */
export function hashApiKey(apiKey: string): string {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}

/**
 * Generate a webhook signature
 */
export function generateWebhookSignature(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

/**
 * Verify a webhook signature
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
 * Format a success response
 */
export function formatSuccessResponse<T>(data: T): { success: true; data: T } {
  return { success: true, data };
}

/**
 * Format an error response
 */
export function formatErrorResponse(
  message: string,
  code: string
): { success: false; error: { message: string; code: string } } {
  return {
    success: false,
    error: { message, code },
  };
}

/**
 * Sleep for a specified duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate a UUID v4
 */
export function generateUuid(): string {
  return crypto.randomUUID();
}

/**
 * Generate a PSP reference number
 */
export function generatePspReference(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `PSP${timestamp}${random}`;
}

