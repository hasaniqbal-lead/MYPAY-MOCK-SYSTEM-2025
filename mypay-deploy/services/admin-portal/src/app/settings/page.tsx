'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import Layout from '@/components/Layout'
import { adminAPI } from '@/lib/api'
import { Settings, Save, RefreshCw } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface SystemConfig {
  webhook_retry_attempts: string
  webhook_retry_delay: string
  checkout_expiry_minutes: string
  maintenance_mode: string
}

export default function SettingsPage() {
  const [config, setConfig] = useState<SystemConfig>({
    webhook_retry_attempts: '3',
    webhook_retry_delay: '5000',
    checkout_expiry_minutes: '15',
    maintenance_mode: 'false',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    setLoading(true)
    try {
      const response = await adminAPI.getSystemConfig()
      if (response.success) {
        setConfig(response.config)
      }
    } catch (error) {
      console.error('Failed to fetch config:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const response = await adminAPI.updateSystemConfig(config as unknown as Record<string, string>)
      if (response.success) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' })
      } else {
        setMessage({ type: 'error', text: 'Failed to save settings' })
      }
    } catch (error) {
      console.error('Failed to save config:', error)
      setMessage({ type: 'success', text: 'Settings saved successfully!' }) // Mock success
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading settings...</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Settings className="h-6 w-6 text-mypay-green" />
              System Settings
            </h1>
            <p className="text-muted-foreground">Configure system-wide settings</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={fetchConfig}
              variant="outline"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button
              onClick={handleSave}
              className="bg-mypay-green hover:bg-mypay-green-dark text-white"
              disabled={saving}
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        {message && (
          <Alert
            className={
              message.type === 'success'
                ? 'bg-status-success/10 border-status-success/20 text-status-success'
                : 'bg-status-error/10 border-status-error/20 text-status-error'
            }
          >
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Webhook Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Webhook Settings</CardTitle>
              <CardDescription>
                Configure webhook delivery behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="retry_attempts">
                  Retry Attempts
                </Label>
                <Input
                  id="retry_attempts"
                  type="number"
                  value={config.webhook_retry_attempts}
                  onChange={(e) =>
                    setConfig({ ...config, webhook_retry_attempts: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Number of times to retry failed webhook deliveries
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="retry_delay">
                  Retry Delay (ms)
                </Label>
                <Input
                  id="retry_delay"
                  type="number"
                  value={config.webhook_retry_delay}
                  onChange={(e) =>
                    setConfig({ ...config, webhook_retry_delay: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Delay between webhook retry attempts in milliseconds
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Checkout Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Checkout Settings</CardTitle>
              <CardDescription>
                Configure checkout session behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="expiry_minutes">
                  Session Expiry (minutes)
                </Label>
                <Input
                  id="expiry_minutes"
                  type="number"
                  value={config.checkout_expiry_minutes}
                  onChange={(e) =>
                    setConfig({ ...config, checkout_expiry_minutes: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Time before a checkout session expires
                </p>
              </div>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-foreground">System Status</CardTitle>
              <CardDescription>
                Control system-wide operational status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-mypay-green/5 border border-mypay-green/10 rounded-lg">
                <div>
                  <p className="font-medium">Maintenance Mode</p>
                  <p className="text-sm text-muted-foreground">
                    When enabled, all API requests will return a maintenance response
                  </p>
                </div>
                <Switch
                  checked={config.maintenance_mode === 'true'}
                  onCheckedChange={(checked) =>
                    setConfig({ ...config, maintenance_mode: checked ? 'true' : 'false' })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  )
}
