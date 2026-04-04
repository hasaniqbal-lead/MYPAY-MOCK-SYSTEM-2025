'use client'

import { X, Download, RotateCcw, Copy, Check, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'
import { format } from 'date-fns'

interface Transaction {
  checkout_id: string
  reference: string
  amount: number
  status: string
  payment_method?: string
  paymentMethod?: string
  created_at?: string
  createdAt?: string
  updated_at?: string
  updatedAt?: string
  customer_email?: string
  success_url?: string
  return_url?: string
  vendor_id?: string
}

interface Props {
  transaction: Transaction | null
  isOpen: boolean
  onClose: () => void
  onRefund?: (transaction: Transaction) => void
}

const statusColors: Record<string, string> = {
  completed: 'bg-green-100 text-green-700 border-green-200',
  success: 'bg-green-100 text-green-700 border-green-200',
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  failed: 'bg-red-100 text-red-700 border-red-200',
  expired: 'bg-gray-100 text-gray-500 border-gray-200',
  refunded: 'bg-purple-100 text-purple-700 border-purple-200',
}

export default function TransactionDetailDrawer({ transaction, isOpen, onClose, onRefund }: Props) {
  const [copied, setCopied] = useState('')

  if (!isOpen || !transaction) return null

  const method = transaction.payment_method || transaction.paymentMethod || 'N/A'
  const created = transaction.created_at || transaction.createdAt || ''
  const updated = transaction.updated_at || transaction.updatedAt || ''
  const status = transaction.status.toLowerCase()
  const canRefund = status === 'completed' || status === 'success'

  const copyText = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopied(field)
    setTimeout(() => setCopied(''), 1500)
  }

  const handleDownloadReceipt = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || ''
      const token = document.cookie.split(';').find(c => c.trim().startsWith('auth_token='))?.split('=')[1]
      const res = await fetch(`${apiUrl}/api/v1/portal/transactions/${transaction.checkout_id}/receipt`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const html = await res.text()
      // Open in new window with print button
      const win = window.open('', '_blank')
      if (win) {
        win.document.write(html)
        win.document.close()
        // Add print/save button after content loads
        setTimeout(() => {
          const btn = win.document.createElement('button')
          btn.textContent = 'Save as PDF (Ctrl+P)'
          btn.style.cssText = 'position:fixed;top:10px;right:10px;padding:8px 16px;background:#3B9EE8;color:white;border:none;border-radius:6px;cursor:pointer;font-size:13px;z-index:9999;'
          btn.onclick = () => win.print()
          win.document.body.appendChild(btn)
        }, 500)
      }
    } catch { alert('Failed to download receipt') }
  }

  const rows = [
    { label: 'Transaction ID', value: transaction.checkout_id, copyable: true },
    { label: 'Reference', value: transaction.reference, copyable: true },
    { label: 'Amount', value: `PKR ${transaction.amount.toLocaleString()}` },
    { label: 'Payment Method', value: method.charAt(0).toUpperCase() + method.slice(1) },
    { label: 'Status', value: transaction.status, isStatus: true },
    { label: 'Created', value: created ? format(new Date(created), 'MMM dd, yyyy HH:mm:ss') : '—' },
    ...(updated ? [{ label: 'Updated', value: format(new Date(updated), 'MMM dd, yyyy HH:mm:ss') }] : []),
    ...(transaction.customer_email ? [{ label: 'Customer Email', value: transaction.customer_email }] : []),
    ...(transaction.vendor_id ? [{ label: 'Vendor ID', value: transaction.vendor_id, copyable: true }] : []),
  ]

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed top-0 right-0 z-50 h-full w-full max-w-md bg-card border-l border-border shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Transaction Details</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto h-[calc(100%-140px)]">
          {/* Amount highlight */}
          <div className="text-center py-4 bg-muted rounded-lg">
            <p className="text-3xl font-bold">PKR {transaction.amount.toLocaleString()}</p>
            <Badge className={`mt-2 ${statusColors[status] || 'bg-gray-100 text-gray-600'}`}>
              {transaction.status}
            </Badge>
          </div>

          {/* Detail rows */}
          <div className="space-y-3">
            {rows.map((row) => (
              <div key={row.label} className="flex items-start justify-between py-2 border-b border-border/50 last:border-0">
                <span className="text-sm text-muted-foreground">{row.label}</span>
                <div className="flex items-center gap-1 text-right">
                  {row.isStatus ? (
                    <Badge className={statusColors[status] || 'bg-gray-100'}>{row.value}</Badge>
                  ) : (
                    <span className="text-sm font-medium max-w-[200px] truncate">{row.value}</span>
                  )}
                  {row.copyable && (
                    <button
                      onClick={() => copyText(row.value!, row.label)}
                      className="p-1 hover:bg-muted rounded"
                    >
                      {copied === row.label ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer actions */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-card flex gap-2">
          <Button variant="outline" className="flex-1 gap-2" onClick={handleDownloadReceipt}>
            <Download className="h-4 w-4" />
            Receipt
          </Button>
          {canRefund && onRefund && (
            <Button
              variant="outline"
              className="flex-1 gap-2 text-orange-600 border-orange-200 hover:bg-orange-50"
              onClick={() => onRefund(transaction)}
            >
              <RotateCcw className="h-4 w-4" />
              Refund
            </Button>
          )}
        </div>
      </div>
    </>
  )
}
