'use client'

import { useState } from 'react'
import Layout from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Send, Shield, Loader2, CheckCircle, AlertTriangle } from 'lucide-react'
import Cookies from 'js-cookie'

export default function SendMoneyPage() {
  const [step, setStep] = useState<'form' | 'confirm' | 'result'>('form')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [form, setForm] = useState({
    destType: 'BANK', bankCode: 'HBL', walletCode: 'EASYPAISA',
    accountNumber: '', accountTitle: '', amount: '', purpose: '', secretKey: '',
  })

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || ''
  const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${Cookies.get('admin_token')}` })

  const handlePreview = () => {
    if (!form.accountNumber || !form.accountTitle || !form.amount) return
    setStep('confirm')
  }

  const handleSend = async () => {
    if (!form.secretKey) return
    setLoading(true)
    try {
      // Use the payout API internally
      const body: any = {
        merchantReference: `ADMIN-SEND-${Date.now()}`,
        amount: Number(form.amount),
        currency: 'PKR',
        destType: form.destType,
        accountNumber: form.accountNumber,
        accountTitle: form.accountTitle,
      }
      if (form.destType === 'BANK') body.bankCode = form.bankCode
      else body.walletCode = form.walletCode

      // Call payout API via admin route (uses internal payout key)
      const res = await fetch(`${apiUrl}/api/v1/payouts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': form.secretKey,
          'X-Idempotency-Key': crypto.randomUUID(),
        },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      setResult(data)
      setStep('result')
    } catch (err) {
      setResult({ success: false, error: 'Network error' })
      setStep('result')
    } finally { setLoading(false) }
  }

  return (
    <Layout>
      <div className="max-w-xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Send className="h-6 w-6" /> Send Money</h1>
          <p className="text-muted-foreground text-sm">Send funds to bank accounts or wallets (requires secret key)</p>
        </div>

        <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0" />
          <p className="text-xs text-yellow-700">This action transfers real funds. Requires a valid payout secret key (sk) for authorization.</p>
        </div>

        {step === 'form' && (
          <Card>
            <CardHeader><CardTitle className="text-base">Transfer Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Destination Type</Label>
                <select value={form.destType} onChange={e => setForm({ ...form, destType: e.target.value })} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="BANK">Bank Account</option>
                  <option value="WALLET">Mobile Wallet</option>
                </select>
              </div>
              {form.destType === 'BANK' ? (
                <div>
                  <Label>Bank</Label>
                  <select value={form.bankCode} onChange={e => setForm({ ...form, bankCode: e.target.value })} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                    {['HBL', 'UBL', 'MCB', 'ABL', 'MEEZAN', 'NBP', 'FBL', 'BOP', 'ASKARI', 'JSBL'].map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              ) : (
                <div>
                  <Label>Wallet</Label>
                  <select value={form.walletCode} onChange={e => setForm({ ...form, walletCode: e.target.value })} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                    {['EASYPAISA', 'JAZZCASH', 'SADAPAY', 'NAYAPAY'].map(w => <option key={w} value={w}>{w}</option>)}
                  </select>
                </div>
              )}
              <div><Label>Account Number</Label><Input placeholder={form.destType === 'BANK' ? '1234567890001' : '03001234567'} value={form.accountNumber} onChange={e => setForm({ ...form, accountNumber: e.target.value })} /></div>
              <div><Label>Account Title</Label><Input placeholder="Recipient name" value={form.accountTitle} onChange={e => setForm({ ...form, accountTitle: e.target.value })} /></div>
              <div><Label>Amount (PKR)</Label><Input type="number" placeholder="5000" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></div>
              <div><Label>Purpose (optional)</Label><Input placeholder="Salary, refund, etc." value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })} /></div>
              <Button onClick={handlePreview} disabled={!form.accountNumber || !form.accountTitle || !form.amount} className="w-full bg-darpay-primary text-white">
                Preview Transfer
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 'confirm' && (
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4" /> Confirm Transfer</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">To</span><span className="font-medium">{form.accountTitle}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">{form.destType === 'BANK' ? 'Bank' : 'Wallet'}</span><span>{form.destType === 'BANK' ? form.bankCode : form.walletCode}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Account</span><span className="font-mono">{form.accountNumber}</span></div>
                <div className="flex justify-between text-sm font-bold text-lg border-t pt-2"><span>Amount</span><span>PKR {Number(form.amount).toLocaleString()}</span></div>
              </div>
              <div>
                <Label className="text-sm font-semibold">Secret Key (sk)</Label>
                <Input type="password" placeholder="settlix_sk_..." value={form.secretKey} onChange={e => setForm({ ...form, secretKey: e.target.value })} className="font-mono" />
                <p className="text-xs text-muted-foreground mt-1">Enter a valid payout secret key to authorize</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep('form')}>Back</Button>
                <Button onClick={handleSend} disabled={loading || !form.secretKey} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />} Send Money
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 'result' && (
          <Card>
            <CardContent className="pt-6 text-center space-y-4">
              {result?.success ? (
                <>
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                  <h2 className="text-xl font-bold">Transfer Initiated</h2>
                  <p className="text-muted-foreground">PKR {Number(form.amount).toLocaleString()} to {form.accountTitle}</p>
                  <Badge>Status: {result.data?.status || 'PENDING'}</Badge>
                  <p className="text-xs font-mono text-muted-foreground">ID: {result.data?.id}</p>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
                  <h2 className="text-xl font-bold text-red-600">Transfer Failed</h2>
                  <p className="text-muted-foreground">{result?.error?.message || result?.error || 'Unknown error'}</p>
                </>
              )}
              <Button onClick={() => { setStep('form'); setForm({ ...form, secretKey: '', accountNumber: '', accountTitle: '', amount: '' }); setResult(null) }}
                className="bg-darpay-primary text-white">New Transfer</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  )
}
