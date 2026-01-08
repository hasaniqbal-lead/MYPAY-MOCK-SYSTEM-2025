'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { paymentPageAPI } from '@/lib/api'
import Layout from '@/components/Layout'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Palette,
  Layout as LayoutIcon,
  CreditCard,
  Link as LinkIcon,
  Eye,
  Copy,
  ExternalLink,
  Save,
  RefreshCw,
  Plus,
  Check,
  X,
  Monitor,
  Smartphone,
  Type,
  FileText,
} from 'lucide-react'
import { DEFAULT_THEME_CONFIG, AVAILABLE_CHANNELS, type ThemeConfiguration, type PaymentMethod } from '@/types/payment-page'

// Payment Page URL (can be configured via env)
const PAYMENT_PAGE_URL = process.env.NEXT_PUBLIC_PAYMENT_PAGE_URL || 'http://localhost:5173'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface PaymentPageConfig extends Partial<ThemeConfiguration> {
  branding: ThemeConfiguration['branding']
  colors: ThemeConfiguration['colors']
  channels: ThemeConfiguration['channels']
  layout: ThemeConfiguration['layout']
  text: ThemeConfiguration['text']
  legal: ThemeConfiguration['legal']
  advanced: ThemeConfiguration['advanced']
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

// Color Picker Input Component
function ColorInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-14 h-10 p-1 cursor-pointer"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="flex-1 font-mono text-sm"
        />
      </div>
    </div>
  )
}

// Preview Device Toggle
function DeviceToggle({
  device,
  onChange,
}: {
  device: 'desktop' | 'mobile'
  onChange: (device: 'desktop' | 'mobile') => void
}) {
  return (
    <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
      <button
        type="button"
        onClick={() => onChange('desktop')}
        className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm transition-colors ${
          device === 'desktop'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <Monitor className="h-4 w-4" />
        Desktop
      </button>
      <button
        type="button"
        onClick={() => onChange('mobile')}
        className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm transition-colors ${
          device === 'mobile'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <Smartphone className="h-4 w-4" />
        Mobile
      </button>
    </div>
  )
}

// Live Preview Component
function LivePreview({
  config,
  device,
  iframeRef,
}: {
  config: PaymentPageConfig
  device: 'desktop' | 'mobile'
  iframeRef: React.RefObject<HTMLIFrameElement>
}) {
  const previewUrl = `${PAYMENT_PAGE_URL}/preview`

  return (
    <div className="bg-muted/50 rounded-lg p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-foreground">Live Preview</span>
        <Badge variant="secondary" className="text-xs">
          Real-time
        </Badge>
      </div>

      <div
        className={`flex-1 mx-auto bg-background rounded-lg overflow-hidden shadow-lg border border-border transition-all duration-300 ${
          device === 'mobile' ? 'w-[375px]' : 'w-full'
        }`}
        style={{ minHeight: '500px' }}
      >
        <iframe
          ref={iframeRef}
          src={previewUrl}
          className="w-full h-full min-h-[500px] border-0"
          title="Payment Page Preview"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>

      <p className="text-xs text-muted-foreground text-center mt-3">
        Changes are reflected in real-time
      </p>
    </div>
  )
}

// Payment Link Modal Component
function GenerateLinkModal({
  isOpen,
  onClose,
  onGenerate,
}: {
  isOpen: boolean
  onClose: () => void
  onGenerate: (data: any) => void
}) {
  const [formData, setFormData] = useState({
    amount: '',
    currency: 'PKR',
    reference: '',
    description: '',
    expiresIn: '30',
  })
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onGenerate({
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        reference: formData.reference,
        description: formData.description,
        expiresIn: parseInt(formData.expiresIn) * 60,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Generate Payment Link</h3>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground" title="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                placeholder="1000"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData({ ...formData, currency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PKR">PKR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="AED">AED</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference">Reference / Order ID</Label>
            <Input
              id="reference"
              placeholder="ORD-12345"
              value={formData.reference}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Input
              id="description"
              placeholder="Payment for order #12345"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiresIn">Link Expiry</Label>
            <Select
              value={formData.expiresIn}
              onValueChange={(value) => setFormData({ ...formData, expiresIn: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="1440">24 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-mypay-green hover:bg-mypay-green-dark"
              disabled={loading}
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Generate Link
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Generated Link Display Modal
function LinkDisplayModal({
  isOpen,
  onClose,
  link,
}: {
  isOpen: boolean
  onClose: () => void
  link: { url: string; token: string; expiresAt: string } | null
}) {
  const [copied, setCopied] = useState(false)

  if (!isOpen || !link) return null

  const handleCopy = async () => {
    await navigator.clipboard.writeText(link.url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg w-full max-w-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-mypay-green/10 rounded-full flex items-center justify-center">
              <Check className="h-5 w-5 text-mypay-green" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Payment Link Generated</h3>
          </div>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground" title="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3">
          <Label>Payment URL</Label>
          <div className="flex gap-2">
            <Input value={link.url} readOnly className="font-mono text-sm" />
            <Button variant="outline" size="icon" onClick={handleCopy} title="Copy URL">
              {copied ? <Check className="h-4 w-4 text-mypay-green" /> : <Copy className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="icon" asChild title="Open in new tab">
              <a href={link.url} target="_blank" rel="noopener noreferrer" title="Open payment link">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Token:</span>
            <p className="font-mono text-foreground truncate">{link.token}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Expires:</span>
            <p className="text-foreground">{new Date(link.expiresAt).toLocaleString()}</p>
          </div>
        </div>

        <Button onClick={onClose} className="w-full bg-mypay-green hover:bg-mypay-green-dark">
          Done
        </Button>
      </div>
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function PaymentPageSettings() {
  const { user } = useAuth()
  const iframeRef = useRef<HTMLIFrameElement | null>(null)

  // State
  const [config, setConfig] = useState<PaymentPageConfig>({
    branding: DEFAULT_THEME_CONFIG.branding!,
    colors: DEFAULT_THEME_CONFIG.colors!,
    channels: DEFAULT_THEME_CONFIG.channels!,
    layout: DEFAULT_THEME_CONFIG.layout!,
    text: DEFAULT_THEME_CONFIG.text!,
    legal: DEFAULT_THEME_CONFIG.legal!,
    advanced: DEFAULT_THEME_CONFIG.advanced!,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop')
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [generatedLink, setGeneratedLink] = useState<{
    url: string
    token: string
    expiresAt: string
  } | null>(null)

  // Load config on mount
  useEffect(() => {
    loadConfig()
  }, [])

  // Send config updates to iframe
  const sendConfigToPreview = useCallback((newConfig: PaymentPageConfig) => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type: 'PREVIEW_CONFIG_UPDATE', payload: newConfig },
        '*'
      )
    }
  }, [])

  // Update config and sync to preview
  const updateConfig = useCallback(
    (updates: Partial<PaymentPageConfig>) => {
      setConfig((prev) => {
        const newConfig = { ...prev, ...updates }
        // Debounced sync to iframe
        setTimeout(() => sendConfigToPreview(newConfig), 100)
        return newConfig
      })
    },
    [sendConfigToPreview]
  )

  // Deep update for nested config sections
  const updateConfigSection = useCallback(
    <K extends keyof PaymentPageConfig>(
      section: K,
      updates: Partial<PaymentPageConfig[K]>
    ) => {
      setConfig((prev) => {
        const prevSection = prev[section]
        const newConfig = {
          ...prev,
          [section]: { ...(prevSection as object), ...(updates as object) },
        }
        setTimeout(() => sendConfigToPreview(newConfig), 100)
        return newConfig
      })
    },
    [sendConfigToPreview]
  )

  // Listen for iframe ready
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === 'PREVIEW_READY') {
        sendConfigToPreview(config)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [config, sendConfigToPreview])

  const loadConfig = async () => {
    setLoading(true)
    try {
      const response = await paymentPageAPI.getConfig()
      if (response.config) {
        setConfig({
          branding: { ...DEFAULT_THEME_CONFIG.branding!, ...response.config.branding },
          colors: { ...DEFAULT_THEME_CONFIG.colors!, ...response.config.colors },
          channels: { ...DEFAULT_THEME_CONFIG.channels!, ...response.config.channels },
          layout: { ...DEFAULT_THEME_CONFIG.layout!, ...response.config.layout },
          text: { ...DEFAULT_THEME_CONFIG.text!, ...response.config.text },
          legal: { ...DEFAULT_THEME_CONFIG.legal!, ...response.config.legal },
          advanced: { ...DEFAULT_THEME_CONFIG.advanced!, ...response.config.advanced },
        })
      }
    } catch (error) {
      console.log('Using default config')
      // Use default with merchant name
      setConfig((prev) => ({
        ...prev,
        branding: {
          ...prev.branding,
          merchantName: user?.companyName || prev.branding.merchantName,
        },
      }))
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage('')
    try {
      await paymentPageAPI.updateConfig(config)
      setMessage('Configuration saved successfully!')
      setTimeout(() => setMessage(''), 3000)
    } catch (error: any) {
      setMessage(error.response?.data?.error || 'Failed to save configuration')
    } finally {
      setSaving(false)
    }
  }

  const handleGenerateLink = async (data: any) => {
    try {
      const response = await paymentPageAPI.generatePaymentLink(data)
      setGeneratedLink({
        url: response.paymentUrl || `${PAYMENT_PAGE_URL}/pg/${response.token}`,
        token: response.token,
        expiresAt: response.expiresAt,
      })
      setShowGenerateModal(false)
      setShowLinkModal(true)
    } catch (error: any) {
      // Mock response for demo
      const mockToken = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      setGeneratedLink({
        url: `${PAYMENT_PAGE_URL}/pg/${mockToken}`,
        token: mockToken,
        expiresAt: new Date(Date.now() + data.expiresIn * 1000).toISOString(),
      })
      setShowGenerateModal(false)
      setShowLinkModal(true)
    }
  }

  const toggleChannel = (channelId: PaymentMethod) => {
    const currentVisibility = config.channels.channelVisibility || {}
    updateConfigSection('channels', {
      channelVisibility: {
        ...currentVisibility,
        [channelId]: !(currentVisibility[channelId] ?? AVAILABLE_CHANNELS.find(c => c.id === channelId)?.enabled ?? false),
      },
    })
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Payment Page Designer</h1>
            <p className="text-muted-foreground">
              Customize your payment page and preview changes in real-time
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              asChild
            >
              <a href={`${PAYMENT_PAGE_URL}/demo`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Demo
              </a>
            </Button>
            <Button
              className="bg-mypay-green hover:bg-mypay-green-dark"
              onClick={() => setShowGenerateModal(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Generate Link
            </Button>
          </div>
        </div>

        {/* Status Message */}
        {message && (
          <div
            className={`p-4 rounded-lg ${
              message.includes('success')
                ? 'bg-status-success/10 text-status-success border border-status-success/20'
                : 'bg-status-error/10 text-status-error border border-status-error/20'
            }`}
          >
            {message}
          </div>
        )}

        {/* Main Content - Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column - Configuration */}
          <div className="space-y-6">
            <Tabs defaultValue="branding" className="space-y-4">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="branding" className="gap-1 text-xs">
                  <Palette className="h-3 w-3" />
                  <span className="hidden sm:inline">Brand</span>
                </TabsTrigger>
                <TabsTrigger value="colors" className="gap-1 text-xs">
                  <Palette className="h-3 w-3" />
                  <span className="hidden sm:inline">Colors</span>
                </TabsTrigger>
                <TabsTrigger value="channels" className="gap-1 text-xs">
                  <CreditCard className="h-3 w-3" />
                  <span className="hidden sm:inline">Channels</span>
                </TabsTrigger>
                <TabsTrigger value="text" className="gap-1 text-xs">
                  <Type className="h-3 w-3" />
                  <span className="hidden sm:inline">Text</span>
                </TabsTrigger>
                <TabsTrigger value="layout" className="gap-1 text-xs">
                  <LayoutIcon className="h-3 w-3" />
                  <span className="hidden sm:inline">Layout</span>
                </TabsTrigger>
              </TabsList>

              {/* Branding Tab */}
              <TabsContent value="branding">
                <Card className="shadow-elevation">
                  <CardHeader>
                    <CardTitle className="text-lg">Branding</CardTitle>
                    <CardDescription>Your business identity on the payment page</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Business Name</Label>
                      <Input
                        value={config.branding.merchantName}
                        onChange={(e) =>
                          updateConfigSection('branding', { merchantName: e.target.value })
                        }
                        placeholder="Your Business Name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Logo URL</Label>
                      <Input
                        value={config.branding.merchantLogo}
                        onChange={(e) =>
                          updateConfigSection('branding', { merchantLogo: e.target.value })
                        }
                        placeholder="https://example.com/logo.png"
                      />
                      <p className="text-xs text-muted-foreground">
                        Recommended: 200x60 pixels, PNG or SVG
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Background Image (Optional)</Label>
                      <Input
                        value={config.branding.backgroundImage || ''}
                        onChange={(e) =>
                          updateConfigSection('branding', { backgroundImage: e.target.value })
                        }
                        placeholder="https://example.com/bg.jpg"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Colors Tab */}
              <TabsContent value="colors">
                <Card className="shadow-elevation">
                  <CardHeader>
                    <CardTitle className="text-lg">Colors</CardTitle>
                    <CardDescription>Customize the color scheme</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <ColorInput
                        label="Primary Color"
                        value={config.colors.primary}
                        onChange={(value) => updateConfigSection('colors', { primary: value })}
                      />
                      <ColorInput
                        label="Secondary Color"
                        value={config.colors.secondary}
                        onChange={(value) => updateConfigSection('colors', { secondary: value })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <ColorInput
                        label="Background"
                        value={config.colors.background}
                        onChange={(value) => updateConfigSection('colors', { background: value })}
                      />
                      <ColorInput
                        label="Surface (Card)"
                        value={config.colors.surface}
                        onChange={(value) => updateConfigSection('colors', { surface: value })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <ColorInput
                        label="Success"
                        value={config.colors.success}
                        onChange={(value) => updateConfigSection('colors', { success: value })}
                      />
                      <ColorInput
                        label="Error"
                        value={config.colors.error}
                        onChange={(value) => updateConfigSection('colors', { error: value })}
                      />
                    </div>

                    <div className="border-t pt-4 mt-4">
                      <h4 className="text-sm font-medium mb-3">Text Colors</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <ColorInput
                          label="Primary Text"
                          value={config.colors.text.primary}
                          onChange={(value) =>
                            updateConfigSection('colors', {
                              text: { ...config.colors.text, primary: value },
                            })
                          }
                        />
                        <ColorInput
                          label="Secondary Text"
                          value={config.colors.text.secondary}
                          onChange={(value) =>
                            updateConfigSection('colors', {
                              text: { ...config.colors.text, secondary: value },
                            })
                          }
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Channels Tab */}
              <TabsContent value="channels">
                <Card className="shadow-elevation">
                  <CardHeader>
                    <CardTitle className="text-lg">Payment Channels</CardTitle>
                    <CardDescription>Enable or disable payment methods</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {AVAILABLE_CHANNELS.map((channel) => {
                      const isVisible = config.channels.channelVisibility?.[channel.id] ?? channel.enabled
                      return (
                        <div
                          key={channel.id}
                          className="flex items-center justify-between p-3 bg-background rounded-lg border border-border"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                              <CreditCard className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                              <div className="font-medium text-foreground text-sm">{channel.name}</div>
                              <div className="text-xs text-muted-foreground">{channel.description}</div>
                            </div>
                          </div>
                          <Switch
                            checked={isVisible}
                            onCheckedChange={() => toggleChannel(channel.id)}
                          />
                        </div>
                      )
                    })}

                    <div className="border-t pt-4 mt-4">
                      <div className="space-y-2">
                        <Label>Display Style</Label>
                        <Select
                          value={config.channels.displayStyle}
                          onValueChange={(value: 'grid' | 'list' | 'tabs') =>
                            updateConfigSection('channels', { displayStyle: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="list">List View</SelectItem>
                            <SelectItem value="grid">Grid View</SelectItem>
                            <SelectItem value="tabs">Tab View</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        <div>
                          <div className="font-medium text-foreground text-sm">Show Icons</div>
                          <div className="text-xs text-muted-foreground">
                            Display payment method logos
                          </div>
                        </div>
                        <Switch
                          checked={config.channels.showIcons}
                          onCheckedChange={(checked) =>
                            updateConfigSection('channels', { showIcons: checked })
                          }
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Text Tab */}
              <TabsContent value="text">
                <Card className="shadow-elevation">
                  <CardHeader>
                    <CardTitle className="text-lg">Text & Labels</CardTitle>
                    <CardDescription>Customize the text content</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Page Heading</Label>
                      <Input
                        value={config.text.heading}
                        onChange={(e) => updateConfigSection('text', { heading: e.target.value })}
                        placeholder="Complete Your Payment"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Subheading</Label>
                      <Input
                        value={config.text.subheading || ''}
                        onChange={(e) => updateConfigSection('text', { subheading: e.target.value })}
                        placeholder="Select your preferred payment method"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Amount Label</Label>
                      <Input
                        value={config.text.amountLabel}
                        onChange={(e) => updateConfigSection('text', { amountLabel: e.target.value })}
                        placeholder="Amount to Pay"
                      />
                    </div>

                    <div className="border-t pt-4 mt-4">
                      <h4 className="text-sm font-medium mb-3">Button Text</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Pay Now</Label>
                          <Input
                            value={config.text.buttons.payNow}
                            onChange={(e) =>
                              updateConfigSection('text', {
                                buttons: { ...config.text.buttons, payNow: e.target.value },
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Continue</Label>
                          <Input
                            value={config.text.buttons.continue}
                            onChange={(e) =>
                              updateConfigSection('text', {
                                buttons: { ...config.text.buttons, continue: e.target.value },
                              })
                            }
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
                    <CardTitle className="text-lg">Layout & Style</CardTitle>
                    <CardDescription>Configure the visual layout</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Layout Type</Label>
                      <Select
                        value={config.layout.type}
                        onValueChange={(value: 'centered' | 'split' | 'full-width') =>
                          updateConfigSection('layout', { type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="centered">Centered</SelectItem>
                          <SelectItem value="split">Split View</SelectItem>
                          <SelectItem value="full-width">Full Width</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Border Radius</Label>
                      <Select
                        value={config.layout.borderRadius}
                        onValueChange={(value) => updateConfigSection('layout', { borderRadius: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="sm">Small</SelectItem>
                          <SelectItem value="md">Medium</SelectItem>
                          <SelectItem value="lg">Large</SelectItem>
                          <SelectItem value="xl">Extra Large</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="border-t pt-4 mt-4">
                      <h4 className="text-sm font-medium mb-3">Footer Options</h4>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-foreground text-sm">Show "Powered by MyPay"</div>
                          <div className="text-xs text-muted-foreground">
                            Display branding in footer
                          </div>
                        </div>
                        <Switch
                          checked={config.advanced.showPoweredBy}
                          onCheckedChange={(checked) =>
                            updateConfigSection('advanced', { showPoweredBy: checked })
                          }
                        />
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="text-sm font-medium mb-3">Legal</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Show Terms & Conditions</span>
                          <Switch
                            checked={config.legal.showTerms}
                            onCheckedChange={(checked) =>
                              updateConfigSection('legal', { showTerms: checked })
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Show Privacy Policy</span>
                          <Switch
                            checked={config.legal.showPrivacy}
                            onCheckedChange={(checked) =>
                              updateConfigSection('legal', { showPrivacy: checked })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Save Button */}
            <Button
              onClick={handleSave}
              className="w-full gap-2 bg-mypay-green hover:bg-mypay-green-dark"
              disabled={saving}
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Configuration'}
            </Button>
          </div>

          {/* Right Column - Live Preview */}
          <div className="lg:sticky lg:top-6">
            <Card className="shadow-elevation h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Preview</CardTitle>
                  <DeviceToggle device={previewDevice} onChange={setPreviewDevice} />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <LivePreview config={config} device={previewDevice} iframeRef={iframeRef} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modals */}
      <GenerateLinkModal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        onGenerate={handleGenerateLink}
      />
      <LinkDisplayModal
        isOpen={showLinkModal}
        onClose={() => setShowLinkModal(false)}
        link={generatedLink}
      />
    </Layout>
  )
}
