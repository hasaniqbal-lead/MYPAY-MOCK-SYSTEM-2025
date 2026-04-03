'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X, RotateCcw, Loader2 } from 'lucide-react'

interface RefundDialogProps {
  isOpen: boolean
  onClose: () => void
  transaction: {
    checkout_id: string
    reference: string
    amount: number
    status: string
  } | null
  onRefundCreated?: () => void
}

export default function RefundDialog({ isOpen, onClose, transaction, onRefundCreated }: RefundDialogProps) {
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  if (!isOpen || !transaction) return null

  const maxAmount = transaction.amount
  const isFullRefund = !amount || Number(amount) >= maxAmount

  const handleSubmit = async () => {
    setLoading(true)
    setResult(null)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || ''
      const token = document.cookie.split(';').find(c => c.trim().startsWith('auth_token='))?.split('=')[1]

      const res = await fetch(`${apiUrl}/api/v1/portal/refunds`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          transactionId: transaction.checkout_id,
          amount: amount ? Number(amount) : undefined,
          reason: reason || undefined,
        }),
      })

      const data = await res.json()
      if (data.success) {
        setResult({ success: true, message: `Refund of PKR ${data.refund.amount.toLocaleString()} ${data.refund.status}` })
        onRefundCreated?.()
      } else {
        setResult({ success: false, message: data.error || 'Refund failed' })
      }
    } catch {
      setResult({ success: false, message: 'Network error. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div className="bg-card rounded-xl shadow-2xl border border-border w-full max-w-md" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-orange-500" />
              <h3 className="font-semibold">Refund Transaction</h3>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Body */}
          <div className="p-4 space-y-4">
            {/* Transaction info */}
            <div className="bg-muted rounded-lg p-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Reference</span>
                <span className="font-medium">{transaction.reference}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Original Amount</span>
                <span className="font-semibold">PKR {maxAmount.toLocaleString()}</span>
              </div>
            </div>

            {/* Amount */}
            <div>
              <Label className="text-sm">Refund Amount (PKR)</Label>
              <Input
                type="number"
                placeholder={`Full refund: ${maxAmount}`}
                value={amount}
                onChange={e => setAmount(e.target.value)}
                max={maxAmount}
                min={1}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {isFullRefund ? 'Full refund' : `Partial refund: PKR ${Number(amount).toLocaleString()}`}
              </p>
            </div>

            {/* Reason */}
            <div>
              <Label className="text-sm">Reason (optional)</Label>
              <textarea
                placeholder="Customer request, duplicate payment, etc."
                value={reason}
                onChange={e => setReason(e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px] resize-none"
              />
            </div>

            {/* Result */}
            {result && (
              <div className={`p-3 rounded-lg text-sm ${result.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {result.message}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-2 p-4 border-t border-border">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
              onClick={handleSubmit}
              disabled={loading || (!!amount && (Number(amount) <= 0 || Number(amount) > maxAmount))}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {isFullRefund ? 'Full Refund' : `Refund PKR ${Number(amount || 0).toLocaleString()}`}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
