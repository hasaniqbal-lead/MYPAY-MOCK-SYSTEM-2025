import { NextRequest, NextResponse } from 'next/server'

// Demo credentials data
const DEMO_CREDENTIALS: Record<string, any> = {
  'demo-merchant-001': {
    apiKey: 'pk_test_demo001_abcd1234efgh5678',
    apiSecret: 'sk_test_demo001_ijkl9012mnop3456',
    vendorId: 'VND-DEMO-001',
    webhookSecret: 'whsec_demo001_qrst7890uvwx1234',
    environment: 'sandbox',
    createdAt: '2024-01-15T10:30:00Z',
    lastUsed: '2024-01-20T14:25:00Z',
  },
  'demo-merchant-002': {
    apiKey: 'pk_test_admin002_wxyz5678abcd1234',
    apiSecret: 'sk_test_admin002_efgh9012ijkl3456',
    vendorId: 'VND-ADMIN-002',
    webhookSecret: 'whsec_admin002_mnop7890qrst1234',
    environment: 'sandbox',
    createdAt: '2024-01-10T08:15:00Z',
    lastUsed: '2024-01-21T09:45:00Z',
  },
}

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

    const credentials = DEMO_CREDENTIALS[merchantId] || {
      apiKey: `pk_test_${merchantId.replace('merchant-', '')}_${Math.random().toString(36).substring(2, 10)}`,
      apiSecret: `sk_test_${merchantId.replace('merchant-', '')}_${Math.random().toString(36).substring(2, 10)}`,
      vendorId: `VND-${merchantId.replace('merchant-', '').toUpperCase()}`,
      webhookSecret: `whsec_${merchantId.replace('merchant-', '')}_${Math.random().toString(36).substring(2, 10)}`,
      environment: 'sandbox',
      createdAt: new Date().toISOString(),
      lastUsed: null,
    }

    return NextResponse.json({
      success: true,
      credentials,
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

    // Generate new credentials
    const newCredentials = {
      apiKey: `pk_test_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
      apiSecret: `sk_test_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
      vendorId: `VND-${merchantId.replace('merchant-', '').toUpperCase()}`,
      webhookSecret: `whsec_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
      environment: 'sandbox',
      createdAt: new Date().toISOString(),
      lastUsed: null,
    }

    return NextResponse.json({
      success: true,
      credentials: newCredentials,
      message: 'New API key generated successfully',
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    )
  }
}
