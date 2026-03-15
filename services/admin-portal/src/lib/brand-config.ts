// Centralized brand configuration — reads from NEXT_PUBLIC_ORG_* env vars.
export const brandConfig = {
  brandName: process.env.NEXT_PUBLIC_ORG_BRAND_NAME || 'Mint',
  slug: process.env.NEXT_PUBLIC_ORG_SLUG || 'mint',
  primaryColor: process.env.NEXT_PUBLIC_ORG_PRIMARY_COLOR || '#f5a623',
  logoUrl: process.env.NEXT_PUBLIC_ORG_LOGO_URL || '/default-logo.webp',
  logoDarkUrl: process.env.NEXT_PUBLIC_ORG_LOGO_DARK_URL || '/default-logo.webp',
  supportEmail: process.env.NEXT_PUBLIC_ORG_SUPPORT_EMAIL || 'support@mint.pay',
};
