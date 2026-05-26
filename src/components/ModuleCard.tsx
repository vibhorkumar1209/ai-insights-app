'use client';

import Link from 'next/link';
import ModuleIcon from '@/components/shared/ModuleIcon';

interface ModuleCardProps {
  id: string;
  label: string;
  icon: string;
  available: boolean;
}

export default function ModuleCard({ id, label, icon, available }: ModuleCardProps) {
  const cardContent = (
    <div style={{
      background: available ? '#FFFFFF' : '#F9FAFB',
      border: `1px solid ${available ? '#CCDFEA' : '#E8F2F7'}`,
      borderRadius: 10,
      padding: '18px 14px',
      cursor: available ? 'pointer' : 'default',
      transition: 'border-color 0.15s, box-shadow 0.15s, transform 0.12s',
      position: 'relative',
      overflow: 'hidden',
      minHeight: 110,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      opacity: available ? 1 : 0.45,
      boxShadow: available ? '0 1px 4px rgba(12,54,73,0.06)' : 'none',
    }}
    onMouseEnter={(e) => {
      if (!available) return;
      const el = e.currentTarget;
      el.style.borderColor = '#E63946';
      el.style.boxShadow = '0 4px 18px rgba(230,57,70,0.13)';
      el.style.transform = 'translateY(-2px)';
    }}
    onMouseLeave={(e) => {
      if (!available) return;
      const el = e.currentTarget;
      el.style.borderColor = '#CCDFEA';
      el.style.boxShadow = '0 1px 4px rgba(12,54,73,0.06)';
      el.style.transform = 'translateY(0)';
    }}
    >
      {/* DS Blue top accent bar */}
      {available && (
        <div style={{
          position: 'absolute', top: 0, left: 0,
          width: '100%', height: 3,
          background: 'linear-gradient(90deg, #0c3649, #12516E)',
          borderRadius: '10px 10px 0 0',
        }} />
      )}

      <div style={{ marginBottom: 10, marginTop: 4 }}>
        <ModuleIcon id={id} size={26} fallback={icon} />
      </div>

      <div>
        <div style={{
          fontSize: 12.5, fontWeight: 600,
          color: available ? '#001F4D' : '#9CA3AF',
          lineHeight: 1.35,
        }}>
          {label}
        </div>
        {!available && (
          <div style={{ fontSize: 10, color: '#B8D0D8', marginTop: 3, fontWeight: 500 }}>
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
