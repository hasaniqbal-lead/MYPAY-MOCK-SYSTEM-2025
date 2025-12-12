'use client'

import { useEffect, useState } from 'react'
import { merchantAPI } from '@/lib/api'
import Layout from '@/components/Layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Copy, Eye, EyeOff, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function CredentialsPage() {
  const [credentials, setCredentials] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showKeys, setShowKeys] = useState(false)
  const [copied, setCopied] = useState(false)
  const router = useRouter()

  useEffect(() => {
    loadCredentials()
  }, [])

  const loadCredentials = async () => {
    try {
      const data = await merchantAPI.getCredentials()
      setCredentials(data)
    } catch (error) {
      console.error('Failed to load credentials:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateNew = async () => {
    try {
      await merchantAPI.generateApiKey()
      await loadCredentials()
    } catch (error) {
      console.error('Failed to generate new key:', error)
      alert('Failed to generate new key. Please try again.')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const maskKey = (key: string) => {
    if (!key) return ''
    return key.length > 8 ? `${key.substring(0, 4)}${'•'.repeat(key.length - 8)}${key.substring(key.length - 4)}` : key
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.back()}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-foreground">API Keys</h1>
            <p className="text-muted-foreground">Manage your API keys for secure integration</p>
          </div>
          <Button className="gap-2 bg-mypay-green hover:bg-mypay-green-dark" onClick={handleGenerateNew}>
            <Plus className="h-4 w-4" />
            Create New Key
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mypay-green"></div>
          </div>
        ) : credentials ? (
          <Card className="shadow-elevation">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-foreground">Your API Keys</CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowKeys(!showKeys)}
                className="gap-2"
              >
                {showKeys ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showKeys ? 'Hide' : 'Show'} Keys
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Single API Key - Works for both APIs */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">API Key</span>
                      <Badge variant="default" className="bg-mypay-green text-white">
                        Active
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mb-2">
                      Use this key for both Payment and Payout API requests
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Created: {new Date(credentials.createdAt || Date.now()).toLocaleDateString()}
                    </div>
                    <div className="font-mono text-sm bg-muted p-2 rounded text-foreground mt-2">
                      {showKeys ? (credentials.apiKey || 'N/A') : '••••••••••••••••••••••••••••••••'}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => copyToClipboard(credentials.apiKey || '')}>
                    <Copy className="h-4 w-4" />
                    Copy
                  </Button>
                </div>

                {/* Merchant ID */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1 flex-1">
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      Merchant ID:
                    </div>
                    <div className="text-xs text-muted-foreground mb-2">
                      Your unique merchant identifier
                    </div>
                    <div className="font-mono text-sm bg-muted p-2 rounded text-foreground">
                      {credentials.merchantId || credentials.vendorId || 'N/A'}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => copyToClipboard(credentials.merchantId || credentials.vendorId || '')}>
                    <Copy className="h-4 w-4" />
                    Copy
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            No credentials found
          </div>
        )}
      </div>
    </Layout>
  )
}
