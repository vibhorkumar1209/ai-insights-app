'use client';

import { useEffect } from 'react';
import ModuleCard from '@/components/ModuleCard';
import { MODULES, MODULE_CATEGORIES } from '@/lib/types';
import { seedMarketIntelReports } from '@/lib/history';

export default function HomePage() {
  useEffect(() => {
    seedMarketIntelReports();
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#080f16' }}>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0c3649 0%, #0a2233 100%)',
        borderBottom: '1px solid #1e4a68',
        padding: '24px 32px',
      }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        }}>
          <div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#E8EDF5', lineHeight: 1.2 }}>
              RefractOne AI Insights
            </div>
            <div style={{ fontSize: 14, color: '#7eaabf', marginTop: 6 }}>
              Enterprise intelligence for peer benchmarking, financial analysis, and account planning
            </div>
          </div>

          {/* Report Library */}
          <a
            href="/reports"
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(5,150,105,0.1)',
              border: '1px solid rgba(5,150,105,0.25)',
              color: '#34d399',
              borderRadius: 8, padding: '10px 18px',
              fontSize: 13, fontWeight: 600, textDecoration: 'none',
              flexShrink: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 28 28" fill="none">
              <path d="M7 3H18L23 8V25H7V3Z" stroke="#34d399" strokeWidth="1.5" strokeLinejoin="round" fill="#34d399" fillOpacity="0.08"/>
              <path d="M18 3V8H23" stroke="#34d399" strokeWidth="1.4" strokeLinejoin="round"/>
              <rect x="10" y="14" width="3" height="7" rx="0.5" fill="#34d399" opacity="0.7"/>
              <rect x="14.5" y="11" width="3" height="10" rx="0.5" fill="#34d399" opacity="0.5"/>
            </svg>
            Report Library
          </a>
        </div>
      </div>

      {/* Module Categories */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 32px 48px' }}>
        {MODULE_CATEGORIES.map((cat) => {
          const catModules = MODULES.filter((m) => m.category === cat.key);
          if (catModules.length === 0) return null;

          return (
            <div key={cat.key} style={{ marginBottom: 36 }}>
              {/* Category Header */}
              <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  fontSize: 12, fontWeight: 700, color: cat.accent,
                  letterSpacing: 2, textTransform: 'uppercase',
                }}>
                  {cat.label}
                </div>
                <div style={{
                  flex: 1, height: 1,
                  background: `linear-gradient(90deg, ${cat.accent}44, transparent)`,
                }} />
                <div style={{
                  fontSize: 11, color: '#4a7a96', fontWeight: 500,
                }}>
                  {catModules.filter((m) => m.available).length} / {catModules.length} active
                </div>
              </div>

              {/* Module Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
                gap: 14,
              }}>
                {catModules.map((module) => (
                  <ModuleCard
                    key={module.id}
                    id={module.id}
                    label={module.label}
                    icon={module.icon}
                    available={module.available}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
