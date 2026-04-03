'use client'

import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Loader2, Power, Trash2, Copy, Check, Users } from 'lucide-react'
import { format } from 'date-fns'
import Cookies from 'js-cookie'

interface TeamMember {
  id: number; name: string; email: string; role: string; isActive: boolean; createdAt: string
}

const roleBadge = (role: string) => {
  const c: Record<string, string> = { admin: 'bg-blue-100 text-blue-700', viewer: 'bg-gray-100 text-gray-700', accountant: 'bg-purple-100 text-purple-700' }
  return <Badge className={c[role] || 'bg-gray-100'} variant="outline">{role}</Badge>
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [role, setRole] = useState('viewer')
  const [creating, setCreating] = useState(false)
  const [newCreds, setNewCreds] = useState<{ email: string; password: string } | null>(null)
  const [copied, setCopied] = useState('')

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || ''
  const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${Cookies.get('auth_token')}` })

  const load = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/v1/portal/team`, { headers: headers() })
      const data = await res.json()
      if (data.success) setMembers(data.members || [])
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    if (!name.trim()) return
    setCreating(true); setNewCreds(null)
    try {
      const res = await fetch(`${apiUrl}/api/v1/portal/team`, {
        method: 'POST', headers: headers(),
        body: JSON.stringify({ name: name.trim(), role }),
      })
      const data = await res.json()
      if (data.success) {
        setNewCreds(data.credentials)
        setName(''); load()
      } else { alert(data.error) }
    } catch {} finally { setCreating(false) }
  }

  const toggle = async (id: number, isActive: boolean) => {
    await fetch(`${apiUrl}/api/v1/portal/team/${id}`, {
      method: 'PUT', headers: headers(),
      body: JSON.stringify({ isActive: !isActive }),
    }); load()
  }

  const remove = async (id: number) => {
    if (!confirm('Remove this team member?')) return
    await fetch(`${apiUrl}/api/v1/portal/team/${id}`, { method: 'DELETE', headers: headers() }); load()
  }

  const copy = (t: string, f: string) => { navigator.clipboard.writeText(t); setCopied(f); setTimeout(() => setCopied(''), 1500) }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Users className="h-6 w-6" /> Team</h1>
            <p className="text-muted-foreground text-sm">Manage team members and access roles</p>
          </div>
          <Button className="bg-darpay-primary hover:bg-darpay-primary-dark text-white gap-2" onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4" /> Add Member
          </Button>
        </div>

        {/* Add member form */}
        {showForm && (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Name</Label>
                  <Input placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div>
                  <Label>Role</Label>
                  <select value={role} onChange={e => setRole(e.target.value)} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                    <option value="admin">Admin</option>
                    <option value="viewer">Viewer</option>
                    <option value="accountant">Accountant</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <Button onClick={handleCreate} disabled={creating || !name.trim()} className="bg-darpay-primary text-white w-full">
                    {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Create
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Email and password will be auto-generated. Credentials are shown once after creation.</p>

              {/* Show credentials once */}
              {newCreds && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-2">
                  <p className="text-sm font-semibold text-green-800">Member created! Save these credentials — they won't be shown again.</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-16">Email:</span>
                    <code className="text-sm flex-1">{newCreds.email}</code>
                    <button onClick={() => copy(newCreds.email, 'email')} className="p-1">{copied === 'email' ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}</button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-16">Password:</span>
                    <code className="text-sm flex-1 font-bold">{newCreds.password}</code>
                    <button onClick={() => copy(newCreds.password, 'pass')} className="p-1">{copied === 'pass' ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}</button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Team list */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{members.length} Team Member{members.length !== 1 ? 's' : ''}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead><TableHead>Joined</TableHead><TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.length > 0 ? members.map(m => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{m.email}</TableCell>
                      <TableCell>{roleBadge(m.role)}</TableCell>
                      <TableCell><Badge variant={m.isActive ? 'default' : 'secondary'} className={m.isActive ? 'bg-green-500 text-white text-[10px]' : 'text-[10px]'}>{m.isActive ? 'Active' : 'Disabled'}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{format(new Date(m.createdAt), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggle(m.id, m.isActive)} title={m.isActive ? 'Disable' : 'Enable'}>
                            <Power className={`h-3.5 w-3.5 ${m.isActive ? 'text-green-500' : 'text-gray-400'}`} />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => remove(m.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No team members yet</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
