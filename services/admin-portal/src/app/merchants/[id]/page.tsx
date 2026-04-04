'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Save, Loader2, User, Percent, Shield, Settings, Key } from 'lucide-react'
import Cookies from 'js-cookie'

export default function MerchantDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [merchant, setMerchant] = useState<any>(null)
  const [rates, setRates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Editable config
  const [config, setConfig] = useState({
    settlementPeriod: 15,
    maxTransactionAmount: 500000,
    dailyTransactionLimit: 5000000,
    monthlyVolumeLimit: 50000000,
    apiRateDay: 5000,
    apiRateHour: 500,
  })

  // Rate editing
  const [newRate, setNewRate] = useState({ method: 'easypaisa', rate: '', fee: '' })

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || ''
  const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${Cookies.get('admin_token')}` })

  const load = async () => {
    try {
      const [mRes, rRes] = await Promise.all([
        fetch(`${apiUrl}/api/v1/admin/merchants/${id}`, { headers: headers() }),
        fetch(`${apiUrl}/api/v1/admin/merchants/${id}/rates`, { headers: headers() }),
      ])
      const mData = await mRes.json()
      const rData = await rRes.json()
      if (mData.success) setMerchant(mData.merchant || mData)
      if (rData.success) setRates(rData.rates || [])
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { load() }, [id])

  const saveRate = async () => {
    if (!newRate.rate) return
    setSaving(true)
    try {
      await fetch(`${apiUrl}/api/v1/admin/merchants/${id}/rates`, {
        method: 'POST', headers: headers(),
        body: JSON.stringify({ paymentMethod: newRate.method, ratePercent: Number(newRate.rate), fixedFee: Number(newRate.fee || 0) }),
      })
      setNewRate({ method: 'easypaisa', rate: '', fee: '' })
      load()
    } catch {} finally { setSaving(false) }
  }

  const updateMerchant = async (data: any) => {
    setSaving(true)
    try {
      await fetch(`${apiUrl}/api/v1/admin/merchants/${id}`, {
        method: 'PUT', headers: headers(), body: JSON.stringify(data),
      })
      load()
    } catch {} finally { setSaving(false) }
  }

  if (loading) return <Layout><div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div></Layout>
  if (!merchant) return <Layout><p className="text-center py-12 text-muted-foreground">Merchant not found</p></Layout>

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/merchants')} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{merchant.company_name || merchant.name}</h1>
            <p className="text-muted-foreground text-sm">{merchant.email} | ID: {merchant.id}</p>
          </div>
          <Badge className={merchant.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>{merchant.status}</Badge>
        </div>

        <Tabs defaultValue="overview">
          <TabsList className="flex flex-wrap gap-1">
            <TabsTrigger value="overview" className="gap-1"><User className="h-3 w-3" /> Overview</TabsTrigger>
            <TabsTrigger value="rates" className="gap-1"><Percent className="h-3 w-3" /> Rates</TabsTrigger>
            <TabsTrigger value="limits" className="gap-1"><Shield className="h-3 w-3" /> Limits</TabsTrigger>
            <TabsTrigger value="keys" className="gap-1"><Key className="h-3 w-3" /> Keys</TabsTrigger>
          </TabsList>

          {/* OVERVIEW */}
          <TabsContent value="overview">
            <Card>
              <CardHeader><CardTitle className="text-base">Merchant Information</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Contact Name</Label><div className="text-sm font-medium mt-1">{merchant.name}</div></div>
                  <div><Label>Company</Label><div className="text-sm font-medium mt-1">{merchant.company_name || '—'}</div></div>
                  <div><Label>Email</Label><div className="text-sm font-medium mt-1">{merchant.email}</div></div>
                  <div><Label>Status</Label><div className="mt-1"><Badge className={merchant.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>{merchant.status}</Badge></div></div>
                  <div><Label>Webhook URL</Label><div className="text-sm font-medium mt-1 font-mono">{merchant.webhookUrl || '—'}</div></div>
                  <div><Label>Created</Label><div className="text-sm font-medium mt-1">{new Date(merchant.createdAt || merchant.created_at).toLocaleDateString()}</div></div>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button variant="outline" size="sm" onClick={() => updateMerchant({ status: merchant.status === 'active' ? 'inactive' : 'active' })}>
                    {merchant.status === 'active' ? 'Disable' : 'Enable'} Merchant
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* RATES */}
          <TabsContent value="rates" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Merchant-Specific Rates</CardTitle>
                <p className="text-xs text-muted-foreground">Override default platform rates for this merchant</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {rates.length > 0 ? (
                  <div className="space-y-2">
                    {rates.map(r => (
                      <div key={r.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <Badge variant="outline" className="capitalize">{r.paymentMethod}</Badge>
                        <span className="font-semibold">{r.ratePercent}% {r.fixedFee > 0 ? `+ PKR ${r.fixedFee}` : ''}</span>
                        <span className="text-xs text-muted-foreground">Since {new Date(r.effectiveFrom).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-muted-foreground">No custom rates — using platform defaults (2.5%)</p>}

                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium mb-3">Set New Rate</h4>
                  <div className="grid grid-cols-4 gap-3">
                    <div>
                      <Label className="text-xs">Method</Label>
                      <select value={newRate.method} onChange={e => setNewRate({ ...newRate, method: e.target.value })} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                        <option value="easypaisa">Easypaisa</option><option value="jazzcash">JazzCash</option><option value="card">Card</option>
                      </select>
                    </div>
                    <div><Label className="text-xs">Rate (%)</Label><Input type="number" step="0.01" placeholder="2.50" value={newRate.rate} onChange={e => setNewRate({ ...newRate, rate: e.target.value })} className="h-9" /></div>
                    <div><Label className="text-xs">Fixed Fee</Label><Input type="number" placeholder="0" value={newRate.fee} onChange={e => setNewRate({ ...newRate, fee: e.target.value })} className="h-9" /></div>
                    <div className="flex items-end"><Button onClick={saveRate} disabled={saving || !newRate.rate} className="h-9 bg-darpay-primary text-white w-full"><Save className="h-3 w-3 mr-1" /> Save</Button></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* LIMITS */}
          <TabsContent value="limits">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Transaction & API Limits</CardTitle>
                <p className="text-xs text-muted-foreground">Configure limits for this merchant</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Max Transaction Amount (PKR)</Label>
                    <Input type="number" value={config.maxTransactionAmount} onChange={e => setConfig({ ...config, maxTransactionAmount: Number(e.target.value) })} />
                  </div>
                  <div>
                    <Label>Daily Transaction Limit (PKR)</Label>
                    <Input type="number" value={config.dailyTransactionLimit} onChange={e => setConfig({ ...config, dailyTransactionLimit: Number(e.target.value) })} />
                  </div>
                  <div>
                    <Label>Monthly Volume Limit (PKR)</Label>
                    <Input type="number" value={config.monthlyVolumeLimit} onChange={e => setConfig({ ...config, monthlyVolumeLimit: Number(e.target.value) })} />
                  </div>
                  <div>
                    <Label>Settlement Period (days)</Label>
                    <Input type="number" value={config.settlementPeriod} onChange={e => setConfig({ ...config, settlementPeriod: Number(e.target.value) })} />
                  </div>
                  <div>
                    <Label>API Rate Limit (per day)</Label>
                    <Input type="number" value={config.apiRateDay} onChange={e => setConfig({ ...config, apiRateDay: Number(e.target.value) })} />
                  </div>
                  <div>
                    <Label>API Rate Limit (per hour)</Label>
                    <Input type="number" value={config.apiRateHour} onChange={e => setConfig({ ...config, apiRateHour: Number(e.target.value) })} />
                  </div>
                </div>
                <Button className="bg-darpay-primary text-white gap-2"><Save className="h-4 w-4" /> Save Limits</Button>
                <p className="text-xs text-muted-foreground">Note: Limits are enforced at the API level. Changes take effect immediately.</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* KEYS */}
          <TabsContent value="keys">
            <Card>
              <CardHeader><CardTitle className="text-base">API Keys</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">Payment Key (pk)</span>
                    <Badge className="bg-green-100 text-green-700 text-[10px]">Active</Badge>
                  </div>
                  <div className="font-mono text-xs text-muted-foreground">Keys are managed from the merchant portal credentials page</div>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">Send Key (sk)</span>
                    <Badge className="bg-green-100 text-green-700 text-[10px]">Active</Badge>
                  </div>
                  <div className="font-mono text-xs text-muted-foreground">{merchant.apiKeyPlain ? merchant.apiKeyPlain.substring(0, 15) + '...' : 'Not configured'}</div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => { /* Reset password */ }}>Reset Password</Button>
                  <Button variant="outline" size="sm" className="text-red-600">Disable All Keys</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  )
}
