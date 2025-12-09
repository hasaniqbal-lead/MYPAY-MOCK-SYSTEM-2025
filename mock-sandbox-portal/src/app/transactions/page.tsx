'use client'

import { useEffect, useState } from 'react'
import { transactionsAPI } from '@/lib/api'
import Layout from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Search, Filter, Download, Eye, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'

interface Transaction {
  checkout_id: string
  reference: string
  amount: number
  status: string
  payment_method?: string
  paymentMethod?: string
  created_at?: string
  createdAt?: string
  customer_email?: string
}

const getStatusBadge = (status: string) => {
  switch (status.toLowerCase()) {
    case 'success':
    case 'completed':
      return <Badge className="bg-status-success/10 text-status-success">Success</Badge>
    case 'pending':
      return <Badge className="bg-status-pending/10 text-status-pending">Pending</Badge>
    case 'failed':
    case 'error':
      return <Badge className="bg-status-error/10 text-status-error">Failed</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [methodFilter, setMethodFilter] = useState('all')

  useEffect(() => {
    loadTransactions()
  }, [statusFilter, methodFilter])

  const loadTransactions = async () => {
    try {
      const params: any = {}
      if (statusFilter !== 'all') params.status = statusFilter
      
      const data = await transactionsAPI.list(params)
      let filtered = data.transactions || []
      
      if (methodFilter !== 'all') {
        filtered = filtered.filter((t: Transaction) => 
          (t.payment_method || t.paymentMethod || '').toLowerCase() === methodFilter.toLowerCase()
        )
      }
      
      if (searchQuery) {
        filtered = filtered.filter((t: Transaction) =>
          t.checkout_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (t.customer_email || '').toLowerCase().includes(searchQuery.toLowerCase())
        )
      }
      
      setTransactions(filtered)
    } catch (error) {
      console.error('Failed to load transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const params: any = {}
      if (statusFilter !== 'all') params.status = statusFilter
      
      const blob = await transactionsAPI.export(format, params)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `transactions.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed. Please try again.')
    }
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Transactions</h1>
            <p className="text-muted-foreground">
              Monitor and manage all your payment transactions
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={loadTransactions}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="shadow-elevation">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search transactions..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      loadTransactions()
                    }}
                    className="pl-9"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="easypaisa">Easypaisa</SelectItem>
                  <SelectItem value="jazzcash">JazzCash</SelectItem>
                  <SelectItem value="e-billing">E-billing</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                More Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card className="shadow-elevation">
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mypay-green"></div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-foreground">Transaction ID</TableHead>
                    <TableHead className="text-foreground">Customer</TableHead>
                    <TableHead className="text-foreground">Amount</TableHead>
                    <TableHead className="text-foreground">Method</TableHead>
                    <TableHead className="text-foreground">Status</TableHead>
                    <TableHead className="text-foreground">Timestamp</TableHead>
                    <TableHead className="text-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.length > 0 ? (
                    transactions.map((transaction) => (
                      <TableRow key={transaction.checkout_id}>
                        <TableCell className="font-mono text-sm text-foreground">
                          {transaction.checkout_id}
                        </TableCell>
                        <TableCell className="text-foreground">
                          {transaction.customer_email || transaction.reference || 'N/A'}
                        </TableCell>
                        <TableCell className="font-semibold text-foreground">
                          PKR {transaction.amount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{transaction.payment_method || transaction.paymentMethod || 'N/A'}</Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(transaction.created_at || transaction.createdAt || new Date()), 'yyyy-MM-dd HH:mm:ss')}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                        No transactions found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
