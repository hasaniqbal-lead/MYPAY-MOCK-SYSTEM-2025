'use client'

import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DollarSign, TrendingUp, TrendingDown, RefreshCw, Loader2, CreditCard, Users, BarChart3 } from 'lucide-react'
import Cookies from 'js-cookie'

export default function FinancePage() {
  const [overview, setOverview] = useState<any>(null)
  const [byMethod, setByMethod] = useState<any[]>([])
  const [byMerchant, setByMerchant] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30')

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || ''
  const headers = () => ({ Authorization: `Bearer ${Cookies.get('admin_token')}` })

  const load = async () => {
    setLoading(true)
    try {
      const [ovRes, methRes, merchRes] = await Promise.all([
        fetch(`${apiUrl}/api/v1/admin/finance/overview?periodDays=${period}`, { headers: headers() }),
        fetch(`${apiUrl}/api/v1/admin/finance/by-method?periodDays=${period}`, { headers: headers() }),
        fetch(`${apiUrl}/api/v1/admin/finance/by-merchant?periodDays=${period}`, { headers: headers() }),
      ])
      const [ovData, methData, merchData] = await Promise.all([ovRes.json(), methRes.json(), merchRes.json()])
      if (ovData.success) setOverview(ovData.overview)
      if (methData.success) setByMethod(methData.breakdown || [])
      if (merchData.success) setByMerchant(merchData.merchants || [])
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { load() }, [period])

  const fmt = (n: number) => `PKR ${n.toLocaleString()}`

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><BarChart3 className="h-6 w-6" /> Finance</h1>
            <p className="text-muted-foreground text-sm">Revenue, fees, margins, and settlement calculations</p>
          </div>
          <div className="flex gap-2">
            {['7', '30', '90'].map(d => (
              <Button key={d} variant={period === d ? 'default' : 'outline'} size="sm" onClick={() => setPeriod(d)}>{d}d</Button>
            ))}
            <Button variant="outline" size="sm" onClick={load} className="gap-2"><RefreshCw className="h-4 w-4" /></Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : overview ? (
          <>
            {/* Overview Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Gross Revenue</span>
                    <DollarSign className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="text-xl font-bold mt-1">{fmt(overview.grossRevenue)}</div>
                  <div className="text-xs text-muted-foreground">{overview.totalTransactions} transactions</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Platform Margin</span>
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className={`text-xl font-bold mt-1 ${overview.platformMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(overview.platformMargin)}</div>
                  <div className="text-xs text-muted-foreground">Merchant fees − PSP costs</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Refunds</span>
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  </div>
                  <div className="text-xl font-bold mt-1 text-red-600">{fmt(overview.totalRefunds)}</div>
                  <div className="text-xs text-muted-foreground">{overview.refundCount} refunds</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Pending Settlements</span>
                    <DollarSign className="h-4 w-4 text-yellow-500" />
                  </div>
                  <div className="text-xl font-bold mt-1">{fmt(overview.pendingSettlements)}</div>
                  <div className="text-xs text-muted-foreground">{overview.pendingSettlementCount} pending</div>
                </CardContent>
              </Card>
            </div>

            {/* Fee Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-4 text-center">
                  <div className="text-xs text-muted-foreground">PSP Fees</div>
                  <div className="text-lg font-bold text-red-500">{fmt(overview.pspFees)}</div>
                  <div className="text-xs text-muted-foreground">Avg {overview.avgPspRate.toFixed(2)}%</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <div className="text-xs text-muted-foreground">Merchant Fees Collected</div>
                  <div className="text-lg font-bold text-blue-500">{fmt(overview.merchantFees)}</div>
                  <div className="text-xs text-muted-foreground">Default 2.5%</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <div className="text-xs text-muted-foreground">Net Revenue</div>
                  <div className="text-lg font-bold text-green-600">{fmt(overview.netRevenue)}</div>
                  <div className="text-xs text-muted-foreground">Gross − refunds − PSP fees</div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="methods">
              <TabsList>
                <TabsTrigger value="methods" className="gap-1"><CreditCard className="h-3 w-3" /> By Method</TabsTrigger>
                <TabsTrigger value="merchants" className="gap-1"><Users className="h-3 w-3" /> By Merchant</TabsTrigger>
              </TabsList>

              <TabsContent value="methods">
                <Card>
                  <CardHeader><CardTitle className="text-base">Revenue by Payment Method</CardTitle></CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader><TableRow>
                        <TableHead>Method</TableHead><TableHead>Transactions</TableHead><TableHead>Revenue</TableHead>
                        <TableHead>PSP Rate</TableHead><TableHead>PSP Cost</TableHead><TableHead>Merchant Rate</TableHead>
                        <TableHead>Merchant Fee</TableHead><TableHead>Margin</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {byMethod.map(m => (
                          <TableRow key={m.method}>
                            <TableCell><Badge variant="outline" className="capitalize">{m.method}</Badge></TableCell>
                            <TableCell>{m.transactions}</TableCell>
                            <TableCell className="font-semibold">{fmt(m.revenue)}</TableCell>
                            <TableCell className="text-red-500">{m.pspRate}%</TableCell>
                            <TableCell className="text-red-500">{fmt(m.pspCost)}</TableCell>
                            <TableCell className="text-blue-500">{m.merchantRate}%</TableCell>
                            <TableCell className="text-blue-500">{fmt(m.merchantFee)}</TableCell>
                            <TableCell className={`font-bold ${m.margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(m.margin)}</TableCell>
                          </TableRow>
                        ))}
                        {byMethod.length === 0 && <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No transaction data</TableCell></TableRow>}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="merchants">
                <Card>
                  <CardHeader><CardTitle className="text-base">Revenue by Merchant</CardTitle></CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader><TableRow>
                        <TableHead>Merchant</TableHead><TableHead>Transactions</TableHead><TableHead>Gross</TableHead>
                        <TableHead>Rate</TableHead><TableHead>Platform Fees</TableHead><TableHead>Refunds</TableHead>
                        <TableHead>Net Settleable</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {byMerchant.map(m => (
                          <TableRow key={m.merchantId}>
                            <TableCell className="font-medium">{m.merchantName}</TableCell>
                            <TableCell>{m.transactions}</TableCell>
                            <TableCell className="font-semibold">{fmt(m.grossRevenue)}</TableCell>
                            <TableCell>{m.merchantRate}%</TableCell>
                            <TableCell className="text-blue-500">{fmt(m.platformFees)}</TableCell>
                            <TableCell className="text-red-500">{fmt(m.refunds)}</TableCell>
                            <TableCell className={`font-bold ${m.netSettleable >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(m.netSettleable)}</TableCell>
                          </TableRow>
                        ))}
                        {byMerchant.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No merchant data</TableCell></TableRow>}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <p className="text-center py-12 text-muted-foreground">Failed to load financial data</p>
        )}
      </div>
    </Layout>
  )
}
