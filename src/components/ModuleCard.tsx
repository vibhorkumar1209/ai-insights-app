'use client';

import Link from 'next/link';

interface ModuleCardProps {
  id: string;
  label: string;
  icon: string;
  available: boolean;
}

export default function ModuleCard({ id, label, icon, available }: ModuleCardProps) {
  const cardContent = (
    <div
      style={{
        background: available ? 'linear-gradient(160deg, #132d40, #0f2535)' : 'rgba(15,37,53,0.4)',
        border: `1px solid ${available ? '#1e4a68' : 'rgba(30,74,104,0.3)'}`,
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
      <div style={{ fontSize: 28, marginBottom: 10 }}>{icon}</div>
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
