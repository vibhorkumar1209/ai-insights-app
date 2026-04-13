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
    <div style={{ minHeight: '100vh', background: '#F5F7FA' }}>

      {/* Header */}
      <div style={{
        background: '#fff',
        borderBottom: '1px solid #E5E7EB',
        padding: '20px 32px',
      }}>
        <div style={{
          maxWidth: 1100, margin: '0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#1B2A3D', lineHeight: 1.2 }}>
              AI Insights
            </div>
            <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
              Enterprise intelligence for peer benchmarking, financial analysis, and account planning
            </div>
          </div>

          <a
            href="/reports"
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: '#C23141',
              color: '#fff',
              borderRadius: 8, padding: '9px 18px',
              fontSize: 13, fontWeight: 600, textDecoration: 'none',
              flexShrink: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 28 28" fill="none">
              <path d="M7 3H18L23 8V25H7V3Z" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" fill="rgba(255,255,255,0.15)"/>
              <path d="M18 3V8H23" stroke="#fff" strokeWidth="1.4" strokeLinejoin="round"/>
            </svg>
            Report Library
          </a>
        </div>
      </div>

      {/* Module Categories */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 32px 48px' }}>
        {MODULE_CATEGORIES.map((cat) => {
          const catModules = MODULES.filter((m) => m.category === cat.key);
          if (catModules.length === 0) return null;

          return (
            <div key={cat.key} style={{ marginBottom: 32 }}>
              <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  fontSize: 11, fontWeight: 700, color: '#6B7280',
                  letterSpacing: 1.5, textTransform: 'uppercase',
                }}>
                  {cat.label}
                </div>
                <div style={{
                  flex: 1, height: 1,
                  background: '#E5E7EB',
                }} />
                <div style={{
                  fontSize: 11, color: '#9CA3AF', fontWeight: 500,
                }}>
                  {catModules.filter((m) => m.available).length} / {catModules.length} active
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
                gap: 12,
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
