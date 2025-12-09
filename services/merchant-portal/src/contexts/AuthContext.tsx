'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import Cookies from 'js-cookie'
import { authAPI, merchantAPI } from '@/lib/api'

interface User {
  id: string
  email: string
  companyName: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  register: (data: { companyName: string; username: string }) => Promise<{ password: string; merchant: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = Cookies.get('auth_token')
    if (token) {
      loadUser()
    } else {
      setIsLoading(false)
    }
  }, [])

  const loadUser = async () => {
    try {
      const data = await merchantAPI.getProfile()
      setUser(data.merchant)
      setIsLoading(false)
    } catch (error) {
      Cookies.remove('auth_token')
      setUser(null)
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login(email, password)
      if (response.success && response.token) {
        Cookies.set('auth_token', response.token, { expires: 7 })
        setUser(response.merchant)
      } else {
        throw new Error(response.error || 'Login failed')
      }
    } catch (error: any) {
      console.error('Login error in AuthContext:', error)
      throw error
    }
  }

  const logout = async () => {
    await authAPI.logout()
    setUser(null)
  }

  const register = async (data: { companyName: string; username: string }) => {
    const response = await authAPI.register(data)
    // Don't set token or user here - password will be shown in modal
    // User will login after seeing the password
    return response
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        register,
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

