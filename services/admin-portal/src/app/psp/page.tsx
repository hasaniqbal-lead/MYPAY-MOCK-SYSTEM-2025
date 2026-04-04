'use client'

import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Power, Loader2, RefreshCw, Server, Key, Percent, TrendingUp } from 'lucide-react'
import Cookies from 'js-cookie'

interface PSP {
  id: number; name: string; code: string; logoUrl: string | null; isActive: boolean; environment: string
  credentials: { id: number; environment: string; merchantId: string | null; hasApiKey: boolean; isActive: boolean }[]
  rates: { id: number; paymentMethod: string; ratePercent: number; fixedFee: number }[]
}

export default function PSPPage() {
  const [psps, setPsps] = useState<PSP[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [newPsp, setNewPsp] = useState({ name: '', code: '', logoUrl: '' })
  const [margins, setMargins] = useState<any[]>([])

  // Credential editing
  const [editCred, setEditCred] = useState<{ pspId: number; env: string; apiKey: string; apiSecret: string; merchantId: string; webhookUrl: string } | null>(null)
  // Rate editing
  const [editRate, setEditRate] = useState<{ pspId: number; method: string; rate: string; fee: string } | null>(null)

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || ''
  const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${Cookies.get('admin_token')}` })

  const load = async () => {
    try {
      const [pspRes, marginRes] = await Promise.all([
        fetch(`${apiUrl}/api/v1/admin/psps`, { headers: headers() }),
        fetch(`${apiUrl}/api/v1/admin/margins`, { headers: headers() }),
      ])
      const pspData = await pspRes.json()
      const marginData = await marginRes.json()
      if (pspData.success) setPsps(pspData.psps || [])
      if (marginData.success) setMargins(marginData.margins || [])
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const createPsp = async () => {
    if (!newPsp.name || !newPsp.code) return
    const res = await fetch(`${apiUrl}/api/v1/admin/psps`, { method: 'POST', headers: headers(), body: JSON.stringify(newPsp) })
    const data = await res.json()
    if (data.success) { setShowForm(false); setNewPsp({ name: '', code: '', logoUrl: '' }); load() }
    else alert(data.error)
  }

  const togglePsp = async (id: number, isActive: boolean) => {
    await fetch(`${apiUrl}/api/v1/admin/psps/${id}`, { method: 'PUT', headers: headers(), body: JSON.stringify({ isActive: !isActive }) })
    load()
  }

  const saveCred = async () => {
    if (!editCred) return
    await fetch(`${apiUrl}/api/v1/admin/psps/${editCred.pspId}/credentials`, {
      method: 'PUT', headers: headers(),
      body: JSON.stringify({ environment: editCred.env, apiKey: editCred.apiKey, apiSecret: editCred.apiSecret, merchantId: editCred.merchantId, webhookUrl: editCred.webhookUrl }),
    })
    setEditCred(null); load()
  }

  const saveRate = async () => {
    if (!editRate) return
    await fetch(`${apiUrl}/api/v1/admin/psps/${editRate.pspId}/rates`, {
      method: 'POST', headers: headers(),
      body: JSON.stringify({ paymentMethod: editRate.method, ratePercent: Number(editRate.rate), fixedFee: Number(editRate.fee || 0) }),
    })
    setEditRate(null); load()
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Server className="h-6 w-6" /> PSP Management</h1>
            <p className="text-muted-foreground text-sm">Manage Payment Service Providers, credentials, and rates</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={load} className="gap-2"><RefreshCw className="h-4 w-4" /> Refresh</Button>
            <Button size="sm" onClick={() => setShowForm(!showForm)} className="gap-2 bg-darpay-primary text-white"><Plus className="h-4 w-4" /> Add PSP</Button>
          </div>
        </div>

        {showForm && (
          <Card><CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Name</Label><Input placeholder="Easypaisa PSP" value={newPsp.name} onChange={e => setNewPsp({ ...newPsp, name: e.target.value })} /></div>
              <div><Label>Code</Label><Input placeholder="easypaisa_psp" value={newPsp.code} onChange={e => setNewPsp({ ...newPsp, code: e.target.value })} /></div>
              <div><Label>Logo URL</Label><Input placeholder="https://..." value={newPsp.logoUrl} onChange={e => setNewPsp({ ...newPsp, logoUrl: e.target.value })} /></div>
            </div>
            <Button onClick={createPsp} className="bg-darpay-primary text-white">Create PSP</Button>
          </CardContent></Card>
        )}

        <Tabs defaultValue="providers">
          <TabsList>
            <TabsTrigger value="providers" className="gap-1"><Server className="h-3 w-3" /> Providers</TabsTrigger>
            <TabsTrigger value="margins" className="gap-1"><TrendingUp className="h-3 w-3" /> Margins</TabsTrigger>
          </TabsList>

          <TabsContent value="providers" className="space-y-4">
            {loading ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div> : (
              psps.length > 0 ? psps.map(psp => (
                <Card key={psp.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {psp.logoUrl && <img src={psp.logoUrl} alt={psp.name} className="h-8 w-8 rounded" />}
                        <div>
                          <CardTitle className="text-base">{psp.name}</CardTitle>
                          <span className="text-xs text-muted-foreground font-mono">{psp.code}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 items-center">
                        <Badge className={psp.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>{psp.isActive ? 'Active' : 'Disabled'}</Badge>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => togglePsp(psp.id, psp.isActive)}>
                          <Power className={`h-4 w-4 ${psp.isActive ? 'text-green-500' : 'text-gray-400'}`} />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Credentials */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium flex items-center gap-1"><Key className="h-3 w-3" /> Credentials</span>
                        <Button size="sm" variant="outline" className="h-7 text-xs"
                          onClick={() => setEditCred({ pspId: psp.id, env: 'sandbox', apiKey: '', apiSecret: '', merchantId: '', webhookUrl: '' })}>
                          Configure
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        {psp.credentials.map(c => (
                          <Badge key={c.id} variant="outline" className={c.isActive ? 'border-green-300' : ''}>
                            {c.environment} {c.hasApiKey ? '(configured)' : '(empty)'}
                          </Badge>
                        ))}
                        {psp.credentials.length === 0 && <span className="text-xs text-muted-foreground">No credentials configured</span>}
                      </div>
                    </div>

                    {/* Rates */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium flex items-center gap-1"><Percent className="h-3 w-3" /> Rates (PSP cost)</span>
                        <Button size="sm" variant="outline" className="h-7 text-xs"
                          onClick={() => setEditRate({ pspId: psp.id, method: 'easypaisa', rate: '', fee: '' })}>
                          Set Rate
                        </Button>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {psp.rates.map(r => (
                          <Badge key={r.id} variant="outline">
                            {r.paymentMethod}: {r.ratePercent}% {r.fixedFee > 0 ? `+ PKR ${r.fixedFee}` : ''}
                          </Badge>
                        ))}
                        {psp.rates.length === 0 && <span className="text-xs text-muted-foreground">No rates configured</span>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )) : <p className="text-center py-12 text-muted-foreground">No PSPs configured. Click "Add PSP" to create one.</p>
            )}
          </TabsContent>

          <TabsContent value="margins" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Margin Analysis</CardTitle>
                <p className="text-xs text-muted-foreground">PSP cost vs merchant rate = your margin</p>
              </CardHeader>
              <CardContent>
                {margins.length > 0 ? (
                  <div className="grid gap-3">
                    {margins.map((m, i) => (
                      <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <span className="font-medium text-sm">{m.paymentMethod}</span>
                          <span className="text-xs text-muted-foreground ml-2">via {m.pspName}</span>
                        </div>
                        <div className="flex gap-4 text-sm">
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground">PSP Cost</div>
                            <div className="text-red-600 font-medium">{m.pspRate}%</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground">Merchant Rate</div>
                            <div className="text-blue-600 font-medium">{m.merchantRate}%</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground">Your Margin</div>
                            <div className={`font-bold ${m.margin > 0 ? 'text-green-600' : 'text-red-600'}`}>{m.margin.toFixed(2)}%</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-center py-8 text-muted-foreground">Add PSPs and set rates to see margin analysis</p>}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Credential Edit Modal */}
        {editCred && (
          <>
            <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setEditCred(null)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <Card className="w-full max-w-md" onClick={e => e.stopPropagation()}>
                <CardHeader><CardTitle className="text-base">PSP Credentials</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div><Label>Environment</Label>
                    <select value={editCred.env} onChange={e => setEditCred({ ...editCred, env: e.target.value })} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                      <option value="sandbox">Sandbox</option><option value="production">Production</option>
                    </select>
                  </div>
                  <div><Label>API Key</Label><Input value={editCred.apiKey} onChange={e => setEditCred({ ...editCred, apiKey: e.target.value })} /></div>
                  <div><Label>API Secret</Label><Input value={editCred.apiSecret} onChange={e => setEditCred({ ...editCred, apiSecret: e.target.value })} /></div>
                  <div><Label>PSP Merchant ID</Label><Input value={editCred.merchantId} onChange={e => setEditCred({ ...editCred, merchantId: e.target.value })} /></div>
                  <div><Label>Webhook URL</Label><Input value={editCred.webhookUrl} onChange={e => setEditCred({ ...editCred, webhookUrl: e.target.value })} /></div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => setEditCred(null)}>Cancel</Button>
                    <Button className="flex-1 bg-darpay-primary text-white" onClick={saveCred}>Save</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Rate Edit Modal */}
        {editRate && (
          <>
            <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setEditRate(null)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <Card className="w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <CardHeader><CardTitle className="text-base">Set PSP Rate</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div><Label>Payment Method</Label>
                    <select value={editRate.method} onChange={e => setEditRate({ ...editRate, method: e.target.value })} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                      <option value="easypaisa">Easypaisa</option><option value="jazzcash">JazzCash</option><option value="card">Card</option>
                    </select>
                  </div>
                  <div><Label>Rate (%)</Label><Input type="number" step="0.01" placeholder="1.50" value={editRate.rate} onChange={e => setEditRate({ ...editRate, rate: e.target.value })} /></div>
                  <div><Label>Fixed Fee (PKR)</Label><Input type="number" placeholder="0" value={editRate.fee} onChange={e => setEditRate({ ...editRate, fee: e.target.value })} /></div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => setEditRate(null)}>Cancel</Button>
                    <Button className="flex-1 bg-darpay-primary text-white" onClick={saveRate}>Save Rate</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}
