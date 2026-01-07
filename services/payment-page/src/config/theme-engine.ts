import { ThemeConfiguration } from '../types';

/**
 * Apply theme configuration as CSS variables
 */
export function applyTheme(config: ThemeConfiguration): void {
  const root = document.documentElement;

  // Colors
  root.style.setProperty('--color-primary', config.colors.primary);
  root.style.setProperty('--color-secondary', config.colors.secondary);
  root.style.setProperty('--color-accent', config.colors.accent);
  root.style.setProperty('--color-success', config.colors.success);
  root.style.setProperty('--color-error', config.colors.error);
  root.style.setProperty('--color-warning', config.colors.warning);
  root.style.setProperty('--color-background', config.colors.background);
  root.style.setProperty('--color-surface', config.colors.surface);
  root.style.setProperty('--color-text-primary', config.colors.text.primary);
  root.style.setProperty('--color-text-secondary', config.colors.text.secondary);
  root.style.setProperty('--color-text-disabled', config.colors.text.disabled);

  // Typography
  root.style.setProperty('--font-family', config.typography.fontFamily);
  root.style.setProperty('--font-size-heading', config.typography.fontSize.heading);
  root.style.setProperty('--font-size-body', config.typography.fontSize.body);
  root.style.setProperty('--font-size-small', config.typography.fontSize.small);
  root.style.setProperty('--font-weight-heading', String(config.typography.fontWeight.heading));
  root.style.setProperty('--font-weight-body', String(config.typography.fontWeight.body));

  // Layout
  root.style.setProperty('--border-radius', config.layout.borderRadius);
  root.style.setProperty('--max-width', config.layout.maxWidth);
  root.style.setProperty('--padding', config.layout.padding);

  // Update meta theme-color
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', config.colors.background);
  }

  // Update body background
  document.body.style.backgroundColor = config.colors.background;

  // Apply custom CSS if provided
  if (config.advanced.customCSS) {
    let styleEl = document.getElementById('custom-theme-styles');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'custom-theme-styles';
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = config.advanced.customCSS;
  }

  // Load custom font if specified
  if (config.typography.fontFamily && !config.typography.fontFamily.includes('system-ui')) {
    const fontName = config.typography.fontFamily.split(',')[0].trim().replace(/['"]/g, '');
    if (!document.querySelector(`link[href*="${fontName}"]`)) {
      const link = document.createElement('link');
      link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@400;500;600;700&display=swap`;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
  }
}

/**
 * Reset theme to defaults
 */
export function resetTheme(): void {
  const root = document.documentElement;

  // Reset to default dark theme
  root.style.setProperty('--color-primary', '#10B981');
  root.style.setProperty('--color-secondary', '#3B82F6');
  root.style.setProperty('--color-accent', '#10B981');
  root.style.setProperty('--color-success', '#10B981');
  root.style.setProperty('--color-error', '#EF4444');
  root.style.setProperty('--color-warning', '#F59E0B');
  root.style.setProperty('--color-background', '#0F172A');
  root.style.setProperty('--color-surface', '#1E293B');
  root.style.setProperty('--color-text-primary', '#F8FAFC');
  root.style.setProperty('--color-text-secondary', '#94A3B8');
  root.style.setProperty('--color-text-disabled', '#64748B');
  root.style.setProperty('--font-family', 'Inter, system-ui, sans-serif');
  root.style.setProperty('--border-radius', '0.75rem');
  root.style.setProperty('--max-width', '28rem');
  root.style.setProperty('--padding', '1.5rem');

  // Remove custom styles
  const customStyles = document.getElementById('custom-theme-styles');
  if (customStyles) {
    customStyles.remove();
  }
}
