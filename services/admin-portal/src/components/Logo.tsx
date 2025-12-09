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
        <img 
          src="/12cfc784-5cca-41b2-968b-2ab31add4c8d.png" 
          alt="MyPay Logo" 
          className="h-14 w-auto flex-shrink-0"
        />
        {showTag && (
          <span className="ml-2 px-2 py-0.5 bg-mypay-green text-white text-xs rounded">
            Admin Portal
          </span>
        )}
      </div>
    </Link>
  )
}
