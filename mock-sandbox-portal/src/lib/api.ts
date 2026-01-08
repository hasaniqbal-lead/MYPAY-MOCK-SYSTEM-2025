import axios from 'axios'
import Cookies from 'js-cookie'

// Use local API routes in development, remote API in production
const API_URL = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? '' : '')

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000, // 5 second timeout
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
    const response = await api.post('/api/portal/auth/login', { email, password })
    return response.data
  },
  register: async (data: { companyName: string; username: string }) => {
    const response = await api.post('/api/portal/auth/register', data)
    return response.data
  },
  logout: async () => {
    await api.post('/api/portal/auth/logout')
    Cookies.remove('auth_token')
  },
}

// Merchant API
export const merchantAPI = {
  getProfile: async () => {
    const response = await api.get('/api/portal/merchant/profile')
    return response.data
  },
  updateProfile: async (data: any) => {
    const response = await api.put('/api/portal/merchant/profile', data)
    return response.data
  },
  getCredentials: async () => {
    const response = await api.get('/api/portal/merchant/credentials')
    // Extract credentials from nested response
    return response.data.credentials || response.data
  },
  generateApiKey: async () => {
    const response = await api.post('/api/portal/merchant/credentials')
    // Extract credentials from nested response
    return response.data.credentials || response.data
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
    const response = await api.get('/api/portal/transactions', { params })
    return response.data
  },
  get: async (id: string) => {
    const response = await api.get(`/api/portal/transactions/${id}`)
    return response.data
  },
  export: async (format: 'csv' | 'json', params?: any) => {
    const response = await api.get(`/api/portal/transactions/export/${format}`, {
      params,
      responseType: 'blob',
    })
    return response.data
  },
}

// Dashboard API
export const dashboardAPI = {
  getStats: async () => {
    const response = await api.get('/api/portal/dashboard/stats')
    return response.data
  },
}

// Payment Page Configuration API
export const paymentPageAPI = {
  // Get merchant's payment page configuration
  getConfig: async () => {
    const response = await api.get('/api/portal/payment-page/config')
    return response.data
  },

  // Update payment page configuration
  updateConfig: async (config: any) => {
    const response = await api.put('/api/portal/payment-page/config', config)
    return response.data
  },

  // Update specific section of configuration
  updateSection: async (section: string, data: any) => {
    const response = await api.patch(`/api/portal/payment-page/config/${section}`, data)
    return response.data
  },

  // Get available templates
  getTemplates: async () => {
    const response = await api.get('/api/portal/payment-page/templates')
    return response.data
  },

  // Apply a template
  applyTemplate: async (templateId: string) => {
    const response = await api.post(`/api/portal/payment-page/templates/${templateId}/apply`)
    return response.data
  },

  // Generate a payment link
  generatePaymentLink: async (data: {
    amount: number
    currency: string
    reference: string
    description?: string
    expiresIn?: number
    callbackUrl?: string
  }) => {
    const response = await api.post('/api/portal/payment-page/links', data)
    return response.data
  },

  // List payment links
  listPaymentLinks: async (params?: { page?: number; limit?: number; status?: string }) => {
    const response = await api.get('/api/portal/payment-page/links', { params })
    return response.data
  },

  // Get payment link details
  getPaymentLink: async (token: string) => {
    const response = await api.get(`/api/portal/payment-page/links/${token}`)
    return response.data
  },

  // Preview payment page (returns preview URL)
  getPreviewUrl: async () => {
    const response = await api.get('/api/portal/payment-page/preview')
    return response.data
  },
}

