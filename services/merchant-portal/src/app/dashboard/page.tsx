'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { dashboardAPI, transactionsAPI } from '@/lib/api'
import { MetricsCard } from '@/components/dashboard/MetricsCard'
import { RecentTransactionsCard } from '@/components/dashboard/RecentTransactionsCard'
import Layout from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DollarSign, TrendingUp, CreditCard, AlertCircle, Zap, Copy, Check, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { credentialsAPI } from '@/lib/api'

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
              Here's what's happening with your account today.
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
                title="Success Rate"
                value={stats.successfulTransactions.toString()}
                change={0}
                changeType="increase"
                icon={<Check className="h-4 w-4" />}
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
                <QuickCheckout />
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

function QuickCheckout() {
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('all')
  const [expiry, setExpiry] = useState('1440') // 24 hours default
  const [reference, setReference] = useState(`QC-${Date.now().toString(36).toUpperCase()}`)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ url: string; id: string; expiresAt: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const handleGenerate = async () => {
    if (!amount || Number(amount) <= 0) return
    setLoading(true)
    setResult(null)
    try {
      const creds = await credentialsAPI.getCredentials()
      const apiKey = creds?.credentials?.paymentApiKey || creds?.credentials?.apiKey
      if (!apiKey) throw new Error('No API key found')

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || ''
      const body: any = {
        reference,
        amount: Number(amount),
        paymentType: 'onetime',
        successUrl: window.location.origin + '/dashboard',
        returnUrl: window.location.origin + '/dashboard',
        expiresIn: Number(expiry),
      }
      if (method !== 'all') body.paymentMethod = method

      const res = await fetch(`${apiUrl}/api/v1/checkouts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Api-Key': apiKey },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.success) {
        setResult({ url: data.checkoutUrl, id: data.checkoutId, expiresAt: data.expiresAt })
        setReference(`QC-${Date.now().toString(36).toUpperCase()}`)
      }
    } catch (err) {
      console.error('Quick checkout failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const copyLink = () => {
    if (result?.url) {
      navigator.clipboard.writeText(result.url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Card className="shadow-elevation">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Zap className="h-4 w-4 text-darpay-primary" />
          Quick Payment Link
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label className="text-xs">Amount (PKR)</Label>
          <Input
            type="number"
            placeholder="1000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="h-9"
          />
        </div>
        <div>
          <Label className="text-xs">Payment Method</Label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="all">All Methods</option>
            <option value="easypaisa">Easypaisa</option>
            <option value="jazzcash">JazzCash</option>
            <option value="card">Card</option>
          </select>
        </div>
        <div>
          <Label className="text-xs">Expires In</Label>
          <select
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
            className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="15">15 minutes</option>
            <option value="60">1 hour</option>
            <option value="1440">24 hours</option>
            <option value="10080">7 days</option>
          </select>
        </div>
        <Button
          onClick={handleGenerate}
          disabled={loading || !amount}
          className="w-full bg-darpay-primary hover:bg-darpay-primary-dark text-white"
        >
          {loading ? 'Generating...' : 'Generate Link'}
        </Button>

        {result && (
          <div className="mt-3 p-3 bg-muted rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={result.url}
                className="flex-1 text-xs bg-background border rounded px-2 py-1.5 truncate"
              />
              <Button size="sm" variant="outline" onClick={copyLink} className="h-8 px-2">
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              </Button>
              <a href={result.url} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="outline" className="h-8 px-2">
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </a>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Expires: {new Date(result.expiresAt).toLocaleString()}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
