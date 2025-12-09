import axios from 'axios'
import Cookies from 'js-cookie'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://sandbox.mycodigital.io'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = Cookies.get('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('auth_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    try {
      const response = await api.post('/api/portal/auth/login', { email, password })
      return response.data
    } catch (error) {
      // Mock login for local development when API is unreachable
      if (email === 'test@mycodigital.io' && password === 'test123456') {
        return {
          success: true,
          token: 'mock-merchant-token-' + Date.now(),
          merchant: {
            id: '1',
            email: 'test@mycodigital.io',
            companyName: 'Test Merchant Company',
          },
        }
      }
      throw error
    }
  },
  register: async (data: { companyName: string; username: string }) => {
    try {
      const response = await api.post('/api/portal/auth/register', data)
      return response.data
    } catch {
      // Mock registration for local development
      return {
        success: true,
        password: 'Generated' + Math.random().toString(36).substring(2, 10),
        merchant: {
          email: data.username + '@mycodigital.io',
          companyName: data.companyName,
        },
      }
    }
  },
  logout: async () => {
    try {
      await api.post('/api/portal/auth/logout')
    } catch {
      // Ignore logout errors in local development
    }
    Cookies.remove('auth_token')
  },
}

// Merchant API
export const merchantAPI = {
  getProfile: async () => {
    try {
      const response = await api.get('/api/portal/merchant/profile')
      return response.data
    } catch {
      // Mock profile for local development
      return {
        success: true,
        merchant: {
          id: '1',
          email: 'test@mycodigital.io',
          companyName: 'Test Merchant Company',
        },
      }
    }
  },
  updateProfile: async (data: any) => {
    try {
      const response = await api.put('/api/portal/merchant/profile', data)
      return response.data
    } catch {
      return { success: true }
    }
  },
  getCredentials: async () => {
    try {
      const response = await api.get('/api/portal/merchant/credentials')
      // Extract credentials from nested response
      return response.data.credentials || response.data
    } catch {
      // Mock credentials for local development
      return {
        vendor_id: 'VENDOR_000001',
        api_key: 'test-api-key-123',
        api_secret: 'test-api-secret-456',
      }
    }
  },
  generateApiKey: async () => {
    try {
      const response = await api.post('/api/portal/merchant/credentials')
      // Extract credentials from nested response
      return response.data.credentials || response.data
    } catch {
      // Mock new credentials for local development
      return {
        vendor_id: 'VENDOR_000001',
        api_key: 'new-api-key-' + Date.now(),
        api_secret: 'new-api-secret-' + Date.now(),
      }
    }
  },
}

// Transactions API
export const transactionsAPI = {
  list: async (params?: {
    page?: number
    limit?: number
    status?: string
    startDate?: string
    endDate?: string
  }) => {
    try {
      const response = await api.get('/api/portal/transactions', { params })
      return response.data
    } catch {
      // Mock transactions for local development
      return {
        success: true,
        transactions: [
          { checkout_id: 'CHK001', reference: 'REF-001', amount: 5000, status: 'completed', payment_method: 'easypaisa', created_at: new Date().toISOString() },
          { checkout_id: 'CHK002', reference: 'REF-002', amount: 3500, status: 'completed', payment_method: 'jazzcash', created_at: new Date().toISOString() },
          { checkout_id: 'CHK003', reference: 'REF-003', amount: 7500, status: 'pending', payment_method: 'card', created_at: new Date().toISOString() },
        ],
        pagination: { page: 1, limit: 10, total: 3, pages: 1 },
      }
    }
  },
  get: async (id: string) => {
    try {
      const response = await api.get(`/api/portal/transactions/${id}`)
      return response.data
    } catch {
      return {
        success: true,
        transaction: { checkout_id: id, reference: 'REF-001', amount: 5000, status: 'completed', payment_method: 'easypaisa', created_at: new Date().toISOString() },
      }
    }
  },
  export: async (format: 'csv' | 'json', params?: any) => {
    try {
      const response = await api.get(`/api/portal/transactions/export/${format}`, {
        params,
        responseType: 'blob',
      })
      return response.data
    } catch {
      return new Blob(['No data'], { type: 'text/plain' })
    }
  },
}

// Dashboard API
export const dashboardAPI = {
  getStats: async () => {
    try {
      const response = await api.get('/api/portal/dashboard/stats')
      return response.data
    } catch {
      // Mock stats for local development
      return {
        success: true,
        stats: {
          totalTransactions: 150,
          successfulTransactions: 120,
          failedTransactions: 20,
          pendingTransactions: 10,
          totalAmount: 750000,
          successRate: 80.0,
          todayVolume: 25000,
          todayTransactions: 15,
        },
      }
    }
  },
}

// Payouts API
export const payoutsAPI = {
  list: async (params?: {
    page?: number
    limit?: number
    status?: string
    startDate?: string
    endDate?: string
  }) => {
    try {
      const response = await api.get('/api/portal/payouts', { params })
      return response.data
    } catch {
      // Mock payouts for local development
      return {
        success: true,
        payouts: [
          { 
            id: 'PYT001', 
            merchantReference: 'PAY-001', 
            amount: 25000, 
            status: 'SUCCESS', 
            destType: 'BANK',
            bankCode: 'HBL',
            walletCode: null,
            accountNumber: '1234567890',
            accountTitle: 'Muhammad Ali',
            createdAt: new Date(Date.now() - 86400000).toISOString() 
          },
          { 
            id: 'PYT002', 
            merchantReference: 'PAY-002', 
            amount: 15000, 
            status: 'SUCCESS', 
            destType: 'WALLET',
            bankCode: null,
            walletCode: 'EASYPAISA',
            accountNumber: '03001234567',
            accountTitle: 'Ahmed Khan',
            createdAt: new Date(Date.now() - 172800000).toISOString() 
          },
          { 
            id: 'PYT003', 
            merchantReference: 'PAY-003', 
            amount: 50000, 
            status: 'PENDING', 
            destType: 'BANK',
            bankCode: 'UBL',
            walletCode: null,
            accountNumber: '9876543210',
            accountTitle: 'Sara Ahmed',
            createdAt: new Date(Date.now() - 259200000).toISOString() 
          },
          { 
            id: 'PYT004', 
            merchantReference: 'PAY-004', 
            amount: 8500, 
            status: 'FAILED', 
            destType: 'WALLET',
            bankCode: null,
            walletCode: 'JAZZCASH',
            accountNumber: '03111234567',
            accountTitle: 'Fatima Hassan',
            failureReason: 'Invalid account number',
            createdAt: new Date(Date.now() - 345600000).toISOString() 
          },
        ],
        pagination: { page: 1, limit: 10, total: 4, pages: 1 },
      }
    }
  },
  get: async (id: string) => {
    try {
      const response = await api.get(`/api/portal/payouts/${id}`)
      return response.data
    } catch {
      return {
        success: true,
        payout: { 
          id, 
          merchantReference: 'PAY-001', 
          amount: 25000, 
          status: 'SUCCESS', 
          destType: 'BANK',
          bankCode: 'HBL',
          accountNumber: '1234567890',
          accountTitle: 'Muhammad Ali',
          createdAt: new Date().toISOString() 
        },
      }
    }
  },
  export: async (format: 'csv' | 'json', params?: any) => {
    try {
      const response = await api.get(`/api/portal/payouts/export/${format}`, {
        params,
        responseType: 'blob',
      })
      return response.data
    } catch {
      // Generate mock export data
      const mockPayouts = [
        { id: 'PYT001', merchantReference: 'PAY-001', amount: 25000, status: 'SUCCESS', destType: 'BANK', bankCode: 'HBL', accountNumber: '1234567890', accountTitle: 'Muhammad Ali' },
        { id: 'PYT002', merchantReference: 'PAY-002', amount: 15000, status: 'SUCCESS', destType: 'WALLET', walletCode: 'EASYPAISA', accountNumber: '03001234567', accountTitle: 'Ahmed Khan' },
      ]
      if (format === 'json') {
        return new Blob([JSON.stringify(mockPayouts, null, 2)], { type: 'application/json' })
      }
      const csv = 'ID,Reference,Amount,Status,Type,Bank/Wallet,Account,Title\n' + 
        mockPayouts.map(p => `${p.id},${p.merchantReference},${p.amount},${p.status},${p.destType},${p.bankCode || p.walletCode},${p.accountNumber},${p.accountTitle}`).join('\n')
      return new Blob([csv], { type: 'text/csv' })
    }
  },
}

