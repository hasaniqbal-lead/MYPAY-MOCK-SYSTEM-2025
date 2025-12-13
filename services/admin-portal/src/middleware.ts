import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('admin_token')
  const { pathname } = request.nextUrl

  // Public routes (including landing page)
  const publicRoutes = ['/', '/login', '/register']
  const isPublicRoute = publicRoutes.includes(pathname)

  // Protected routes
  const protectedRoutes = ['/dashboard', '/transactions', '/credentials', '/settings']
  const isProtectedRoute = protectedRoutes.includes(pathname)

  // If accessing protected route without token, redirect to landing page
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}

