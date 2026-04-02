'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ArrowUpDown, Key, Palette, MoreHorizontal } from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/transactions', label: 'Txns', icon: ArrowUpDown },
  { href: '/payment-page', label: 'Pay Page', icon: Palette },
  { href: '/credentials', label: 'Keys', icon: Key },
]

export default function BottomNav({ onMoreClick }: { onMoreClick: () => void }) {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 safe-bottom">
      <div className="flex items-center justify-around h-16 px-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 rounded-lg transition-colors ${
                isActive ? 'text-darpay-primary' : 'text-muted-foreground'
              }`}
            >
              <item.icon className={`h-5 w-5 ${isActive ? 'text-darpay-primary' : ''}`} />
              <span className="text-[10px] font-medium leading-tight">{item.label}</span>
            </Link>
          )
        })}
        <button
          onClick={onMoreClick}
          className="flex flex-col items-center justify-center gap-0.5 flex-1 py-2 rounded-lg text-muted-foreground transition-colors"
        >
          <MoreHorizontal className="h-5 w-5" />
          <span className="text-[10px] font-medium leading-tight">More</span>
        </button>
      </div>
    </nav>
  )
}
