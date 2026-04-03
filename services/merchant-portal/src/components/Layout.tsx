'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'
import { Home, ArrowUpDown, Shield, Settings, Palette, RotateCcw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { brandConfig } from '@/lib/brand-config'
import BottomNav from '@/components/BottomNav'
import MobileDrawer from '@/components/MobileDrawer'

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Transactions', href: '/transactions', icon: ArrowUpDown },
    { name: 'Refunds', href: '/refunds', icon: RotateCcw },
    { name: 'Payment Page', href: '/payment-page', icon: Palette },
    { name: 'Credentials', href: '/credentials', icon: Shield },
    { name: 'Settings', href: '/settings', icon: Settings },
  ]

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Desktop Sidebar — hidden on mobile */}
      <aside className="hidden md:flex w-64 bg-card border-r border-border flex-shrink-0 flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <img
              src={brandConfig.logoUrl}
              alt={`${brandConfig.brandName} Logo`}
              className="h-14 w-auto flex-shrink-0"
            />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-4">
            Main
          </p>
          {navigation.map((item) => {
            const active = isActive(item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-darpay-primary/10 text-darpay-primary border-r-2 border-darpay-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                }`}
              >
                <Icon className="h-4 w-4 mr-3 flex-shrink-0" />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 md:h-16 bg-card border-b border-border flex items-center justify-between px-4 md:px-6">
          {/* Mobile: logo */}
          <div className="flex items-center gap-3 md:hidden">
            <img
              src={brandConfig.logoUrl}
              alt={brandConfig.brandName}
              className="h-8 w-auto"
            />
            <span className="font-semibold text-sm text-foreground">{brandConfig.brandName}</span>
          </div>

          {/* Desktop: badge */}
          <div className="hidden md:flex items-center gap-4">
            <Badge variant="secondary" className="text-xs bg-darpay-primary/10 text-darpay-primary">
              Sandbox Mode
            </Badge>
          </div>

          {/* Right side — user info */}
          <div className="flex items-center gap-2 md:gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-darpay-primary rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {user?.companyName?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="text-sm hidden md:block">
                <div className="font-medium text-foreground">{user?.companyName}</div>
                <div className="text-xs text-muted-foreground">ID: {user?.id}</div>
              </div>
            </div>
            {/* Desktop only logout */}
            <button
              onClick={handleLogout}
              className="hidden md:block px-4 py-2 bg-darpay-primary hover:bg-darpay-primary-dark text-white text-sm font-medium rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Main Content — extra bottom padding on mobile for bottom nav */}
        <main className="flex-1 p-4 md:p-6 overflow-auto bg-background pb-20 md:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <BottomNav onMoreClick={() => setDrawerOpen(true)} />

      {/* Mobile Drawer */}
      <MobileDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  )
}
