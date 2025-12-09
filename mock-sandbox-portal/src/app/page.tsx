'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Code, Shield, Zap } from 'lucide-react'
import LoginForm from '@/components/auth/LoginForm'
import RegisterForm from '@/components/auth/RegisterForm'

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login')
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, isLoading, router])

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#2c3e50] via-[#34495e] to-[#1a252f] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mypay-green"></div>
      </div>
    )
  }

  // Don't render landing page if authenticated (will redirect)
  if (isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2c3e50] via-[#34495e] to-[#1a252f]">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row min-h-screen">
          {/* Right Side - Authentication Forms (First on mobile) */}
          <div className="flex-1 flex flex-col justify-center items-center max-w-lg mx-auto lg:mx-0 order-1 lg:order-2">
            <div className="w-full space-y-6">
              {/* Tab Navigation */}
              <div className="flex bg-white/10 backdrop-blur-sm p-1 rounded-lg border border-white/20">
                <Button
                  variant={activeTab === 'login' ? 'default' : 'ghost'}
                  onClick={() => setActiveTab('login')}
                  className={`flex-1 h-12 ${
                    activeTab === 'login' 
                      ? 'bg-mypay-green hover:bg-mypay-green-dark text-white' 
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Sign In
                </Button>
                <Button
                  variant={activeTab === 'register' ? 'default' : 'ghost'}
                  onClick={() => setActiveTab('register')}
                  className={`flex-1 h-12 ${
                    activeTab === 'register' 
                      ? 'bg-mypay-green hover:bg-mypay-green-dark text-white' 
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Create Merchant Account
                </Button>
              </div>

              {/* Form Content */}
              {activeTab === 'login' ? <LoginForm /> : <RegisterForm />}

              {/* Footer */}
              <div className="text-center text-sm text-gray-400">
                <p>
                  By continuing, you agree to our{' '}
                  <a href="#" className="text-mypay-green hover:underline">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="#" className="text-mypay-green hover:underline">
                    Privacy Policy
                  </a>
                </p>
              </div>
            </div>
          </div>

          {/* Left Side - Branding & Features (Second on mobile) */}
          <div className="flex-1 flex flex-col justify-center space-y-8 lg:pr-12 order-2 lg:order-1">
            {/* Logo and Main Heading */}
            <div className="text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-4 mb-8">
                <img 
                  src="/68b701ed-8fcb-48ba-a850-5d370741bcd5.png" 
                  alt="MyPay Logo" 
                  className="h-24 w-auto lg:h-32"
                />
                <Badge variant="secondary" className="bg-mypay-green/10 text-mypay-green text-sm">
                  Merchant Platform
                </Badge>
              </div>
              
              <h2 className="text-2xl lg:text-3xl font-semibold text-white mb-4">
                Build the future of payments in Pakistan & MENA
              </h2>
              <p className="text-lg text-gray-300 max-w-2xl">
                Access our comprehensive payment infrastructure with powerful APIs, 
                SDKs, and tools designed for merchants. Supporting PKR, USD, and AED 
                with mobile wallets, cards, and e-billing.
              </p>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-white/10 border-white/20 backdrop-blur-sm hover:bg-white/20 transition-all">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-mypay-green/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Code className="h-6 w-6 text-mypay-green" />
                  </div>
                  <h3 className="font-semibold text-white mb-2">Merchant-First</h3>
                  <p className="text-sm text-gray-300">
                    Comprehensive APIs and SDKs for seamless integration
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/10 border-white/20 backdrop-blur-sm hover:bg-white/20 transition-all">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-mypay-green/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Shield className="h-6 w-6 text-mypay-green" />
                  </div>
                  <h3 className="font-semibold text-white mb-2">Bank-Grade Security</h3>
                  <p className="text-sm text-gray-300">
                    Enterprise security with PCI DSS compliance
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/10 border-white/20 backdrop-blur-sm hover:bg-white/20 transition-all">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-mypay-green/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Zap className="h-6 w-6 text-mypay-green" />
                  </div>
                  <h3 className="font-semibold text-white mb-2">Lightning Fast</h3>
                  <p className="text-sm text-gray-300">
                    Real-time processing with 99.9% uptime guarantee
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-2xl font-bold text-mypay-green">99.9%</div>
                <div className="text-sm text-gray-300">Uptime</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-mypay-green">5+</div>
                <div className="text-sm text-gray-300">Countries</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-mypay-green">$50M+</div>
                <div className="text-sm text-gray-300">Processed</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
