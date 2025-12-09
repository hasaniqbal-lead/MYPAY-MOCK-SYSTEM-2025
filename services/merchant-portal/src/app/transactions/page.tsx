'use client'

import { useEffect, useState } from 'react'
import { transactionsAPI, payoutsAPI } from '@/lib/api'
import Layout from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { Search, Download, Eye, RefreshCw, CreditCard, Wallet } from 'lucide-react'
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

interface Payout {
  id: string
  merchantReference: string
  amount: number
  status: string
  destType: string
  bankCode?: string | null
  walletCode?: string | null
  accountNumber: string
  accountTitle: string
  failureReason?: string
  createdAt: string
}

const getPaymentStatusBadge = (status: string) => {
  switch (status.toLowerCase()) {
    case 'success':
    case 'completed':
      return <Badge className="bg-status-success/10 text-status-success border-status-success/20">Success</Badge>
    case 'pending':
      return <Badge className="bg-status-warning/10 text-status-warning border-status-warning/20">Pending</Badge>
    case 'failed':
    case 'error':
      return <Badge className="bg-status-error/10 text-status-error border-status-error/20">Failed</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

const getPayoutStatusBadge = (status: string) => {
  switch (status.toUpperCase()) {
    case 'SUCCESS':
      return <Badge className="bg-status-success/10 text-status-success border-status-success/20">Success</Badge>
    case 'PENDING':
    case 'PROCESSING':
      return <Badge className="bg-status-warning/10 text-status-warning border-status-warning/20">{status}</Badge>
    case 'FAILED':
      return <Badge className="bg-status-error/10 text-status-error border-status-error/20">Failed</Badge>
    case 'IN_REVIEW':
    case 'ON_HOLD':
      return <Badge className="bg-orange-100 text-orange-700 border-orange-200">{status}</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

export default function TransactionsPage() {
  const [activeTab, setActiveTab] = useState('payments')
  
  // Payment states
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [paymentLoading, setPaymentLoading] = useState(true)
  const [paymentSearchQuery, setPaymentSearchQuery] = useState('')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all')
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all')

  // Payout states
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [payoutLoading, setPayoutLoading] = useState(true)
  const [payoutSearchQuery, setPayoutSearchQuery] = useState('')
  const [payoutStatusFilter, setPayoutStatusFilter] = useState('all')
  const [payoutDestFilter, setPayoutDestFilter] = useState('all')

  useEffect(() => {
    loadTransactions()
  }, [paymentStatusFilter, paymentMethodFilter])

  useEffect(() => {
    loadPayouts()
  }, [payoutStatusFilter, payoutDestFilter])

  const loadTransactions = async () => {
    setPaymentLoading(true)
    try {
      const params: any = {}
      if (paymentStatusFilter !== 'all') params.status = paymentStatusFilter
      
      const data = await transactionsAPI.list(params)
      let filtered = data.transactions || []
      
      if (paymentMethodFilter !== 'all') {
        filtered = filtered.filter((t: Transaction) => 
          (t.payment_method || t.paymentMethod || '').toLowerCase() === paymentMethodFilter.toLowerCase()
        )
      }
      
      if (paymentSearchQuery) {
        filtered = filtered.filter((t: Transaction) =>
          t.checkout_id.toLowerCase().includes(paymentSearchQuery.toLowerCase()) ||
          t.reference.toLowerCase().includes(paymentSearchQuery.toLowerCase()) ||
          (t.customer_email || '').toLowerCase().includes(paymentSearchQuery.toLowerCase())
        )
      }
      
      setTransactions(filtered)
    } catch (error) {
      console.error('Failed to load transactions:', error)
    } finally {
      setPaymentLoading(false)
    }
  }

  const loadPayouts = async () => {
    setPayoutLoading(true)
    try {
      const params: any = {}
      if (payoutStatusFilter !== 'all') params.status = payoutStatusFilter
      
      const data = await payoutsAPI.list(params)
      let filtered = data.payouts || []
      
      if (payoutDestFilter !== 'all') {
        filtered = filtered.filter((p: Payout) => 
          p.destType.toUpperCase() === payoutDestFilter.toUpperCase()
        )
      }
      
      if (payoutSearchQuery) {
        filtered = filtered.filter((p: Payout) =>
          p.id.toLowerCase().includes(payoutSearchQuery.toLowerCase()) ||
          p.merchantReference.toLowerCase().includes(payoutSearchQuery.toLowerCase()) ||
          p.accountTitle.toLowerCase().includes(payoutSearchQuery.toLowerCase())
        )
      }
      
      setPayouts(filtered)
    } catch (error) {
      console.error('Failed to load payouts:', error)
    } finally {
      setPayoutLoading(false)
    }
  }

  const handlePaymentExport = async (exportFormat: 'csv' | 'json') => {
    try {
      const params: any = {}
      if (paymentStatusFilter !== 'all') params.status = paymentStatusFilter
      
      const blob = await transactionsAPI.export(exportFormat, params)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `payments.${exportFormat}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed. Please try again.')
    }
  }

  const handlePayoutExport = async (exportFormat: 'csv' | 'json') => {
    try {
      const params: any = {}
      if (payoutStatusFilter !== 'all') params.status = payoutStatusFilter
      
      const blob = await payoutsAPI.export(exportFormat, params)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `payouts.${exportFormat}`
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
              Monitor and manage all your payment and payout transactions
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Payments
            </TabsTrigger>
            <TabsTrigger value="payouts" className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Payouts
            </TabsTrigger>
          </TabsList>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-6 mt-6">
            {/* Payment Filters */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <CardTitle className="text-lg">Payment Transactions</CardTitle>
                  <div className="flex items-center gap-2">
                    <Select value="csv" onValueChange={(v) => handlePaymentExport(v as 'csv' | 'json')}>
                      <SelectTrigger className="w-[130px]">
                        <Download className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Export" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="csv">Export CSV</SelectItem>
                        <SelectItem value="json">Export JSON</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={loadTransactions}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by ID, reference, or email..."
                        value={paymentSearchQuery}
                        onChange={(e) => {
                          setPaymentSearchQuery(e.target.value)
                          loadTransactions()
                        }}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Methods</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="easypaisa">Easypaisa</SelectItem>
                      <SelectItem value="jazzcash">JazzCash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {paymentLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mypay-green"></div>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Transaction ID</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.length > 0 ? (
                        transactions.map((transaction) => (
                          <TableRow key={transaction.checkout_id}>
                            <TableCell className="font-mono text-sm">
                              {transaction.checkout_id}
                            </TableCell>
                            <TableCell>
                              {transaction.reference}
                            </TableCell>
                            <TableCell className="font-semibold">
                              PKR {transaction.amount.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {transaction.payment_method || transaction.paymentMethod || 'N/A'}
                              </Badge>
                            </TableCell>
                            <TableCell>{getPaymentStatusBadge(transaction.status)}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {format(new Date(transaction.created_at || transaction.createdAt || new Date()), 'MMM dd, yyyy HH:mm')}
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
                            No payment transactions found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payouts Tab */}
          <TabsContent value="payouts" className="space-y-6 mt-6">
            {/* Payout Filters */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <CardTitle className="text-lg">Payout Transactions</CardTitle>
                  <div className="flex items-center gap-2">
                    <Select value="csv" onValueChange={(v) => handlePayoutExport(v as 'csv' | 'json')}>
                      <SelectTrigger className="w-[130px]">
                        <Download className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Export" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="csv">Export CSV</SelectItem>
                        <SelectItem value="json">Export JSON</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={loadPayouts}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by ID, reference, or account title..."
                        value={payoutSearchQuery}
                        onChange={(e) => {
                          setPayoutSearchQuery(e.target.value)
                          loadPayouts()
                        }}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <Select value={payoutStatusFilter} onValueChange={setPayoutStatusFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="SUCCESS">Success</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="PROCESSING">Processing</SelectItem>
                      <SelectItem value="FAILED">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={payoutDestFilter} onValueChange={setPayoutDestFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Destination" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="BANK">Bank Account</SelectItem>
                      <SelectItem value="WALLET">Mobile Wallet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {payoutLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mypay-green"></div>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Payout ID</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead>Destination</TableHead>
                        <TableHead>Account</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payouts.length > 0 ? (
                        payouts.map((payout) => (
                          <TableRow key={payout.id}>
                            <TableCell className="font-mono text-sm">
                              {payout.id}
                            </TableCell>
                            <TableCell>
                              {payout.merchantReference}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-mypay-green/10 text-mypay-green border-mypay-green/20">
                                {payout.destType === 'BANK' ? payout.bankCode : payout.walletCode}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-mono text-xs">{payout.accountNumber}</p>
                                <p className="text-xs text-muted-foreground">{payout.accountTitle}</p>
                              </div>
                            </TableCell>
                            <TableCell className="font-semibold">
                              PKR {payout.amount.toLocaleString()}
                            </TableCell>
                            <TableCell>{getPayoutStatusBadge(payout.status)}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {format(new Date(payout.createdAt), 'MMM dd, yyyy HH:mm')}
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
                          <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                            No payout transactions found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  )
}
