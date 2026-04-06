'use client'

import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Power, Trash2, Loader2, RefreshCw, Users, Shield, CreditCard, Bell, Activity, Send } from 'lucide-react'
import { format } from 'date-fns'
import Cookies from 'js-cookie'

export default function OperationsPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || ''
  const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${Cookies.get('admin_token')}` })

  // === ADMIN USERS ===
  const [admins, setAdmins] = useState<any[]>([])
  const [adminLoading, setAdminLoading] = useState(true)
  const [newAdmin, setNewAdmin] = useState({ email: '', name: '', password: '', role: 'admin' })
  const [showAdminForm, setShowAdminForm] = useState(false)

  const loadAdmins = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/v1/admin/users`, { headers: headers() })
      const data = await res.json()
      if (data.success) setAdmins(data.admins || [])
    } catch {} finally { setAdminLoading(false) }
  }

  const createAdmin = async () => {
    if (!newAdmin.email || !newAdmin.name || !newAdmin.password) return
    try {
      const res = await fetch(`${apiUrl}/api/v1/admin/users`, { method: 'POST', headers: headers(), body: JSON.stringify(newAdmin) })
      const data = await res.json()
      if (data.success) { setShowAdminForm(false); setNewAdmin({ email: '', name: '', password: '', role: 'admin' }); loadAdmins() }
      else alert(data.error)
    } catch {}
  }

  const toggleAdmin = async (id: number) => {
    await fetch(`${apiUrl}/api/v1/admin/users/${id}/toggle`, { method: 'POST', headers: headers() }); loadAdmins()
  }

  const resetAdminPw = async (id: number) => {
    if (!confirm('Reset password for this admin?')) return
    try {
      const res = await fetch(`${apiUrl}/api/v1/admin/users/${id}/reset-password`, { method: 'POST', headers: headers() })
      const data = await res.json()
      if (data.success) alert(`New password for ${data.email}:\n\n${data.password}\n\nCopy it now!`)
      else alert(data.error)
    } catch {}
  }

  // === BLACKLIST ===
  const [blacklist, setBlacklist] = useState<any[]>([])
  const [blLoading, setBlLoading] = useState(true)
  const [blType, setBlType] = useState('all')
  const [newBl, setNewBl] = useState({ type: 'phone', value: '', reason: '' })
  const [showBlForm, setShowBlForm] = useState(false)

  const loadBlacklist = async () => {
    try {
      const url = blType === 'all' ? `${apiUrl}/api/v1/admin/blacklist` : `${apiUrl}/api/v1/admin/blacklist?type=${blType}`
      const res = await fetch(url, { headers: headers() })
      const data = await res.json()
      if (data.success) setBlacklist(data.entries || [])
    } catch {} finally { setBlLoading(false) }
  }

  const addToBlacklist = async () => {
    if (!newBl.value) return
    const res = await fetch(`${apiUrl}/api/v1/admin/blacklist`, { method: 'POST', headers: headers(), body: JSON.stringify(newBl) })
    const data = await res.json()
    if (data.success) { setShowBlForm(false); setNewBl({ type: 'phone', value: '', reason: '' }); loadBlacklist() }
    else alert(data.error)
  }

  const removeFromBlacklist = async (id: number) => {
    await fetch(`${apiUrl}/api/v1/admin/blacklist/${id}`, { method: 'DELETE', headers: headers() }); loadBlacklist()
  }

  // === METHODS ===
  const [methods, setMethods] = useState<any[]>([])
  const [methodsLoading, setMethodsLoading] = useState(true)

  const loadMethods = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/v1/admin/methods`, { headers: headers() })
      const data = await res.json()
      if (data.success) setMethods(data.methods || [])
    } catch {} finally { setMethodsLoading(false) }
  }

  const toggleMethod = async (id: number, isEnabled: boolean) => {
    await fetch(`${apiUrl}/api/v1/admin/methods/${id}`, { method: 'PUT', headers: headers(), body: JSON.stringify({ isEnabled: !isEnabled }) })
    loadMethods()
  }

  const updateMethodLimits = async (id: number, min: number, max: number) => {
    await fetch(`${apiUrl}/api/v1/admin/methods/${id}`, { method: 'PUT', headers: headers(), body: JSON.stringify({ minAmount: min, maxAmount: max }) })
    loadMethods()
  }

  // === NOTIFICATIONS ===
  const [notifications, setNotifications] = useState<any[]>([])
  const [notifLoading, setNotifLoading] = useState(true)
  const [newNotif, setNewNotif] = useState({ type: 'info', title: '', message: '', target: 'all' })
  const [showNotifForm, setShowNotifForm] = useState(false)

  const loadNotifications = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/v1/admin/notifications`, { headers: headers() })
      const data = await res.json()
      if (data.success) setNotifications(data.notifications || [])
    } catch {} finally { setNotifLoading(false) }
  }

  const sendNotification = async () => {
    if (!newNotif.title || !newNotif.message) return
    const res = await fetch(`${apiUrl}/api/v1/admin/notifications`, { method: 'POST', headers: headers(), body: JSON.stringify(newNotif) })
    const data = await res.json()
    if (data.success) { setShowNotifForm(false); setNewNotif({ type: 'info', title: '', message: '', target: 'all' }); loadNotifications() }
  }

  // === ACTIVITY LOGS ===
  const [logs, setLogs] = useState<any[]>([])
  const [logsLoading, setLogsLoading] = useState(true)

  const loadLogs = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/v1/admin/activity-logs`, { headers: headers() })
      const data = await res.json()
      if (data.success) setLogs(data.logs || [])
    } catch {} finally { setLogsLoading(false) }
  }

  useEffect(() => { loadAdmins(); loadBlacklist(); loadMethods(); loadNotifications(); loadLogs() }, [])
  useEffect(() => { loadBlacklist() }, [blType])

  const typeColors: Record<string, string> = { info: 'bg-blue-100 text-blue-700', warning: 'bg-yellow-100 text-yellow-700', alert: 'bg-red-100 text-red-700', maintenance: 'bg-purple-100 text-purple-700' }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Operations Center</h1>
          <p className="text-muted-foreground text-sm">Manage admin users, blacklists, payment methods, and notifications</p>
        </div>

        <Tabs defaultValue="admins">
          <TabsList className="flex flex-wrap gap-1">
            <TabsTrigger value="admins" className="gap-1"><Users className="h-3 w-3" /> Admin Users</TabsTrigger>
            <TabsTrigger value="methods" className="gap-1"><CreditCard className="h-3 w-3" /> Methods</TabsTrigger>
            <TabsTrigger value="blacklist" className="gap-1"><Shield className="h-3 w-3" /> Blacklist</TabsTrigger>
            <TabsTrigger value="notifications" className="gap-1"><Bell className="h-3 w-3" /> Notifications</TabsTrigger>
            <TabsTrigger value="logs" className="gap-1"><Activity className="h-3 w-3" /> Logs</TabsTrigger>
          </TabsList>

          {/* ADMIN USERS TAB */}
          <TabsContent value="admins" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Admin Users</h2>
              <Button size="sm" onClick={() => setShowAdminForm(!showAdminForm)} className="gap-2 bg-darpay-primary text-white"><Plus className="h-4 w-4" /> Add Admin</Button>
            </div>
            {showAdminForm && (
              <Card><CardContent className="pt-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Name</Label><Input value={newAdmin.name} onChange={e => setNewAdmin({ ...newAdmin, name: e.target.value })} /></div>
                  <div><Label>Email</Label><Input value={newAdmin.email} onChange={e => setNewAdmin({ ...newAdmin, email: e.target.value })} /></div>
                  <div><Label>Password</Label><Input type="password" value={newAdmin.password} onChange={e => setNewAdmin({ ...newAdmin, password: e.target.value })} /></div>
                  <div><Label>Role</Label>
                    <select value={newAdmin.role} onChange={e => setNewAdmin({ ...newAdmin, role: e.target.value })} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                      <option value="super_admin">Super Admin</option><option value="admin">Admin</option><option value="operations">Operations</option><option value="support">Support</option><option value="viewer">Viewer</option>
                    </select>
                  </div>
                </div>
                <Button onClick={createAdmin} className="bg-darpay-primary text-white">Create Admin</Button>
              </CardContent></Card>
            )}
            <Card><CardContent className="p-0">
              {adminLoading ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div> : (
                <Table><TableHeader><TableRow>
                  <TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead><TableHead>Joined</TableHead><TableHead>Actions</TableHead>
                </TableRow></TableHeader><TableBody>
                  {admins.map(a => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{a.email}</TableCell>
                      <TableCell><Badge variant="outline" className="capitalize">{a.role}</Badge></TableCell>
                      <TableCell><Badge className={a.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>{a.isActive ? 'Active' : 'Disabled'}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{format(new Date(a.createdAt), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleAdmin(a.id)} title={a.isActive ? 'Disable' : 'Enable'}><Power className={`h-4 w-4 ${a.isActive ? 'text-green-500' : 'text-gray-400'}`} /></Button>
                          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => resetAdminPw(a.id)}>Reset PW</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {admins.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No admin users</TableCell></TableRow>}
                </TableBody></Table>
              )}
            </CardContent></Card>
          </TabsContent>

          {/* METHODS TAB */}
          <TabsContent value="methods" className="space-y-4">
            <h2 className="text-lg font-semibold">Payment Method Controls</h2>
            <div className="grid gap-4">
              {methods.map(m => (
                <Card key={m.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{m.displayName}</span>
                        <span className="text-xs text-muted-foreground ml-2">({m.method})</span>
                      </div>
                      <Button variant={m.isEnabled ? 'default' : 'outline'} size="sm" onClick={() => toggleMethod(m.id, m.isEnabled)}
                        className={m.isEnabled ? 'bg-green-500 text-white' : ''}>{m.isEnabled ? 'Enabled' : 'Disabled'}</Button>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mt-3">
                      <div><Label className="text-xs">Min (PKR)</Label><Input type="number" defaultValue={m.minAmount} onBlur={e => updateMethodLimits(m.id, Number(e.target.value), m.maxAmount)} /></div>
                      <div><Label className="text-xs">Max (PKR)</Label><Input type="number" defaultValue={m.maxAmount} onBlur={e => updateMethodLimits(m.id, m.minAmount, Number(e.target.value))} /></div>
                      <div><Label className="text-xs">Daily Limit</Label><Input type="number" defaultValue={m.dailyLimit || ''} placeholder="No limit" /></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* BLACKLIST TAB */}
          <TabsContent value="blacklist" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Blacklist</h2>
              <Button size="sm" onClick={() => setShowBlForm(!showBlForm)} className="gap-2 bg-darpay-primary text-white"><Plus className="h-4 w-4" /> Add Entry</Button>
            </div>
            <div className="flex gap-2">
              {['all', 'phone', 'email', 'ip', 'merchant'].map(t => (
                <Button key={t} variant={blType === t ? 'default' : 'outline'} size="sm" onClick={() => setBlType(t)} className="capitalize">{t}</Button>
              ))}
            </div>
            {showBlForm && (
              <Card><CardContent className="pt-4 space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div><Label>Type</Label>
                    <select value={newBl.type} onChange={e => setNewBl({ ...newBl, type: e.target.value })} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                      <option value="phone">Phone</option><option value="email">Email</option><option value="ip">IP Address</option><option value="merchant">Merchant</option>
                    </select>
                  </div>
                  <div><Label>Value</Label><Input placeholder="03001234567" value={newBl.value} onChange={e => setNewBl({ ...newBl, value: e.target.value })} /></div>
                  <div><Label>Reason</Label><Input placeholder="Suspicious activity" value={newBl.reason} onChange={e => setNewBl({ ...newBl, reason: e.target.value })} /></div>
                </div>
                <Button onClick={addToBlacklist} className="bg-red-500 text-white">Block</Button>
              </CardContent></Card>
            )}
            <Card><CardContent className="p-0">
              <Table><TableHeader><TableRow>
                <TableHead>Type</TableHead><TableHead>Value</TableHead><TableHead>Reason</TableHead><TableHead>Added</TableHead><TableHead>Actions</TableHead>
              </TableRow></TableHeader><TableBody>
                {blacklist.map(b => (
                  <TableRow key={b.id}>
                    <TableCell><Badge variant="outline" className="capitalize">{b.type}</Badge></TableCell>
                    <TableCell className="font-mono text-sm">{b.value}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{b.reason || '—'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{format(new Date(b.created_at), 'MMM dd, yyyy')}</TableCell>
                    <TableCell><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeFromBlacklist(b.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                  </TableRow>
                ))}
                {blacklist.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No blacklist entries</TableCell></TableRow>}
              </TableBody></Table>
            </CardContent></Card>
          </TabsContent>

          {/* NOTIFICATIONS TAB */}
          <TabsContent value="notifications" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Notifications</h2>
              <Button size="sm" onClick={() => setShowNotifForm(!showNotifForm)} className="gap-2 bg-darpay-primary text-white"><Send className="h-4 w-4" /> Send Notification</Button>
            </div>
            {showNotifForm && (
              <Card><CardContent className="pt-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Type</Label>
                    <select value={newNotif.type} onChange={e => setNewNotif({ ...newNotif, type: e.target.value })} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                      <option value="info">Info</option><option value="warning">Warning</option><option value="alert">Alert</option><option value="maintenance">Maintenance</option>
                    </select>
                  </div>
                  <div><Label>Target</Label><Input placeholder="all (or merchant ID)" value={newNotif.target} onChange={e => setNewNotif({ ...newNotif, target: e.target.value })} /></div>
                </div>
                <div><Label>Title</Label><Input value={newNotif.title} onChange={e => setNewNotif({ ...newNotif, title: e.target.value })} /></div>
                <div><Label>Message</Label><textarea value={newNotif.message} onChange={e => setNewNotif({ ...newNotif, message: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px] resize-none" /></div>
                <Button onClick={sendNotification} className="bg-darpay-primary text-white">Send</Button>
              </CardContent></Card>
            )}
            <Card><CardContent className="p-0">
              <div className="divide-y">
                {notifications.map(n => (
                  <div key={n.id} className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={typeColors[n.type] || ''}>{n.type}</Badge>
                      <span className="font-medium text-sm">{n.title}</span>
                      <span className="text-[10px] text-muted-foreground ml-auto">{format(new Date(n.created_at), 'MMM dd, HH:mm')}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{n.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Target: {n.target} | Sent by: {n.sent_by}</p>
                  </div>
                ))}
                {notifications.length === 0 && <p className="text-center py-8 text-muted-foreground">No notifications sent yet</p>}
              </div>
            </CardContent></Card>
          </TabsContent>

          {/* ACTIVITY LOGS TAB */}
          <TabsContent value="logs" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Activity Logs</h2>
              <Button variant="outline" size="sm" onClick={loadLogs} className="gap-2"><RefreshCw className="h-4 w-4" /> Refresh</Button>
            </div>
            <Card><CardContent className="p-0">
              <Table><TableHeader><TableRow>
                <TableHead>Admin</TableHead><TableHead>Action</TableHead><TableHead>Entity</TableHead><TableHead>Details</TableHead><TableHead>Time</TableHead>
              </TableRow></TableHeader><TableBody>
                {logs.map(l => (
                  <TableRow key={l.id}>
                    <TableCell className="text-sm">{l.admin_email || '—'}</TableCell>
                    <TableCell><Badge variant="outline" className="capitalize">{l.action}</Badge></TableCell>
                    <TableCell className="text-sm">{l.entity_type} #{l.entity_id}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{JSON.stringify(l.details)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{format(new Date(l.created_at), 'MMM dd, HH:mm')}</TableCell>
                  </TableRow>
                ))}
                {logs.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No activity logs yet</TableCell></TableRow>}
              </TableBody></Table>
            </CardContent></Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  )
}
