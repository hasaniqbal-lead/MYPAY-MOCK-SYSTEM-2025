import { Request } from 'express';

export interface VendorInfo {
  id: number;
  vendor_id: string;
  api_key: string;
  api_secret: string;
  merchant_id: number | null;
  is_active: boolean;
}

export interface MerchantInfo {
  id: number;
  email: string;
  company_name: string;
  status: string;
}

export interface AuthenticatedRequest extends Request {
  vendor?: VendorInfo;
  merchant?: MerchantInfo;
  merchantId?: number;
}

export interface CheckoutRequest {
  reference: string;
  amount: number;
  paymentMethod: 'jazzcash' | 'easypaisa' | 'card';
  paymentType: 'onetime';
  successUrl: string;
  returnUrl: string;
  user?: {
    id?: string;
    email?: string;
  };
}

export interface Transaction {
  id: number;
  checkout_id: string;
  vendor_id: string | null;
  reference: string;
  amount: number;
  payment_method: string;
  payment_type: string;
  success_url: string;
  return_url: string;
  status: string;
  status_code: string | null;
  mobile_number: string | null;
  user_data: string | null;
  webhook_status: string;
  webhook_attempts: number;
  merchant_id: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface ScenarioMapping {
  id: number;
  mobile_number: string;
  scenario: string;
  status: string;
  status_code: string;
  description: string;
}

export interface WebhookPayload {
  id: string;
  vendorId: string;
  checkoutId: string;
  reference: string;
  paymentMethod: string;
  status: string;
  statusCode: string;
  createdAt: Date;
  updatedAt: Date;
  amount: number;
  acknowledged: boolean;
  tokenId: string;
  message: string;
  user?: unknown;
}

export interface DashboardStats {
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  successRate: number;
  totalAmount: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
  paymentMethod?: string;
}

