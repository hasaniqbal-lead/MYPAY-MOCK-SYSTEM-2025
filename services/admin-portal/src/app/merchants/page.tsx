'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import Layout from '@/components/Layout'
import { adminAPI } from '@/lib/api'
import { Users, Search, RefreshCw } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface Merchant {
  id: number
  name: string
  email: string
  company_name: string
  status: string
  isActive: boolean
  createdAt: string
  transactionCount: number
  totalVolume: number
}

export default function MerchantsPage() {
  const [merchants, setMerchants] = useState<Merchant[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchMerchants()
  }, [])

  const fetchMerchants = async () => {
    setLoading(true)
    try {
      const response = await adminAPI.getMerchants()
      if (response.success) {
        setMerchants(response.merchants)
      }
    } catch (error) {
      console.error('Failed to fetch merchants:', error)
      // Mock data for demo
      setMerchants([
        {
          id: 1,
          name: 'Test Merchant',
          email: 'test@mycodigital.io',
          company_name: 'Test Merchant Company',
          status: 'active',
          isActive: true,
          createdAt: '2024-01-15T10:30:00Z',
          transactionCount: 150,
          totalVolume: 250000,
        },
        {
          id: 2,
          name: 'Demo Store',
          email: 'demo@example.com',
          company_name: 'Demo Store Ltd',
          status: 'active',
          isActive: true,
          createdAt: '2024-02-20T14:45:00Z',
          transactionCount: 89,
          totalVolume: 125000,
        },
        {
          id: 3,
          name: 'Sample Business',
          email: 'sample@business.com',
          company_name: 'Sample Business Inc',
          status: 'inactive',
          isActive: false,
          createdAt: '2024-03-10T09:15:00Z',
          transactionCount: 45,
          totalVolume: 75000,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const filteredMerchants = merchants.filter(
    (merchant) =>
      merchant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      merchant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      merchant.company_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Users className="h-6 w-6 text-mypay-green" />
              Merchants
            </h1>
            <p className="text-muted-foreground">Manage registered merchants</p>
          </div>
          <Button
            onClick={fetchMerchants}
            variant="outline"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-foreground">All Merchants</CardTitle>
                <CardDescription>
                  {merchants.length} merchants registered
                </CardDescription>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search merchants..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading merchants...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Transactions</TableHead>
                    <TableHead>Volume</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMerchants.map((merchant) => (
                    <TableRow key={merchant.id}>
                      <TableCell className="font-mono">#{merchant.id}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{merchant.company_name}</p>
                          <p className="text-xs text-muted-foreground">{merchant.name}</p>
                        </div>
                      </TableCell>
                      <TableCell>{merchant.email}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            merchant.status === 'active'
                              ? 'bg-status-success/10 text-status-success border-status-success/20'
                              : 'bg-status-error/10 text-status-error border-status-error/20'
                          }
                        >
                          {merchant.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{merchant.transactionCount}</TableCell>
                      <TableCell>{formatCurrency(merchant.totalVolume)}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(merchant.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
