import axios from 'axios';
import { SessionResponse, CompletePaymentRequest, CompletePaymentResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Get payment session with configuration
 */
export async function getPaymentSession(checkoutId: string): Promise<SessionResponse> {
  const response = await api.get(`/api/v1/payment-page/session/${checkoutId}`);
  return response.data;
}

/**
 * Complete payment (initiate or verify OTP)
 */
export async function completePayment(
  checkoutId: string,
  data: CompletePaymentRequest
): Promise<CompletePaymentResponse> {
  const response = await api.post(`/payment/${checkoutId}/complete`, data);
  return response.data;
}

/**
 * Get checkout details (for status polling)
 */
export async function getCheckoutStatus(checkoutId: string) {
  const response = await api.get(`/api/v1/checkouts/${checkoutId}`);
  return response.data;
}

export default api;
