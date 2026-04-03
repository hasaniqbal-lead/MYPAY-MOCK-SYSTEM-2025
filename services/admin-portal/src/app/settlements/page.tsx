'use client'

import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { RefreshCw, Loader2, Banknote } from 'lucide-react'
import { format } from 'date-fns'
import Cookies from 'js-cookie'

interface Settlement {
  id: number; amount: number; periodStart: string; periodEnd: string; status: string
  merchantName?: string; merchantEmail?: string; requestedAt: string; completedAt?: string
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700', in_review: 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700', completed: 'bg-green-200 text-green-800',
  rejected: 'bg-red-100 text-red-700',
}

export default function AdminSettlementsPage() {
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [processing, setProcessing] = useState<number | null>(null)

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || ''
  const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${Cookies.get('admin_token')}` })

  const load = async () => {
    try {
      const url = filter === 'all' ? `${apiUrl}/api/v1/admin/settlements` : `${apiUrl}/api/v1/admin/settlements?status=${filter}`
      const res = await fetch(url, { headers: headers() })
      const data = await res.json()
      if (data.success) setSettlements(data.settlements || [])
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { load() }, [filter])

  const updateStatus = async (id: number, status: string) => {
    setProcessing(id)
    try {
      const note = status === 'rejected' ? prompt('Rejection reason:') : undefined
      await fetch(`${apiUrl}/api/v1/admin/settlements/${id}/status`, {
        method: 'PUT', headers: headers(),
        body: JSON.stringify({ status, adminNote: note || undefined }),
      })
      load()
    } catch {} finally { setProcessing(null) }
  }

  const filters = ['all', 'pending', 'in_review', 'approved', 'completed', 'rejected']
  const nextAction: Record<string, { label: string; status: string; color: string }[]> = {
    pending: [{ label: 'Review', status: 'in_review', color: 'text-blue-600' }],
    in_review: [
      { label: 'Approve', status: 'approved', color: 'text-green-600' },
      { label: 'Reject', status: 'rejected', color: 'text-red-600' },
    ],
    approved: [{ label: 'Complete', status: 'completed', color: 'text-green-700' }],
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Banknote className="h-6 w-6" /> Settlements</h1>
            <p className="text-muted-foreground text-sm">Review and process merchant settlement requests</p>
          </div>
          <Button variant="outline" size="sm" onClick={load} className="gap-2"><RefreshCw className="h-4 w-4" /> Refresh</Button>
        </div>

        <div className="flex gap-2 flex-wrap">
          {filters.map(f => (
            <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)} className="capitalize">{f.replace('_', ' ')}</Button>
          ))}
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead><TableHead>Merchant</TableHead><TableHead>Amount</TableHead>
                    <TableHead>Period</TableHead><TableHead>Status</TableHead><TableHead>Requested</TableHead>
                    <TableHead>Completed</TableHead><TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {settlements.length > 0 ? settlements.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-xs">STL-{s.id}</TableCell>
                      <TableCell className="text-sm">{s.merchantName || s.merchantEmail || '—'}</TableCell>
                      <TableCell className="font-semibold">PKR {s.amount.toLocaleString()}</TableCell>
                      <TableCell className="text-xs">{format(new Date(s.periodStart), 'MMM dd')} — {format(new Date(s.periodEnd), 'MMM dd')}</TableCell>
                      <TableCell><Badge className={statusColors[s.status] || ''}>{s.status.replace('_', ' ')}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{format(new Date(s.requestedAt), 'MMM dd, yyyy')}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{s.completedAt ? format(new Date(s.completedAt), 'MMM dd') : '—'}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {(nextAction[s.status] || []).map(a => (
                            <Button key={a.status} size="sm" variant="outline" className={`h-7 text-xs ${a.color}`}
                              disabled={processing === s.id} onClick={() => updateStatus(s.id, a.status)}>
                              {a.label}
                            </Button>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">No settlements found</TableCell></TableRow>
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
