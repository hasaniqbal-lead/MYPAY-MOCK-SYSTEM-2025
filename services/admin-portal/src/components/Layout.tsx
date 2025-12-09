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
  Menu,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface LayoutProps {
  children: React.ReactNode
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/merchants', label: 'Merchants', icon: Users },
  { href: '/transactions', label: 'Payments', icon: CreditCard },
  { href: '/payouts', label: 'Payouts', icon: Wallet },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default function Layout({ children }: LayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    Cookies.remove('admin_token')
    router.push('/login')
  }

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
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
              {navItems.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-mypay-green/10 text-mypay-green font-medium border-r-2 border-mypay-green'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-border">
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-accent/50"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5 mr-3" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2 md:gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-muted-foreground"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </Button>
            <Badge variant="secondary" className="text-xs bg-mypay-green/10 text-mypay-green">
              Admin Portal
            </Badge>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-mypay-green rounded-full flex items-center justify-center text-white font-semibold text-sm">
                A
              </div>
              <div className="text-sm hidden md:block">
                <div className="font-medium text-foreground">System Admin</div>
                <div className="text-xs text-muted-foreground">Super Admin</div>
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

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto bg-background">{children}</main>
      </div>
    </div>
  )
}
