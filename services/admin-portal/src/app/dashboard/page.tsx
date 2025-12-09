'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Layout from '@/components/Layout'
import { adminAPI } from '@/lib/api'
import { 
  Users, 
  CreditCard, 
  Wallet, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react'

interface SystemStats {
  totalMerchants: number
  activeMerchants: number
  totalPaymentTransactions: number
  totalPayoutTransactions: number
  paymentVolume: number
  payoutVolume: number
  successfulPayments: number
  failedPayments: number
  pendingPayments: number
  successfulPayouts: number
  failedPayouts: number
  pendingPayouts: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await adminAPI.getSystemStats()
        if (response.success) {
          setStats(response.stats)
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error)
        // Set mock data for demo
        setStats({
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
        })
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading dashboard...</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">System Dashboard</h1>
          <p className="text-muted-foreground">Overview of the MyPay Mock Platform</p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Merchants</CardTitle>
              <Users className="h-4 w-4 text-mypay-green" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats?.totalMerchants}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.activeMerchants} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Payment Volume</CardTitle>
              <CreditCard className="h-4 w-4 text-mypay-green" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{formatCurrency(stats?.paymentVolume || 0)}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.totalPaymentTransactions} transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Payout Volume</CardTitle>
              <Wallet className="h-4 w-4 text-mypay-green" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{formatCurrency(stats?.payoutVolume || 0)}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.totalPayoutTransactions} transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-mypay-green" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {stats ? ((stats.successfulPayments / stats.totalPaymentTransactions) * 100).toFixed(1) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">Payment success rate</p>
            </CardContent>
          </Card>
        </div>

        {/* Transaction Status Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Payment Transactions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-mypay-green" />
                Payment Transactions
              </CardTitle>
              <CardDescription>
                Breakdown of payment transaction statuses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-status-success" />
                    <span className="text-foreground">Successful</span>
                  </div>
                  <Badge className="bg-status-success/10 text-status-success border-status-success/20">
                    {stats?.successfulPayments}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-status-warning" />
                    <span className="text-foreground">Pending</span>
                  </div>
                  <Badge className="bg-status-warning/10 text-status-warning border-status-warning/20">
                    {stats?.pendingPayments}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-status-error" />
                    <span className="text-foreground">Failed</span>
                  </div>
                  <Badge className="bg-status-error/10 text-status-error border-status-error/20">
                    {stats?.failedPayments}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payout Transactions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Wallet className="h-5 w-5 text-mypay-green" />
                Payout Transactions
              </CardTitle>
              <CardDescription>
                Breakdown of payout transaction statuses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-status-success" />
                    <span className="text-foreground">Successful</span>
                  </div>
                  <Badge className="bg-status-success/10 text-status-success border-status-success/20">
                    {stats?.successfulPayouts}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-status-warning" />
                    <span className="text-foreground">Pending</span>
                  </div>
                  <Badge className="bg-status-warning/10 text-status-warning border-status-warning/20">
                    {stats?.pendingPayouts}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-status-error" />
                    <span className="text-foreground">Failed</span>
                  </div>
                  <Badge className="bg-status-error/10 text-status-error border-status-error/20">
                    {stats?.failedPayouts}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-mypay-green" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 bg-mypay-green/5 rounded-lg border border-mypay-green/10">
                <div className="h-3 w-3 rounded-full bg-status-success animate-pulse" />
                <div>
                  <p className="text-sm font-medium text-foreground">Payment API</p>
                  <p className="text-xs text-muted-foreground">Operational</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-mypay-green/5 rounded-lg border border-mypay-green/10">
                <div className="h-3 w-3 rounded-full bg-status-success animate-pulse" />
                <div>
                  <p className="text-sm font-medium text-foreground">Payout API</p>
                  <p className="text-xs text-muted-foreground">Operational</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-mypay-green/5 rounded-lg border border-mypay-green/10">
                <div className="h-3 w-3 rounded-full bg-status-success animate-pulse" />
                <div>
                  <p className="text-sm font-medium text-foreground">Database</p>
                  <p className="text-xs text-muted-foreground">Healthy</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
