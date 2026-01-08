/** @type {import('next').NextConfig} */

// Determine if running in local development mode
const isLocalDev = process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_API_URL

const nextConfig = {
  output: 'standalone',
  env: {
    // In local dev without explicit API URL, use empty string (relative URLs hit local Next.js API routes)
    // In production or when API URL is set, use the provided/default remote URL
    NEXT_PUBLIC_API_URL: isLocalDev ? '' : (process.env.NEXT_PUBLIC_API_URL || 'https://sandbox.mycodigital.io'),
    NEXT_PUBLIC_PORTAL_URL: process.env.NEXT_PUBLIC_PORTAL_URL || 'https://devportal.mycodigital.io',
  },
  // Ensure public files are properly served
  async rewrites() {
    return []
  },
}

module.exports = nextConfig

