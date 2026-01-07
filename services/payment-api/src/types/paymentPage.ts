/**
 * Payment Page Configuration Types
 * Defines theming, branding, and visual customization for dynamic payment pages
 */

// ============================================================================
// PAYMENT METHODS
// ============================================================================

export type PaymentMethod = 'easypaisa' | 'jazzcash' | 'card' | 'stripe' | 'payfast' | 'swich';

export interface ChannelSettings {
  requiresOTP?: boolean;
  otpLength?: number;
  otpTimeout?: number;
  otpResendLimit?: number;
  requiresPhone?: boolean;
  requiresEmail?: boolean;
}

export interface CustomChannelConfig {
  name?: string;
  icon?: string;
  description?: string;
}

// ============================================================================
// UI VISIBILITY CONFIG
// ============================================================================

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
    showBreakdown?: boolean;
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
    showValidationErrors?: boolean;
  };
  otp?: {
    showTimer?: boolean;
    showResendButton?: boolean;
    showHelpText?: boolean;
  };
  processing?: {
    showSpinner?: boolean;
    showMessage?: boolean;
    showProgress?: boolean;
  };
  success?: {
    showIcon?: boolean;
    showMessage?: boolean;
    showTransactionId?: boolean;
    showAmount?: boolean;
    showConfetti?: boolean;
    showCTA?: boolean;
    showDownloadReceipt?: boolean;
  };
  failure?: {
    showIcon?: boolean;
    showMessage?: boolean;
    showErrorDetails?: boolean;
    showRetryButton?: boolean;
    showSupportInfo?: boolean;
  };
  footer?: {
    show?: boolean;
    showPoweredBy?: boolean;
    showSecurityBadge?: boolean;
    showLegalLinks?: boolean;
  };
}

// ============================================================================
// CHANNEL LAYOUT CONFIG
// ============================================================================

export interface ChannelLayoutConfig {
  displayStyle?: 'grid' | 'list' | 'tabs' | 'cards';
  columnCount?: {
    mobile?: 1 | 2;
    tablet?: 2 | 3;
    desktop?: 2 | 3 | 4;
  };
  spacing?: 'compact' | 'normal' | 'spacious';
  gap?: number;
  iconPosition?: 'left' | 'top' | 'right' | 'none';
  iconSize?: 'sm' | 'md' | 'lg';
  buttonHeight?: 'sm' | 'md' | 'lg' | 'auto';
  buttonWidth?: 'full' | 'fit';
  showBorder?: boolean;
  showShadow?: boolean;
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'full';
}

export interface ChannelFeatureConfig {
  enabled?: boolean;
  visible?: boolean;
  position?: number;
  customName?: string;
  customDescription?: string;
  customIcon?: string;
  badge?: string;
  badgeColor?: string;
}

// ============================================================================
// FORM FIELD CONFIG
// ============================================================================

export interface FormFieldConfig {
  phone?: {
    required?: boolean;
    visible?: boolean;
    label?: string;
    placeholder?: string;
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    errorMessages?: {
      required?: string;
      invalid?: string;
    };
  };
  email?: {
    required?: boolean;
    visible?: boolean;
    label?: string;
    placeholder?: string;
    errorMessages?: {
      required?: string;
      invalid?: string;
    };
  };
  name?: {
    required?: boolean;
    visible?: boolean;
    label?: string;
    placeholder?: string;
    minLength?: number;
    maxLength?: number;
  };
  card?: {
    showCardNumber?: boolean;
    showExpiry?: boolean;
    showCVV?: boolean;
    showCardholderName?: boolean;
    cardNumberFormat?: 'spaces' | 'dashes' | 'none';
    labels?: {
      cardNumber?: string;
      expiry?: string;
      cvv?: string;
      cardholderName?: string;
    };
    placeholders?: {
      cardNumber?: string;
      expiry?: string;
      cvv?: string;
      cardholderName?: string;
    };
  };
}

// ============================================================================
// OTP CONFIG
// ============================================================================

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

// ============================================================================
// RESPONSIVE CONFIG
// ============================================================================

export interface ResponsiveConfig {
  breakpoints?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  mobile?: {
    padding?: string;
    fontSize?: string;
    buttonSize?: string;
  };
  tablet?: {
    padding?: string;
    fontSize?: string;
    buttonSize?: string;
  };
  desktop?: {
    padding?: string;
    fontSize?: string;
    buttonSize?: string;
  };
}

// ============================================================================
// THEME CONFIGURATION SECTIONS
// ============================================================================

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
  layout?: ChannelLayoutConfig;
  channelFeatures?: Partial<Record<PaymentMethod, ChannelFeatureConfig>>;
  channelSettings?: Partial<Record<PaymentMethod, ChannelSettings>>;
  customChannels?: Partial<Record<PaymentMethod, CustomChannelConfig>>;
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
  termsDisplayMode?: 'popup' | 'redirect' | 'hyperlink';
  showPrivacy: boolean;
  privacyText?: string;
  privacyUrl?: string;
  privacyDisplayMode?: 'popup' | 'redirect' | 'hyperlink';
  showRefund: boolean;
  refundText?: string;
  refundUrl?: string;
  refundDisplayMode?: 'popup' | 'redirect' | 'hyperlink';
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
  customJS?: string;
}

// ============================================================================
// MAIN THEME CONFIGURATION
// ============================================================================

export interface ThemeConfiguration {
  id: number;
  merchantId: number;
  name: string;
  description?: string;
  isDefault: boolean;
  isActive: boolean;

  // Core configuration sections
  branding: BrandingConfig;
  colors: ColorConfig;
  typography: TypographyConfig;
  layout: LayoutConfig;
  channels: ChannelsConfig;
  text: TextConfig;
  legal: LegalConfig;
  resultPages: ResultPagesConfig;
  advanced: AdvancedConfig;

  // Extended configuration (Portal features)
  visibility?: UIVisibilityConfig;
  formConfig?: FormFieldConfig;
  otpConfig?: OTPConfigExtended;
  responsive?: ResponsiveConfig;

  // Metadata
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// TEMPLATE TYPES
// ============================================================================

export interface ThemeTemplate {
  id: number;
  name: string;
  slug: string;
  category: string;
  description?: string;
  thumbnailUrl?: string;
  configuration: Partial<ThemeConfiguration>;
  tags: string[];
  isActive: boolean;
  isFeatured: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// ADMIN RULE TYPES
// ============================================================================

export type RuleType = 'required' | 'allowed_values' | 'locked' | 'regex' | 'range';

export interface RuleValue {
  // For 'locked' rule type
  value?: unknown;
  // For 'allowed_values' rule type
  values?: unknown[];
  // For 'regex' rule type
  pattern?: string;
  // For 'range' rule type
  min?: number;
  max?: number;
  // Common
  message?: string;
}

export interface PaymentPageRule {
  id: number;
  fieldPath: string;
  ruleType: RuleType;
  ruleValue: RuleValue;
  description?: string;
  isActive: boolean;
  priority: number;
  createdBy?: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface CreateConfigRequest {
  name: string;
  description?: string;
  isDefault?: boolean;
  branding?: Partial<BrandingConfig>;
  colors?: Partial<ColorConfig>;
  typography?: Partial<TypographyConfig>;
  layout?: Partial<LayoutConfig>;
  channels?: Partial<ChannelsConfig>;
  text?: Partial<TextConfig>;
  legal?: Partial<LegalConfig>;
  resultPages?: Partial<ResultPagesConfig>;
  advanced?: Partial<AdvancedConfig>;
  visibility?: UIVisibilityConfig;
  formConfig?: FormFieldConfig;
  otpConfig?: OTPConfigExtended;
}

export interface UpdateConfigRequest extends Partial<CreateConfigRequest> {}

export interface CreateFromTemplateRequest {
  templateId: number;
  name: string;
  description?: string;
}

export interface CreateRuleRequest {
  fieldPath: string;
  ruleType: RuleType;
  ruleValue: RuleValue;
  description?: string;
  isActive?: boolean;
  priority?: number;
}

export interface UpdateRuleRequest extends Partial<CreateRuleRequest> {}

export interface CreateTemplateRequest {
  name: string;
  slug: string;
  category: string;
  description?: string;
  thumbnailUrl?: string;
  configuration: Partial<ThemeConfiguration>;
  tags?: string[];
  isActive?: boolean;
  isFeatured?: boolean;
}

export interface UpdateTemplateRequest extends Partial<CreateTemplateRequest> {}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

export interface ValidationError {
  field: string;
  message: string;
  rule: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

// ============================================================================
// SESSION CONFIG (for payment page frontend)
// ============================================================================

export interface PaymentSessionConfig {
  checkoutId: string;
  reference: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: string;
  expiresAt: string;
  merchantId: number;
  merchantName: string;
  configuration: ThemeConfiguration;
}
