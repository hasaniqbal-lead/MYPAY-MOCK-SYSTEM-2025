'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Layout from '@/components/Layout'
import { adminAPI } from '@/lib/api'
import { Users, Search, RefreshCw, Plus, Edit, Power, Check, X } from 'lucide-react'

interface Merchant {
  id: number
  merchant_id: string
  name: string
  email: string
  company_name: string
  status: string
  isActive: boolean
  createdAt: string
  updatedAt?: string
  transactionCount: number
  totalVolume: number
  payoutCount: number
  totalPayoutVolume: number
  webhookUrl?: string
}

interface CreateMerchantData {
  email: string
  name: string
  company_name: string
  webhookUrl: string
}

interface EditMerchantData {
  name: string
  company_name: string
  webhookUrl: string
  status: string
}

export default function MerchantsPage() {
  const [merchants, setMerchants] = useState<Merchant[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Create merchant dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createData, setCreateData] = useState<CreateMerchantData>({
    email: '',
    name: '',
    company_name: '',
    webhookUrl: '',
  })
  const [createError, setCreateError] = useState('')
  const [createSuccess, setCreateSuccess] = useState<any>(null)

  // Edit merchant dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editingMerchant, setEditingMerchant] = useState<Merchant | null>(null)
  const [editData, setEditData] = useState<EditMerchantData>({
    name: '',
    company_name: '',
    webhookUrl: '',
    status: 'active',
  })
  const [editError, setEditError] = useState('')

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
    } finally {
      setLoading(false)
    }
  }

  const handleCreateMerchant = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError('')
    setCreating(true)

    try {
      const response = await adminAPI.createMerchant(createData)
      
      if (response.success) {
        setCreateSuccess(response)
        // Don't close dialog yet, show credentials first
        fetchMerchants()
      } else {
        setCreateError(response.error || 'Failed to create merchant')
      }
    } catch (error: any) {
      setCreateError(error.message || 'Failed to create merchant')
    } finally {
      setCreating(false)
    }
  }

  const closeCreateDialog = () => {
    setCreateDialogOpen(false)
    setCreateData({ email: '', name: '', company_name: '', webhookUrl: '' })
    setCreateError('')
    setCreateSuccess(null)
  }

  const openEditDialog = (merchant: Merchant) => {
    setEditingMerchant(merchant)
    setEditData({
      name: merchant.name,
      company_name: merchant.company_name,
      webhookUrl: merchant.webhookUrl || '',
      status: merchant.status,
    })
    setEditError('')
    setEditDialogOpen(true)
  }

  const handleEditMerchant = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingMerchant) return

    setEditError('')
    setEditing(true)

    try {
      const response = await adminAPI.updateMerchant(editingMerchant.id, editData)
      
      if (response.success) {
        setEditDialogOpen(false)
        fetchMerchants()
      } else {
        setEditError(response.error || 'Failed to update merchant')
      }
    } catch (error: any) {
      setEditError(error.message || 'Failed to update merchant')
    } finally {
      setEditing(false)
    }
  }

  const handleToggleStatus = async (merchant: Merchant) => {
    try {
      const response = await adminAPI.toggleMerchantStatus(merchant.id)
      if (response.success) {
        fetchMerchants()
      }
    } catch (error) {
      console.error('Failed to toggle merchant status:', error)
    }
  }

  const filteredMerchants = merchants.filter(
    (merchant) =>
      merchant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      merchant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      merchant.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      merchant.merchant_id.toLowerCase().includes(searchTerm.toLowerCase())
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
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
          <div className="flex gap-2">
            <Button
              onClick={() => setCreateDialogOpen(true)}
              className="bg-mypay-green hover:bg-mypay-green-dark text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Merchant
            </Button>
            <Button onClick={fetchMerchants} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
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
                  placeholder="Search by name, email, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-80"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading merchants...</div>
            ) : filteredMerchants.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? 'No merchants found matching your search' : 'No merchants registered yet'}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Merchant ID</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payments</TableHead>
                    <TableHead>Payouts</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMerchants.map((merchant) => (
                    <TableRow key={merchant.id}>
                      <TableCell className="font-mono text-xs">{merchant.merchant_id}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{merchant.company_name}</p>
                          <p className="text-xs text-muted-foreground">{merchant.name}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{merchant.email}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            merchant.isActive
                              ? 'bg-status-success/10 text-status-success border-status-success/20'
                              : 'bg-status-error/10 text-status-error border-status-error/20'
                          }
                        >
                          {merchant.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="font-medium">{merchant.transactionCount} txns</p>
                          <p className="text-xs text-muted-foreground">{formatCurrency(merchant.totalVolume)}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="font-medium">{merchant.payoutCount} payouts</p>
                          <p className="text-xs text-muted-foreground">{formatCurrency(merchant.totalPayoutVolume)}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{formatDate(merchant.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            onClick={() => openEditDialog(merchant)}
                            variant="outline"
                            size="sm"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            onClick={() => handleToggleStatus(merchant)}
                            variant="outline"
                            size="sm"
                            className={merchant.isActive ? 'text-red-600' : 'text-green-600'}
                          >
                            <Power className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Merchant Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Merchant</DialogTitle>
            <DialogDescription>
              Create a new merchant account. Credentials will be auto-generated.
            </DialogDescription>
          </DialogHeader>

          {createSuccess ? (
            <div className="space-y-4">
              <Alert className="bg-status-success/10 border-status-success/20">
                <Check className="h-4 w-4 text-status-success" />
                <AlertDescription className="text-status-success">
                  Merchant created successfully! Save these credentials - they won't be shown again.
                </AlertDescription>
              </Alert>

              <div className="space-y-3 p-4 bg-muted rounded-lg">
                <h3 className="font-semibold text-sm">Login Credentials</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Email:</span>
                    <div className="flex gap-2 items-center">
                      <span className="font-mono">{createSuccess.credentials.email}</span>
                      <Button size="sm" variant="ghost" onClick={() => copyToClipboard(createSuccess.credentials.email)}>
                        Copy
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Password:</span>
                    <div className="flex gap-2 items-center">
                      <span className="font-mono">{createSuccess.credentials.password}</span>
                      <Button size="sm" variant="ghost" onClick={() => copyToClipboard(createSuccess.credentials.password)}>
                        Copy
                      </Button>
                    </div>
                  </div>
                </div>

                <h3 className="font-semibold text-sm mt-4">API Keys</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Payment API Key:</span>
                    <div className="flex gap-2 items-center">
                      <span className="font-mono text-xs">{createSuccess.credentials.payment_api_key.substring(0, 20)}...</span>
                      <Button size="sm" variant="ghost" onClick={() => copyToClipboard(createSuccess.credentials.payment_api_key)}>
                        Copy
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Payout API Key:</span>
                    <div className="flex gap-2 items-center">
                      <span className="font-mono text-xs">{createSuccess.credentials.payout_api_key.substring(0, 20)}...</span>
                      <Button size="sm" variant="ghost" onClick={() => copyToClipboard(createSuccess.credentials.payout_api_key)}>
                        Copy
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button onClick={closeCreateDialog} className="bg-mypay-green hover:bg-mypay-green-dark text-white">
                  Done
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <form onSubmit={handleCreateMerchant}>
              <div className="space-y-4">
                {createError && (
                  <Alert variant="destructive">
                    <X className="h-4 w-4" />
                    <AlertDescription>{createError}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={createData.email}
                    onChange={(e) => setCreateData({ ...createData, email: e.target.value })}
                    placeholder="merchant@example.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Contact Name *</Label>
                  <Input
                    id="name"
                    value={createData.name}
                    onChange={(e) => setCreateData({ ...createData, name: e.target.value })}
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company_name">Company Name</Label>
                  <Input
                    id="company_name"
                    value={createData.company_name}
                    onChange={(e) => setCreateData({ ...createData, company_name: e.target.value })}
                    placeholder="Example Company Ltd"
                  />
                  <p className="text-xs text-muted-foreground">Leave empty to use contact name</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="webhookUrl">Webhook URL</Label>
                  <Input
                    id="webhookUrl"
                    type="url"
                    value={createData.webhookUrl}
                    onChange={(e) => setCreateData({ ...createData, webhookUrl: e.target.value })}
                    placeholder="https://example.com/webhook"
                  />
                </div>
              </div>

              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={creating}
                  className="bg-mypay-green hover:bg-mypay-green-dark text-white"
                >
                  {creating ? 'Creating...' : 'Create Merchant'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Merchant Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Merchant</DialogTitle>
            <DialogDescription>
              Update merchant details
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditMerchant}>
            <div className="space-y-4">
              {editError && (
                <Alert variant="destructive">
                  <X className="h-4 w-4" />
                  <AlertDescription>{editError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="edit-name">Contact Name</Label>
                <Input
                  id="edit-name"
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-company">Company Name</Label>
                <Input
                  id="edit-company"
                  value={editData.company_name}
                  onChange={(e) => setEditData({ ...editData, company_name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-webhook">Webhook URL</Label>
                <Input
                  id="edit-webhook"
                  type="url"
                  value={editData.webhookUrl}
                  onChange={(e) => setEditData({ ...editData, webhookUrl: e.target.value })}
                  placeholder="https://example.com/webhook"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <select
                  id="edit-status"
                  value={editData.status}
                  onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={editing}
                className="bg-mypay-green hover:bg-mypay-green-dark text-white"
              >
                {editing ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  )
}
