'use client'

import { useState, useEffect } from 'react'
import { merchantAPI } from '@/lib/api'
import Layout from '@/components/Layout'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, User, Building, CreditCard, Bell, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState({
    firstName: user?.companyName?.split(' ')[0] || '',
    lastName: user?.companyName?.split(' ').slice(1).join(' ') || '',
    email: user?.email || '',
    phone: ''
  })

  const [business, setBusiness] = useState({
    businessName: user?.companyName || '',
    businessType: 'E-commerce',
    address: '',
    country: 'Pakistan',
    website: ''
  })

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    smsNotifications: false,
    webhookNotifications: true,
    marketingEmails: false
  })

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (user) {
      setProfile({
        firstName: user.companyName?.split(' ')[0] || '',
        lastName: user.companyName?.split(' ').slice(1).join(' ') || '',
        email: user.email || '',
        phone: ''
      })
      setBusiness({
        businessName: user.companyName || '',
        businessType: 'E-commerce',
        address: '',
        country: 'Pakistan',
        website: ''
      })
    }
  }, [user])

  const handleProfileSave = async () => {
    setLoading(true)
    setMessage('')
    try {
      await merchantAPI.updateProfile({
        companyName: `${profile.firstName} ${profile.lastName}`.trim(),
        email: profile.email
      })
      setMessage('Profile updated successfully!')
    } catch (error: any) {
      setMessage(error.response?.data?.error || 'Update failed')
    } finally {
      setLoading(false)
    }
  }

  const handleBusinessSave = async () => {
    setLoading(true)
    setMessage('')
    try {
      await merchantAPI.updateProfile({
        companyName: business.businessName
      })
      setMessage('Business information updated successfully!')
    } catch (error: any) {
      setMessage(error.response?.data?.error || 'Update failed')
    } finally {
      setLoading(false)
    }
  }

  const handleNotificationSave = () => {
    setMessage('Notification preferences updated successfully!')
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
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Account Settings</h1>
            <p className="text-muted-foreground">Manage your account and business information</p>
          </div>
        </div>

        {message && (
          <div className={`p-4 rounded-lg ${
            message.includes('success') 
              ? 'bg-status-success/10 text-status-success border border-status-success/20' 
              : 'bg-status-error/10 text-status-error border border-status-error/20'
          }`}>
            {message}
          </div>
        )}

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="business" className="gap-2">
              <Building className="h-4 w-4" />
              Business
            </TabsTrigger>
            <TabsTrigger value="billing" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Billing
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card className="shadow-elevation">
              <CardHeader>
                <CardTitle className="text-foreground">Profile Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-foreground">First Name</Label>
                    <Input 
                      id="firstName" 
                      value={profile.firstName}
                      onChange={(e) => setProfile({...profile, firstName: e.target.value})}
                      className="text-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-foreground">Last Name</Label>
                    <Input 
                      id="lastName" 
                      value={profile.lastName}
                      onChange={(e) => setProfile({...profile, lastName: e.target.value})}
                      className="text-foreground"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={profile.email}
                    onChange={(e) => setProfile({...profile, email: e.target.value})}
                    className="text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-foreground">Phone</Label>
                  <Input 
                    id="phone" 
                    value={profile.phone}
                    onChange={(e) => setProfile({...profile, phone: e.target.value})}
                    className="text-foreground"
                  />
                </div>
                <Button onClick={handleProfileSave} className="gap-2 bg-mypay-green hover:bg-mypay-green-dark" disabled={loading}>
                  <Save className="h-4 w-4" />
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="business">
            <Card className="shadow-elevation">
              <CardHeader>
                <CardTitle className="text-foreground">Business Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName" className="text-foreground">Business Name</Label>
                  <Input 
                    id="businessName" 
                    value={business.businessName}
                    onChange={(e) => setBusiness({...business, businessName: e.target.value})}
                    className="text-foreground"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="businessType" className="text-foreground">Business Type</Label>
                    <Select value={business.businessType} onValueChange={(value) => setBusiness({...business, businessType: value})}>
                      <SelectTrigger className="text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="E-commerce">E-commerce</SelectItem>
                        <SelectItem value="Retail">Retail</SelectItem>
                        <SelectItem value="SaaS">SaaS</SelectItem>
                        <SelectItem value="Education">Education</SelectItem>
                        <SelectItem value="Healthcare">Healthcare</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country" className="text-foreground">Country</Label>
                    <Select value={business.country} onValueChange={(value) => setBusiness({...business, country: value})}>
                      <SelectTrigger className="text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pakistan">Pakistan</SelectItem>
                        <SelectItem value="UAE">United Arab Emirates</SelectItem>
                        <SelectItem value="Egypt">Egypt</SelectItem>
                        <SelectItem value="Saudi Arabia">Saudi Arabia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-foreground">Business Address</Label>
                  <Textarea 
                    id="address" 
                    value={business.address}
                    onChange={(e) => setBusiness({...business, address: e.target.value})}
                    className="text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website" className="text-foreground">Website</Label>
                  <Input 
                    id="website" 
                    value={business.website}
                    onChange={(e) => setBusiness({...business, website: e.target.value})}
                    className="text-foreground"
                  />
                </div>
                <Button onClick={handleBusinessSave} className="gap-2 bg-mypay-green hover:bg-mypay-green-dark" disabled={loading}>
                  <Save className="h-4 w-4" />
                  Update Business Info
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing">
            <Card className="shadow-elevation">
              <CardHeader>
                <CardTitle className="text-foreground">Billing & Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    Billing settings and payment method management coming soon.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card className="shadow-elevation">
              <CardHeader>
                <CardTitle className="text-foreground">Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="font-medium text-foreground">Email Notifications</div>
                    <div className="text-sm text-muted-foreground">
                      Receive transaction updates via email
                    </div>
                  </div>
                  <Switch 
                    checked={notifications.emailNotifications}
                    onCheckedChange={(checked) => setNotifications({...notifications, emailNotifications: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="font-medium text-foreground">SMS Notifications</div>
                    <div className="text-sm text-muted-foreground">
                      Receive important alerts via SMS
                    </div>
                  </div>
                  <Switch 
                    checked={notifications.smsNotifications}
                    onCheckedChange={(checked) => setNotifications({...notifications, smsNotifications: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="font-medium text-foreground">Webhook Notifications</div>
                    <div className="text-sm text-muted-foreground">
                      Receive real-time webhook updates
                    </div>
                  </div>
                  <Switch 
                    checked={notifications.webhookNotifications}
                    onCheckedChange={(checked) => setNotifications({...notifications, webhookNotifications: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="font-medium text-foreground">Marketing Emails</div>
                    <div className="text-sm text-muted-foreground">
                      Receive product updates and marketing communications
                    </div>
                  </div>
                  <Switch 
                    checked={notifications.marketingEmails}
                    onCheckedChange={(checked) => setNotifications({...notifications, marketingEmails: checked})}
                  />
                </div>
                <Button onClick={handleNotificationSave} className="gap-2 bg-mypay-green hover:bg-mypay-green-dark">
                  <Save className="h-4 w-4" />
                  Save Preferences
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  )
}
