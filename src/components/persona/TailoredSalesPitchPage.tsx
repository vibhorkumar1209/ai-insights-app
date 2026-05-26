'use client';

import Link from 'next/link';
import ModuleIcon from '@/components/shared/ModuleIcon';
import TailoredSalesPitchSection from './TailoredSalesPitchSection';

const ACCENT = '#3491E8';

export default function TailoredSalesPitchPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0c3649, #12516E)',
        borderBottom: '1px solid #CCDFEA',
        padding: '16px 32px',
        flexShrink: 0,
      }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto',
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <Link href="/" style={{ color: 'rgba(255,255,255,0.65)', textDecoration: 'none', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            ← Home
          </Link>
          <div style={{ width: 1, height: 16, background: '#CCDFEA', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, color: ACCENT, marginBottom: 3 }}>PERSONA</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ModuleIcon id="tailored-sales-pitch" size={20} />
              <span style={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF' }}>Tailored Sales Pitch</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, maxWidth: 1200, margin: '0 auto', width: '100%', padding: '32px' }}>
        <TailoredSalesPitchSection />
      </div>
    </div>
  );
}
