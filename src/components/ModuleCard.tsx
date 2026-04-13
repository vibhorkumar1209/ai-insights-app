'use client';

import Link from 'next/link';
import ModuleIcon from '@/components/shared/ModuleIcon';

interface ModuleCardProps {
  id: string;
  label: string;
  icon: string;
  available: boolean;
}

const MODULE_ACCENTS: Record<string, string> = {
  'industry-report': '#059669', 'industry-trends': '#10B981',
  'niche-industries': '#059669', 'marketing-strategy': '#059669',
  'financial-analysis': '#0EA5E9', 'peer-benchmarking': '#3491E8',
  'business-themes': '#F59E0B', 'technology-themes': '#8B5CF6',
  'sustainability': '#10B981', 'challenges-growth': '#F59E0B',
  'sales-play': '#C23141', 'key-buyers': '#3491E8',
  'business-description': '#0EA5E9', 'peers': '#3491E8',
  'social-insights': '#06B6D4', 'account-plan': '#6B8FA5',
  'tailored-sales-pitch': '#C23141', 'marketing-channels': '#F59E0B',
  'content-themes': '#8B5CF6', 'gifting-suggestions': '#EC4899',
  'networking-events': '#3491E8', 'conversation-starters': '#0EA5E9',
  'outreach-message': '#10B981',
  'cross-tabs': '#F59E0B', 'conjoint-analysis': '#8B5CF6', 'kano-analysis': '#0EA5E9',
};

export default function ModuleCard({ id, label, icon, available }: ModuleCardProps) {
  const accent = MODULE_ACCENTS[id] || '#6B7280';

  const cardContent = (
    <div style={{
      background: available ? '#fff' : '#F9FAFB',
      border: `1px solid ${available ? '#E5E7EB' : '#F3F4F6'}`,
      borderRadius: 10,
      padding: '18px 14px',
      cursor: available ? 'pointer' : 'default',
      transition: 'all 0.2s ease',
      position: 'relative',
      overflow: 'hidden',
      minHeight: 110,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      opacity: available ? 1 : 0.5,
      boxShadow: available ? '0 1px 3px rgba(0,0,0,0.04)' : 'none',
    }}>
      {available && (
        <div style={{
          position: 'absolute', top: 0, left: 0,
          width: '100%', height: 3,
          background: accent,
          borderRadius: '10px 10px 0 0',
        }} />
      )}

      <div style={{ marginBottom: 10 }}>
        <ModuleIcon id={id} size={26} fallback={icon} />
      </div>

      <div>
        <div style={{
          fontSize: 12.5, fontWeight: 600,
          color: available ? '#1B2A3D' : '#9CA3AF',
          lineHeight: 1.35,
        }}>
          {label}
        </div>
        {!available && (
          <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 3, fontWeight: 500 }}>
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
