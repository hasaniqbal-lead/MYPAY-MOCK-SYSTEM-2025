/**
 * Payment Page Configuration Types
 * Matches the types from mypay-payment-page-v2/shared/types
 */

export type PaymentMethod = 'easypaisa' | 'jazzcash' | 'card' | 'stripe' | 'payfast' | 'swich'

export interface BrandingConfig {
  merchantLogo: string
  merchantName: string
  favicon?: string
  backgroundImage?: string
  backgroundGradient?: string
}

export interface ColorConfig {
  primary: string
  secondary: string
  accent: string
  success: string
  error: string
  warning: string
  background: string
  surface: string
  text: {
    primary: string
    secondary: string
    disabled: string
  }
}

export interface TypographyConfig {
  fontFamily: string
  fontSize: {
    heading: string
    body: string
    small: string
  }
  fontWeight: {
    heading: number
    body: number
  }
}

export interface LayoutConfig {
  type: 'centered' | 'split' | 'full-width'
  maxWidth: string
  padding: string
  borderRadius: string
  shadow: string
}

export interface ChannelsConfig {
  enabled: PaymentMethod[]
  displayStyle: 'grid' | 'list' | 'tabs'
  showIcons: boolean
  channelOrder?: Partial<Record<PaymentMethod, number>>
  channelVisibility?: Partial<Record<PaymentMethod, boolean>>
}

export interface TextConfig {
  heading: string
  subheading?: string
  amountLabel: string
  channelSelectionLabel: string
  buttons: {
    payNow: string
    cancel: string
    retry: string
    back: string
    continue: string
  }
  messages: {
    processing: string
    success: string
    failure: string
    expired: string
  }
}

export interface LegalConfig {
  showTerms: boolean
  termsText?: string
  termsUrl?: string
  showPrivacy: boolean
  privacyText?: string
  privacyUrl?: string
  showRefund: boolean
  refundText?: string
  refundUrl?: string
}

export interface SuccessPageConfig {
  showConfetti: boolean
  message: string
  submessage?: string
  showTransactionId: boolean
  autoRedirect: boolean
  autoRedirectDelay?: number
}

export interface FailurePageConfig {
  message: string
  submessage?: string
  showRetry: boolean
  showSupport: boolean
  supportEmail?: string
  supportPhone?: string
}

export interface ResultPagesConfig {
  success: SuccessPageConfig
  failure: FailurePageConfig
}

export interface AdvancedConfig {
  showPoweredBy: boolean
  enableAnalytics: boolean
  customCSS?: string
  customJS?: string
}

export interface ThemeConfiguration {
  id: string
  merchantId: string
  name: string
  description?: string
  isDefault: boolean
  isActive: boolean
  branding: BrandingConfig
  colors: ColorConfig
  typography: TypographyConfig
  layout: LayoutConfig
  channels: ChannelsConfig
  text: TextConfig
  legal: LegalConfig
  resultPages: ResultPagesConfig
  advanced: AdvancedConfig
  createdAt: string
  updatedAt: string
}

export interface PaymentChannel {
  id: PaymentMethod
  name: string
  description: string
  enabled: boolean
  order: number
  icon?: string
}

export interface PaymentLinkRequest {
  amount: number
  currency: string
  reference: string
  description?: string
  expiresIn?: number
  callbackUrl?: string
  metadata?: Record<string, any>
}

export interface PaymentLink {
  token: string
  paymentUrl: string
  amount: number
  currency: string
  reference: string
  status: 'active' | 'completed' | 'expired' | 'cancelled'
  expiresAt: string
  createdAt: string
}

// Default configuration for new merchants
export const DEFAULT_THEME_CONFIG: Partial<ThemeConfiguration> = {
  branding: {
    merchantLogo: '',
    merchantName: '',
  },
  colors: {
    primary: '#10B981',
    secondary: '#3B82F6',
    accent: '#8B5CF6',
    success: '#22C55E',
    error: '#EF4444',
    warning: '#F59E0B',
    background: '#0F172A',
    surface: '#1E293B',
    text: {
      primary: '#F8FAFC',
      secondary: '#94A3B8',
      disabled: '#64748B',
    },
  },
  typography: {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: {
      heading: '1.5rem',
      body: '1rem',
      small: '0.875rem',
    },
    fontWeight: {
      heading: 600,
      body: 400,
    },
  },
  layout: {
    type: 'centered',
    maxWidth: 'md',
    padding: 'normal',
    borderRadius: 'lg',
    shadow: 'lg',
  },
  channels: {
    enabled: ['easypaisa', 'jazzcash', 'card'],
    displayStyle: 'list',
    showIcons: true,
    channelOrder: {
      easypaisa: 1,
      jazzcash: 2,
      card: 3,
      stripe: 4,
      payfast: 5,
      swich: 6,
    },
    channelVisibility: {
      easypaisa: true,
      jazzcash: true,
      card: true,
      stripe: false,
      payfast: false,
      swich: false,
    },
  },
  text: {
    heading: 'Complete Your Payment',
    subheading: 'Select your preferred payment method',
    amountLabel: 'Amount to Pay',
    channelSelectionLabel: 'Payment Method',
    buttons: {
      payNow: 'Pay Now',
      cancel: 'Cancel',
      retry: 'Try Again',
      back: 'Back',
      continue: 'Continue',
    },
    messages: {
      processing: 'Processing your payment...',
      success: 'Payment successful!',
      failure: 'Payment failed. Please try again.',
      expired: 'This payment link has expired.',
    },
  },
  legal: {
    showTerms: true,
    showPrivacy: true,
    showRefund: false,
  },
  resultPages: {
    success: {
      showConfetti: true,
      message: 'Payment Successful!',
      submessage: 'Thank you for your payment.',
      showTransactionId: true,
      autoRedirect: false,
    },
    failure: {
      message: 'Payment Failed',
      submessage: 'Something went wrong. Please try again.',
      showRetry: true,
      showSupport: true,
    },
  },
  advanced: {
    showPoweredBy: true,
    enableAnalytics: false,
  },
}

// Available payment channels
export const AVAILABLE_CHANNELS: PaymentChannel[] = [
  {
    id: 'easypaisa',
    name: 'Easypaisa',
    description: 'Pay with your Easypaisa wallet',
    enabled: true,
    order: 1,
  },
  {
    id: 'jazzcash',
    name: 'JazzCash',
    description: 'Pay with your JazzCash wallet',
    enabled: true,
    order: 2,
  },
  {
    id: 'card',
    name: 'Credit/Debit Card',
    description: 'Pay with Visa, Mastercard, or other cards',
    enabled: true,
    order: 3,
  },
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'International card payments via Stripe',
    enabled: false,
    order: 4,
  },
  {
    id: 'payfast',
    name: 'PayFast',
    description: 'Fast and secure payments',
    enabled: false,
    order: 5,
  },
  {
    id: 'swich',
    name: 'Swich',
    description: 'Pay with Swich',
    enabled: false,
    order: 6,
  },
]
