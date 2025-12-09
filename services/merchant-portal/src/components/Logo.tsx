'use client'

import Link from 'next/link'

interface LogoProps {
  className?: string
  showTag?: boolean
}

export default function Logo({ className = '', showTag = false }: LogoProps) {
  return (
    <Link href="/dashboard" className={`flex items-center ${className}`}>
      <div className="flex items-center">
        <span className="text-2xl font-bold">
          <span className="text-primary-400" style={{ fontFamily: 'system-ui, -apple-system' }}>
            my
          </span>
          <span className="text-white dark:text-white" style={{ fontFamily: 'system-ui, -apple-system' }}>
            pay
          </span>
        </span>
        {showTag && (
          <span className="ml-2 px-2 py-0.5 bg-green-800 text-white text-xs rounded">
            Merchant Platform
          </span>
        )}
      </div>
    </Link>
  )
}

