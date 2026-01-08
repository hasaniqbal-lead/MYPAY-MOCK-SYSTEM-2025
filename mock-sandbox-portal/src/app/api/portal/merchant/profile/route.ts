import { NextRequest, NextResponse } from 'next/server'

// Demo merchant data
const DEMO_MERCHANTS: Record<string, any> = {
  'demo-merchant-001': {
    id: 'demo-merchant-001',
    email: 'demo@mypay.com',
    companyName: 'Demo Merchant',
    businessType: 'E-commerce',
    country: 'Pakistan',
    phone: '+92 300 1234567',
    website: 'https://demo-merchant.com',
    address: '123 Business Street, Karachi',
  },
  'demo-merchant-002': {
    id: 'demo-merchant-002',
    email: 'admin@mypay.com',
    companyName: 'Admin Test Merchant',
    businessType: 'Retail',
    country: 'UAE',
    phone: '+971 50 1234567',
    website: 'https://admin-merchant.com',
    address: '456 Commerce Ave, Dubai',
  },
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]

    // Decode the mock token to get merchant ID
    let merchantId: string
    try {
      const decoded = Buffer.from(token, 'base64').toString()
      merchantId = decoded.split(':')[0]
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      )
    }

    const merchant = DEMO_MERCHANTS[merchantId]

    if (!merchant) {
      return NextResponse.json(
        { success: false, error: 'Merchant not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      merchant,
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const data = await request.json()

    return NextResponse.json({
      success: true,
      merchant: data,
      message: 'Profile updated successfully',
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    )
  }
}
