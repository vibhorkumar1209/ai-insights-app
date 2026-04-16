'use client';

import { useState } from 'react';
import Link from 'next/link';
import ModuleIcon from '@/components/shared/ModuleIcon';
import TailoredSalesPitchSection from './TailoredSalesPitchSection';

const ACCENT = '#3491E8';

export default function PersonaPage() {
  const [activeTab, setActiveTab] = useState('tailored-pitch');

  return (
    <div style={{ minHeight: '100vh', background: '#080f16', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0c3649 0%, #0a2233 100%)',
        borderBottom: '1px solid #1e4a68',
        padding: '16px 32px',
        flexShrink: 0,
      }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto',
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <Link href="/" style={{ color: '#7eaabf', textDecoration: 'none', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            ← Home
          </Link>
          <div style={{ width: 1, height: 16, background: '#1e4a68', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, color: ACCENT, marginBottom: 3 }}>REFRACTONE</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ModuleIcon id="persona" size={20} />
              <span style={{ fontSize: 18, fontWeight: 800, color: '#E8EDF5' }}>Persona & Sales Pitch</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        borderBottom: '1px solid #1e4a68',
        padding: '0 32px',
        display: 'flex',
        gap: 0,
      }}>
        <button
          onClick={() => setActiveTab('tailored-pitch')}
          style={{
            padding: '14px 24px',
            border: 'none',
            background: activeTab === 'tailored-pitch' ? '#1e4a68' : 'transparent',
            borderBottom: activeTab === 'tailored-pitch' ? `3px solid ${ACCENT}` : '1px solid #1e4a68',
            color: activeTab === 'tailored-pitch' ? ACCENT : '#6B8FA5',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          Tailored Sales Pitch
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, maxWidth: 1200, margin: '0 auto', width: '100%', padding: '32px' }}>
        {activeTab === 'tailored-pitch' && <TailoredSalesPitchSection />}
      </div>
    </div>
  );
}
