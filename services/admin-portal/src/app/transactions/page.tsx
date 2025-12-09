'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import Layout from '@/components/Layout'
import { adminAPI } from '@/lib/api'
import { CreditCard, RefreshCw, Filter } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Transaction {
  checkout_id: string
  reference: string
  amount: number
  status: string
  status_code: string
  payment_method: string
  merchant_name: string
  created_at: string
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    fetchTransactions()
  }, [statusFilter])

  const fetchTransactions = async () => {
    setLoading(true)
    try {
      const response = await adminAPI.getAllTransactions({ status: statusFilter !== 'all' ? statusFilter : undefined })
      if (response.success) {
        setTransactions(response.transactions)
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error)
      // Mock data
      setTransactions([
        {
          checkout_id: 'chk_abc123',
          reference: 'ORD-001',
          amount: 5000,
          status: 'completed',
          status_code: 'SUCCESS',
          payment_method: 'jazzcash',
          merchant_name: 'Test Merchant',
          created_at: '2024-03-15T10:30:00Z',
        },
        {
          checkout_id: 'chk_def456',
          reference: 'ORD-002',
          amount: 2500,
          status: 'pending',
          status_code: 'PENDING',
          payment_method: 'easypaisa',
          merchant_name: 'Demo Store',
          created_at: '2024-03-15T11:45:00Z',
        },
        {
          checkout_id: 'chk_ghi789',
          reference: 'ORD-003',
          amount: 7500,
          status: 'failed',
          status_code: 'INSUFFICIENT_FUNDS',
          payment_method: 'card',
          merchant_name: 'Test Merchant',
          created_at: '2024-03-15T12:00:00Z',
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
      case 'completed':
        return 'bg-status-success/10 text-status-success border-status-success/20'
      case 'pending':
        return 'bg-status-warning/10 text-status-warning border-status-warning/20'
      case 'failed':
        return 'bg-status-error/10 text-status-error border-status-error/20'
      default:
        return 'bg-muted text-muted-foreground border-border'
    }
  }

  const getMethodBadge = (method: string) => {
    switch (method) {
      case 'jazzcash':
        return 'bg-red-100 text-red-700 border-red-200'
      case 'easypaisa':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'card':
        return 'bg-mypay-green/10 text-mypay-green border-mypay-green/20'
      default:
        return 'bg-muted text-muted-foreground border-border'
    }
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <CreditCard className="h-6 w-6 text-mypay-green" />
              Payment Transactions
            </h1>
            <p className="text-muted-foreground">Monitor all payment transactions across merchants</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={fetchTransactions}
              variant="outline"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">All Transactions</CardTitle>
            <CardDescription>
              {transactions.length} transactions found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading transactions...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Checkout ID</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Merchant</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.checkout_id}>
                      <TableCell className="font-mono text-xs">{tx.checkout_id}</TableCell>
                      <TableCell className="font-medium">{tx.reference}</TableCell>
                      <TableCell>{tx.merchant_name}</TableCell>
                      <TableCell>
                        <Badge className={getMethodBadge(tx.payment_method)}>
                          {tx.payment_method}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{formatCurrency(tx.amount)}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(tx.status)}>
                          {tx.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(tx.created_at)}</TableCell>
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
