'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'

interface AdminUser {
  id: number
  email: string
  name: string
  role: string
}

interface AuthContextType {
  admin: AdminUser | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const token = Cookies.get('admin_token')
    if (token) {
      // In a real app, validate token with backend
      setAdmin({
        id: 1,
        email: 'admin@mycodigital.io',
        name: 'System Admin',
        role: 'super_admin',
      })
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Mock login - in production, call the API
      if (email === 'admin@mycodigital.io' && password === 'admin123456') {
        const mockToken = 'mock-admin-token-' + Date.now()
        Cookies.set('admin_token', mockToken, { expires: 1 })
        setAdmin({
          id: 1,
          email: 'admin@mycodigital.io',
          name: 'System Admin',
          role: 'super_admin',
        })
        return true
      }
      return false
    } catch {
      return false
    }
  }

  const logout = () => {
    Cookies.remove('admin_token')
    setAdmin(null)
    router.push('/login')
  }

  return (
    <AuthContext.Provider
      value={{
        admin,
        isLoading,
        isAuthenticated: !!admin,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
