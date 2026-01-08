import { NextRequest, NextResponse } from 'next/server'

// Demo credentials for local development
const DEMO_USERS = [
  {
    id: 'demo-merchant-001',
    email: 'demo@mypay.com',
    username: 'demo',
    password: 'demo123',
    companyName: 'Demo Merchant',
  },
  {
    id: 'demo-merchant-002',
    email: 'admin@mypay.com',
    username: 'admin',
    password: 'admin123',
    companyName: 'Admin Test Merchant',
  },
]

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Find user by email or username
    const user = DEMO_USERS.find(
      (u) => (u.email === email || u.username === email) && u.password === password
    )

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Generate a mock token
    const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64')

    return NextResponse.json({
      success: true,
      token,
      merchant: {
        id: user.id,
        email: user.email,
        companyName: user.companyName,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    )
  }
}
