/**
 * Color utilities for hex/RGB conversions and color manipulations
 */

/**
 * Darken a hex color by reducing RGB components
 * @param hex - Color in #RRGGBB format
 * @param amount - Amount to reduce (default: 25)
 * @returns Darkened hex color
 */
export function darken(hex: string, amount: number = 25): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, ((n >> 16) & 0xff) - amount);
  const g = Math.max(0, ((n >> 8) & 0xff) - amount);
  const b = Math.max(0, (n & 0xff) - amount);
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

/**
 * Convert hex color to RGB object
 * @param hex - Color in #RRGGBB format
 * @returns RGB object with r, g, b properties
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const n = parseInt(hex.replace('#', ''), 16);
  return {
    r: (n >> 16) & 0xff,
    g: (n >> 8) & 0xff,
    b: n & 0xff,
  };
}

/**
 * Convert RGB to hex color
 * @param r - Red component (0-255)
 * @param g - Green component (0-255)
 * @param b - Blue component (0-255)
 * @returns Hex color in #RRGGBB format
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('')}`;
}

/**
 * Calculate luminance of a color (0-1, where 1 is brightest)
 * @param hex - Color in #RRGGBB format
 * @returns Luminance value
 */
export function getLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  // Use relative luminance formula from WCAG
  const [rs, gs, bs] = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Get contrasting text color (black or white) based on background color
 * @param hex - Background color in #RRGGBB format
 * @returns '#000000' for light backgrounds, '#FFFFFF' for dark backgrounds
 */
export function getContrastingTextColor(hex: string): string {
  return getLuminance(hex) > 0.5 ? '#000000' : '#FFFFFF';
}
