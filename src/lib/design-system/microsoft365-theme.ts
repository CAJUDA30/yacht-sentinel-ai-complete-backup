/**
 * Microsoft 365 Design System for Yacht Excel AI Operations
 * Enterprise-grade design tokens, colors, typography, and spacing
 */

export const Microsoft365Theme = {
  // Colors based on Microsoft Fluent Design System
  colors: {
    // Primary brand colors
    brand: {
      primary: '#0078d4',      // Microsoft Blue
      primaryDark: '#106ebe',
      primaryLight: '#40e0d0',
      secondary: '#605e5c',    // Microsoft Gray
      accent: '#0078d4',
    },
    
    // Semantic colors
    semantic: {
      success: '#107c10',      // Microsoft Green
      warning: '#ff8c00',      // Microsoft Orange  
      error: '#d13438',        // Microsoft Red
      info: '#0078d4',         // Microsoft Blue
      neutral: '#8a8886',      // Microsoft Neutral
    },
    
    // Background colors
    background: {
      canvas: '#faf9f8',       // Microsoft Canvas
      surface: '#ffffff',      // Microsoft Surface
      overlay: '#f3f2f1',      // Microsoft Overlay
      subtle: '#edebe9',       // Microsoft Subtle
    },
    
    // Text colors
    text: {
      primary: '#323130',      // Microsoft Text Primary
      secondary: '#605e5c',    // Microsoft Text Secondary
      disabled: '#a19f9d',     // Microsoft Text Disabled
      white: '#ffffff',
      onBrand: '#ffffff',
    },
    
    // Border colors  
    border: {
      subtle: '#edebe9',       // Microsoft Border Subtle
      neutral: '#d2d0ce',      // Microsoft Border Neutral
      strong: '#8a8886',       // Microsoft Border Strong
    },
    
    // Shadow colors
    shadow: {
      ambient: 'rgba(0, 0, 0, 0.12)',
      key: 'rgba(0, 0, 0, 0.14)',
      card: '0 2px 4px rgba(0, 0, 0, 0.1)',
      elevated: '0 4px 8px rgba(0, 0, 0, 0.12)',
      focus: '0 0 0 2px rgba(0, 120, 212, 0.4)',
    }
  },
  
  // Typography system
  typography: {
    fonts: {
      primary: '"Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      monospace: '"Cascadia Code", "SF Mono", "Monaco", "Inconsolata", monospace',
    },
    
    sizes: {
      // Display
      display: '42px',
      displaySubtle: '32px',
      
      // Headings
      h1: '28px',
      h2: '24px', 
      h3: '20px',
      h4: '18px',
      h5: '16px',
      h6: '14px',
      
      // Body
      body: '14px',
      bodyLarge: '16px',
      bodySmall: '12px',
      
      // Captions
      caption: '12px',
      captionSmall: '10px',
    },
    
    weights: {
      light: 300,
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    
    lineHeights: {
      tight: 1.2,
      normal: 1.4,
      relaxed: 1.6,
      loose: 1.8,
    }
  },
  
  // Spacing system (4px base unit)
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '32px',
    '4xl': '40px',
    '5xl': '48px',
    '6xl': '64px',
  },
  
  // Border radius
  radius: {
    none: '0px',
    sm: '2px',
    md: '4px',
    lg: '8px',
    xl: '12px',
    full: '9999px',
  },
  
  // Animation and transitions
  animation: {
    duration: {
      fast: '150ms',
      normal: '200ms',
      slow: '300ms',
    },
    
    easing: {
      easeOut: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0.0, 1, 1)',
      easeInOut: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    }
  },
  
  // Component tokens
  components: {
    button: {
      height: {
        sm: '24px',
        md: '32px',
        lg: '40px',
        xl: '48px',
      },
      padding: {
        sm: '0 8px',
        md: '0 12px', 
        lg: '0 16px',
        xl: '0 20px',
      }
    },
    
    card: {
      padding: {
        sm: '12px',
        md: '16px',
        lg: '20px',
        xl: '24px',
      },
      radius: '8px',
      shadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    },
    
    input: {
      height: {
        sm: '24px',
        md: '32px', 
        lg: '40px',
      },
      borderWidth: '1px',
      focusBorderWidth: '2px',
    }
  },
  
  // Layout system
  layout: {
    containerMaxWidth: '1200px',
    sidebarWidth: '240px',
    headerHeight: '48px',
    
    breakpoints: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    
    grid: {
      columns: 12,
      gap: '16px',
    }
  },
  
  // Z-index system
  zIndex: {
    base: 0,
    dropdown: 1000,
    sticky: 1100,
    banner: 1200,
    overlay: 1300,
    modal: 1400,
    popover: 1500,
    tooltip: 1600,
  }
} as const;

// CSS Custom Properties for runtime theming
export const createCSSVariables = (theme = Microsoft365Theme) => ({
  // Colors
  '--color-brand-primary': theme.colors.brand.primary,
  '--color-brand-secondary': theme.colors.brand.secondary,
  '--color-success': theme.colors.semantic.success,
  '--color-warning': theme.colors.semantic.warning,
  '--color-error': theme.colors.semantic.error,
  '--color-info': theme.colors.semantic.info,
  
  // Backgrounds
  '--color-bg-canvas': theme.colors.background.canvas,
  '--color-bg-surface': theme.colors.background.surface,
  '--color-bg-overlay': theme.colors.background.overlay,
  
  // Text
  '--color-text-primary': theme.colors.text.primary,
  '--color-text-secondary': theme.colors.text.secondary,
  '--color-text-disabled': theme.colors.text.disabled,
  
  // Typography
  '--font-family-primary': theme.typography.fonts.primary,
  '--font-size-body': theme.typography.sizes.body,
  '--font-weight-regular': theme.typography.weights.regular,
  '--font-weight-semibold': theme.typography.weights.semibold,
  
  // Spacing
  '--spacing-xs': theme.spacing.xs,
  '--spacing-sm': theme.spacing.sm,
  '--spacing-md': theme.spacing.md,
  '--spacing-lg': theme.spacing.lg,
  '--spacing-xl': theme.spacing.xl,
  
  // Radius
  '--radius-sm': theme.radius.sm,
  '--radius-md': theme.radius.md,
  '--radius-lg': theme.radius.lg,
  
  // Shadows
  '--shadow-card': theme.colors.shadow.card,
  '--shadow-elevated': theme.colors.shadow.elevated,
  '--shadow-focus': theme.colors.shadow.focus,
});

export type Microsoft365ThemeType = typeof Microsoft365Theme;