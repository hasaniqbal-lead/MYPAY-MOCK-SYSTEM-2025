'use client'

import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Loader2, MessageSquare, Send, ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'
import Cookies from 'js-cookie'

interface Ticket { id: number; subject: string; status: string; priority: string; messageCount: number; createdAt: string; updatedAt: string }
interface Message { id: number; senderType: string; senderName?: string; message: string; createdAt: string }

const statusColors: Record<string, string> = { open: 'bg-blue-100 text-blue-700', in_progress: 'bg-yellow-100 text-yellow-700', resolved: 'bg-green-100 text-green-700', closed: 'bg-gray-100 text-gray-500' }
const priorityColors: Record<string, string> = { low: 'border-gray-200', medium: 'border-yellow-200', high: 'border-red-200' }

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [priority, setPriority] = useState('medium')
  const [creating, setCreating] = useState(false)

  // Conversation view
  const [activeTicket, setActiveTicket] = useState<number | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [ticketDetail, setTicketDetail] = useState<any>(null)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || ''
  const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${Cookies.get('auth_token')}` })

  const loadTickets = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/v1/portal/tickets`, { headers: headers() })
      const data = await res.json()
      if (data.success) setTickets(data.tickets || [])
    } catch {} finally { setLoading(false) }
  }

  const loadConversation = async (id: number) => {
    setActiveTicket(id)
    try {
      const res = await fetch(`${apiUrl}/api/v1/portal/tickets/${id}`, { headers: headers() })
      const data = await res.json()
      if (data.success) { setTicketDetail(data.ticket); setMessages(data.ticket.messages || []) }
    } catch {}
  }

  useEffect(() => { loadTickets() }, [])

  const handleCreate = async () => {
    if (!subject.trim() || !message.trim()) return
    setCreating(true)
    try {
      const res = await fetch(`${apiUrl}/api/v1/portal/tickets`, {
        method: 'POST', headers: headers(),
        body: JSON.stringify({ subject, message, priority }),
      })
      const data = await res.json()
      if (data.success) { setShowNew(false); setSubject(''); setMessage(''); loadTickets() }
    } catch {} finally { setCreating(false) }
  }

  const handleReply = async () => {
    if (!reply.trim() || !activeTicket) return
    setSending(true)
    try {
      await fetch(`${apiUrl}/api/v1/portal/tickets/${activeTicket}/reply`, {
        method: 'POST', headers: headers(),
        body: JSON.stringify({ message: reply }),
      })
      setReply('')
      loadConversation(activeTicket)
    } catch {} finally { setSending(false) }
  }

  // Conversation view
  if (activeTicket && ticketDetail) {
    return (
      <Layout>
        <div className="space-y-4 max-w-3xl mx-auto">
          <Button variant="ghost" size="sm" onClick={() => { setActiveTicket(null); setTicketDetail(null) }} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Tickets
          </Button>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">{ticketDetail.subject}</CardTitle>
                  <div className="flex gap-2 mt-1">
                    <Badge className={statusColors[ticketDetail.status] || ''}>{ticketDetail.status.replace('_', ' ')}</Badge>
                    <Badge variant="outline">{ticketDetail.priority}</Badge>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{format(new Date(ticketDetail.createdAt), 'MMM dd, yyyy')}</span>
              </div>
            </CardHeader>
            <CardContent>
              {/* Messages */}
              <div className="space-y-3 max-h-[400px] overflow-y-auto mb-4">
                {messages.map(m => (
                  <div key={m.id} className={`p-3 rounded-lg ${m.senderType === 'merchant' ? 'bg-blue-50 ml-8' : 'bg-gray-50 mr-8'}`}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium">{m.senderType === 'merchant' ? 'You' : m.senderName || 'Support'}</span>
                      <span className="text-[10px] text-muted-foreground">{format(new Date(m.createdAt), 'MMM dd, HH:mm')}</span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{m.message}</p>
                  </div>
                ))}
              </div>
              {/* Reply */}
              <div className="flex gap-2 border-t pt-3">
                <Input
                  placeholder="Type your reply..."
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleReply()}
                  className="flex-1"
                />
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
            <h1 className="text-2xl font-bold flex items-center gap-2"><MessageSquare className="h-6 w-6" /> Support</h1>
            <p className="text-muted-foreground text-sm">Raise requests and get help from the support team</p>
          </div>
          <Button className="bg-darpay-primary hover:bg-darpay-primary-dark text-white gap-2" onClick={() => setShowNew(!showNew)}>
            <Plus className="h-4 w-4" /> New Ticket
          </Button>
        </div>

        {/* New ticket form */}
        {showNew && (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div>
                <label className="text-sm font-medium">Subject</label>
                <Input placeholder="Brief description of your issue" value={subject} onChange={e => setSubject(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium">Priority</label>
                <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Message</label>
                <textarea
                  placeholder="Describe your issue in detail..."
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[120px] resize-none"
                />
              </div>
              <Button onClick={handleCreate} disabled={creating || !subject.trim() || !message.trim()} className="bg-darpay-primary text-white">
                {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Submit Ticket
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Ticket list */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{tickets.length} Ticket{tickets.length !== 1 ? 's' : ''}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : tickets.length > 0 ? (
              <div className="space-y-2">
                {tickets.map(t => (
                  <button
                    key={t.id}
                    onClick={() => loadConversation(t.id)}
                    className={`w-full text-left p-4 rounded-lg border hover:bg-muted/50 transition-colors ${priorityColors[t.priority] || 'border-border'}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{t.subject}</span>
                      <Badge className={statusColors[t.status] || ''} variant="outline">{t.status.replace('_', ' ')}</Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>#{t.id}</span>
                      <span>{t.messageCount} message{t.messageCount !== 1 ? 's' : ''}</span>
                      <span>{format(new Date(t.updatedAt), 'MMM dd, yyyy HH:mm')}</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-muted-foreground text-sm">No tickets yet. Click "New Ticket" to create one.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
