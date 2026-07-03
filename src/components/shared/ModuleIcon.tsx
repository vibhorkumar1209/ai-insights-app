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
          <rect x="5" y="5" width="18" height="18" rx="3" stroke="#E63946" strokeWidth="1.5"/>
          <rect x="10" y="10" width="8" height="8" rx="1.5" stroke="#E63946" strokeWidth="1.3" opacity="0.8"/>
          <circle cx="10" cy="10" r="1.5" fill="#E63946"/>
          <circle cx="18" cy="10" r="1.5" fill="#E63946"/>
          <circle cx="10" cy="18" r="1.5" fill="#E63946"/>
          <circle cx="18" cy="18" r="1.5" fill="#E63946"/>
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

    case 'industry-report':
      return (
        <svg width={s} height={s} viewBox="0 0 28 28" fill="none">
          <path d="M7 3H18L23 8V25H7V3Z" stroke="#059669" strokeWidth="1.5" strokeLinejoin="round" fill="#059669" fillOpacity="0.08"/>
          <path d="M18 3V8H23" stroke="#059669" strokeWidth="1.4" strokeLinejoin="round"/>
          <rect x="10" y="14" width="3" height="7" rx="0.5" fill="#059669" opacity="0.7"/>
          <rect x="14.5" y="11" width="3" height="10" rx="0.5" fill="#059669" opacity="0.5"/>
          <rect x="19" y="16" width="3" height="5" rx="0.5" fill="#059669" opacity="0.35"/>
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

    /* ── Persona modules ── */
    case 'tailored-sales-pitch':
      return (
        <svg width={s} height={s} viewBox="0 0 28 28" fill="none">
          <path d="M14 4V18" stroke="#E63946" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="14" cy="20" r="4" stroke="#E63946" strokeWidth="1.4" fill="#E63946" fillOpacity="0.12"/>
          <path d="M10 8L14 4L18 8" stroke="#E63946" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M7 24H21" stroke="#E63946" strokeWidth="1.3" strokeLinecap="round" opacity="0.4"/>
        </svg>
      );

    case 'marketing-channels':
      return (
        <svg width={s} height={s} viewBox="0 0 28 28" fill="none">
          <circle cx="14" cy="14" r="3" fill="#F59E0B" opacity="0.8"/>
          <circle cx="14" cy="14" r="7" stroke="#F59E0B" strokeWidth="1.3" opacity="0.5" strokeDasharray="3 2"/>
          <circle cx="14" cy="14" r="11" stroke="#F59E0B" strokeWidth="1.2" opacity="0.3" strokeDasharray="3 2"/>
          <path d="M14 3V7M14 21V25M3 14H7M21 14H25" stroke="#F59E0B" strokeWidth="1.3" strokeLinecap="round" opacity="0.6"/>
        </svg>
      );

    case 'content-themes':
      return (
        <svg width={s} height={s} viewBox="0 0 28 28" fill="none">
          <path d="M6 5H22C22.55 5 23 5.45 23 6V22C23 22.55 22.55 23 22 23H6C5.45 23 5 22.55 5 22V6C5 5.45 5.45 5 6 5Z" stroke="#E63946" strokeWidth="1.4"/>
          <path d="M9 10H19M9 14H16M9 18H13" stroke="#E63946" strokeWidth="1.3" strokeLinecap="round" opacity="0.6"/>
          <path d="M17 16L20 13V20L17 16Z" fill="#E63946" opacity="0.5"/>
        </svg>
      );

    case 'gifting-suggestions':
      return (
        <svg width={s} height={s} viewBox="0 0 28 28" fill="none">
          <rect x="4" y="12" width="20" height="13" rx="2" stroke="#EC4899" strokeWidth="1.4"/>
          <path d="M14 12V25" stroke="#EC4899" strokeWidth="1.3"/>
          <path d="M4 16H24" stroke="#EC4899" strokeWidth="1.2" opacity="0.4"/>
          <path d="M14 12C14 12 10 12 8.5 10C7 8 8.5 5 11 5C13.5 5 14 8 14 12Z" stroke="#EC4899" strokeWidth="1.3" fill="#EC4899" fillOpacity="0.1"/>
          <path d="M14 12C14 12 18 12 19.5 10C21 8 19.5 5 17 5C14.5 5 14 8 14 12Z" stroke="#EC4899" strokeWidth="1.3" fill="#EC4899" fillOpacity="0.1"/>
        </svg>
      );

    case 'networking-events':
      return (
        <svg width={s} height={s} viewBox="0 0 28 28" fill="none">
          <circle cx="8" cy="10" r="3" stroke="#3491E8" strokeWidth="1.3"/>
          <circle cx="20" cy="10" r="3" stroke="#3491E8" strokeWidth="1.3"/>
          <circle cx="14" cy="20" r="3" stroke="#3491E8" strokeWidth="1.3"/>
          <path d="M10.5 11.5L12 18M17.5 11.5L16 18M9.5 12L18.5 12" stroke="#3491E8" strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/>
        </svg>
      );

    case 'conversation-starters':
      return (
        <svg width={s} height={s} viewBox="0 0 28 28" fill="none">
          <path d="M5 5H19C19.55 5 20 5.45 20 6V15C20 15.55 19.55 16 19 16H12L8 20V16H5C4.45 16 4 15.55 4 15V6C4 5.45 4.45 5 5 5Z" stroke="#22D3EE" strokeWidth="1.4" strokeLinejoin="round"/>
          <path d="M22 10H23C23.55 10 24 10.45 24 11V20C24 20.55 23.55 21 23 21H20V25L16 21" stroke="#22D3EE" strokeWidth="1.3" strokeLinejoin="round" opacity="0.5"/>
          <circle cx="9" cy="11" r="1" fill="#22D3EE" opacity="0.7"/>
          <circle cx="12.5" cy="11" r="1" fill="#22D3EE" opacity="0.7"/>
          <circle cx="16" cy="11" r="1" fill="#22D3EE" opacity="0.7"/>
        </svg>
      );

    case 'outreach-message':
      return (
        <svg width={s} height={s} viewBox="0 0 28 28" fill="none">
          <rect x="3" y="6" width="22" height="16" rx="2.5" stroke="#10B981" strokeWidth="1.4"/>
          <path d="M3 9L14 16L25 9" stroke="#10B981" strokeWidth="1.4" strokeLinejoin="round"/>
          <path d="M3 22L10 15M25 22L18 15" stroke="#10B981" strokeWidth="1.2" strokeLinecap="round" opacity="0.3"/>
        </svg>
      );

    /* ── Survey Analytics modules ── */
    case 'cross-tabs':
      return (
        <svg width={s} height={s} viewBox="0 0 28 28" fill="none">
          <rect x="3" y="3" width="22" height="22" rx="2.5" stroke="#F59E0B" strokeWidth="1.4"/>
          <path d="M3 10H25M3 17H25M11 3V25M18 3V25" stroke="#F59E0B" strokeWidth="1.2" opacity="0.5"/>
          <rect x="12" y="11" width="5" height="5" rx="0.5" fill="#F59E0B" opacity="0.3"/>
          <rect x="19" y="18" width="5" height="4" rx="0.5" fill="#F59E0B" opacity="0.2"/>
        </svg>
      );

    case 'conjoint-analysis':
      return (
        <svg width={s} height={s} viewBox="0 0 28 28" fill="none">
          <circle cx="10" cy="14" r="7" stroke="#E63946" strokeWidth="1.4" fill="#E63946" fillOpacity="0.06"/>
          <circle cx="18" cy="14" r="7" stroke="#E63946" strokeWidth="1.4" fill="#E63946" fillOpacity="0.06"/>
          <path d="M14 9.5V18.5" stroke="#E63946" strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/>
        </svg>
      );

    case 'kano-analysis':
      return (
        <svg width={s} height={s} viewBox="0 0 28 28" fill="none">
          <path d="M4 24L24 24" stroke="#22D3EE" strokeWidth="1.3" strokeLinecap="round" opacity="0.4"/>
          <path d="M4 24L4 4" stroke="#22D3EE" strokeWidth="1.3" strokeLinecap="round" opacity="0.4"/>
          <path d="M5 22C8 22 10 18 14 14C18 10 22 7 24 6" stroke="#22D3EE" strokeWidth="1.8" strokeLinecap="round"/>
          <path d="M5 20C9 19 13 17 17 14C21 11 23 8 24 6" stroke="#22D3EE" strokeWidth="1.3" strokeLinecap="round" opacity="0.4" strokeDasharray="3 2"/>
        </svg>
      );

    case 'business-description':
      return (
        <svg width={s} height={s} viewBox="0 0 28 28" fill="none">
          <rect x="4" y="3" width="20" height="22" rx="3" stroke="#06B6D4" strokeWidth="1.5"/>
          <path d="M9 9H19M9 13H19M9 17H15" stroke="#06B6D4" strokeWidth="1.3" strokeLinecap="round" opacity="0.7"/>
          <circle cx="20" cy="21" r="4.5" fill="#080f16" stroke="#06B6D4" strokeWidth="1.3"/>
          <path d="M18.5 21L19.5 22L21.5 20" stroke="#06B6D4" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );

    case 'peers':
      return (
        <svg width={s} height={s} viewBox="0 0 28 28" fill="none">
          <circle cx="14" cy="8" r="3.5" stroke="#6366F1" strokeWidth="1.5"/>
          <circle cx="6" cy="16" r="3" stroke="#6366F1" strokeWidth="1.3" opacity="0.7"/>
          <circle cx="22" cy="16" r="3" stroke="#6366F1" strokeWidth="1.3" opacity="0.7"/>
          <path d="M14 11.5V14M14 14L7.5 19M14 14L20.5 19" stroke="#6366F1" strokeWidth="1.3" strokeLinecap="round"/>
          <path d="M4 22C4 20 5 19 6 19M24 22C24 20 23 19 22 19M10 24C10 21.5 11.8 20 14 20C16.2 20 18 21.5 18 24" stroke="#6366F1" strokeWidth="1.3" strokeLinecap="round" opacity="0.6"/>
        </svg>
      );

    case 'consulting-intelligence':
      return <span style={{ fontSize: size }}>🔭</span>;

    case 'vuca-analysis':
      return <span style={{ fontSize: size }}>⚡</span>;

    case 'objection-handling':
      return (
        <svg width={s} height={s} viewBox="0 0 28 28" fill="none">
          <path d="M14 3L4 7V14.5C4 19.5 8.5 24 14 25C19.5 24 24 19.5 24 14.5V7L14 3Z" stroke="#E63946" strokeWidth="1.6" strokeLinejoin="round" fill="rgba(230,57,70,0.1)"/>
          <path d="M9.5 14L12.5 17L18.5 11" stroke="#E63946" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );

    case 'firmographic':
      return (
        <svg width={s} height={s} viewBox="0 0 28 28" fill="none">
          <path d="M6 25V6C6 4.9 6.9 4 8 4H16C17.1 4 18 4.9 18 6V25" stroke="#10B981" strokeWidth="1.6" strokeLinejoin="round" fill="rgba(16,185,129,0.08)"/>
          <path d="M18 12H21C22.1 12 23 12.9 23 14V25" stroke="#10B981" strokeWidth="1.6" strokeLinejoin="round" fill="rgba(16,185,129,0.08)"/>
          <path d="M9.5 8H10.5M13.5 8H14.5M9.5 12H10.5M13.5 12H14.5M9.5 16H10.5M13.5 16H14.5" stroke="#10B981" strokeWidth="1.4" strokeLinecap="round"/>
          <path d="M10.5 25V21C10.5 20.4 11 20 11.5 20H12.5C13 20 13.5 20.4 13.5 21V25" stroke="#10B981" strokeWidth="1.6"/>
        </svg>
      );

    default:
      return fallback ? <span style={{ fontSize: size }}>{fallback}</span> : null;
  }
}
