'use client'

import { useState, useEffect } from 'react'
import { paymentPageAdminAPI, adminAPI } from '@/lib/api'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Lock,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  Save,
  X,
  Shield,
  FileText,
  Users,
  Check
} from 'lucide-react'

interface Rule {
  id: number
  fieldPath: string
  ruleType: 'locked' | 'required' | 'allowed_values' | 'regex' | 'range'
  ruleValue: unknown
  description: string
  isActive: boolean
}

interface Template {
  id: number
  name: string
  category: string
  description: string
  isActive: boolean
  configuration?: unknown
}

interface MerchantConfig {
  id: number
  merchantId: number
  name: string
  isDefault: boolean
  isActive: boolean
  createdAt: string
  merchant?: {
    id: number
    email: string
    company_name?: string
  }
}

const FIELD_PATHS = [
  { value: 'advanced.showPoweredBy', label: 'Show "Powered by MyPay"' },
  { value: 'advanced.customCSS', label: 'Custom CSS' },
  { value: 'branding.merchantName', label: 'Merchant Name' },
  { value: 'branding.merchantLogo', label: 'Merchant Logo' },
  { value: 'colors.primary', label: 'Primary Color' },
  { value: 'colors.background', label: 'Background Color' },
  { value: 'colors.surface', label: 'Surface Color' },
  { value: 'layout.type', label: 'Layout Type' },
  { value: 'channels.enabled', label: 'Enabled Channels' },
  { value: 'resultPages.success.showConfetti', label: 'Show Confetti on Success' },
]

const RULE_TYPES = [
  { value: 'locked', label: 'Locked Value', description: 'Field is locked to a specific value' },
  { value: 'required', label: 'Required', description: 'Field must have a value' },
  { value: 'allowed_values', label: 'Allowed Values', description: 'Field must be one of allowed values' },
  { value: 'regex', label: 'Regex Pattern', description: 'Field must match regex pattern' },
  { value: 'range', label: 'Range', description: 'Field must be within min/max range' },
]

export default function PaymentPageAdminPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [rules, setRules] = useState<Rule[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [merchantConfigs, setMerchantConfigs] = useState<MerchantConfig[]>([])
  const [merchants, setMerchants] = useState<{ id: number; email: string; company_name?: string }[]>([])

  const [showRuleModal, setShowRuleModal] = useState(false)
  const [editingRule, setEditingRule] = useState<Rule | null>(null)
  const [ruleForm, setRuleForm] = useState({
    fieldPath: '',
    ruleType: 'locked' as Rule['ruleType'],
    ruleValue: '',
    description: '',
  })

  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [templateForm, setTemplateForm] = useState({
    name: '',
    category: 'minimal',
    description: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [rulesRes, templatesRes, configsRes, merchantsRes] = await Promise.all([
        paymentPageAdminAPI.listRules(),
        paymentPageAdminAPI.listTemplates(),
        paymentPageAdminAPI.listMerchantConfigs(),
        adminAPI.getMerchants(),
      ])

      setRules(rulesRes.rules || [])
      setTemplates(templatesRes.templates || [])
      setMerchantConfigs(configsRes.configs || [])
      setMerchants(merchantsRes.merchants || [])
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Rule handlers
  const openRuleModal = (rule?: Rule) => {
    if (rule) {
      setEditingRule(rule)
      setRuleForm({
        fieldPath: rule.fieldPath,
        ruleType: rule.ruleType,
        ruleValue: JSON.stringify(rule.ruleValue),
        description: rule.description || '',
      })
    } else {
      setEditingRule(null)
      setRuleForm({ fieldPath: '', ruleType: 'locked', ruleValue: '', description: '' })
    }
    setShowRuleModal(true)
  }

  const saveRule = async () => {
    setSaving(true)
    setMessage(null)
    try {
      let ruleValue: unknown
      try {
        ruleValue = JSON.parse(ruleForm.ruleValue)
      } catch {
        ruleValue = ruleForm.ruleValue
      }

      const data = {
        fieldPath: ruleForm.fieldPath,
        ruleType: ruleForm.ruleType,
        ruleValue,
        description: ruleForm.description,
      }

      if (editingRule) {
        await paymentPageAdminAPI.updateRule(editingRule.id, data)
        setMessage({ type: 'success', text: 'Rule updated successfully!' })
      } else {
        await paymentPageAdminAPI.createRule(data)
        setMessage({ type: 'success', text: 'Rule created successfully!' })
      }

      setShowRuleModal(false)
      await loadData()
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to save rule' })
    } finally {
      setSaving(false)
    }
  }

  const deleteRule = async (id: number) => {
    if (!confirm('Are you sure you want to delete this rule?')) return
    setSaving(true)
    try {
      await paymentPageAdminAPI.deleteRule(id)
      setMessage({ type: 'success', text: 'Rule deleted!' })
      await loadData()
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to delete rule' })
    } finally {
      setSaving(false)
    }
  }

  const toggleRule = async (rule: Rule) => {
    setSaving(true)
    try {
      await paymentPageAdminAPI.updateRule(rule.id, { isActive: !rule.isActive })
      await loadData()
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to toggle rule' })
    } finally {
      setSaving(false)
    }
  }

  // Template handlers
  const openTemplateModal = (template?: Template) => {
    if (template) {
      setEditingTemplate(template)
      setTemplateForm({
        name: template.name,
        category: template.category,
        description: template.description || '',
      })
    } else {
      setEditingTemplate(null)
      setTemplateForm({ name: '', category: 'minimal', description: '' })
    }
    setShowTemplateModal(true)
  }

  const saveTemplate = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const data = {
        name: templateForm.name,
        category: templateForm.category,
        description: templateForm.description,
        configuration: editingTemplate?.configuration || {},
      }

      if (editingTemplate) {
        await paymentPageAdminAPI.updateTemplate(editingTemplate.id, data)
        setMessage({ type: 'success', text: 'Template updated successfully!' })
      } else {
        await paymentPageAdminAPI.createTemplate(data)
        setMessage({ type: 'success', text: 'Template created successfully!' })
      }

      setShowTemplateModal(false)
      await loadData()
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to save template' })
    } finally {
      setSaving(false)
    }
  }

  const deleteTemplate = async (id: number) => {
    if (!confirm('Are you sure you want to delete this template?')) return
    setSaving(true)
    try {
      await paymentPageAdminAPI.deleteTemplate(id)
      setMessage({ type: 'success', text: 'Template deleted!' })
      await loadData()
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to delete template' })
    } finally {
      setSaving(false)
    }
  }

  const toggleTemplate = async (template: Template) => {
    setSaving(true)
    try {
      await paymentPageAdminAPI.updateTemplate(template.id, { isActive: !template.isActive })
      await loadData()
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to toggle template' })
    } finally {
      setSaving(false)
    }
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
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Payment Page Management</h1>
            <p className="text-muted-foreground">Manage rules, templates, and merchant configurations</p>
          </div>
          <Button onClick={() => loadData()} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
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

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="shadow-elevation">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-mypay-green/10">
                  <Shield className="h-6 w-6 text-mypay-green" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Rules</p>
                  <p className="text-2xl font-bold text-foreground">{rules.filter(r => r.isActive).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-elevation">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-mypay-green/10">
                  <FileText className="h-6 w-6 text-mypay-green" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Templates</p>
                  <p className="text-2xl font-bold text-foreground">{templates.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-elevation">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-mypay-green/10">
                  <Users className="h-6 w-6 text-mypay-green" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Merchant Configs</p>
                  <p className="text-2xl font-bold text-foreground">{merchantConfigs.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="rules" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="rules" className="gap-2">
              <Lock className="h-4 w-4" />
              Rules
            </TabsTrigger>
            <TabsTrigger value="templates" className="gap-2">
              <FileText className="h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="configs" className="gap-2">
              <Users className="h-4 w-4" />
              Merchant Configs
            </TabsTrigger>
          </TabsList>

          {/* Rules Tab */}
          <TabsContent value="rules">
            <Card className="shadow-elevation">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-foreground">Field Rules</CardTitle>
                <Button onClick={() => openRuleModal()} className="gap-2 bg-mypay-green hover:bg-mypay-green-dark">
                  <Plus className="h-4 w-4" />
                  Add Rule
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Field Path</TableHead>
                      <TableHead>Rule Type</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rules.map((rule) => (
                      <TableRow key={rule.id}>
                        <TableCell className="font-mono text-sm">{rule.fieldPath}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{rule.ruleType}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm max-w-[200px] truncate">
                          {JSON.stringify(rule.ruleValue)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{rule.description}</TableCell>
                        <TableCell>
                          <Switch
                            checked={rule.isActive}
                            onCheckedChange={() => toggleRule(rule)}
                            disabled={saving}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openRuleModal(rule)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteRule(rule.id)}
                              className="text-status-error hover:text-status-error"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {rules.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          No rules configured. Click "Add Rule" to create one.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates">
            <Card className="shadow-elevation">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-foreground">Payment Page Templates</CardTitle>
                <Button onClick={() => openTemplateModal()} className="gap-2 bg-mypay-green hover:bg-mypay-green-dark">
                  <Plus className="h-4 w-4" />
                  Add Template
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {templates.map((template) => (
                    <Card key={template.id} className={`relative ${!template.isActive ? 'opacity-50' : ''}`}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="font-semibold text-foreground">{template.name}</h3>
                            <p className="text-sm text-muted-foreground">{template.description}</p>
                          </div>
                          <Badge variant="secondary">{template.category}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={template.isActive}
                              onCheckedChange={() => toggleTemplate(template)}
                              disabled={saving}
                            />
                            <span className="text-sm text-muted-foreground">
                              {template.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openTemplateModal(template)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteTemplate(template.id)}
                              className="text-status-error hover:text-status-error"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {templates.length === 0 && (
                    <div className="col-span-3 text-center text-muted-foreground py-8">
                      No templates available. Click "Add Template" to create one.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Merchant Configs Tab */}
          <TabsContent value="configs">
            <Card className="shadow-elevation">
              <CardHeader>
                <CardTitle className="text-foreground">Merchant Configurations</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Merchant</TableHead>
                      <TableHead>Config Name</TableHead>
                      <TableHead>Default</TableHead>
                      <TableHead>Active</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {merchantConfigs.map((config) => {
                      const merchant = merchants.find(m => m.id === config.merchantId)
                      return (
                        <TableRow key={config.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-foreground">
                                {merchant?.company_name || merchant?.email || `Merchant #${config.merchantId}`}
                              </p>
                              {merchant?.email && (
                                <p className="text-sm text-muted-foreground">{merchant.email}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{config.name}</TableCell>
                          <TableCell>
                            {config.isDefault && (
                              <Badge variant="secondary" className="bg-mypay-green/10 text-mypay-green">
                                <Check className="h-3 w-3 mr-1" />
                                Default
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {config.isActive ? (
                              <Badge variant="secondary" className="bg-status-success/10 text-status-success">
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-muted text-muted-foreground">
                                Inactive
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(config.createdAt).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                    {merchantConfigs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No merchant configurations found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Rule Modal */}
        {showRuleModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-lg mx-4 shadow-elevation">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-foreground">
                  {editingRule ? 'Edit Rule' : 'Add Rule'}
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowRuleModal(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-foreground">Field Path</Label>
                  <Select
                    value={ruleForm.fieldPath}
                    onValueChange={(v) => setRuleForm({ ...ruleForm, fieldPath: v })}
                  >
                    <SelectTrigger className="text-foreground">
                      <SelectValue placeholder="Select a field..." />
                    </SelectTrigger>
                    <SelectContent>
                      {FIELD_PATHS.map((field) => (
                        <SelectItem key={field.value} value={field.value}>
                          {field.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    value={ruleForm.fieldPath}
                    onChange={(e) => setRuleForm({ ...ruleForm, fieldPath: e.target.value })}
                    className="text-foreground mt-2"
                    placeholder="Or enter custom path..."
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Rule Type</Label>
                  <Select
                    value={ruleForm.ruleType}
                    onValueChange={(v) => setRuleForm({ ...ruleForm, ruleType: v as Rule['ruleType'] })}
                  >
                    <SelectTrigger className="text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RULE_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div>
                            <span className="font-medium">{type.label}</span>
                            <span className="text-muted-foreground ml-2">- {type.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">
                    Rule Value (JSON)
                    <span className="text-muted-foreground ml-2 text-xs">
                      {ruleForm.ruleType === 'locked' && 'e.g., {"value": true}'}
                      {ruleForm.ruleType === 'allowed_values' && 'e.g., {"values": ["#10B981", "#3B82F6"]}'}
                      {ruleForm.ruleType === 'regex' && 'e.g., {"pattern": "^.{3,50}$"}'}
                      {ruleForm.ruleType === 'range' && 'e.g., {"min": 0, "max": 100}'}
                    </span>
                  </Label>
                  <Textarea
                    value={ruleForm.ruleValue}
                    onChange={(e) => setRuleForm({ ...ruleForm, ruleValue: e.target.value })}
                    className="text-foreground font-mono"
                    placeholder='{"value": true}'
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Description</Label>
                  <Input
                    value={ruleForm.description}
                    onChange={(e) => setRuleForm({ ...ruleForm, description: e.target.value })}
                    className="text-foreground"
                    placeholder="Explain why this rule exists..."
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setShowRuleModal(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={saveRule}
                    disabled={saving || !ruleForm.fieldPath || !ruleForm.ruleValue}
                    className="gap-2 bg-mypay-green hover:bg-mypay-green-dark"
                  >
                    <Save className="h-4 w-4" />
                    {saving ? 'Saving...' : 'Save Rule'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Template Modal */}
        {showTemplateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-lg mx-4 shadow-elevation">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-foreground">
                  {editingTemplate ? 'Edit Template' : 'Add Template'}
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowTemplateModal(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-foreground">Template Name</Label>
                  <Input
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                    className="text-foreground"
                    placeholder="Modern Minimal"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Category</Label>
                  <Select
                    value={templateForm.category}
                    onValueChange={(v) => setTemplateForm({ ...templateForm, category: v })}
                  >
                    <SelectTrigger className="text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minimal">Minimal</SelectItem>
                      <SelectItem value="ecommerce">E-commerce</SelectItem>
                      <SelectItem value="corporate">Corporate</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Description</Label>
                  <Textarea
                    value={templateForm.description}
                    onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                    className="text-foreground"
                    placeholder="Clean dark theme with modern styling..."
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setShowTemplateModal(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={saveTemplate}
                    disabled={saving || !templateForm.name}
                    className="gap-2 bg-mypay-green hover:bg-mypay-green-dark"
                  >
                    <Save className="h-4 w-4" />
                    {saving ? 'Saving...' : 'Save Template'}
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
