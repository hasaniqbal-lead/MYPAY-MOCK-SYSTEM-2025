import { NextRequest, NextResponse } from 'next/server'

const TEMPLATES = [
  {
    id: 'modern-minimal',
    name: 'Modern Minimal',
    description: 'Clean and simple design with focus on conversion',
    thumbnail: '/templates/modern-minimal.png',
    config: {
      branding: {
        primaryColor: '#10B981',
        backgroundColor: '#FFFFFF',
        textColor: '#1F2937',
        fontFamily: 'Inter',
      },
    },
  },
  {
    id: 'dark-professional',
    name: 'Dark Professional',
    description: 'Professional dark theme for premium brands',
    thumbnail: '/templates/dark-professional.png',
    config: {
      branding: {
        primaryColor: '#6366F1',
        backgroundColor: '#1F2937',
        textColor: '#F9FAFB',
        fontFamily: 'Inter',
      },
    },
  },
  {
    id: 'vibrant-retail',
    name: 'Vibrant Retail',
    description: 'Colorful and engaging for retail businesses',
    thumbnail: '/templates/vibrant-retail.png',
    config: {
      branding: {
        primaryColor: '#F59E0B',
        backgroundColor: '#FFFBEB',
        textColor: '#1F2937',
        fontFamily: 'Poppins',
      },
    },
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

    return NextResponse.json({
      success: true,
      templates: TEMPLATES,
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    )
  }
}
