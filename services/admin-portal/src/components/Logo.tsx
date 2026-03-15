'use client'

import Link from 'next/link'
import { brandConfig } from '@/lib/brand-config'

interface LogoProps {
  className?: string
  showTag?: boolean
}

export default function Logo({ className = '', showTag = false }: LogoProps) {
  return (
    <Link href="/dashboard" className={`flex items-center ${className}`}>
      <div className="flex items-center">
        <img
          src={brandConfig.logoUrl}
          alt={`${brandConfig.brandName} Logo`}
          className="h-14 w-auto flex-shrink-0"
        />
        {showTag && (
          <span className="ml-2 px-2 py-0.5 bg-darpay-primary text-white text-xs rounded">
            Admin Portal
          </span>
        )}
      </div>
    </Link>
  )
}
