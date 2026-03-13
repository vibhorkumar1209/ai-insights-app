'use client';

import Link from 'next/link';
import ModuleIcon from '@/components/shared/ModuleIcon';

interface ModuleCardProps {
  id: string;
  label: string;
  icon: string;
  available: boolean;
}

// Accent colours per active module (border + glow)
const MODULE_ACCENTS: Record<string, string> = {
  'financial-analysis':  '#22D3EE',
  'peer-benchmarking':   '#3491E8',
  'business-themes':     '#F59E0B',
  'technology-themes':   '#8B5CF6',
  'sustainability':      '#10B981',
  'challenges-growth':   '#F59E0B',
};

export default function ModuleCard({ id, label, icon, available }: ModuleCardProps) {
  const accent = MODULE_ACCENTS[id];

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
        <ModuleIcon id={id} size={28} fallback={icon} />
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
