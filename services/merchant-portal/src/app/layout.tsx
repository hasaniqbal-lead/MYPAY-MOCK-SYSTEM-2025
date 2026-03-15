import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { BrandStyleInjector } from '@/components/BrandStyleInjector'

const inter = Inter({ subsets: ['latin'] })

const brandName = process.env.NEXT_PUBLIC_ORG_BRAND_NAME || 'DarPay'

export const metadata: Metadata = {
  title: `${brandName} Merchant Portal`,
  description: `Merchant portal for managing payment API credentials and transactions`,
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <BrandStyleInjector />
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
