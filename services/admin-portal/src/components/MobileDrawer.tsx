'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Settings, LogOut, X, ChevronRight, RefreshCcw, Palette, MessageSquare, Banknote } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { brandConfig } from '@/lib/brand-config'

interface MobileDrawerProps {
  isOpen: boolean
  onClose: () => void
}

const drawerItems = [
  { href: '/refunds', label: 'Refunds', icon: RefreshCcw },
  { href: '/settlements', label: 'Settlements', icon: Banknote },
  { href: '/tickets', label: 'Support', icon: MessageSquare },
  { href: '/payment-page', label: 'Payment Page', icon: Palette },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
  const { admin, logout } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    onClose()
    logout()
    router.push('/login')
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-2xl shadow-2xl border-t border-border animate-in slide-in-from-bottom duration-200 safe-bottom">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
        </div>

        {/* Profile */}
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-darpay-primary flex items-center justify-center text-white font-semibold">
              {admin?.name?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">{admin?.name || 'Admin'}</p>
              <p className="text-xs text-muted-foreground">{admin?.role || 'Administrator'}</p>
            </div>
            <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Menu items */}
        <div className="px-4 py-3 space-y-1">
          {drawerItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-accent transition-colors"
            >
              <item.icon className="h-5 w-5 text-muted-foreground" />
              <span className="flex-1 text-sm font-medium">{item.label}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          ))}

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-destructive/10 transition-colors w-full text-left"
          >
            <LogOut className="h-5 w-5 text-destructive" />
            <span className="flex-1 text-sm font-medium text-destructive">Logout</span>
          </button>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border">
          <p className="text-[10px] text-muted-foreground text-center">
            {brandConfig.brandName} Admin Portal
          </p>
        </div>
      </div>
    </>
  )
}
