'use client';

interface ModuleIconProps {
  /** Module ID matching the MODULES array (e.g. 'financial-analysis') */
  id: string;
  /** Rendered size in px — both width and height. Default 28. */
  size?: number;
  /** Fallback emoji/text if no SVG is defined for the given id */
  fallback?: string;
}

/**
 * Renders a crisp, coloured SVG icon for each RefractOne module.
 * Used by ModuleCard (dashboard grid) and individual module page headers.
 */
export default function ModuleIcon({ id, size = 28, fallback }: ModuleIconProps) {
  const s = size;

  switch (id) {
    case 'financial-analysis':
      return (
        <svg width={s} height={s} viewBox="0 0 28 28" fill="none">
          <rect x="3" y="16" width="5" height="9" rx="1.5" fill="#22D3EE" opacity="0.9"/>
          <rect x="11.5" y="10" width="5" height="15" rx="1.5" fill="#22D3EE" opacity="0.7"/>
          <rect x="20" y="5" width="5" height="20" rx="1.5" fill="#22D3EE" opacity="0.5"/>
          <path d="M4 14.5L12 7.5L16.5 11.5L24 3.5" stroke="#22D3EE" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );

    case 'peer-benchmarking':
      return (
        <svg width={s} height={s} viewBox="0 0 28 28" fill="none">
          <circle cx="14" cy="14" r="10" stroke="#3491E8" strokeWidth="1.5"/>
          <circle cx="14" cy="14" r="5.5" stroke="#3491E8" strokeWidth="1.3" opacity="0.7"/>
          <circle cx="14" cy="14" r="2" fill="#3491E8"/>
          <path d="M14 4V6.5M14 21.5V24M4 14H6.5M21.5 14H24" stroke="#3491E8" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      );

    case 'business-themes':
      return (
        <svg width={s} height={s} viewBox="0 0 28 28" fill="none">
          <rect x="3" y="11" width="22" height="14" rx="2.5" stroke="#F59E0B" strokeWidth="1.5"/>
          <path d="M9.5 11V8.5C9.5 7.12 10.62 6 12 6H16C17.38 6 18.5 7.12 18.5 8.5V11" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M3 17H25" stroke="#F59E0B" strokeWidth="1.3" opacity="0.5"/>
          <rect x="12" y="15" width="4" height="4" rx="1" fill="#F59E0B" opacity="0.8"/>
        </svg>
      );

    case 'technology-themes':
      return (
        <svg width={s} height={s} viewBox="0 0 28 28" fill="none">
          <rect x="5" y="5" width="18" height="18" rx="3" stroke="#8B5CF6" strokeWidth="1.5"/>
          <rect x="10" y="10" width="8" height="8" rx="1.5" stroke="#8B5CF6" strokeWidth="1.3" opacity="0.8"/>
          <circle cx="10" cy="10" r="1.5" fill="#8B5CF6"/>
          <circle cx="18" cy="10" r="1.5" fill="#8B5CF6"/>
          <circle cx="10" cy="18" r="1.5" fill="#8B5CF6"/>
          <circle cx="18" cy="18" r="1.5" fill="#8B5CF6"/>
        </svg>
      );

    case 'sustainability':
      return (
        <svg width={s} height={s} viewBox="0 0 28 28" fill="none">
          <path d="M14 24C9.5 21 5 17 5 12C5 8.69 7.69 6 11 6C12.3 6 13.5 6.4 14.5 7.1C15.5 6.4 16.7 6 18 6C21.31 6 24 8.69 24 12C24 17 18.5 21 14 24Z" stroke="#10B981" strokeWidth="1.5" strokeLinejoin="round" fill="#10B981" fillOpacity="0.12"/>
          <path d="M14 24V15" stroke="#10B981" strokeWidth="1.6" strokeLinecap="round"/>
          <path d="M14 19L10.5 15.5" stroke="#10B981" strokeWidth="1.4" strokeLinecap="round"/>
          <path d="M14 17L17.5 13.5" stroke="#10B981" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
      );

    case 'challenges-growth':
      return (
        <svg width={s} height={s} viewBox="0 0 28 28" fill="none">
          <path d="M4 21L10.5 13L15.5 17.5L24 7" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M19.5 7H24V11.5" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M4 25H24" stroke="#F59E0B" strokeWidth="1.2" strokeLinecap="round" opacity="0.35"/>
        </svg>
      );

    case 'key-buyers':
      return (
        <svg width={s} height={s} viewBox="0 0 28 28" fill="none">
          <circle cx="10" cy="9" r="3.5" stroke="#4a7a96" strokeWidth="1.4"/>
          <circle cx="20" cy="9" r="3.5" stroke="#4a7a96" strokeWidth="1.4"/>
          <path d="M4.5 22C4.5 18.96 6.96 16.5 10 16.5" stroke="#4a7a96" strokeWidth="1.4" strokeLinecap="round"/>
          <path d="M16 22C16 18.96 18.46 16.5 21.5 16.5" stroke="#4a7a96" strokeWidth="1.4" strokeLinecap="round"/>
          <path d="M10 22H20" stroke="#4a7a96" strokeWidth="1.3" strokeLinecap="round" opacity="0.4"/>
        </svg>
      );

    case 'social-insights':
      return (
        <svg width={s} height={s} viewBox="0 0 28 28" fill="none">
          <path d="M5 6H23C23.55 6 24 6.45 24 7V18C24 18.55 23.55 19 23 19H16L11 24V19H5C4.45 19 4 18.55 4 18V7C4 6.45 4.45 6 5 6Z" stroke="#4a7a96" strokeWidth="1.4" strokeLinejoin="round"/>
          <path d="M9 12H19M9 15.5H15" stroke="#4a7a96" strokeWidth="1.3" strokeLinecap="round" opacity="0.6"/>
        </svg>
      );

    case 'industry-trends':
      return (
        <svg width={s} height={s} viewBox="0 0 28 28" fill="none">
          <circle cx="14" cy="14" r="10" stroke="#4a7a96" strokeWidth="1.4"/>
          <path d="M4 14H24" stroke="#4a7a96" strokeWidth="1.2" opacity="0.4"/>
          <path d="M14 4C14 4 10.5 9 10.5 14C10.5 19 14 24 14 24" stroke="#4a7a96" strokeWidth="1.3"/>
          <path d="M14 4C14 4 17.5 9 17.5 14C17.5 19 14 24 14 24" stroke="#4a7a96" strokeWidth="1.3"/>
        </svg>
      );

    case 'sales-play':
      return (
        <svg width={s} height={s} viewBox="0 0 28 28" fill="none">
          {/* Lightning bolt / play arrow — signals action & competitive energy */}
          <path d="M16 3L7 16H14L12 25L21 12H14L16 3Z" fill="#E63946" fillOpacity="0.18" stroke="#E63946" strokeWidth="1.5" strokeLinejoin="round"/>
          <circle cx="23" cy="5" r="2" fill="#E63946" opacity="0.7"/>
          <path d="M19 9L23 5" stroke="#E63946" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
      );

    case 'account-plan':
      return (
        <svg width={s} height={s} viewBox="0 0 28 28" fill="none">
          <rect x="5" y="3" width="18" height="22" rx="2.5" stroke="#4a7a96" strokeWidth="1.4"/>
          <path d="M9.5 9.5H18.5M9.5 13.5H18.5M9.5 17.5H14.5" stroke="#4a7a96" strokeWidth="1.3" strokeLinecap="round" opacity="0.65"/>
          <rect x="7.5" y="8.5" width="2" height="2" rx="0.5" fill="#4a7a96" opacity="0.5"/>
          <rect x="7.5" y="12.5" width="2" height="2" rx="0.5" fill="#4a7a96" opacity="0.5"/>
          <rect x="7.5" y="16.5" width="2" height="2" rx="0.5" fill="#4a7a96" opacity="0.5"/>
        </svg>
      );

    default:
      return fallback ? <span style={{ fontSize: size }}>{fallback}</span> : null;
  }
}
