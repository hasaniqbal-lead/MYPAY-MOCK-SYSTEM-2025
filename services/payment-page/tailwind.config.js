/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dynamic colors via CSS variables (set by theme engine)
        primary: 'var(--color-primary, #10B981)',
        secondary: 'var(--color-secondary, #3B82F6)',
        accent: 'var(--color-accent, #10B981)',
        success: 'var(--color-success, #10B981)',
        error: 'var(--color-error, #EF4444)',
        warning: 'var(--color-warning, #F59E0B)',
        // Backgrounds
        background: 'var(--color-background, #0F172A)',
        surface: 'var(--color-surface, #1E293B)',
        'surface-light': 'var(--color-surface-light, #334155)',
        // Text colors
        'text-primary': 'var(--color-text-primary, #F8FAFC)',
        'text-secondary': 'var(--color-text-secondary, #94A3B8)',
        'text-disabled': 'var(--color-text-disabled, #64748B)',
        // Border colors
        border: 'var(--color-border, #334155)',
        'border-light': 'var(--color-border-light, #475569)',
      },
      fontFamily: {
        sans: ['var(--font-family, Inter)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -2px rgba(0, 0, 0, 0.2)',
        'card-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -4px rgba(0, 0, 0, 0.3)',
      },
    },
  },
  plugins: [],
}
