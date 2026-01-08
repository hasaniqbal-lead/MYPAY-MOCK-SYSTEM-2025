import { NextRequest, NextResponse } from 'next/server'

// Mock payment links storage
const MOCK_PAYMENT_LINKS = [
  {
    id: 'link-001',
    token: 'pay_abc123xyz789',
    amount: 15000,
    currency: 'PKR',
    reference: 'INV-2024-001',
    description: 'Invoice payment',
    status: 'active',
    url: 'https://pay.mypay.mx/pay_abc123xyz789',
    createdAt: '2024-01-20T10:00:00Z',
    expiresAt: '2024-02-20T10:00:00Z',
    views: 5,
    payments: 0,
  },
  {
    id: 'link-002',
    token: 'pay_def456uvw012',
    amount: 25000,
    currency: 'PKR',
    reference: 'INV-2024-002',
    description: 'Product purchase',
    status: 'completed',
    url: 'https://pay.mypay.mx/pay_def456uvw012',
    createdAt: '2024-01-18T14:30:00Z',
    expiresAt: '2024-02-18T14:30:00Z',
    views: 12,
    payments: 1,
  },
]

function getMerchantIdFromToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.split(' ')[1]
  try {
    const decoded = Buffer.from(token, 'base64').toString()
    return decoded.split(':')[0]
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const merchantId = getMerchantIdFromToken(request.headers.get('authorization'))

    if (!merchantId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')

    let filteredLinks = [...MOCK_PAYMENT_LINKS]

    if (status && status !== 'all') {
      filteredLinks = filteredLinks.filter((l) => l.status === status)
    }

    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedLinks = filteredLinks.slice(startIndex, endIndex)

    return NextResponse.json({
      success: true,
      links: paginatedLinks,
      pagination: {
        page,
        limit,
        total: filteredLinks.length,
        totalPages: Math.ceil(filteredLinks.length / limit),
      },
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const merchantId = getMerchantIdFromToken(request.headers.get('authorization'))

    if (!merchantId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { amount, currency, reference, description, expiresIn, callbackUrl } = await request.json()

    if (!amount || !currency || !reference) {
      return NextResponse.json(
        { success: false, error: 'Amount, currency, and reference are required' },
        { status: 400 }
      )
    }

    const token = `pay_${Math.random().toString(36).substring(2, 15)}`
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + (expiresIn || 30))

    const newLink = {
      id: `link-${Date.now()}`,
      token,
      amount,
      currency,
      reference,
      description: description || '',
      status: 'active',
      url: `https://pay.mypay.mx/${token}`,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
      callbackUrl: callbackUrl || '',
      views: 0,
      payments: 0,
    }

    return NextResponse.json({
      success: true,
      link: newLink,
      message: 'Payment link created successfully',
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    )
  }
}
