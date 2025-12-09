/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://sandbox.mycodigital.io',
    NEXT_PUBLIC_PORTAL_URL: process.env.NEXT_PUBLIC_PORTAL_URL || 'https://devportal.mycodigital.io',
  },
  // Ensure public files are properly served
  async rewrites() {
    return []
  },
}

module.exports = nextConfig

