'use client'

import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Upload, Loader2, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'
import Cookies from 'js-cookie'

const statusColors: Record<string, string> = { pending: 'bg-yellow-100 text-yellow-700', approved: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700' }

export default function DocumentsPage() {
  const [docs, setDocs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || ''
  const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${Cookies.get('auth_token')}` })

  const load = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/v1/portal/documents`, { headers: headers() })
      const data = await res.json()
      if (data.success) setDocs(data.documents || [])
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const policies = docs.filter(d => d.uploaded_by === 'admin' && d.status === 'approved')
  const requests = docs.filter(d => d.uploaded_by === 'admin' && d.status === 'pending' && d.required)
  const myUploads = docs.filter(d => d.uploaded_by === 'merchant')

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><FileText className="h-6 w-6" /> Documents</h1>
          <p className="text-muted-foreground text-sm">View shared documents and upload requested files</p>
        </div>

        {loading ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div> : (
          <>
            {/* Upload Requests */}
            {requests.length > 0 && (
              <Card className="border-yellow-200">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Upload className="h-4 w-4 text-yellow-500" />
                    Action Required — Upload Requested
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {requests.map(d => (
                    <div key={d.id} className="p-3 border border-yellow-200 rounded-lg bg-yellow-50/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{d.title}</p>
                          {d.description && <p className="text-xs text-muted-foreground mt-1">{d.description}</p>}
                        </div>
                        {d.upload_token && (
                          <a href={`${apiUrl}/api/v1/upload/${d.upload_token}`} target="_blank">
                            <Button size="sm" className="bg-yellow-500 hover:bg-yellow-600 text-white gap-1">
                              <Upload className="h-3 w-3" /> Upload
                            </Button>
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Shared Documents */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Shared Documents</CardTitle>
              </CardHeader>
              <CardContent>
                {policies.length > 0 ? (
                  <div className="space-y-2">
                    {policies.map(d => (
                      <div key={d.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{d.title}</p>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline" className="capitalize text-[10px]">{d.type}</Badge>
                            <span className="text-[10px] text-muted-foreground">{format(new Date(d.created_at), 'MMM dd, yyyy')}</span>
                          </div>
                        </div>
                        {d.file_url && (
                          <a href={d.file_url} target="_blank">
                            <Button variant="outline" size="sm" className="gap-1"><ExternalLink className="h-3 w-3" /> View</Button>
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : <p className="text-center py-6 text-muted-foreground text-sm">No shared documents</p>}
              </CardContent>
            </Card>

            {/* My Uploads */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">My Uploads</CardTitle>
              </CardHeader>
              <CardContent>
                {myUploads.length > 0 ? (
                  <div className="space-y-2">
                    {myUploads.map(d => (
                      <div key={d.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{d.title}</p>
                          <span className="text-xs text-muted-foreground">{format(new Date(d.created_at), 'MMM dd, yyyy')}</span>
                        </div>
                        <Badge className={statusColors[d.status] || ''}>{d.status}</Badge>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-center py-6 text-muted-foreground text-sm">No uploads yet</p>}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </Layout>
  )
}
