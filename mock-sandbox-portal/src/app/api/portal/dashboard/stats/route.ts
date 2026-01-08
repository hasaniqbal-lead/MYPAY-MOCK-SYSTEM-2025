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

    // Return mock dashboard stats
    const stats = {
      totalTransactions: 1247,
      successfulTransactions: 1156,
      failedTransactions: 91,
      successRate: 92.7,
      totalAmount: 2547850,
      pendingTransactions: 23,
      todayTransactions: 45,
      todayAmount: 125600,
      weeklyGrowth: 12.5,
      monthlyGrowth: 8.2,
    }

    return NextResponse.json({
      success: true,
      stats,
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    )
  }
}
