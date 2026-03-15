// Centralized brand configuration — reads from NEXT_PUBLIC_ORG_* env vars.
// Defaults to DarPay branding if no env vars are set.
export const brandConfig = {
  brandName: process.env.NEXT_PUBLIC_ORG_BRAND_NAME || 'DarPay',
  slug: process.env.NEXT_PUBLIC_ORG_SLUG || 'darpay',
  primaryColor: process.env.NEXT_PUBLIC_ORG_PRIMARY_COLOR || '#2dd4a8',
  logoUrl: process.env.NEXT_PUBLIC_ORG_LOGO_URL || '/default-logo.webp',
  logoDarkUrl: process.env.NEXT_PUBLIC_ORG_LOGO_DARK_URL || '/default-logo.webp',
  supportEmail: process.env.NEXT_PUBLIC_ORG_SUPPORT_EMAIL || 'support@darpay.net',
};
