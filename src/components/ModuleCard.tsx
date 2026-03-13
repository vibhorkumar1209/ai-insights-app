'use client';

import Link from 'next/link';

interface ModuleCardProps {
  id: string;
  label: string;
  icon: string;
  available: boolean;
}

// ── SVG icons per module ───────────────────────────────────────────────────────

const MODULE_ICONS: Record<string, React.ReactNode> = {
  'financial-analysis': (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect x="3" y="16" width="5" height="9" rx="1.5" fill="#22D3EE" opacity="0.9"/>
      <rect x="11.5" y="10" width="5" height="15" rx="1.5" fill="#22D3EE" opacity="0.7"/>
      <rect x="20" y="5" width="5" height="20" rx="1.5" fill="#22D3EE" opacity="0.5"/>
      <path d="M4 14.5L12 7.5L16.5 11.5L24 3.5" stroke="#22D3EE" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  'peer-benchmarking': (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="14" r="10" stroke="#3491E8" strokeWidth="1.5"/>
      <circle cx="14" cy="14" r="5.5" stroke="#3491E8" strokeWidth="1.3" opacity="0.7"/>
      <circle cx="14" cy="14" r="2" fill="#3491E8"/>
      <path d="M14 4V6.5M14 21.5V24M4 14H6.5M21.5 14H24" stroke="#3491E8" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  'business-themes': (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect x="3" y="11" width="22" height="14" rx="2.5" stroke="#F59E0B" strokeWidth="1.5"/>
      <path d="M9.5 11V8.5C9.5 7.12 10.62 6 12 6H16C17.38 6 18.5 7.12 18.5 8.5V11" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M3 17H25" stroke="#F59E0B" strokeWidth="1.3" opacity="0.5"/>
      <rect x="12" y="15" width="4" height="4" rx="1" fill="#F59E0B" opacity="0.8"/>
    </svg>
  ),
  'technology-themes': (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect x="5" y="5" width="18" height="18" rx="3" stroke="#8B5CF6" strokeWidth="1.5"/>
      <rect x="10" y="10" width="8" height="8" rx="1.5" stroke="#8B5CF6" strokeWidth="1.3" opacity="0.8"/>
      <circle cx="10" cy="10" r="1.5" fill="#8B5CF6"/>
      <circle cx="18" cy="10" r="1.5" fill="#8B5CF6"/>
      <circle cx="10" cy="18" r="1.5" fill="#8B5CF6"/>
      <circle cx="18" cy="18" r="1.5" fill="#8B5CF6"/>
    </svg>
  ),
  'sustainability': (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <path d="M14 24C9.5 21 5 17 5 12C5 8.69 7.69 6 11 6C12.3 6 13.5 6.4 14.5 7.1C15.5 6.4 16.7 6 18 6C21.31 6 24 8.69 24 12C24 17 18.5 21 14 24Z" stroke="#10B981" strokeWidth="1.5" strokeLinejoin="round" fill="#10B981" fillOpacity="0.12"/>
      <path d="M14 24V15" stroke="#10B981" strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M14 19L10.5 15.5" stroke="#10B981" strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M14 17L17.5 13.5" stroke="#10B981" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  ),
  'challenges-growth': (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <path d="M4 21L10.5 13L15.5 17.5L24 7" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M19.5 7H24V11.5" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M4 25H24" stroke="#F59E0B" strokeWidth="1.2" strokeLinecap="round" opacity="0.35"/>
    </svg>
  ),
  'key-buyers': (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <circle cx="10" cy="9" r="3.5" stroke="#4a7a96" strokeWidth="1.4"/>
      <circle cx="20" cy="9" r="3.5" stroke="#4a7a96" strokeWidth="1.4"/>
      <path d="M4.5 22C4.5 18.96 6.96 16.5 10 16.5" stroke="#4a7a96" strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M16 22C16 18.96 18.46 16.5 21.5 16.5" stroke="#4a7a96" strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M10 22H20" stroke="#4a7a96" strokeWidth="1.3" strokeLinecap="round" opacity="0.4"/>
    </svg>
  ),
  'social-insights': (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <path d="M5 6H23C23.55 6 24 6.45 24 7V18C24 18.55 23.55 19 23 19H16L11 24V19H5C4.45 19 4 18.55 4 18V7C4 6.45 4.45 6 5 6Z" stroke="#4a7a96" strokeWidth="1.4" strokeLinejoin="round"/>
      <path d="M9 12H19M9 15.5H15" stroke="#4a7a96" strokeWidth="1.3" strokeLinecap="round" opacity="0.6"/>
    </svg>
  ),
  'industry-trends': (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="14" r="10" stroke="#4a7a96" strokeWidth="1.4"/>
      <path d="M4 14H24" stroke="#4a7a96" strokeWidth="1.2" opacity="0.4"/>
      <path d="M14 4C14 4 10.5 9 10.5 14C10.5 19 14 24 14 24" stroke="#4a7a96" strokeWidth="1.3"/>
      <path d="M14 4C14 4 17.5 9 17.5 14C17.5 19 14 24 14 24" stroke="#4a7a96" strokeWidth="1.3"/>
    </svg>
  ),
  'sales-play': (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <path d="M14 4L16.9 10.5L24 11.4L18.8 16.2L20.4 24L14 20.5L7.6 24L9.2 16.2L4 11.4L11.1 10.5L14 4Z" stroke="#4a7a96" strokeWidth="1.4" strokeLinejoin="round"/>
    </svg>
  ),
  'account-plan': (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect x="5" y="3" width="18" height="22" rx="2.5" stroke="#4a7a96" strokeWidth="1.4"/>
      <path d="M9.5 9.5H18.5M9.5 13.5H18.5M9.5 17.5H14.5" stroke="#4a7a96" strokeWidth="1.3" strokeLinecap="round" opacity="0.65"/>
      <rect x="7.5" y="8.5" width="2" height="2" rx="0.5" fill="#4a7a96" opacity="0.5"/>
      <rect x="7.5" y="12.5" width="2" height="2" rx="0.5" fill="#4a7a96" opacity="0.5"/>
      <rect x="7.5" y="16.5" width="2" height="2" rx="0.5" fill="#4a7a96" opacity="0.5"/>
    </svg>
  ),
};

// Accent colours per module (used for border + glow)
const MODULE_ACCENTS: Record<string, string> = {
  'financial-analysis':  '#22D3EE',
  'peer-benchmarking':   '#3491E8',
  'business-themes':     '#F59E0B',
  'technology-themes':   '#8B5CF6',
  'sustainability':      '#10B981',
  'challenges-growth':   '#F59E0B',
};

export default function ModuleCard({ id, label, icon, available }: ModuleCardProps) {
  const svgIcon = MODULE_ICONS[id];
  const accent  = MODULE_ACCENTS[id];

  const borderColor = available
    ? (accent ? `${accent}55` : '#1e4a68')
    : 'rgba(30,74,104,0.25)';

  const cardContent = (
    <div
      style={{
        background: available ? 'linear-gradient(160deg, #132d40, #0f2535)' : 'rgba(15,37,53,0.4)',
        border: `1px solid ${borderColor}`,
        borderRadius: 12,
        padding: '20px 16px',
        cursor: available ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        position: 'relative',
        overflow: 'hidden',
        minHeight: 120,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        opacity: available ? 1 : 0.55,
      }}
      className={available ? 'module-card-active' : ''}
    >
      {/* Subtle accent glow in top-right corner for live modules */}
      {available && accent && (
        <div style={{
          position: 'absolute',
          top: 0, right: 0,
          width: 90, height: 90,
          background: `radial-gradient(circle at 85% 15%, ${accent}22, transparent 70%)`,
          pointerEvents: 'none',
        }} />
      )}

      {/* Icon */}
      <div style={{ marginBottom: 10 }}>
        {svgIcon || <span style={{ fontSize: 28 }}>{icon}</span>}
      </div>

      <div>
        <div style={{
          fontSize: 13, fontWeight: 700,
          color: available ? '#E8EDF5' : '#7eaabf',
          lineHeight: 1.3,
        }}>
          {label}
        </div>
        {!available && (
          <div style={{ fontSize: 11, color: '#4a7a96', marginTop: 4, fontWeight: 500 }}>
            Coming soon
          </div>
        )}
      </div>
    </div>
  );

  if (available) {
    return (
      <Link href={`/${id}`} style={{ textDecoration: 'none' }}>
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}
