'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'
import { authAPI } from '@/lib/api'
import PasswordModal from '@/components/PasswordModal'

export default function RegisterForm() {
  const [formData, setFormData] = useState({
    companyName: '',
    username: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [generatedPassword, setGeneratedPassword] = useState('')
  const [generatedEmail, setGeneratedEmail] = useState('')
  const router = useRouter()

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^a-zA-Z]/g, '').toLowerCase()
    setFormData({ ...formData, username: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.companyName.trim()) {
      setError('Company name is required')
      return
    }

    if (!formData.username.trim()) {
      setError('Username is required')
      return
    }

    if (formData.username.length < 3) {
      setError('Username must be at least 3 characters')
      return
    }

    setLoading(true)

    try {
      const response = await authAPI.register({
        companyName: formData.companyName.trim(),
        username: formData.username.trim(),
      })

      setGeneratedPassword(response.password)
      setGeneratedEmail(response.merchant.email)
      setShowPasswordModal(true)
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false)
          router.push('/login')
        }}
        password={generatedPassword}
        email={generatedEmail}
      />
      
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-mypay-dark">Create Merchant Account</CardTitle>
          <CardDescription>
            Get started with MyPay's payment solutions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                placeholder="Enter your company name"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                disabled={loading}
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username *</Label>
              <div className="flex">
                <Input
                  id="username"
                  type="text"
                  placeholder="username"
                  value={formData.username}
                  onChange={handleUsernameChange}
                  disabled={loading}
                  className="h-10 rounded-r-none"
                />
                <span className="inline-flex items-center px-4 rounded-r-md border border-l-0 border-input bg-muted text-muted-foreground text-sm">
                  @mycodigital.io
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Letters only, no spaces. Your login email will be: <span className="font-mono text-mypay-green">{formData.username || 'username'}@mycodigital.io</span>
              </p>
            </div>

            <div className="bg-mypay-green/10 border border-mypay-green/20 rounded-lg p-4">
              <p className="text-xs text-mypay-dark">
                <strong>Note:</strong> Your password will be auto-generated and shown after registration. 
                Please save it securely as it cannot be recovered.
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full h-12 bg-mypay-green hover:bg-mypay-green-dark text-white"
              disabled={loading || !formData.companyName.trim() || formData.username.length < 3}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Create Merchant Account'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  )
}

