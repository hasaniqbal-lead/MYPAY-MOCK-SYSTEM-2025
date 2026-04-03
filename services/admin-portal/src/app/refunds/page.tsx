'use client'

import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { RefreshCw, CheckCircle, XCircle, Loader2, Search } from 'lucide-react'
import { format } from 'date-fns'
import Cookies from 'js-cookie'

interface Refund {
  id: number; transactionId: string; amount: number; originalAmount: number; type: string
  status: string; reason: string | null; merchantName?: string; merchantEmail?: string; createdAt: string
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700', approved: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700',
}

export default function AdminRefundsPage() {
  const [refunds, setRefunds] = useState<Refund[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [processing, setProcessing] = useState<number | null>(null)

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || ''
  const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${Cookies.get('admin_token')}` })

  const load = async () => {
    try {
      const url = filter === 'all' ? `${apiUrl}/api/v1/admin/refunds` : `${apiUrl}/api/v1/admin/refunds?status=${filter}`
      const res = await fetch(url, { headers: headers() })
      const data = await res.json()
      if (data.success) setRefunds(data.refunds || [])
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { load() }, [filter])

  const updateStatus = async (id: number, status: string) => {
    setProcessing(id)
    try {
      const note = status === 'rejected' ? prompt('Rejection reason:') : undefined
      await fetch(`${apiUrl}/api/v1/admin/refunds/${id}/status`, {
        method: 'PUT', headers: headers(),
        body: JSON.stringify({ status, adminNote: note || undefined }),
      })
      load()
    } catch {} finally { setProcessing(null) }
  }

  const filters = ['all', 'pending', 'approved', 'completed', 'rejected']

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Refund Management</h1>
            <p className="text-muted-foreground text-sm">Review and process merchant refund requests</p>
          </div>
          <Button variant="outline" size="sm" onClick={load} className="gap-2">
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        </div>

        <div className="flex gap-2 flex-wrap">
          {filters.map(f => (
            <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)} className="capitalize">
              {f}
            </Button>
          ))}
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead><TableHead>Merchant</TableHead><TableHead>Transaction</TableHead>
                    <TableHead>Original</TableHead><TableHead>Refund</TableHead><TableHead>Type</TableHead>
                    <TableHead>Status</TableHead><TableHead>Date</TableHead><TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {refunds.length > 0 ? refunds.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs">RF-{r.id}</TableCell>
                      <TableCell className="text-sm">{r.merchantName || r.merchantEmail || '—'}</TableCell>
                      <TableCell className="font-mono text-xs">{r.transactionId.substring(0, 8)}...</TableCell>
                      <TableCell>PKR {r.originalAmount.toLocaleString()}</TableCell>
                      <TableCell className="font-semibold">PKR {r.amount.toLocaleString()}</TableCell>
                      <TableCell><Badge variant="outline" className="capitalize">{r.type}</Badge></TableCell>
                      <TableCell><Badge className={statusColors[r.status] || ''}>{r.status}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{format(new Date(r.createdAt), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>
                        {r.status === 'pending' && (
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-green-600" disabled={processing === r.id}
                              onClick={() => updateStatus(r.id, 'completed')}>
                              <CheckCircle className="h-3 w-3" /> Approve
                            </Button>
                            <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-red-600" disabled={processing === r.id}
                              onClick={() => updateStatus(r.id, 'rejected')}>
                              <XCircle className="h-3 w-3" /> Reject
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow><TableCell colSpan={9} className="text-center py-12 text-muted-foreground">No refunds found</TableCell></TableRow>
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
