'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Layout from '@/components/Layout'
import { adminAPI } from '@/lib/api'
import { Wallet, RefreshCw, Filter, Search } from 'lucide-react'

interface Payout {
  id: string
  merchantReference: string
  amount: number
  currency: string
  status: string
  destType: string
  bankCode: string | null
  walletCode: string | null
  accountNumber: string
  accountTitle: string
  createdAt: string
  processedAt: string | null
  failureReason?: string | null
  merchant: {
    id: number
    merchant_id: string
    name: string
    company_name: string
  }
}

interface Merchant {
  id: number
  merchant_id: string
  name: string
  company_name: string
}

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [merchants, setMerchants] = useState<Merchant[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [merchantFilter, setMerchantFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchMerchants()
  }, [])

  useEffect(() => {
    fetchPayouts()
  }, [statusFilter, merchantFilter])

  const fetchMerchants = async () => {
    try {
      const response = await adminAPI.getMerchants()
      if (response.success) {
        setMerchants(response.merchants)
      }
    } catch (error) {
      console.error('Failed to fetch merchants:', error)
    }
  }

  const fetchPayouts = async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (statusFilter !== 'all') params.status = statusFilter
      if (merchantFilter !== 'all') params.merchantId = parseInt(merchantFilter)
      params.limit = 100

      const response = await adminAPI.getAllPayouts(params)
      if (response.success) {
        setPayouts(response.payouts)
      }
    } catch (error) {
      console.error('Failed to fetch payouts:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPayouts = payouts.filter((payout) => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      payout.merchantReference.toLowerCase().includes(search) ||
      payout.accountNumber.toLowerCase().includes(search) ||
      payout.accountTitle.toLowerCase().includes(search) ||
      payout.merchant.merchant_id.toLowerCase().includes(search) ||
      payout.merchant.name.toLowerCase().includes(search) ||
      payout.merchant.company_name.toLowerCase().includes(search)
    )
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'SUCCESS':
      case 'COMPLETED':
        return 'bg-status-success/10 text-status-success border-status-success/20'
      case 'PENDING':
      case 'PROCESSING':
        return 'bg-status-pending/10 text-status-pending border-status-pending/20'
      case 'FAILED':
      case 'ERROR':
      case 'REJECTED':
        return 'bg-status-error/10 text-status-error border-status-error/20'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  const totalAmount = filteredPayouts.reduce((sum, payout) => sum + payout.amount, 0)
  const completedAmount = filteredPayouts
    .filter((payout) => payout.status.toUpperCase() === 'SUCCESS' || payout.status.toUpperCase() === 'COMPLETED')
    .reduce((sum, payout) => sum + payout.amount, 0)

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Wallet className="h-6 w-6 text-mypay-green" />
              Payouts
            </h1>
            <p className="text-muted-foreground">View all payout transactions</p>
          </div>
          <Button onClick={fetchPayouts} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Payouts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredPayouts.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Volume</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalAmount)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completed Volume</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(completedAmount)}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="text-foreground">All Payouts</CardTitle>
                <CardDescription>
                  {filteredPayouts.length} payouts
                </CardDescription>
              </div>
              
              <div className="flex flex-col md:flex-row gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                
                <Select value={merchantFilter} onValueChange={setMerchantFilter}>
                  <SelectTrigger className="w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by merchant" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Merchants</SelectItem>
                    {merchants.map((merchant) => (
                      <SelectItem key={merchant.id} value={merchant.id.toString()}>
                        {merchant.company_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="SUCCESS">Success</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="FAILED">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading payouts...</div>
            ) : filteredPayouts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No payouts found</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Merchant</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayouts.map((payout) => (
                    <TableRow key={payout.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{payout.merchant.company_name}</p>
                          <p className="text-xs text-muted-foreground">{payout.merchant.merchant_id}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {payout.merchantReference}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="font-medium">{payout.accountTitle}</p>
                          <p className="text-xs text-muted-foreground">
                            {payout.bankCode || payout.walletCode} - {payout.accountNumber}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(payout.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {payout.destType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(payout.status)}>
                          {payout.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        <div>
                          <p>{formatDate(payout.createdAt)}</p>
                          {payout.processedAt && (
                            <p className="text-xs">Processed: {formatDate(payout.processedAt)}</p>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
