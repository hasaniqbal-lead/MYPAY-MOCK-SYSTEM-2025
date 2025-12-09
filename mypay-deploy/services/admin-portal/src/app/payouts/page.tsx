'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import Layout from '@/components/Layout'
import { adminAPI } from '@/lib/api'
import { Wallet, RefreshCw, Filter } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Payout {
  id: string
  merchantReference: string
  amount: number
  status: string
  destType: string
  bankCode: string | null
  walletCode: string | null
  accountNumber: string
  accountTitle: string
  merchant_name: string
  createdAt: string
}

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    fetchPayouts()
  }, [statusFilter])

  const fetchPayouts = async () => {
    setLoading(true)
    try {
      const response = await adminAPI.getAllPayouts({ status: statusFilter !== 'all' ? statusFilter : undefined })
      if (response.success) {
        setPayouts(response.payouts)
      }
    } catch (error) {
      console.error('Failed to fetch payouts:', error)
      // Mock data
      setPayouts([
        {
          id: 'pyt_abc123',
          merchantReference: 'PAY-001',
          amount: 50000,
          status: 'SUCCESS',
          destType: 'BANK',
          bankCode: 'HBL',
          walletCode: null,
          accountNumber: '1234567890',
          accountTitle: 'John Doe',
          merchant_name: 'Test Merchant',
          createdAt: '2024-03-15T10:30:00Z',
        },
        {
          id: 'pyt_def456',
          merchantReference: 'PAY-002',
          amount: 25000,
          status: 'PENDING',
          destType: 'WALLET',
          bankCode: null,
          walletCode: 'EASYPAISA',
          accountNumber: '03001234567',
          accountTitle: 'Jane Smith',
          merchant_name: 'Demo Store',
          createdAt: '2024-03-15T11:45:00Z',
        },
        {
          id: 'pyt_ghi789',
          merchantReference: 'PAY-003',
          amount: 75000,
          status: 'FAILED',
          destType: 'BANK',
          bankCode: 'UBL',
          walletCode: null,
          accountNumber: '0987654321',
          accountTitle: 'Bob Wilson',
          merchant_name: 'Test Merchant',
          createdAt: '2024-03-15T12:00:00Z',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return 'bg-status-success/10 text-status-success border-status-success/20'
      case 'PENDING':
      case 'PROCESSING':
        return 'bg-status-warning/10 text-status-warning border-status-warning/20'
      case 'FAILED':
        return 'bg-status-error/10 text-status-error border-status-error/20'
      case 'IN_REVIEW':
      case 'ON_HOLD':
        return 'bg-orange-100 text-orange-700 border-orange-200'
      default:
        return 'bg-muted text-muted-foreground border-border'
    }
  }

  const getDestBadge = (destType: string) => {
    return destType === 'BANK'
      ? 'bg-mypay-green/10 text-mypay-green border-mypay-green/20'
      : 'bg-mypay-green/10 text-mypay-green border-mypay-green/20'
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Wallet className="h-6 w-6 text-mypay-green" />
              Payout Transactions
            </h1>
            <p className="text-muted-foreground">Monitor all payout transactions across merchants</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="SUCCESS">Success</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="PROCESSING">Processing</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
                <SelectItem value="IN_REVIEW">In Review</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={fetchPayouts}
              variant="outline"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">All Payouts</CardTitle>
            <CardDescription>
              {payouts.length} payouts found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading payouts...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Merchant</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payouts.map((payout) => (
                    <TableRow key={payout.id}>
                      <TableCell className="font-mono text-xs">{payout.id}</TableCell>
                      <TableCell className="font-medium">{payout.merchantReference}</TableCell>
                      <TableCell>{payout.merchant_name}</TableCell>
                      <TableCell>
                        <Badge className={getDestBadge(payout.destType)}>
                          {payout.destType === 'BANK' ? payout.bankCode : payout.walletCode}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-mono text-xs">{payout.accountNumber}</p>
                          <p className="text-xs text-muted-foreground">{payout.accountTitle}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{formatCurrency(payout.amount)}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(payout.status)}>
                          {payout.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(payout.createdAt)}</TableCell>
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
