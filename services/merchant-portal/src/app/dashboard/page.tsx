'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { dashboardAPI, transactionsAPI } from '@/lib/api'
import { MetricsCard } from '@/components/dashboard/MetricsCard'
import { RecentTransactionsCard } from '@/components/dashboard/RecentTransactionsCard'
import Layout from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DollarSign, TrendingUp, CreditCard, Users, AlertCircle } from 'lucide-react'

interface DashboardStats {
  totalTransactions: number
  successfulTransactions: number
  failedTransactions: number
  successRate: number
  totalAmount: number
}

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData()
    }
  }, [isAuthenticated])

  const loadDashboardData = async () => {
    try {
      const [statsData, transactionsData] = await Promise.all([
        dashboardAPI.getStats(),
        transactionsAPI.list({ limit: 5 })
      ])
      setStats(statsData.stats)
      setTransactions(transactionsData.transactions || [])
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Welcome back, {user?.companyName || 'User'}</h1>
            <p className="text-muted-foreground">
              Here's what's happening with your MyPay merchant account today.
            </p>
          </div>
        </div>

        {/* Setup Alert */}
        <Alert className="border-status-warning/20 bg-status-warning/5">
          <AlertCircle className="h-4 w-4 text-status-warning" />
          <AlertDescription className="text-status-warning">
            Complete your business verification to start accepting live payments in Pakistan.
          </AlertDescription>
        </Alert>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mypay-green"></div>
          </div>
        ) : stats ? (
          <>
            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricsCard 
                title="Total Revenue" 
                value={`PKR ${stats.totalAmount.toLocaleString()}`} 
                change={12.5} 
                changeType="increase" 
                icon={<DollarSign className="h-4 w-4" />} 
              />
              <MetricsCard 
                title="Total Transactions" 
                value={stats.totalTransactions.toString()} 
                change={8.2} 
                changeType="increase" 
                icon={<CreditCard className="h-4 w-4" />} 
              />
              <MetricsCard 
                title="Success Rate" 
                value={`${stats.successRate.toFixed(1)}%`} 
                change={2.1} 
                changeType="increase" 
                icon={<TrendingUp className="h-4 w-4" />} 
              />
              <MetricsCard 
                title="Active Customers" 
                value="892" 
                change={-1.2} 
                changeType="decrease" 
                icon={<Users className="h-4 w-4" />} 
              />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - 2/3 width */}
              <div className="lg:col-span-2 space-y-6">
                <RecentTransactionsCard transactions={transactions} />
              </div>

              {/* Right Column - 1/3 width */}
              <div className="space-y-6">
                {/* System Status */}
                <Card className="shadow-elevation">
                  <CardHeader>
                    <CardTitle>System Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground">API Status</span>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-status-success rounded-full"></div>
                        <span className="text-sm text-status-success">Operational</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground">Payment Gateway</span>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-status-success rounded-full"></div>
                        <span className="text-sm text-status-success">Operational</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground">Webhook Delivery</span>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-status-warning rounded-full"></div>
                        <span className="text-sm text-status-warning">Degraded</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            No data available
          </div>
        )}
      </div>
    </Layout>
  )
}
