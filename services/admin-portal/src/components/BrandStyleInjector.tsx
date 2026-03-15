'use client'

import { brandConfig } from '@/lib/brand-config'
import { hexToHsl, darkenHex } from '@/lib/color-utils'

/**
 * Injects dynamic CSS variables based on the org's primary color.
 * Overrides the defaults in globals.css so all Tailwind brand colors respond.
 */
export function BrandStyleInjector() {
  if (!process.env.NEXT_PUBLIC_ORG_PRIMARY_COLOR) return null

  const primaryHsl = hexToHsl(brandConfig.primaryColor)
  const primaryDarkHsl = hexToHsl(darkenHex(brandConfig.primaryColor, 20))

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `:root {
  --primary: ${primaryHsl};
  --ring: ${primaryHsl};
  --darpay-primary: ${primaryHsl};
  --darpay-primary-dark: ${primaryDarkHsl};
  --gradient-primary: linear-gradient(135deg, hsl(${primaryHsl}), hsl(${primaryDarkHsl}));
  --shadow-brand: 0 4px 20px hsl(${primaryHsl} / 0.1);
}`,
      }}
    />
  )
}
