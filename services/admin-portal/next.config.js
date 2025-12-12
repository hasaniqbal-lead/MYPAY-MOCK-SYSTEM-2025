/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance optimizations
  compress: true,  // Enable built-in compression
  poweredByHeader: false,
  generateEtags: true,
  
  // Production optimizations
  swcMinify: true,  // Use SWC for faster minification
  reactStrictMode: true,
  
  // Image optimization
  images: {
    unoptimized: false,
    domains: ['mock.mycodigital.io'],
  },
  
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://mock.mycodigital.io',
    NEXT_PUBLIC_PORTAL_URL: process.env.NEXT_PUBLIC_PORTAL_URL || 'https://devadmin.mycodigital.io',
  },
  
  // Ensure public files are properly served
  async rewrites() {
    return []
  },
}

module.exports = nextConfig

