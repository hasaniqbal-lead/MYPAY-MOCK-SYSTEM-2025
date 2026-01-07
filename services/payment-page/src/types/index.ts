// Payment methods supported
export type PaymentMethod = 'easypaisa' | 'jazzcash' | 'card' | 'stripe' | 'payfast' | 'swich';

// Payment flow stages
export type PaymentStage =
  | 'loading'
  | 'channel_selection'
  | 'user_input'
  | 'otp_verification'
  | 'processing'
  | 'success'
  | 'failure'
  | 'expired';

// Session data from API
export interface PaymentSession {
  checkoutId: string;
  reference: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: string;
  merchantId: number | null;
  merchantName: string;
  configuration: ThemeConfiguration | null;
}

// Theme configuration
export interface BrandingConfig {
  merchantLogo: string;
  merchantName: string;
  favicon?: string;
  backgroundImage?: string;
  backgroundGradient?: string;
}

export interface ColorConfig {
  primary: string;
  secondary: string;
  accent: string;
  success: string;
  error: string;
  warning: string;
  background: string;
  surface: string;
  text: {
    primary: string;
    secondary: string;
    disabled: string;
  };
}

export interface TypographyConfig {
  fontFamily: string;
  fontSize: {
    heading: string;
    body: string;
    small: string;
  };
  fontWeight: {
    heading: number;
    body: number;
  };
}

export interface LayoutConfig {
  type: 'centered' | 'split' | 'full-width';
  maxWidth: string;
  padding: string;
  borderRadius: string;
  shadow: string;
}

export interface ChannelsConfig {
  enabled: PaymentMethod[];
  displayStyle: 'grid' | 'list' | 'tabs';
  showIcons: boolean;
  channelOrder?: Partial<Record<PaymentMethod, number>>;
  channelVisibility?: Partial<Record<PaymentMethod, boolean>>;
}

export interface TextConfig {
  heading: string;
  subheading?: string;
  amountLabel: string;
  channelSelectionLabel: string;
  buttons: {
    payNow: string;
    cancel: string;
    retry: string;
    back: string;
    continue: string;
  };
  messages: {
    processing: string;
    success: string;
    failure: string;
    expired: string;
  };
}

export interface LegalConfig {
  showTerms: boolean;
  termsText?: string;
  termsUrl?: string;
  showPrivacy: boolean;
  privacyText?: string;
  privacyUrl?: string;
  showRefund: boolean;
  refundText?: string;
  refundUrl?: string;
}

export interface SuccessPageConfig {
  showConfetti: boolean;
  message: string;
  submessage?: string;
  ctaText?: string;
  ctaUrl?: string;
  showTransactionId: boolean;
  autoRedirect: boolean;
  autoRedirectDelay?: number;
}

export interface FailurePageConfig {
  message: string;
  submessage?: string;
  showRetry: boolean;
  showSupport: boolean;
  supportEmail?: string;
  supportPhone?: string;
}

export interface ResultPagesConfig {
  success: SuccessPageConfig;
  failure: FailurePageConfig;
}

export interface AdvancedConfig {
  showPoweredBy: boolean;
  enableAnalytics: boolean;
  customCSS?: string;
}

export interface UIVisibilityConfig {
  header?: {
    show?: boolean;
    showMerchantLogo?: boolean;
    showMerchantName?: boolean;
    showReferenceNumber?: boolean;
    showPageTitle?: boolean;
    showSubheading?: boolean;
  };
  amount?: {
    show?: boolean;
    showLabel?: boolean;
    showCurrency?: boolean;
  };
  channels?: {
    showIcons?: boolean;
    showNames?: boolean;
    showDescriptions?: boolean;
    showArrows?: boolean;
  };
  form?: {
    showPhoneField?: boolean;
    showEmailField?: boolean;
    showNameField?: boolean;
    showLabels?: boolean;
    showPlaceholders?: boolean;
  };
  footer?: {
    show?: boolean;
    showPoweredBy?: boolean;
    showSecurityBadge?: boolean;
    showLegalLinks?: boolean;
  };
}

export interface FormFieldConfig {
  phone?: {
    required?: boolean;
    visible?: boolean;
    label?: string;
    placeholder?: string;
    pattern?: string;
    minLength?: number;
    maxLength?: number;
  };
  email?: {
    required?: boolean;
    visible?: boolean;
    label?: string;
    placeholder?: string;
  };
}

export interface OTPConfigExtended {
  enabled?: boolean;
  length?: 4 | 5 | 6;
  timeout?: number;
  resendLimit?: number;
  resendCooldown?: number;
  messages?: {
    sent?: string;
    resent?: string;
    expired?: string;
    invalid?: string;
    maxResends?: string;
  };
  inputStyle?: 'boxes' | 'underline' | 'single';
  showTimer?: boolean;
  autoSubmit?: boolean;
}

// Full theme configuration
export interface ThemeConfiguration {
  id: number;
  merchantId: number;
  name: string;
  description?: string;
  isDefault: boolean;
  isActive: boolean;
  branding: BrandingConfig;
  colors: ColorConfig;
  typography: TypographyConfig;
  layout: LayoutConfig;
  channels: ChannelsConfig;
  text: TextConfig;
  legal: LegalConfig;
  resultPages: ResultPagesConfig;
  advanced: AdvancedConfig;
  visibility?: UIVisibilityConfig;
  formConfig?: FormFieldConfig;
  otpConfig?: OTPConfigExtended;
}

// Channel display info
export interface ChannelInfo {
  id: PaymentMethod;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  badge?: string;
  position?: number;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface SessionResponse {
  success: boolean;
  session: PaymentSession;
}

export interface CompletePaymentRequest {
  mobileNumber: string;
  otp?: string;
}

export interface CompletePaymentResponse {
  success: boolean;
  status: string;
  statusCode: string;
  message: string;
  requiresOTP?: boolean;
}
