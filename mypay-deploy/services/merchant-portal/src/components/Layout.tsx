'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'
import { Home, ArrowUpDown, Shield, Settings } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  const iconMap: Record<string, React.ReactNode> = {
    Home: <Home className="h-4 w-4 flex-shrink-0" />,
    ArrowUpDown: <ArrowUpDown className="h-4 w-4 flex-shrink-0" />,
    Shield: <Shield className="h-4 w-4 flex-shrink-0" />,
    Settings: <Settings className="h-4 w-4 flex-shrink-0" />,
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: 'Home' },
    { name: 'Transactions', href: '/transactions', icon: 'ArrowUpDown' },
    { name: 'Credentials', href: '/credentials', icon: 'Shield' },
    { name: 'Settings', href: '/settings', icon: 'Settings' },
  ]

  const isActive = (href: string) => pathname === href

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Left Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex-shrink-0">
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-4 md:p-6 border-b border-border">
            <div className="flex items-center gap-2">
              <img 
                src="/12cfc784-5cca-41b2-968b-2ab31add4c8d.png" 
                alt="MyPay Logo" 
                className="h-14 w-auto flex-shrink-0"
              />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            <div className="mb-6">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Main
              </p>
              {navigation.map((item) => {
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`
                      flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors
                      ${
                        active
                          ? 'bg-mypay-green/10 text-mypay-green font-medium border-r-2 border-mypay-green'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                      }
                    `}
                  >
                    <span className="mr-3">{iconMap[item.icon]}</span>
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2 md:gap-4">
            <Badge variant="secondary" className="text-xs bg-mypay-green/10 text-mypay-green">
              Sandbox Mode
            </Badge>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-mypay-green rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {user?.companyName?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="text-sm hidden md:block">
                <div className="font-medium text-foreground">{user?.companyName}</div>
                <div className="text-xs text-muted-foreground">Merchant ID: {user?.id}</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-mypay-green hover:bg-mypay-green-dark text-white text-sm font-medium rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto bg-background">
          {children}
        </main>
      </div>
    </div>
  )
}

