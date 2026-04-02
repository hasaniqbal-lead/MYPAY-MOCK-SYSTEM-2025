import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { BrandStyleInjector } from '@/components/BrandStyleInjector'

const inter = Inter({ subsets: ['latin'] })

const brandName = process.env.NEXT_PUBLIC_ORG_BRAND_NAME || 'Mint'

export const metadata: Metadata = {
  title: `${brandName} Admin Portal`,
  description: `Admin Portal for ${brandName} Payment Platform`,
  icons: {
    icon: process.env.NEXT_PUBLIC_ORG_LOGO_URL || '/default-logo.webp',
    apple: process.env.NEXT_PUBLIC_ORG_LOGO_URL || '/default-logo.webp',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className={inter.className}>
        <BrandStyleInjector />
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
