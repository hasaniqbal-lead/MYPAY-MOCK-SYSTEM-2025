'use client'

import { useState, useEffect } from 'react'
import { paymentPageAPI } from '@/lib/api'
import Layout from '@/components/Layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  ArrowLeft,
  Palette,
  Type,
  Layout as LayoutIcon,
  CreditCard,
  FileText,
  CheckCircle,
  Save,
  Eye,
  Plus,
  Trash2,
  Lock,
  RefreshCw
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface PaymentPageConfig {
  id: number
  name: string
  description?: string
  isDefault: boolean
  isActive: boolean
  branding: {
    merchantLogo?: string
    merchantName: string
    favicon?: string
    showMerchantName: boolean
  }
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    surface: string
    text: { primary: string; secondary: string }
    success: string
    error: string
    warning: string
  }
  typography: {
    fontFamily: string
    headingSize: string
    bodySize: string
  }
  layout: {
    type: 'centered' | 'split' | 'minimal'
    containerMaxWidth: string
    padding: string
    borderRadius: string
  }
  channels: {
    enabled: string[]
    order: string[]
    displayStyle: 'list' | 'grid'
    showLogos: boolean
    showLabels: boolean
  }
  text: {
    labels: Record<string, string>
    placeholders: Record<string, string>
    messages: Record<string, string>
    buttons: Record<string, string>
  }
  legal: {
    showTerms: boolean
    termsUrl?: string
    showPrivacy: boolean
    privacyUrl?: string
    showRefund: boolean
    refundUrl?: string
    customFooterText?: string
  }
  resultPages: {
    success: {
      message: string
      submessage?: string
      showConfetti: boolean
      showTransactionId: boolean
      ctaText?: string
      ctaUrl?: string
      autoRedirect: boolean
      autoRedirectDelay: number
    }
    failure: {
      message: string
      submessage?: string
      showRetry: boolean
      showSupport: boolean
      supportEmail?: string
      supportPhone?: string
    }
  }
  advanced: {
    showPoweredBy: boolean
    customCSS?: string
  }
  createdAt: string
}

interface Template {
  id: number
  name: string
  slug: string
  category: string
  description: string
  isFeatured: boolean
}

interface Rules {
  locked: Record<string, unknown>
  required: string[]
  restricted: Record<string, unknown>
}

const defaultConfig: Partial<PaymentPageConfig> = {
  branding: {
    merchantName: '',
    showMerchantName: true,
  },
  colors: {
    primary: '#10B981',
    secondary: '#6366F1',
    accent: '#F59E0B',
    background: '#0F172A',
    surface: '#1E293B',
    text: { primary: '#F8FAFC', secondary: '#94A3B8' },
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
  },
  typography: {
    fontFamily: 'Inter',
    headingSize: 'text-2xl',
    bodySize: 'text-base',
  },
  layout: {
    type: 'centered',
    containerMaxWidth: '480px',
    padding: '24px',
    borderRadius: '16px',
  },
  channels: {
    enabled: ['easypaisa', 'jazzcash', 'card', 'bank'],
    order: ['easypaisa', 'jazzcash', 'card', 'bank'],
    displayStyle: 'list',
    showLogos: true,
    showLabels: true,
  },
  text: {
    labels: {
      phoneNumber: 'Phone Number',
      accountNumber: 'Account Number',
    },
    placeholders: {
      phoneNumber: '03XX XXXXXXX',
    },
    messages: {
      success: 'Payment Successful!',
      failure: 'Payment Failed',
      expired: 'Session Expired',
    },
    buttons: {
      pay: 'Pay Now',
      retry: 'Try Again',
      cancel: 'Cancel',
    },
  },
  legal: {
    showTerms: true,
    showPrivacy: true,
    showRefund: false,
  },
  resultPages: {
    success: {
      message: 'Payment Successful!',
      showConfetti: true,
      showTransactionId: true,
      autoRedirect: false,
      autoRedirectDelay: 5,
    },
    failure: {
      message: 'Payment Failed',
      showRetry: true,
      showSupport: true,
    },
  },
  advanced: {
    showPoweredBy: true,
  },
}

export default function PaymentPageSettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [configs, setConfigs] = useState<PaymentPageConfig[]>([])
  const [selectedConfigId, setSelectedConfigId] = useState<number | null>(null)
  const [config, setConfig] = useState<Partial<PaymentPageConfig>>(defaultConfig)
  const [templates, setTemplates] = useState<Template[]>([])
  const [rules, setRules] = useState<Rules>({ locked: {}, required: [], restricted: {} })
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [newConfigName, setNewConfigName] = useState('')

  // Load initial data
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [configsRes, templatesRes, rulesRes] = await Promise.all([
        paymentPageAPI.listConfigs(),
        paymentPageAPI.listTemplates(),
        paymentPageAPI.getRules(),
      ])

      setConfigs(configsRes.configs || [])
      setTemplates(templatesRes.templates || [])
      setRules(rulesRes.rules || { locked: {}, required: [], restricted: {} })

      // Load the default/active config if exists
      const activeConfig = configsRes.configs?.find((c: PaymentPageConfig) => c.isActive)
      if (activeConfig) {
        setSelectedConfigId(activeConfig.id)
        setConfig(activeConfig)
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConfigSelect = async (configId: number) => {
    const selected = configs.find(c => c.id === configId)
    if (selected) {
      setSelectedConfigId(configId)
      setConfig(selected)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      if (selectedConfigId) {
        await paymentPageAPI.updateConfig(selectedConfigId, config)
        setMessage({ type: 'success', text: 'Configuration saved successfully!' })
      } else {
        const result = await paymentPageAPI.createConfig({
          name: newConfigName || 'New Configuration',
          ...config,
        })
        setSelectedConfigId(result.config.id)
        setMessage({ type: 'success', text: 'Configuration created successfully!' })
      }
      await loadData()
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to save configuration'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleActivate = async () => {
    if (!selectedConfigId) return
    setSaving(true)
    try {
      await paymentPageAPI.activateConfig(selectedConfigId)
      setMessage({ type: 'success', text: 'Configuration activated!' })
      await loadData()
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to activate configuration'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedConfigId) return
    if (!confirm('Are you sure you want to delete this configuration?')) return

    setSaving(true)
    try {
      await paymentPageAPI.deleteConfig(selectedConfigId)
      setSelectedConfigId(null)
      setConfig(defaultConfig)
      setMessage({ type: 'success', text: 'Configuration deleted!' })
      await loadData()
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to delete configuration'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCreateFromTemplate = async (templateId: number) => {
    setSaving(true)
    try {
      const result = await paymentPageAPI.createFromTemplate({
        templateId,
        name: newConfigName || `Config from Template ${templateId}`,
      })
      setSelectedConfigId(result.config.id)
      setConfig(result.config)
      setShowTemplateModal(false)
      setMessage({ type: 'success', text: 'Configuration created from template!' })
      await loadData()
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to create from template'
      })
    } finally {
      setSaving(false)
    }
  }

  const isFieldLocked = (path: string): boolean => {
    return !!rules.locked[path]
  }

  const updateConfig = (path: string, value: unknown) => {
    if (isFieldLocked(path)) return

    const parts = path.split('.')
    setConfig(prev => {
      const newConfig = { ...prev }
      let current: any = newConfig

      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) {
          current[parts[i]] = {}
        }
        current[parts[i]] = { ...current[parts[i]] }
        current = current[parts[i]]
      }

      current[parts[parts.length - 1]] = value
      return newConfig
    })
  }

  const LockedIndicator = ({ path }: { path: string }) => {
    if (!isFieldLocked(path)) return null
    return (
      <span className="ml-2 text-muted-foreground" title="This field is locked by admin">
        <Lock className="h-3 w-3 inline" />
      </span>
    )
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-mypay-green" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
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
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Payment Page Customization</h1>
              <p className="text-muted-foreground">Customize your customer payment experience</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowTemplateModal(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              From Template
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="gap-2 bg-mypay-green hover:bg-mypay-green-dark"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-status-success/10 text-status-success border border-status-success/20'
              : 'bg-status-error/10 text-status-error border border-status-error/20'
          }`}>
            {message.text}
          </div>
        )}

        {/* Config Selector */}
        <Card className="shadow-elevation">
          <CardContent className="pt-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label className="text-foreground mb-2 block">Select Configuration</Label>
                <Select
                  value={selectedConfigId?.toString() || ''}
                  onValueChange={(v) => handleConfigSelect(Number(v))}
                >
                  <SelectTrigger className="text-foreground">
                    <SelectValue placeholder="Select a configuration" />
                  </SelectTrigger>
                  <SelectContent>
                    {configs.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        {c.name} {c.isActive && '(Active)'} {c.isDefault && '(Default)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedConfigId && (
                <>
                  <Button
                    variant="outline"
                    onClick={handleActivate}
                    disabled={saving || configs.find(c => c.id === selectedConfigId)?.isActive}
                    className="gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Set Active
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleDelete}
                    disabled={saving}
                    className="gap-2 text-status-error hover:text-status-error"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Main Configuration Tabs */}
        <Tabs defaultValue="branding" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="branding" className="gap-2">
              <Palette className="h-4 w-4" />
              Branding
            </TabsTrigger>
            <TabsTrigger value="colors" className="gap-2">
              <Palette className="h-4 w-4" />
              Colors
            </TabsTrigger>
            <TabsTrigger value="layout" className="gap-2">
              <LayoutIcon className="h-4 w-4" />
              Layout
            </TabsTrigger>
            <TabsTrigger value="channels" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Channels
            </TabsTrigger>
            <TabsTrigger value="text" className="gap-2">
              <Type className="h-4 w-4" />
              Text
            </TabsTrigger>
            <TabsTrigger value="results" className="gap-2">
              <FileText className="h-4 w-4" />
              Results
            </TabsTrigger>
          </TabsList>

          {/* Branding Tab */}
          <TabsContent value="branding">
            <Card className="shadow-elevation">
              <CardHeader>
                <CardTitle className="text-foreground">Branding</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-foreground">
                    Merchant Name
                    <LockedIndicator path="branding.merchantName" />
                  </Label>
                  <Input
                    value={config.branding?.merchantName || ''}
                    onChange={(e) => updateConfig('branding.merchantName', e.target.value)}
                    disabled={isFieldLocked('branding.merchantName')}
                    className="text-foreground"
                    placeholder="Your Business Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">
                    Logo URL
                    <LockedIndicator path="branding.merchantLogo" />
                  </Label>
                  <Input
                    value={config.branding?.merchantLogo || ''}
                    onChange={(e) => updateConfig('branding.merchantLogo', e.target.value)}
                    disabled={isFieldLocked('branding.merchantLogo')}
                    className="text-foreground"
                    placeholder="https://example.com/logo.png"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="font-medium text-foreground">
                      Show Merchant Name
                      <LockedIndicator path="branding.showMerchantName" />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Display your business name on the payment page
                    </div>
                  </div>
                  <Switch
                    checked={config.branding?.showMerchantName ?? true}
                    onCheckedChange={(checked) => updateConfig('branding.showMerchantName', checked)}
                    disabled={isFieldLocked('branding.showMerchantName')}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Colors Tab */}
          <TabsContent value="colors">
            <Card className="shadow-elevation">
              <CardHeader>
                <CardTitle className="text-foreground">Color Scheme</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { key: 'primary', label: 'Primary' },
                    { key: 'secondary', label: 'Secondary' },
                    { key: 'accent', label: 'Accent' },
                    { key: 'background', label: 'Background' },
                    { key: 'surface', label: 'Surface' },
                    { key: 'success', label: 'Success' },
                    { key: 'error', label: 'Error' },
                    { key: 'warning', label: 'Warning' },
                  ].map(({ key, label }) => (
                    <div key={key} className="space-y-2">
                      <Label className="text-foreground">
                        {label}
                        <LockedIndicator path={`colors.${key}`} />
                      </Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={(config.colors as any)?.[key] || '#000000'}
                          onChange={(e) => updateConfig(`colors.${key}`, e.target.value)}
                          disabled={isFieldLocked(`colors.${key}`)}
                          className="h-10 w-16 rounded cursor-pointer"
                        />
                        <Input
                          value={(config.colors as any)?.[key] || ''}
                          onChange={(e) => updateConfig(`colors.${key}`, e.target.value)}
                          disabled={isFieldLocked(`colors.${key}`)}
                          className="text-foreground flex-1"
                          placeholder="#10B981"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-foreground">
                      Primary Text
                      <LockedIndicator path="colors.text.primary" />
                    </Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={config.colors?.text?.primary || '#F8FAFC'}
                        onChange={(e) => updateConfig('colors.text.primary', e.target.value)}
                        disabled={isFieldLocked('colors.text.primary')}
                        className="h-10 w-16 rounded cursor-pointer"
                      />
                      <Input
                        value={config.colors?.text?.primary || ''}
                        onChange={(e) => updateConfig('colors.text.primary', e.target.value)}
                        disabled={isFieldLocked('colors.text.primary')}
                        className="text-foreground flex-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground">
                      Secondary Text
                      <LockedIndicator path="colors.text.secondary" />
                    </Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={config.colors?.text?.secondary || '#94A3B8'}
                        onChange={(e) => updateConfig('colors.text.secondary', e.target.value)}
                        disabled={isFieldLocked('colors.text.secondary')}
                        className="h-10 w-16 rounded cursor-pointer"
                      />
                      <Input
                        value={config.colors?.text?.secondary || ''}
                        onChange={(e) => updateConfig('colors.text.secondary', e.target.value)}
                        disabled={isFieldLocked('colors.text.secondary')}
                        className="text-foreground flex-1"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Layout Tab */}
          <TabsContent value="layout">
            <Card className="shadow-elevation">
              <CardHeader>
                <CardTitle className="text-foreground">Layout Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-foreground">
                    Layout Type
                    <LockedIndicator path="layout.type" />
                  </Label>
                  <Select
                    value={config.layout?.type || 'centered'}
                    onValueChange={(v) => updateConfig('layout.type', v)}
                    disabled={isFieldLocked('layout.type')}
                  >
                    <SelectTrigger className="text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="centered">Centered</SelectItem>
                      <SelectItem value="split">Split</SelectItem>
                      <SelectItem value="minimal">Minimal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-foreground">
                      Container Max Width
                      <LockedIndicator path="layout.containerMaxWidth" />
                    </Label>
                    <Input
                      value={config.layout?.containerMaxWidth || '480px'}
                      onChange={(e) => updateConfig('layout.containerMaxWidth', e.target.value)}
                      disabled={isFieldLocked('layout.containerMaxWidth')}
                      className="text-foreground"
                      placeholder="480px"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground">
                      Padding
                      <LockedIndicator path="layout.padding" />
                    </Label>
                    <Input
                      value={config.layout?.padding || '24px'}
                      onChange={(e) => updateConfig('layout.padding', e.target.value)}
                      disabled={isFieldLocked('layout.padding')}
                      className="text-foreground"
                      placeholder="24px"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">
                    Border Radius
                    <LockedIndicator path="layout.borderRadius" />
                  </Label>
                  <Input
                    value={config.layout?.borderRadius || '16px'}
                    onChange={(e) => updateConfig('layout.borderRadius', e.target.value)}
                    disabled={isFieldLocked('layout.borderRadius')}
                    className="text-foreground"
                    placeholder="16px"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">
                    Font Family
                    <LockedIndicator path="typography.fontFamily" />
                  </Label>
                  <Select
                    value={config.typography?.fontFamily || 'Inter'}
                    onValueChange={(v) => updateConfig('typography.fontFamily', v)}
                    disabled={isFieldLocked('typography.fontFamily')}
                  >
                    <SelectTrigger className="text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Inter">Inter</SelectItem>
                      <SelectItem value="Roboto">Roboto</SelectItem>
                      <SelectItem value="Open Sans">Open Sans</SelectItem>
                      <SelectItem value="Poppins">Poppins</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Channels Tab */}
          <TabsContent value="channels">
            <Card className="shadow-elevation">
              <CardHeader>
                <CardTitle className="text-foreground">Payment Channels</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-foreground">
                    Display Style
                    <LockedIndicator path="channels.displayStyle" />
                  </Label>
                  <Select
                    value={config.channels?.displayStyle || 'list'}
                    onValueChange={(v) => updateConfig('channels.displayStyle', v)}
                    disabled={isFieldLocked('channels.displayStyle')}
                  >
                    <SelectTrigger className="text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="list">List</SelectItem>
                      <SelectItem value="grid">Grid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="font-medium text-foreground">
                      Show Logos
                      <LockedIndicator path="channels.showLogos" />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Display payment method logos
                    </div>
                  </div>
                  <Switch
                    checked={config.channels?.showLogos ?? true}
                    onCheckedChange={(checked) => updateConfig('channels.showLogos', checked)}
                    disabled={isFieldLocked('channels.showLogos')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="font-medium text-foreground">
                      Show Labels
                      <LockedIndicator path="channels.showLabels" />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Display payment method names
                    </div>
                  </div>
                  <Switch
                    checked={config.channels?.showLabels ?? true}
                    onCheckedChange={(checked) => updateConfig('channels.showLabels', checked)}
                    disabled={isFieldLocked('channels.showLabels')}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Enabled Channels</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {['easypaisa', 'jazzcash', 'card', 'bank'].map((channel) => (
                      <div key={channel} className="flex items-center justify-between p-3 bg-accent/10 rounded-lg">
                        <span className="text-foreground capitalize">{channel}</span>
                        <Switch
                          checked={config.channels?.enabled?.includes(channel) ?? true}
                          onCheckedChange={(checked) => {
                            const current = config.channels?.enabled || ['easypaisa', 'jazzcash', 'card', 'bank']
                            const updated = checked
                              ? [...current, channel]
                              : current.filter(c => c !== channel)
                            updateConfig('channels.enabled', updated)
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Text Tab */}
          <TabsContent value="text">
            <Card className="shadow-elevation">
              <CardHeader>
                <CardTitle className="text-foreground">Text & Labels</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <h3 className="font-medium text-foreground">Button Text</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-foreground">Pay Button</Label>
                      <Input
                        value={config.text?.buttons?.pay || 'Pay Now'}
                        onChange={(e) => updateConfig('text.buttons.pay', e.target.value)}
                        className="text-foreground"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground">Retry Button</Label>
                      <Input
                        value={config.text?.buttons?.retry || 'Try Again'}
                        onChange={(e) => updateConfig('text.buttons.retry', e.target.value)}
                        className="text-foreground"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground">Cancel Button</Label>
                      <Input
                        value={config.text?.buttons?.cancel || 'Cancel'}
                        onChange={(e) => updateConfig('text.buttons.cancel', e.target.value)}
                        className="text-foreground"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-medium text-foreground">Messages</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-foreground">Success Message</Label>
                      <Input
                        value={config.text?.messages?.success || 'Payment Successful!'}
                        onChange={(e) => updateConfig('text.messages.success', e.target.value)}
                        className="text-foreground"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground">Failure Message</Label>
                      <Input
                        value={config.text?.messages?.failure || 'Payment Failed'}
                        onChange={(e) => updateConfig('text.messages.failure', e.target.value)}
                        className="text-foreground"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground">Expired Message</Label>
                      <Input
                        value={config.text?.messages?.expired || 'Session Expired'}
                        onChange={(e) => updateConfig('text.messages.expired', e.target.value)}
                        className="text-foreground"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results">
            <div className="grid grid-cols-2 gap-6">
              <Card className="shadow-elevation">
                <CardHeader>
                  <CardTitle className="text-foreground text-status-success">Success Page</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-foreground">Success Message</Label>
                    <Input
                      value={config.resultPages?.success?.message || 'Payment Successful!'}
                      onChange={(e) => updateConfig('resultPages.success.message', e.target.value)}
                      className="text-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground">Sub-message (optional)</Label>
                    <Input
                      value={config.resultPages?.success?.submessage || ''}
                      onChange={(e) => updateConfig('resultPages.success.submessage', e.target.value)}
                      className="text-foreground"
                      placeholder="Thank you for your payment"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="font-medium text-foreground">Show Confetti</div>
                    </div>
                    <Switch
                      checked={config.resultPages?.success?.showConfetti ?? true}
                      onCheckedChange={(checked) => updateConfig('resultPages.success.showConfetti', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="font-medium text-foreground">Show Transaction ID</div>
                    </div>
                    <Switch
                      checked={config.resultPages?.success?.showTransactionId ?? true}
                      onCheckedChange={(checked) => updateConfig('resultPages.success.showTransactionId', checked)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground">CTA Button Text</Label>
                    <Input
                      value={config.resultPages?.success?.ctaText || ''}
                      onChange={(e) => updateConfig('resultPages.success.ctaText', e.target.value)}
                      className="text-foreground"
                      placeholder="Return to Store"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground">CTA Button URL</Label>
                    <Input
                      value={config.resultPages?.success?.ctaUrl || ''}
                      onChange={(e) => updateConfig('resultPages.success.ctaUrl', e.target.value)}
                      className="text-foreground"
                      placeholder="https://yourstore.com"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="font-medium text-foreground">Auto Redirect</div>
                    </div>
                    <Switch
                      checked={config.resultPages?.success?.autoRedirect ?? false}
                      onCheckedChange={(checked) => updateConfig('resultPages.success.autoRedirect', checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-elevation">
                <CardHeader>
                  <CardTitle className="text-foreground text-status-error">Failure Page</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-foreground">Failure Message</Label>
                    <Input
                      value={config.resultPages?.failure?.message || 'Payment Failed'}
                      onChange={(e) => updateConfig('resultPages.failure.message', e.target.value)}
                      className="text-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground">Sub-message (optional)</Label>
                    <Input
                      value={config.resultPages?.failure?.submessage || ''}
                      onChange={(e) => updateConfig('resultPages.failure.submessage', e.target.value)}
                      className="text-foreground"
                      placeholder="Please try again or contact support"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="font-medium text-foreground">Show Retry Button</div>
                    </div>
                    <Switch
                      checked={config.resultPages?.failure?.showRetry ?? true}
                      onCheckedChange={(checked) => updateConfig('resultPages.failure.showRetry', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="font-medium text-foreground">Show Support Info</div>
                    </div>
                    <Switch
                      checked={config.resultPages?.failure?.showSupport ?? true}
                      onCheckedChange={(checked) => updateConfig('resultPages.failure.showSupport', checked)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground">Support Email</Label>
                    <Input
                      value={config.resultPages?.failure?.supportEmail || ''}
                      onChange={(e) => updateConfig('resultPages.failure.supportEmail', e.target.value)}
                      className="text-foreground"
                      placeholder="support@yourcompany.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground">Support Phone</Label>
                    <Input
                      value={config.resultPages?.failure?.supportPhone || ''}
                      onChange={(e) => updateConfig('resultPages.failure.supportPhone', e.target.value)}
                      className="text-foreground"
                      placeholder="+92 300 1234567"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Advanced Settings */}
        <Card className="shadow-elevation">
          <CardHeader>
            <CardTitle className="text-foreground">Advanced Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="font-medium text-foreground">
                  Show "Powered by MyPay"
                  <LockedIndicator path="advanced.showPoweredBy" />
                </div>
                <div className="text-sm text-muted-foreground">
                  Display MyPay branding on the payment page
                </div>
              </div>
              <Switch
                checked={config.advanced?.showPoweredBy ?? true}
                onCheckedChange={(checked) => updateConfig('advanced.showPoweredBy', checked)}
                disabled={isFieldLocked('advanced.showPoweredBy')}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">
                Custom CSS
                <LockedIndicator path="advanced.customCSS" />
              </Label>
              <Textarea
                value={config.advanced?.customCSS || ''}
                onChange={(e) => updateConfig('advanced.customCSS', e.target.value)}
                disabled={isFieldLocked('advanced.customCSS')}
                className="text-foreground font-mono text-sm"
                placeholder="/* Custom CSS styles */"
                rows={6}
              />
            </div>
          </CardContent>
        </Card>

        {/* Template Modal */}
        {showTemplateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-2xl mx-4 shadow-elevation">
              <CardHeader>
                <CardTitle className="text-foreground">Choose a Template</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-foreground">Configuration Name</Label>
                  <Input
                    value={newConfigName}
                    onChange={(e) => setNewConfigName(e.target.value)}
                    className="text-foreground"
                    placeholder="My Custom Theme"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      className="p-4 border border-border rounded-lg cursor-pointer hover:border-mypay-green transition-colors"
                      onClick={() => handleCreateFromTemplate(template.id)}
                    >
                      <div className="font-medium text-foreground">{template.name}</div>
                      <div className="text-sm text-muted-foreground">{template.description}</div>
                      <div className="mt-2">
                        <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded">
                          {template.category}
                        </span>
                        {template.isFeatured && (
                          <span className="text-xs bg-mypay-green/20 text-mypay-green px-2 py-1 rounded ml-2">
                            Featured
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowTemplateModal(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  )
}
