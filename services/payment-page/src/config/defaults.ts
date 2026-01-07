import { ThemeConfiguration, PaymentMethod } from '../types';

/**
 * Default theme configuration
 * Used as fallback when no merchant configuration is available
 */
export const defaultThemeConfiguration: ThemeConfiguration = {
  id: 0,
  merchantId: 0,
  name: 'Default',
  isDefault: true,
  isActive: true,

  branding: {
    merchantLogo: '',
    merchantName: 'MyPay',
  },

  colors: {
    primary: '#10B981',
    secondary: '#3B82F6',
    accent: '#10B981',
    success: '#10B981',
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
    maxWidth: '28rem',
    padding: '1.5rem',
    borderRadius: '0.75rem',
    shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
  },

  channels: {
    enabled: ['easypaisa', 'jazzcash', 'card'] as PaymentMethod[],
    displayStyle: 'list',
    showIcons: true,
  },

  text: {
    heading: 'Complete Payment',
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
      success: 'Payment Successful!',
      failure: 'Payment Failed',
      expired: 'This payment session has expired',
    },
  },

  legal: {
    showTerms: true,
    termsText: 'Terms of Service',
    showPrivacy: true,
    privacyText: 'Privacy Policy',
    showRefund: false,
  },

  resultPages: {
    success: {
      showConfetti: true,
      message: 'Payment Successful!',
      submessage: 'Thank you for your payment',
      showTransactionId: true,
      autoRedirect: true,
      autoRedirectDelay: 5,
    },
    failure: {
      message: 'Payment Failed',
      submessage: 'We were unable to process your payment',
      showRetry: true,
      showSupport: true,
      supportEmail: 'support@mypay.com',
    },
  },

  advanced: {
    showPoweredBy: true,
    enableAnalytics: false,
  },
};

/**
 * Merge user config with defaults
 */
export function mergeWithDefaults(
  config: Partial<ThemeConfiguration> | null
): ThemeConfiguration {
  if (!config) {
    return defaultThemeConfiguration;
  }

  return {
    ...defaultThemeConfiguration,
    ...config,
    branding: {
      ...defaultThemeConfiguration.branding,
      ...(config.branding || {}),
    },
    colors: {
      ...defaultThemeConfiguration.colors,
      ...(config.colors || {}),
      text: {
        ...defaultThemeConfiguration.colors.text,
        ...(config.colors?.text || {}),
      },
    },
    typography: {
      ...defaultThemeConfiguration.typography,
      ...(config.typography || {}),
      fontSize: {
        ...defaultThemeConfiguration.typography.fontSize,
        ...(config.typography?.fontSize || {}),
      },
      fontWeight: {
        ...defaultThemeConfiguration.typography.fontWeight,
        ...(config.typography?.fontWeight || {}),
      },
    },
    layout: {
      ...defaultThemeConfiguration.layout,
      ...(config.layout || {}),
    },
    channels: {
      ...defaultThemeConfiguration.channels,
      ...(config.channels || {}),
    },
    text: {
      ...defaultThemeConfiguration.text,
      ...(config.text || {}),
      buttons: {
        ...defaultThemeConfiguration.text.buttons,
        ...(config.text?.buttons || {}),
      },
      messages: {
        ...defaultThemeConfiguration.text.messages,
        ...(config.text?.messages || {}),
      },
    },
    legal: {
      ...defaultThemeConfiguration.legal,
      ...(config.legal || {}),
    },
    resultPages: {
      success: {
        ...defaultThemeConfiguration.resultPages.success,
        ...(config.resultPages?.success || {}),
      },
      failure: {
        ...defaultThemeConfiguration.resultPages.failure,
        ...(config.resultPages?.failure || {}),
      },
    },
    advanced: {
      ...defaultThemeConfiguration.advanced,
      ...(config.advanced || {}),
    },
  };
}
