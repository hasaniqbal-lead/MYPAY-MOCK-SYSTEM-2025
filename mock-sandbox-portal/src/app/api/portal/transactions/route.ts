import { NextRequest, NextResponse } from 'next/server'

// Mock transaction data
const MOCK_TRANSACTIONS = [
  {
    checkout_id: 'CHK-001-2024',
    reference: 'ORD-12345',
    amount: 15000,
    status: 'success',
    payment_method: 'card',
    created_at: '2024-01-20T14:30:00Z',
    customer_email: 'customer1@example.com',
    currency: 'PKR',
  },
  {
    checkout_id: 'CHK-002-2024',
    reference: 'ORD-12346',
    amount: 8500,
    status: 'success',
    payment_method: 'easypaisa',
    created_at: '2024-01-20T12:15:00Z',
    customer_email: 'customer2@example.com',
    currency: 'PKR',
  },
  {
    checkout_id: 'CHK-003-2024',
    reference: 'ORD-12347',
    amount: 22000,
    status: 'pending',
    payment_method: 'jazzcash',
    created_at: '2024-01-20T10:45:00Z',
    customer_email: 'customer3@example.com',
    currency: 'PKR',
  },
  {
    checkout_id: 'CHK-004-2024',
    reference: 'ORD-12348',
    amount: 5600,
    status: 'failed',
    payment_method: 'card',
    created_at: '2024-01-19T18:20:00Z',
    customer_email: 'customer4@example.com',
    currency: 'PKR',
  },
  {
    checkout_id: 'CHK-005-2024',
    reference: 'ORD-12349',
    amount: 35000,
    status: 'success',
    payment_method: 'e-billing',
    created_at: '2024-01-19T15:00:00Z',
    customer_email: 'customer5@example.com',
    currency: 'PKR',
  },
  {
    checkout_id: 'CHK-006-2024',
    reference: 'ORD-12350',
    amount: 12500,
    status: 'success',
    payment_method: 'card',
    created_at: '2024-01-19T11:30:00Z',
    customer_email: 'customer6@example.com',
    currency: 'PKR',
  },
  {
    checkout_id: 'CHK-007-2024',
    reference: 'ORD-12351',
    amount: 9800,
    status: 'completed',
    payment_method: 'easypaisa',
    created_at: '2024-01-18T16:45:00Z',
    customer_email: 'customer7@example.com',
    currency: 'PKR',
  },
  {
    checkout_id: 'CHK-008-2024',
    reference: 'ORD-12352',
    amount: 45000,
    status: 'success',
    payment_method: 'card',
    created_at: '2024-01-18T09:20:00Z',
    customer_email: 'customer8@example.com',
    currency: 'PKR',
  },
  {
    checkout_id: 'CHK-009-2024',
    reference: 'ORD-12353',
    amount: 7200,
    status: 'pending',
    payment_method: 'jazzcash',
    created_at: '2024-01-17T14:10:00Z',
    customer_email: 'customer9@example.com',
    currency: 'PKR',
  },
  {
    checkout_id: 'CHK-010-2024',
    reference: 'ORD-12354',
    amount: 18900,
    status: 'failed',
    payment_method: 'e-billing',
    created_at: '2024-01-17T08:55:00Z',
    customer_email: 'customer10@example.com',
    currency: 'PKR',
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
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    let filteredTransactions = [...MOCK_TRANSACTIONS]

    // Filter by status
    if (status && status !== 'all') {
      filteredTransactions = filteredTransactions.filter(
        (t) => t.status.toLowerCase() === status.toLowerCase()
      )
    }

    // Filter by date range
    if (startDate) {
      const start = new Date(startDate)
      filteredTransactions = filteredTransactions.filter(
        (t) => new Date(t.created_at) >= start
      )
    }

    if (endDate) {
      const end = new Date(endDate)
      filteredTransactions = filteredTransactions.filter(
        (t) => new Date(t.created_at) <= end
      )
    }

    // Pagination
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex)

    return NextResponse.json({
      success: true,
      transactions: paginatedTransactions,
      pagination: {
        page,
        limit,
        total: filteredTransactions.length,
        totalPages: Math.ceil(filteredTransactions.length / limit),
      },
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    )
  }
}
