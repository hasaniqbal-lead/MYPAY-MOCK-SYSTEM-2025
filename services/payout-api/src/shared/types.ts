export interface CreatePayoutRequest {
  merchantReference: string;
  amount: number;
  currency?: string;
  destType: 'BANK' | 'WALLET';
  bankCode?: string;
  walletCode?: string;
  accountNumber: string;
  accountTitle: string;
}

export interface PayoutResponse {
  id: string;
  merchantId: number;
  merchantReference: string;
  amount: string;
  currency: string;
  destType: string;
  bankCode?: string;
  walletCode?: string;
  accountNumber: string;
  accountTitle: string;
  status: string;
  failureReason?: string;
  pspReference?: string;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BalanceResponse {
  balance: string;
  lockedBalance: string;
  availableBalance: string;
}

export interface LedgerEntryResponse {
  id: string;
  type: string;
  amount: string;
  balance: string;
  description: string;
  metadata?: string;
  createdAt: string;
}

export interface DirectoryItem {
  code: string;
  name: string;
  isActive: boolean;
}

export interface VerifyAccountRequest {
  destType: 'BANK' | 'WALLET';
  bankCode?: string;
  walletCode?: string;
  accountNumber: string;
}

export interface VerifyAccountResponse {
  isValid: boolean;
  accountTitle?: string;
  message: string;
}

export interface WebhookPayload {
  event: string;
  payout: PayoutResponse;
  timestamp: string;
}

export type PayoutStatus = 
  | 'PENDING'
  | 'PROCESSING'
  | 'SUCCESS'
  | 'FAILED'
  | 'RETRY'
  | 'IN_REVIEW'
  | 'ON_HOLD';

import { Request } from 'express';

export interface MerchantRequest extends Request {
  merchant?: {
    id: number;
    name: string;
    email: string;
    apiKey: string;
    webhookUrl?: string;
  };
}

