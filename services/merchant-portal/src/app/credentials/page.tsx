'use client'

import { useEffect, useState } from 'react'
import { merchantAPI } from '@/lib/api'
import Layout from '@/components/Layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Copy, Check, Eye, EyeOff, Plus, Zap, Trash2, Power, RefreshCw } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'

interface ApiKeyItem {
  id: number
  vendorId: string
  apiKey: string
  apiKeyFull: string
  isActive: boolean
  createdAt: string
}

interface RateLimitInfo {
  limits: Record<string, number>
  usage: Record<string, { used: number; remaining: number; resetsAt: string }>
}

export default function CredentialsPage() {
  const [keys, setKeys] = useState<ApiKeyItem[]>([])
  const [payoutKey, setPayoutKey] = useState('')
  const [payoutKeyFull, setPayoutKeyFull] = useState('')
  const [loading, setLoading] = useState(true)
  const [showKeys, setShowKeys] = useState(false)
  const [copied, setCopied] = useState('')
  const [rateLimits, setRateLimits] = useState<RateLimitInfo | null>(null)
  const [generating, setGenerating] = useState(false)
  const router = useRouter()

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || ''
  const getToken = () => Cookies.get('auth_token') || ''

  useEffect(() => {
    loadKeys()
    loadRateLimits()
  }, [])

  const loadKeys = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/v1/portal/merchant/keys`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      const data = await res.json()
      if (data.success) {
        setKeys(data.keys || [])
        setPayoutKey(data.payoutKey || '')
        setPayoutKeyFull(data.payoutKeyFull || '')
      }
    } catch {
      // Fallback to old credentials endpoint
      try {
        const creds = await merchantAPI.getCredentials()
        setKeys([{
          id: 0,
          vendorId: creds.merchantId,
          apiKey: creds.paymentApiKey?.substring(0, 12) + '...',
          apiKeyFull: creds.paymentApiKey,
          isActive: true,
          createdAt: creds.createdAt,
        }])
        setPayoutKeyFull(creds.payoutApiKey || '')
        setPayoutKey(creds.payoutApiKey ? creds.payoutApiKey.substring(0, 12) + '...' : '')
      } catch {}
    } finally {
      setLoading(false)
    }
  }

  const loadRateLimits = async () => {
    try {
      const data = await merchantAPI.getRateLimits()
      setRateLimits(data)
    } catch {}
  }

  const [newKeyLabel, setNewKeyLabel] = useState('')
  const [showNewKeyForm, setShowNewKeyForm] = useState(false)
  const [regenSk, setRegenSk] = useState(false)
  const [newSkKey, setNewSkKey] = useState('')

  const handleGenerateNew = async () => {
    const label = newKeyLabel.trim() || 'Default'
    setGenerating(true)
    try {
      const res = await fetch(`${apiUrl}/api/v1/portal/merchant/credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ label }),
      })
      const data = await res.json()
      if (data.success) {
        setShowNewKeyForm(false)
        setNewKeyLabel('')
        await loadKeys()
      } else { alert(data.error) }
    } catch {
      alert('Failed to generate new key')
    } finally {
      setGenerating(false)
    }
  }

  const handleRegenPayoutKey = async () => {
    if (!confirm('Regenerate payout key? The current key will stop working immediately.')) return
    setRegenSk(true)
    try {
      const res = await fetch(`${apiUrl}/api/v1/portal/merchant/payout-key/regenerate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      const data = await res.json()
      if (data.success) {
        setNewSkKey(data.payoutKey)
        loadKeys()
      } else { alert(data.error) }
    } catch {} finally { setRegenSk(false) }
  }

  const handleToggleKey = async (id: number) => {
    try {
      await fetch(`${apiUrl}/api/v1/portal/merchant/keys/${id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      await loadKeys()
    } catch {}
  }

  const handleDeleteKey = async (id: number) => {
    if (!confirm('Delete this API key? This cannot be undone.')) return
    try {
      const res = await fetch(`${apiUrl}/api/v1/portal/merchant/keys/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      const data = await res.json()
      if (!data.success) alert(data.error)
      await loadKeys()
    } catch {}
  }

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopied(field)
    setTimeout(() => setCopied(''), 2000)
  }

  const CopyBtn = ({ text, field }: { text: string; field: string }) => (
    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(text, field)}>
      {copied === field ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
    </Button>
  )

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold">API Keys</h1>
            <p className="text-muted-foreground text-sm">Manage your API keys for secure integration</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowKeys(!showKeys)} className="gap-2">
            {showKeys ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showKeys ? 'Hide' : 'Show'}
          </Button>
          <Button className="gap-2 bg-darpay-primary hover:bg-darpay-primary-dark text-white" onClick={() => setShowNewKeyForm(!showNewKeyForm)}>
            <Plus className="h-4 w-4" />
            New Key
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-darpay-primary" />
          </div>
        ) : (
          <>
            {/* New Key Form */}
            {showNewKeyForm && (
              <Card>
                <CardContent className="pt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Key Label / Name</Label>
                      <Input placeholder="e.g. Production, Client A, Testing" value={newKeyLabel} onChange={e => setNewKeyLabel(e.target.value)} className="h-9" />
                    </div>
                    <div className="flex items-end">
                      <Button onClick={handleGenerateNew} disabled={generating} className="bg-darpay-primary text-white h-9 w-full">
                        {generating ? 'Creating...' : 'Generate Key'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payment API Keys */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Payment Keys (pk)</CardTitle>
                <p className="text-xs text-muted-foreground">{keys.length} key{keys.length !== 1 ? 's' : ''} — {keys.filter(k => k.isActive).length} active</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {keys.map((key) => (
                  <div key={key.id} className={`flex items-center gap-3 p-3 border rounded-lg ${key.isActive ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200 bg-gray-50/30 opacity-60'}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">{(key as any).label || 'Default'}</span>
                        <span className="text-[10px] font-mono text-muted-foreground">{key.vendorId}</span>
                        <Badge variant={key.isActive ? 'default' : 'secondary'} className={key.isActive ? 'bg-green-500 text-white text-[10px]' : 'text-[10px]'}>
                          {key.isActive ? 'Active' : 'Disabled'}
                        </Badge>
                      </div>
                      <div className="font-mono text-sm truncate">
                        {showKeys ? key.apiKeyFull : key.apiKey}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-1">
                        Created: {new Date(key.createdAt).toLocaleDateString()}
                        {(key as any).allowedMethods && <span className="ml-2">Methods: {((key as any).allowedMethods as string[]).join(', ')}</span>}
                      </div>
                    </div>
                    <CopyBtn text={key.apiKeyFull} field={`pk-${key.id}`} />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleToggleKey(key.id)}
                      title={key.isActive ? 'Disable' : 'Enable'}
                    >
                      <Power className={`h-3.5 w-3.5 ${key.isActive ? 'text-green-500' : 'text-gray-400'}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteKey(key.id)}
                      title="Delete key"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
                {keys.length === 0 && (
                  <p className="text-center py-6 text-muted-foreground text-sm">No payment keys. Click "New Key" to create one.</p>
                )}
              </CardContent>
            </Card>

            {/* Payout (Send) Key */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Send Key (sk)</CardTitle>
                <p className="text-xs text-muted-foreground">Used for payout/disbursement API requests</p>
              </CardHeader>
              <CardContent>
                {payoutKeyFull ? (
                  <div className="flex items-center gap-3 p-3 border rounded-lg border-purple-200 bg-purple-50/30">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className="bg-purple-500 text-white text-[10px]">Active</Badge>
                      </div>
                      <div className="font-mono text-sm truncate">
                        {showKeys ? (newSkKey || payoutKeyFull) : payoutKey}
                      </div>
                      {newSkKey && <p className="text-[10px] text-green-600 mt-1 font-semibold">New key generated — copy it now!</p>}
                    </div>
                    <CopyBtn text={newSkKey || payoutKeyFull} field="sk" />
                    <Button variant="outline" size="sm" className="text-xs h-8" onClick={handleRegenPayoutKey} disabled={regenSk}>
                      {regenSk ? '...' : 'Regenerate'}
                    </Button>
                  </div>
                ) : (
                  <p className="text-center py-4 text-muted-foreground text-sm">No payout key configured</p>
                )}
              </CardContent>
            </Card>

            {/* Rate Limits */}
            {rateLimits && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Zap className="h-4 w-4 text-darpay-primary" />
                    API Rate Limits
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(rateLimits.limits).map(([window, limit]) => {
                      const usage = rateLimits.usage[window]
                      const labels: Record<string, string> = { day: 'Per Day', hour: 'Per Hour', minute: 'Per Minute', second: 'Per Second' }
                      return (
                        <div key={window} className="text-center p-3 border rounded-lg">
                          <div className="text-xl font-bold">{limit}</div>
                          <div className="text-xs text-muted-foreground">{labels[window] || window}</div>
                          {usage && (
                            <div className="text-[10px] text-muted-foreground mt-1">
                              {usage.used} used / {usage.remaining} left
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </Layout>
  )
}
