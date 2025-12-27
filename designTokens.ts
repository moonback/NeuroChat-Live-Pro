/**
 * Design Tokens - NeuroChat Live Pro
 * Système de design centralisé pour une cohérence visuelle
 */

// ============================================
// COULEURS
// ============================================

export const colors = {
  // Fond
  background: {
    primary: '#000000',
    secondary: '#0a0a0a',
    tertiary: '#0f0f19',
    elevated: '#1a1a24',
  },

  // Glassmorphisme
  glass: {
    light: 'rgba(15, 23, 42, 0.6)',
    medium: 'rgba(15, 23, 42, 0.75)',
    intense: 'rgba(15, 23, 42, 0.85)',
    border: 'rgba(255, 255, 255, 0.08)',
    borderHover: 'rgba(255, 255, 255, 0.15)',
    borderActive: 'rgba(255, 255, 255, 0.25)',
  },

  // Texte
  text: {
    primary: '#ffffff',
    secondary: 'rgba(255, 255, 255, 0.8)',
    tertiary: 'rgba(255, 255, 255, 0.6)',
    muted: 'rgba(255, 255, 255, 0.4)',
    disabled: 'rgba(255, 255, 255, 0.3)',
  },

  // États
  status: {
    success: {
      bg: 'rgba(16, 185, 129, 0.15)',
      border: 'rgba(16, 185, 129, 0.4)',
      text: '#10b981',
      glow: 'rgba(16, 185, 129, 0.5)',
      solid: '#10b981',
    },
    error: {
      bg: 'rgba(239, 68, 68, 0.15)',
      border: 'rgba(239, 68, 68, 0.4)',
      text: '#ef4444',
      glow: 'rgba(239, 68, 68, 0.5)',
      solid: '#ef4444',
    },
    warning: {
      bg: 'rgba(245, 158, 11, 0.15)',
      border: 'rgba(245, 158, 11, 0.4)',
      text: '#f59e0b',
      glow: 'rgba(245, 158, 11, 0.5)',
      solid: '#f59e0b',
    },
    info: {
      bg: 'rgba(99, 102, 241, 0.15)',
      border: 'rgba(99, 102, 241, 0.4)',
      text: '#6366f1',
      glow: 'rgba(99, 102, 241, 0.5)',
      solid: '#6366f1',
    },
  },

  // Accents (selon personnalité)
  accent: {
    primary: '#0ea5e9', // Sky Blue
    secondary: '#6366f1', // Indigo
    tertiary: '#8b5cf6', // Purple
  },
} as const;

// ============================================
// TYPOGRAPHIE
// ============================================

export const typography = {
  fontFamily: {
    display: "'Plus Jakarta Sans', sans-serif",
    body: "'Inter', sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', monospace",
  },

  fontSize: {
    'display-1': '3rem',      // 48px
    'display-2': '2.5rem',    // 40px
    'display-3': '2rem',      // 32px
    'h1': '1.875rem',         // 30px
    'h2': '1.5rem',           // 24px
    'h3': '1.25rem',          // 20px
    'h4': '1.125rem',         // 18px
    'body-lg': '1.125rem',    // 18px
    'body': '1rem',           // 16px
    'body-sm': '0.875rem',    // 14px
    'body-xs': '0.75rem',     // 12px
    'label': '0.875rem',      // 14px
    'label-sm': '0.75rem',    // 12px
    'caption': '0.625rem',    // 10px
  },

  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },

  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.6,
    loose: 1.8,
  },

  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
} as const;

// ============================================
// ESPACEMENTS (Système 8px)
// ============================================

export const spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',  // 48px
  '3xl': '4rem',  // 64px
  '4xl': '6rem',  // 96px
} as const;

// ============================================
// OMBRES & EFFETS
// ============================================

export const shadows = {
  sm: '0 2px 8px rgba(0, 0, 0, 0.2)',
  md: '0 4px 16px rgba(0, 0, 0, 0.3)',
  lg: '0 8px 32px rgba(0, 0, 0, 0.4)',
  xl: '0 16px 64px rgba(0, 0, 0, 0.5)',
  '2xl': '0 24px 80px rgba(0, 0, 0, 0.6)',
  
  // Glow effects
  glow: {
    primary: '0 0 20px rgba(14, 165, 233, 0.4)',
    success: '0 0 20px rgba(16, 185, 129, 0.4)',
    error: '0 0 20px rgba(239, 68, 68, 0.4)',
    warning: '0 0 20px rgba(245, 158, 11, 0.4)',
    info: '0 0 20px rgba(99, 102, 241, 0.4)',
  },
} as const;

// ============================================
// BORDER RADIUS
// ============================================

export const borderRadius = {
  none: '0',
  sm: '0.25rem',   // 4px
  md: '0.5rem',    // 8px
  lg: '0.75rem',   // 12px
  xl: '1rem',      // 16px
  '2xl': '1.5rem', // 24px
  '3xl': '2rem',   // 32px
  full: '9999px',
} as const;

// ============================================
// ANIMATIONS & TRANSITIONS
// ============================================

export const transitions = {
  duration: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
    slower: '500ms',
  },

  easing: {
    ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    spring: 'cubic-bezier(0.16, 1, 0.3, 1)', // Smooth spring-like
  },

  // Combinaisons courantes
  default: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
  smooth: 'all 300ms cubic-bezier(0.16, 1, 0.3, 1)',
  fast: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
} as const;

// ============================================
// BREAKPOINTS
// ============================================

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// ============================================
// Z-INDEX
// ============================================

export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
  toast: 1080,
} as const;

// ============================================
// HELPERS
// ============================================

/**
 * Génère une couleur avec opacité
 */
export const withOpacity = (color: string, opacity: number): string => {
  // Si c'est déjà rgba/rgb, extraire les valeurs
  if (color.startsWith('rgba') || color.startsWith('rgb')) {
    return color.replace(/[\d.]+\)$/g, `${opacity})`);
  }
  // Si c'est hex, convertir
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  return color;
};

/**
 * Génère un glow effect CSS
 */
export const getGlow = (color: string, intensity: number = 0.4): string => {
  return `0 0 ${intensity * 50}px ${withOpacity(color, intensity)}`;
};

