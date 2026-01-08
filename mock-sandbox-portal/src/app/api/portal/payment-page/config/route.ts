import { NextRequest, NextResponse } from 'next/server'

// Default payment page configuration
const DEFAULT_CONFIG = {
  branding: {
    logoUrl: '',
    primaryColor: '#10B981',
    backgroundColor: '#FFFFFF',
    textColor: '#1F2937',
    fontFamily: 'Inter',
  },
  content: {
    title: 'Complete Payment',
    description: 'Secure payment powered by MyPay',
    footerText: 'Protected by MyPay secure payments',
    showPoweredBy: true,
  },
  paymentMethods: {
    card: true,
    easypaisa: true,
    jazzcash: true,
    bankTransfer: false,
  },
  fields: {
    customerName: { enabled: true, required: true },
    customerEmail: { enabled: true, required: true },
    customerPhone: { enabled: true, required: false },
    billingAddress: { enabled: false, required: false },
  },
  settings: {
    allowPartialPayments: false,
    showOrderSummary: true,
    enableReceipt: true,
    redirectUrl: '',
    webhookUrl: '',
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

    return NextResponse.json({
      success: true,
      config: DEFAULT_CONFIG,
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
    const merchantId = getMerchantIdFromToken(request.headers.get('authorization'))

    if (!merchantId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const config = await request.json()

    return NextResponse.json({
      success: true,
      config,
      message: 'Configuration updated successfully',
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const merchantId = getMerchantIdFromToken(request.headers.get('authorization'))

    if (!merchantId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const updates = await request.json()

    return NextResponse.json({
      success: true,
      config: { ...DEFAULT_CONFIG, ...updates },
      message: 'Section updated successfully',
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    )
  }
}
