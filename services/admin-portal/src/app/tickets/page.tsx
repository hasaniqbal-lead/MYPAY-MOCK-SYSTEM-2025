'use client'

import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { RefreshCw, Send, ArrowLeft, Loader2, MessageSquare } from 'lucide-react'
import { format } from 'date-fns'
import Cookies from 'js-cookie'

interface Ticket { id: number; subject: string; status: string; priority: string; merchantName?: string; merchantEmail?: string; messageCount: number; createdAt: string; updatedAt: string }
interface Message { id: number; senderType: string; senderName?: string; message: string; createdAt: string }

const statusColors: Record<string, string> = { open: 'bg-blue-100 text-blue-700', in_progress: 'bg-yellow-100 text-yellow-700', resolved: 'bg-green-100 text-green-700', closed: 'bg-gray-100 text-gray-500' }
const priorityColors: Record<string, string> = { low: 'bg-gray-100 text-gray-600', medium: 'bg-yellow-100 text-yellow-700', high: 'bg-red-100 text-red-700' }

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [activeTicket, setActiveTicket] = useState<number | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [ticketDetail, setTicketDetail] = useState<any>(null)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [newStatus, setNewStatus] = useState('')

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || ''
  const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${Cookies.get('admin_token')}` })

  const loadTickets = async () => {
    try {
      const url = filter === 'all' ? `${apiUrl}/api/v1/admin/tickets` : `${apiUrl}/api/v1/admin/tickets?status=${filter}`
      const res = await fetch(url, { headers: headers() })
      const data = await res.json()
      if (data.success) setTickets(data.tickets || [])
    } catch {} finally { setLoading(false) }
  }

  const loadConversation = async (id: number) => {
    setActiveTicket(id)
    try {
      const res = await fetch(`${apiUrl}/api/v1/admin/tickets/${id}`, { headers: headers() })
      const data = await res.json()
      if (data.success) { setTicketDetail(data.ticket); setMessages(data.ticket.messages || []); setNewStatus(data.ticket.status) }
    } catch {}
  }

  useEffect(() => { loadTickets() }, [filter])

  const handleReply = async () => {
    if (!reply.trim() || !activeTicket) return
    setSending(true)
    try {
      await fetch(`${apiUrl}/api/v1/admin/tickets/${activeTicket}/reply`, {
        method: 'POST', headers: headers(),
        body: JSON.stringify({ message: reply, status: newStatus !== ticketDetail?.status ? newStatus : undefined }),
      })
      setReply(''); loadConversation(activeTicket)
    } catch {} finally { setSending(false) }
  }

  const updateStatus = async (status: string) => {
    if (!activeTicket) return
    await fetch(`${apiUrl}/api/v1/admin/tickets/${activeTicket}/status`, {
      method: 'PUT', headers: headers(), body: JSON.stringify({ status }),
    })
    setNewStatus(status); loadConversation(activeTicket); loadTickets()
  }

  if (activeTicket && ticketDetail) {
    return (
      <Layout>
        <div className="space-y-4 max-w-4xl">
          <Button variant="ghost" size="sm" onClick={() => { setActiveTicket(null); setTicketDetail(null) }} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">{ticketDetail.subject}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">From: {ticketDetail.merchantName || ticketDetail.merchantEmail || 'Merchant'} | #{ticketDetail.id}</p>
                </div>
                <div className="flex gap-2">
                  {['open', 'in_progress', 'resolved', 'closed'].map(s => (
                    <Button key={s} size="sm" variant={ticketDetail.status === s ? 'default' : 'outline'} className="text-xs capitalize"
                      onClick={() => updateStatus(s)}>{s.replace('_', ' ')}</Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[400px] overflow-y-auto mb-4">
                {messages.map(m => (
                  <div key={m.id} className={`p-3 rounded-lg ${m.senderType === 'admin' ? 'bg-blue-50 ml-8' : 'bg-gray-50 mr-8'}`}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium">{m.senderType === 'admin' ? (m.senderName || 'Support Team') : 'Merchant'}</span>
                      <span className="text-[10px] text-muted-foreground">{format(new Date(m.createdAt), 'MMM dd, HH:mm')}</span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{m.message}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 border-t pt-3">
                <Input placeholder="Reply to merchant..." value={reply} onChange={e => setReply(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleReply()} className="flex-1" />
                <Button onClick={handleReply} disabled={sending || !reply.trim()} className="bg-darpay-primary text-white">
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><MessageSquare className="h-6 w-6" /> Support Tickets</h1>
            <p className="text-muted-foreground text-sm">Manage merchant support requests</p>
          </div>
          <Button variant="outline" size="sm" onClick={loadTickets} className="gap-2"><RefreshCw className="h-4 w-4" /> Refresh</Button>
        </div>
        <div className="flex gap-2">
          {['all', 'open', 'in_progress', 'resolved', 'closed'].map(f => (
            <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)} className="capitalize">{f.replace('_', ' ')}</Button>
          ))}
        </div>
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : tickets.length > 0 ? (
              <div className="divide-y">
                {tickets.map(t => (
                  <button key={t.id} onClick={() => loadConversation(t.id)} className="w-full text-left p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-sm">{t.subject}</span>
                        <p className="text-xs text-muted-foreground mt-1">{t.merchantName || t.merchantEmail} | {t.messageCount} messages</p>
                      </div>
                      <div className="flex gap-2 items-center">
                        <Badge className={priorityColors[t.priority] || ''}>{t.priority}</Badge>
                        <Badge className={statusColors[t.status] || ''}>{t.status.replace('_', ' ')}</Badge>
                        <span className="text-xs text-muted-foreground">{format(new Date(t.updatedAt), 'MMM dd')}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-center py-12 text-muted-foreground">No tickets found</p>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
