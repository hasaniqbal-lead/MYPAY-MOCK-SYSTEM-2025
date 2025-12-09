'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown } from "lucide-react"

interface MetricsCardProps {
  title: string
  value: string
  change: number
  changeType: 'increase' | 'decrease'
  icon: React.ReactNode
}

export function MetricsCard({ title, value, change, changeType, icon }: MetricsCardProps) {
  return (
    <Card className="shadow-elevation">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="text-mypay-green">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground mb-1">{value}</div>
        <div className="flex items-center gap-1">
          {changeType === 'increase' ? (
            <TrendingUp className="h-3 w-3 text-status-success" />
          ) : (
            <TrendingDown className="h-3 w-3 text-status-error" />
          )}
          <Badge 
            variant="secondary" 
            className={`text-xs ${
              changeType === 'increase' 
                ? 'bg-status-success/10 text-status-success' 
                : 'bg-status-error/10 text-status-error'
            }`}
          >
            {change > 0 ? '+' : ''}{change}%
          </Badge>
          <span className="text-xs text-muted-foreground ml-1">vs last month</span>
        </div>
      </CardContent>
    </Card>
  )
}

