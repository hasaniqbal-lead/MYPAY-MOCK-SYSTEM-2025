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

