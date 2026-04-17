/**
 * Centralized style constants to eliminate duplication across components.
 * These values are extracted from the codebase and organized by category.
 */

// ── Colors ───────────────────────────────────────────────────────────────────

export const COLORS = {
  // Navy/Dark backgrounds (primary theme)
  darkBg: '#080f16',           // Main dark background
  darkBgSecondary: '#0a1929',  // Secondary dark background
  darkBgTertiary: '#0c1e2d',   // Tertiary dark background
  darkBorder: '#0e2535',       // Dark border color

  // Header/Navy accents
  headerBg: '#0c3649',         // Header background
  headerLight: '#1e4a68',      // Lighter header shade

  // Text colors
  textLight: '#E8EDF5',        // Light text (headings, bright text)
  textMuted: '#7eaabf',        // Muted text (secondary text, labels)
  textDark: '#1B2A3D',         // Dark text
  textSecondary: '#4A6A7D',    // Secondary text
  textTertiary: '#6B8FA5',     // Tertiary text
  textGray: '#666',            // Gray text

  // Accents
  accentBlue: '#3491E8',       // Primary accent blue
  accentGreen: '#34d399',      // Green accent
  accentGreenBright: '#22C55E', // Bright green
  accentRed: '#ff8a8a',        // Red accent (errors, warnings)

  // Neutral
  white: '#fff',               // Pure white
  lightGray: '#F9FAFB',        // Very light gray

  // Borders
  borderLight: '#C4D4DE',      // Light border
};

// ── Spacing ─────────────────────────────────────────────────────────────────

export const SPACING = {
  // Padding/Margin units
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  xxl: '24px',
  xxxl: '32px',

  // Common composite values
  p_xs_sm: '4px 8px',           // Vertical: 4, Horizontal: 8
  p_sm: '8px 8px',              // All: 8
  p_sm_md: '8px 12px',          // Vertical: 8, Horizontal: 12
  p_md: '12px 12px',            // All: 12
  p_md_lg: '12px 16px',         // Vertical: 12, Horizontal: 16
  p_lg: '16px 16px',            // All: 16
  p_lg_xl: '16px 20px',         // Vertical: 16, Horizontal: 20
  p_xl: '20px 20px',            // All: 20
  p_xl_xxl: '20px 24px',        // Vertical: 20, Horizontal: 24
  p_xxl: '24px 24px',           // All: 24
  p_xxxl: '32px 32px',          // All: 32

  // Specific card padding (used in tables, cards)
  cardPadding: '18px 22px',
  cardPaddingLarge: '20px 24px',
  cardPaddingSmall: '14px 16px',

  // Table cell padding
  cellPaddingDense: '8px 14px',
  cellPaddingNormal: '10px 14px',
  cellPaddingComfy: '12px 16px',
};

// ── Border Radius ───────────────────────────────────────────────────────────

export const BORDER_RADIUS = {
  xs: '4px',
  sm: '6px',
  md: '8px',
  lg: '10px',
  xl: '12px',
  full: '9999px',
};

// ── Shadows ──────────────────────────────────────────────────────────────────

export const SHADOWS = {
  none: 'none',
  subtle: '0 1px 3px rgba(0,0,0,0.04)',
  small: '0 1px 2px rgba(0,0,0,0.05)',
  medium: '0 4px 6px rgba(0,0,0,0.07)',
  large: '0 10px 15px rgba(0,0,0,0.1)',
};

// ── Typography ──────────────────────────────────────────────────────────────

export const TYPOGRAPHY = {
  // Font sizes
  size_xs: '10px',
  size_sm: '11px',
  size_base: '12px',
  size_md: '12.5px',
  size_lg: '13px',
  size_xl: '14px',
  size_2xl: '16px',
  size_3xl: '18px',
  size_4xl: '20px',
  size_5xl: '24px',

  // Font weights
  weight_normal: 400,
  weight_medium: 500,
  weight_semibold: 600,
  weight_bold: 700,
  weight_extrabold: 800,

  // Line heights
  leading_tight: 1.2,
  leading_normal: 1.35,
  leading_relaxed: 1.5,
};

// ── Transitions/Animations ──────────────────────────────────────────────────

export const TRANSITIONS = {
  fast: '0.15s ease',
  normal: '0.2s ease',
  slow: '0.3s ease',
  verySlow: '0.5s ease',
};

// ── Gradient backgrounds ─────────────────────────────────────────────────────

export const GRADIENTS = {
  headerGradient: 'linear-gradient(135deg, #0c3649 0%, #0a2233 100%)',
};

// ── Borders ──────────────────────────────────────────────────────────────────

export const BORDERS = {
  headerBorder: '1px solid #1e4a68',
  lightBorder: '1px solid #1e4a68',
  subtleBorder: '1px solid #0a2233',
};

// ── Common style compositions ───────────────────────────────────────────────

export const COMMON_STYLES = {
  // Flex centering
  flexCenter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flexCenterVertical: {
    display: 'flex',
    alignItems: 'center',
  },
  flexCenterHorizontal: {
    display: 'flex',
    justifyContent: 'center',
  },

  // Truncate/ellipsis
  truncate: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  truncateMultiline: {
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
  },

  // Hidden scrollbar
  hideScrollbar: {
    scrollbarWidth: 'none' as const,
    msOverflowStyle: 'none' as const,
    '&::-webkit-scrollbar': {
      display: 'none',
    },
  },

  // Card base style
  card: {
    background: COLORS.white,
    border: '1px solid #E5E7EB',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.cardPadding,
    cursor: 'pointer' as const,
    transition: TRANSITIONS.normal,
    boxShadow: SHADOWS.subtle,
  },

  // Dark card style
  darkCard: {
    background: COLORS.headerBg,
    border: BORDERS.headerBorder,
    borderRadius: BORDER_RADIUS.lg,
  },

  // Button base
  buttonBase: {
    cursor: 'pointer' as const,
    transition: TRANSITIONS.normal,
    border: 'none',
    borderRadius: BORDER_RADIUS.md,
    fontWeight: TYPOGRAPHY.weight_semibold,
  },

  // Input base
  inputBase: {
    borderRadius: BORDER_RADIUS.md,
    border: '1px solid #E5E7EB',
    padding: SPACING.p_md_lg,
    fontSize: TYPOGRAPHY.size_base,
    fontFamily: 'inherit',
    transition: TRANSITIONS.normal,
    '&:focus': {
      outline: 'none',
      borderColor: COLORS.accentBlue,
    },
  },
};
