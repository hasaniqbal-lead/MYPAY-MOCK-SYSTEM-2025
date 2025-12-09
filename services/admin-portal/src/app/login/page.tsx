'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { adminAPI } from '@/lib/api'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await adminAPI.login(email, password)
      
      if (response.success && response.token) {
        Cookies.set('admin_token', response.token, { expires: 7 })
        router.push('/dashboard')
      } else {
        setError(response.error || 'Login failed')
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } }
      setError(error.response?.data?.error || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex flex-col items-center justify-center gap-2">
            <img 
              src="/12cfc784-5cca-41b2-968b-2ab31add4c8d.png" 
              alt="MyPay Logo" 
              className="h-16 w-auto"
            />
            <div className="text-xs text-mypay-green font-medium tracking-wider">ADMIN PORTAL</div>
          </div>
          <CardTitle className="text-mypay-dark">Admin Login</CardTitle>
          <CardDescription>
            Sign in to access the admin dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@mycodigital.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12"
              />
            </div>
            
            <Button
              type="submit"
              className="w-full h-12 bg-mypay-green hover:bg-mypay-green-dark text-white"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-mypay-green/10 rounded-lg border border-mypay-green/20">
            <p className="text-xs text-muted-foreground mb-2">Test Credentials:</p>
            <p className="text-xs text-foreground">Email: admin@mycodigital.io</p>
            <p className="text-xs text-foreground">Password: admin123456</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
