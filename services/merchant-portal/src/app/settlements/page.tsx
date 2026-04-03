'use client'

import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Banknote, Loader2, Plus } from 'lucide-react'
import { format } from 'date-fns'
import Cookies from 'js-cookie'

interface Settlement {
  id: number; amount: number; periodStart: string; periodEnd: string; status: string; adminNote?: string; requestedAt: string; completedAt?: string
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700', in_review: 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700', completed: 'bg-green-200 text-green-800',
  rejected: 'bg-red-100 text-red-700',
}

export default function SettlementsPage() {
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')
  const [creating, setCreating] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || ''
  const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${Cookies.get('auth_token')}` })

  const load = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/v1/portal/settlements`, { headers: headers() })
      const data = await res.json()
      if (data.success) setSettlements(data.settlements || [])
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => {
    load()
    // Default period: last 30 days
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 30)
    setPeriodStart(start.toISOString().split('T')[0])
    setPeriodEnd(end.toISOString().split('T')[0])
  }, [])

  const handleRequest = async () => {
    if (!periodStart || !periodEnd) return
    setCreating(true); setResult(null)
    try {
      const res = await fetch(`${apiUrl}/api/v1/portal/settlements`, {
        method: 'POST', headers: headers(),
        body: JSON.stringify({ periodStart, periodEnd }),
      })
      const data = await res.json()
      if (data.success) {
        setResult({ success: true, message: `Settlement requested: PKR ${data.settlement.amount.toLocaleString()}` })
        setShowForm(false); load()
      } else {
        setResult({ success: false, message: data.error })
      }
    } catch { setResult({ success: false, message: 'Request failed' }) }
    finally { setCreating(false) }
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Banknote className="h-6 w-6" /> Settlements</h1>
            <p className="text-muted-foreground text-sm">Request and track your settlement payouts</p>
          </div>
          <Button className="bg-darpay-primary hover:bg-darpay-primary-dark text-white gap-2" onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4" /> Request Settlement
          </Button>
        </div>

        {/* Request form */}
        {showForm && (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Period Start</label>
                  <Input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium">Period End</label>
                  <Input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Settlement amount is calculated from completed transactions minus refunds in the selected period. Sandbox: 1 request per day.</p>
              <Button onClick={handleRequest} disabled={creating} className="bg-darpay-primary text-white">
                {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Calculate & Submit
              </Button>
            </CardContent>
          </Card>
        )}

        {result && (
          <div className={`p-3 rounded-lg text-sm ${result.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {result.message}
          </div>
        )}

        {/* Settlement history */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Settlement History</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead><TableHead>Amount</TableHead><TableHead>Period</TableHead><TableHead>Status</TableHead><TableHead>Requested</TableHead><TableHead>Completed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {settlements.length > 0 ? settlements.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-xs">STL-{s.id}</TableCell>
                      <TableCell className="font-semibold">PKR {s.amount.toLocaleString()}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {format(new Date(s.periodStart), 'MMM dd')} — {format(new Date(s.periodEnd), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell><Badge className={statusColors[s.status] || ''}>{s.status.replace('_', ' ')}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{format(new Date(s.requestedAt), 'MMM dd, yyyy')}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{s.completedAt ? format(new Date(s.completedAt), 'MMM dd, yyyy') : '—'}</TableCell>
                    </TableRow>
                  )) : (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No settlements yet</TableCell></TableRow>
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
