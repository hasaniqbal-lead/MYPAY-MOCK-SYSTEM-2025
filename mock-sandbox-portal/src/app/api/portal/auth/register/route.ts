import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { companyName, username } = await request.json()

    if (!companyName || !username) {
      return NextResponse.json(
        { success: false, error: 'Company name and username are required' },
        { status: 400 }
      )
    }

    // Generate a mock merchant ID
    const merchantId = `merchant-${Date.now()}`
    const token = Buffer.from(`${merchantId}:${Date.now()}`).toString('base64')

    return NextResponse.json({
      success: true,
      token,
      merchant: {
        id: merchantId,
        email: `${username}@example.com`,
        companyName,
        username,
      },
      message: 'Registration successful',
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    )
  }
}
