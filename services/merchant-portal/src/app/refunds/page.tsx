'use client'

import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Search, RotateCcw, RefreshCw, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import RefundDialog from '@/components/RefundDialog'
import Cookies from 'js-cookie'

interface Refund {
  id: number
  transactionId: string
  amount: number
  originalAmount: number
  type: string
  status: string
  reason: string | null
  createdAt: string
}

const statusBadge = (status: string) => {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    approved: 'bg-blue-100 text-blue-700 border-blue-200',
    completed: 'bg-green-100 text-green-700 border-green-200',
    rejected: 'bg-red-100 text-red-700 border-red-200',
  }
  return <Badge className={colors[status] || 'bg-gray-100 text-gray-600'}>{status}</Badge>
}

export default function RefundsPage() {
  const [refunds, setRefunds] = useState<Refund[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResult, setSearchResult] = useState<any>(null)
  const [searching, setSearching] = useState(false)
  const [refundDialogOpen, setRefundDialogOpen] = useState(false)
  const [refundTarget, setRefundTarget] = useState<any>(null)

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || ''
  const getToken = () => Cookies.get('auth_token') || ''

  const loadRefunds = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/v1/portal/refunds?limit=50`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      const data = await res.json()
      if (data.success) setRefunds(data.refunds || [])
    } catch (err) {
      console.error('Failed to load refunds:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadRefunds() }, [])

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setSearching(true)
    setSearchResult(null)
    try {
      // Try by checkout ID first, then by reference
      let res = await fetch(`${apiUrl}/api/v1/portal/transactions/${searchQuery.trim()}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      let data = await res.json()

      if (!data.success || !data.transaction) {
        // Try as reference
        res = await fetch(`${apiUrl}/api/v1/transactions/${searchQuery.trim()}`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        })
        data = await res.json()
      }

      if (data.success && (data.transaction || data.checkout)) {
        const t = data.transaction || data.checkout
        setSearchResult({
          checkout_id: t.checkoutId || t.checkout_id,
          reference: t.reference,
          amount: Number(t.amount),
          status: t.status,
        })
      } else {
        setSearchResult({ error: 'Transaction not found' })
      }
    } catch {
      setSearchResult({ error: 'Search failed' })
    } finally {
      setSearching(false)
    }
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Refunds</h1>
          <p className="text-muted-foreground">Search transactions and process refunds</p>
        </div>

        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Search Transaction</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Enter transaction ID or reference..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleSearch} disabled={searching} className="bg-darpay-primary hover:bg-darpay-primary-dark text-white">
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                <span className="ml-2">Search</span>
              </Button>
            </div>

            {searchResult && !searchResult.error && (
              <div className="mt-4 p-4 bg-muted rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{searchResult.reference}</p>
                  <p className="text-xs text-muted-foreground font-mono">{searchResult.checkout_id}</p>
                  <p className="text-sm mt-1">PKR {searchResult.amount.toLocaleString()} — <span className="capitalize">{searchResult.status}</span></p>
                </div>
                {(searchResult.status === 'completed' || searchResult.status === 'success') && (
                  <Button
                    className="bg-orange-500 hover:bg-orange-600 text-white gap-2"
                    onClick={() => { setRefundTarget(searchResult); setRefundDialogOpen(true); }}
                  >
                    <RotateCcw className="h-4 w-4" />
                    Refund
                  </Button>
                )}
              </div>
            )}

            {searchResult?.error && (
              <p className="mt-4 text-sm text-destructive">{searchResult.error}</p>
            )}
          </CardContent>
        </Card>

        {/* Refund History */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Refund History</CardTitle>
            <Button variant="ghost" size="sm" onClick={loadRefunds} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Transaction</TableHead>
                    <TableHead>Original</TableHead>
                    <TableHead>Refunded</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {refunds.length > 0 ? (
                    refunds.map(r => (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono text-xs">RF-{r.id}</TableCell>
                        <TableCell className="font-mono text-xs">{r.transactionId.substring(0, 8)}...</TableCell>
                        <TableCell>PKR {r.originalAmount.toLocaleString()}</TableCell>
                        <TableCell className="font-semibold">PKR {r.amount.toLocaleString()}</TableCell>
                        <TableCell><Badge variant="outline" className="capitalize">{r.type}</Badge></TableCell>
                        <TableCell>{statusBadge(r.status)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(r.createdAt), 'MMM dd, yyyy HH:mm')}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                        No refunds yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <RefundDialog
        isOpen={refundDialogOpen}
        onClose={() => { setRefundDialogOpen(false); setRefundTarget(null); }}
        transaction={refundTarget}
        onRefundCreated={loadRefunds}
      />
    </Layout>
  )
}
