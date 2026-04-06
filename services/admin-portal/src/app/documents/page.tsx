'use client'

import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Loader2, RefreshCw, FileText, CheckCircle, XCircle, Link2, Copy, Check } from 'lucide-react'
import { format } from 'date-fns'
import Cookies from 'js-cookie'

const statusColors: Record<string, string> = { pending: 'bg-yellow-100 text-yellow-700', approved: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700' }

export default function AdminDocumentsPage() {
  const [docs, setDocs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showRequest, setShowRequest] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', type: 'general', visibility: 'both' })
  const [reqForm, setReqForm] = useState({ merchantId: '', title: '', description: '', type: 'kyc' })
  const [uploadLink, setUploadLink] = useState('')
  const [copied, setCopied] = useState(false)

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || ''
  const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${Cookies.get('admin_token')}` })

  const load = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/v1/admin/documents`, { headers: headers() })
      const data = await res.json()
      if (data.success) setDocs(data.documents || [])
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const createDoc = async () => {
    if (!form.title) return
    await fetch(`${apiUrl}/api/v1/admin/documents`, { method: 'POST', headers: headers(), body: JSON.stringify(form) })
    setShowForm(false); setForm({ title: '', description: '', type: 'general', visibility: 'both' }); load()
  }

  const requestUpload = async () => {
    if (!reqForm.merchantId || !reqForm.title) return
    const res = await fetch(`${apiUrl}/api/v1/admin/documents/request/${reqForm.merchantId}`, {
      method: 'POST', headers: headers(), body: JSON.stringify(reqForm),
    })
    const data = await res.json()
    if (data.success) {
      setUploadLink(data.uploadUrl)
      setShowRequest(false); load()
    } else alert(data.error)
  }

  const updateStatus = async (id: number, status: string) => {
    await fetch(`${apiUrl}/api/v1/admin/documents/${id}/status`, { method: 'PUT', headers: headers(), body: JSON.stringify({ status }) })
    load()
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><FileText className="h-6 w-6" /> Documents</h1>
            <p className="text-muted-foreground text-sm">Manage documents and request merchant uploads</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4" /></Button>
            <Button size="sm" onClick={() => setShowRequest(!showRequest)} className="gap-2"><Link2 className="h-4 w-4" /> Request Upload</Button>
            <Button size="sm" onClick={() => setShowForm(!showForm)} className="gap-2 bg-darpay-primary text-white"><Plus className="h-4 w-4" /> Add Document</Button>
          </div>
        </div>

        {/* Upload link result */}
        {uploadLink && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm font-medium text-green-800 mb-2">Upload link generated — share with merchant:</p>
            <div className="flex gap-2">
              <code className="flex-1 text-xs bg-white p-2 rounded border font-mono break-all">{uploadLink}</code>
              <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(uploadLink); setCopied(true); setTimeout(() => setCopied(false), 1500) }}>
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )}

        {/* Create document form */}
        {showForm && (
          <Card><CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium">Title</label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
              <div><label className="text-sm font-medium">Type</label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="general">General</option><option value="policy">Policy</option><option value="form">Form</option>
                </select>
              </div>
            </div>
            <div><label className="text-sm font-medium">Description</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[60px]" /></div>
            <Button onClick={createDoc} className="bg-darpay-primary text-white">Create Document</Button>
          </CardContent></Card>
        )}

        {/* Request upload form */}
        {showRequest && (
          <Card><CardContent className="pt-4 space-y-3">
            <p className="text-sm font-medium">Request Merchant Upload</p>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium">Merchant ID</label><Input placeholder="1" value={reqForm.merchantId} onChange={e => setReqForm({ ...reqForm, merchantId: e.target.value })} /></div>
              <div><label className="text-sm font-medium">Document Title</label><Input placeholder="KYC Documents" value={reqForm.title} onChange={e => setReqForm({ ...reqForm, title: e.target.value })} /></div>
            </div>
            <div><label className="text-sm font-medium">Description</label><textarea value={reqForm.description} onChange={e => setReqForm({ ...reqForm, description: e.target.value })} placeholder="Please upload your..." className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[60px]" /></div>
            <Button onClick={requestUpload} className="bg-darpay-primary text-white">Generate Upload Link</Button>
          </CardContent></Card>
        )}

        {/* Document list */}
        <Card>
          <CardContent className="p-0">
            {loading ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div> : (
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Title</TableHead><TableHead>Type</TableHead><TableHead>Merchant</TableHead>
                  <TableHead>Uploaded By</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead><TableHead>Actions</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {docs.map(d => (
                    <TableRow key={d.id}>
                      <TableCell>
                        <div><span className="font-medium text-sm">{d.title}</span>
                        {d.description && <p className="text-xs text-muted-foreground truncate max-w-[200px]">{d.description}</p>}</div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="capitalize">{d.type}</Badge></TableCell>
                      <TableCell className="text-sm">{d.merchant?.company_name || d.merchant?.name || (d.merchant_id ? `#${d.merchant_id}` : 'All')}</TableCell>
                      <TableCell className="text-xs">{d.uploaded_by}</TableCell>
                      <TableCell><Badge className={statusColors[d.status] || ''}>{d.status}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{format(new Date(d.created_at), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>
                        {d.status === 'pending' && d.uploaded_by === 'merchant' && (
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" className="h-7 text-xs text-green-600" onClick={() => updateStatus(d.id, 'approved')}><CheckCircle className="h-3 w-3 mr-1" /> Approve</Button>
                            <Button size="sm" variant="outline" className="h-7 text-xs text-red-600" onClick={() => updateStatus(d.id, 'rejected')}><XCircle className="h-3 w-3 mr-1" /> Reject</Button>
                          </div>
                        )}
                        {d.file_url && <a href={d.file_url} target="_blank" className="text-xs text-darpay-primary hover:underline">View</a>}
                      </TableCell>
                    </TableRow>
                  ))}
                  {docs.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">No documents</TableCell></TableRow>}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
