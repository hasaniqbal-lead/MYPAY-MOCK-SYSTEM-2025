import { NextRequest, NextResponse } from 'next/server'

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

    // Generate a preview URL with the merchant's configuration
    const previewToken = Buffer.from(`preview:${merchantId}:${Date.now()}`).toString('base64')
    const paymentPageUrl = process.env.NEXT_PUBLIC_PAYMENT_PAGE_URL || 'http://localhost:5173'

    return NextResponse.json({
      success: true,
      previewUrl: `${paymentPageUrl}/preview?token=${previewToken}`,
      expiresIn: 3600, // 1 hour
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    )
  }
}
