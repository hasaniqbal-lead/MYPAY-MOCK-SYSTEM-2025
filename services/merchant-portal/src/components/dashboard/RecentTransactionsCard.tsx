'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"
import { useRouter } from 'next/navigation'
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
}

interface RecentTransactionsCardProps {
  transactions: Transaction[]
}

const getStatusBadge = (status: string) => {
  switch (status.toLowerCase()) {
    case 'success':
    case 'completed':
      return <Badge className="bg-status-success/10 text-status-success">Success</Badge>
    case 'pending':
      return <Badge className="bg-status-pending/10 text-status-pending">Pending</Badge>
    case 'failed':
    case 'error':
      return <Badge className="bg-status-error/10 text-status-error">Failed</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

export function RecentTransactionsCard({ transactions }: RecentTransactionsCardProps) {
  const router = useRouter()
  const recentTransactions = transactions.slice(0, 5)

  return (
    <Card className="shadow-elevation">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Transactions</CardTitle>
        <Button variant="ghost" size="sm" onClick={() => router.push('/transactions')}>
          View All
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentTransactions.length > 0 ? (
            recentTransactions.map((transaction) => (
              <div
                key={transaction.checkout_id}
                className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm font-mono">{transaction.checkout_id}</span>
                      {getStatusBadge(transaction.status)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {transaction.reference} • {transaction.payment_method || transaction.paymentMethod || 'N/A'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-semibold">PKR {transaction.amount.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(transaction.created_at || transaction.createdAt || new Date()), 'MMM dd, HH:mm')}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No transactions found
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

