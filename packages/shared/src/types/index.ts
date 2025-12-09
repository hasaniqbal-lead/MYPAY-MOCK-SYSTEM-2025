// Common types shared across all services

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Payout Types
export type PayoutStatus = 
  | 'PENDING' 
  | 'PROCESSING' 
  | 'SUCCESS' 
  | 'FAILED' 
  | 'RETRY' 
  | 'IN_REVIEW' 
  | 'ON_HOLD';

export type DestinationType = 'BANK' | 'WALLET';

export interface PayoutRequest {
  merchantReference: string;
  amount: number;
  currency?: string;
  destType: DestinationType;
  bankCode?: string;
  walletCode?: string;
  accountNumber: string;
  accountTitle: string;
}

// Payment Types
export type PaymentStatus = 'pending' | 'completed' | 'failed';

export type PaymentMethod = 'jazzcash' | 'easypaisa';

export interface CheckoutRequest {
  reference: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentType: 'onetime' | 'recurring';
  successUrl: string;
  returnUrl: string;
  user?: {
    id?: string;
    email?: string;
  };
}

// Merchant Types
export interface MerchantProfile {
  id: string;
  name: string;
  email: string;
  webhookUrl?: string;
  isActive: boolean;
  createdAt: Date;
}

// Webhook Types
export interface WebhookPayload {
  eventType: string;
  timestamp: string;
  data: Record<string, unknown>;
}

