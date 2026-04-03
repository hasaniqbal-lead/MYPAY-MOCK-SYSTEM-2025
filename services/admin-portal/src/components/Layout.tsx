'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Wallet,
  Settings,
  LogOut,
  Palette,
  Wrench,
  RefreshCcw,
  MessageSquare,
  Banknote,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { brandConfig } from '@/lib/brand-config'
import BottomNav from '@/components/BottomNav'
import MobileDrawer from '@/components/MobileDrawer'

const allNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/merchants', label: 'Merchants', icon: Users },
  { href: '/transactions', label: 'Payments', icon: CreditCard },
  { href: '/payouts', label: 'Payouts', icon: Wallet },
  { href: '/refunds', label: 'Refunds', icon: RefreshCcw },
  { href: '/settlements', label: 'Settlements', icon: Banknote },
  { href: '/tickets', label: 'Support', icon: MessageSquare },
  { href: '/payment-page', label: 'Payment Page', icon: Palette },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const handleLogout = () => {
    Cookies.remove('admin_token')
    router.push('/login')
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Desktop Sidebar — hidden on mobile */}
      <aside className="hidden lg:flex w-64 bg-card border-r border-border flex-shrink-0 flex-col">
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
          {allNavItems.map((item) => {
            const active = isActive(item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-darpay-primary/10 text-darpay-primary border-r-2 border-darpay-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                }`}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-border">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 lg:h-16 bg-card border-b border-border flex items-center justify-between px-4 lg:px-6">
          {/* Mobile: logo */}
          <div className="flex items-center gap-3 lg:hidden">
            <img
              src={brandConfig.logoUrl}
              alt={brandConfig.brandName}
              className="h-8 w-auto"
            />
            <span className="font-semibold text-sm text-foreground">{brandConfig.brandName}</span>
          </div>

          {/* Desktop: badge */}
          <div className="hidden lg:flex items-center gap-4">
            <Badge variant="secondary" className="text-xs bg-darpay-primary/10 text-darpay-primary">
              Admin Portal
            </Badge>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 lg:gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-darpay-primary rounded-full flex items-center justify-center text-white font-semibold text-sm">
                A
              </div>
              <div className="text-sm hidden lg:block">
                <div className="font-medium text-foreground">System Admin</div>
                <div className="text-xs text-muted-foreground">Administrator</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="hidden lg:block px-4 py-2 bg-darpay-primary hover:bg-darpay-primary-dark text-white text-sm font-medium rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Content — extra bottom padding on mobile */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto bg-background pb-20 lg:pb-6">
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
