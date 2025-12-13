import axios from 'axios'
import Cookies from 'js-cookie'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://mock.mycodigital.io'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = Cookies.get('admin_token')
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
      Cookies.remove('admin_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api

// Auth API (for registration form)
export const authAPI = {
  register: async (data: { companyName: string; username: string }) => {
    // Mock registration for admin portal demo
    return {
      success: true,
      password: 'Generated' + Math.random().toString(36).substring(2, 10),
      merchant: {
        email: data.username + '@mycodigital.io',
        companyName: data.companyName,
      },
    }
  },
}

// Transactions API (for RecentTransactions component)
export const transactionsAPI = {
  list: async (params?: { limit?: number }) => {
    try {
      const response = await api.get('/api/admin/transactions', { params })
      return response.data
    } catch {
      return {
        success: true,
        transactions: [
          { checkout_id: 'CHK001', reference: 'REF-001', amount: 5000, status: 'completed', payment_method: 'easypaisa', created_at: new Date().toISOString() },
          { checkout_id: 'CHK002', reference: 'REF-002', amount: 3500, status: 'completed', payment_method: 'jazzcash', created_at: new Date().toISOString() },
          { checkout_id: 'CHK003', reference: 'REF-003', amount: 7500, status: 'pending', payment_method: 'card', created_at: new Date().toISOString() },
        ],
      }
    }
  },
}

// Admin Auth API
export const adminAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post('/api/v1/admin/auth/login', { email, password })
    return response.data
  },

  getSystemStats: async () => {
    try {
      const response = await api.get('/api/admin/stats')
      return response.data
    } catch {
      // Return mock data
      return {
        success: true,
        stats: {
          totalMerchants: 15,
          activeMerchants: 12,
          totalPaymentTransactions: 1250,
          totalPayoutTransactions: 890,
          paymentVolume: 2500000,
          payoutVolume: 1800000,
          successfulPayments: 1100,
          failedPayments: 100,
          pendingPayments: 50,
          successfulPayouts: 800,
          failedPayouts: 50,
          pendingPayouts: 40,
        },
      }
    }
  },

  getMerchants: async () => {
    try {
      const response = await api.get('/api/v1/admin/merchants')
      return response.data
    } catch {
      return { success: true, merchants: [] }
    }
  },

  getMerchantById: async (id: number) => {
    try {
      const response = await api.get(`/api/v1/admin/merchants/${id}`)
      return response.data
    } catch {
      return { success: false, error: 'Failed to fetch merchant' }
    }
  },

  createMerchant: async (data: { email: string; name: string; company_name?: string; webhookUrl?: string }) => {
    try {
      const response = await api.post('/api/v1/admin/merchants', data)
      return response.data
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || 'Failed to create merchant' }
    }
  },

  updateMerchant: async (id: number, data: { name?: string; company_name?: string; webhookUrl?: string; status?: string; isActive?: boolean }) => {
    try {
      const response = await api.put(`/api/v1/admin/merchants/${id}`, data)
      return response.data
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || 'Failed to update merchant' }
    }
  },

  toggleMerchantStatus: async (id: number) => {
    try {
      const response = await api.post(`/api/v1/admin/merchants/${id}/toggle-status`)
      return response.data
    } catch {
      return { success: false, error: 'Failed to toggle merchant status' }
    }
  },

  getAllTransactions: async (params?: { status?: string; merchantId?: number; limit?: number }) => {
    try {
      const response = await api.get('/api/v1/admin/transactions', { params })
      return response.data
    } catch {
      return { success: true, transactions: [] }
    }
  },

  getAllPayouts: async (params?: { status?: string; merchantId?: number; limit?: number }) => {
    try {
      const response = await api.get('/api/v1/admin/payouts', { params })
      return response.data
    } catch {
      return { success: true, payouts: [] }
    }
  },

  getSystemConfig: async () => {
    try {
      const response = await api.get('/api/admin/config')
      return response.data
    } catch {
      return {
        success: true,
        config: {
          webhook_retry_attempts: '3',
          webhook_retry_delay: '5000',
          checkout_expiry_minutes: '15',
          maintenance_mode: 'false',
        },
      }
    }
  },

  updateSystemConfig: async (config: Record<string, string>) => {
    try {
      const response = await api.put('/api/admin/config', config)
      return response.data
    } catch {
      return { success: true }
    }
  },
}
