'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Settings, LogOut, X, User, ChevronRight } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { brandConfig } from '@/lib/brand-config'

interface MobileDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export default function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    onClose()
    await logout()
    router.push('/login')
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer — slides up from bottom */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-2xl shadow-2xl border-t border-border animate-in slide-in-from-bottom duration-200 safe-bottom">
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
        </div>

        {/* Profile section */}
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-darpay-primary flex items-center justify-center text-white font-semibold">
              {user?.companyName?.charAt(0).toUpperCase() || 'M'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">{user?.companyName || 'Merchant'}</p>
              <p className="text-xs text-muted-foreground">Merchant ID: {user?.id || '—'}</p>
            </div>
            <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Menu items */}
        <div className="px-4 py-3 space-y-1">
          <Link
            href="/settings"
            onClick={onClose}
            className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-accent transition-colors"
          >
            <Settings className="h-5 w-5 text-muted-foreground" />
            <span className="flex-1 text-sm font-medium">Settings</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>

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
            {brandConfig.brandName} Merchant Portal
          </p>
        </div>
      </div>
    </>
  )
}
