'use client';
import React, { useState } from 'react';
import { KeyPlayerOption } from '@ai-insights/types';

const MAX_COMPETITORS = 5;
const ACCENT = '#3491E8';

interface Props {
  competitors: KeyPlayerOption[];
  companyName?: string;
  onUpdate: (competitors: KeyPlayerOption[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function WizardCompetitorsStep({ competitors, companyName, onUpdate, onNext, onBack }: Props) {
  const [customName, setCustomName] = useState('');

  const selectedCount = competitors.filter((c) => c.selected).length;

  const toggle = (name: string) => {
    onUpdate(
      competitors.map((c) => {
        if (c.name !== name) return c;
        if (!c.selected && selectedCount >= MAX_COMPETITORS) return c;
        return { ...c, selected: !c.selected };
      })
    );
  };

  const addCustom = () => {
    if (!customName.trim() || selectedCount >= MAX_COMPETITORS) return;
    const custom: KeyPlayerOption = {
      name: customName.trim(),
      description: 'User-added competitor',
      selected: true,
    };
    onUpdate([...competitors, custom]);
    setCustomName('');
  };

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 16px' }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: ACCENT, textTransform: 'uppercase' as const, marginBottom: 8 }}>
          Step 4 of 5
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1B2A3D', margin: 0 }}>
          Select Competitors to Profile
        </h2>
        <p style={{ fontSize: 13, color: '#5A6E7A', marginTop: 8, maxWidth: 560, margin: '8px auto 0' }}>
          {companyName
            ? <>Select up to {MAX_COMPETITORS} competitors of <strong>{companyName}</strong> for the Competition Analysis section.</>
            : <>Select up to {MAX_COMPETITORS} competitors for the Competition Analysis section.</>
          }
          {' '}Each will be profiled with revenue, market share, competitive overlap, recent news, and more.
        </p>
      </div>

      {competitors.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 16px', color: '#6B7280', fontSize: 13 }}>
          No competitors were suggested — add one manually below.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 20 }}>
          {competitors.map((c) => {
            const isDisabled = !c.selected && selectedCount >= MAX_COMPETITORS;
            return (
              <button
                key={c.name}
                onClick={() => toggle(c.name)}
                style={{
                  padding: '14px 16px',
                  borderRadius: 10,
                  border: c.selected ? `1px solid rgba(52,145,232,0.5)` : '1px solid #CCDFEA',
                  background: c.selected ? 'rgba(52,145,232,0.08)' : '#F3F8FA',
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  opacity: isDisabled ? 0.4 : 1,
                  textAlign: 'left' as const,
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: c.selected ? ACCENT : '#374B5C' }}>
                    {c.selected ? '✓ ' : ''}{c.name}
                  </span>
                  {c.marketShare && (
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4,
                      background: 'rgba(16,185,129,0.12)', color: '#10B981',
                    }}>
                      {c.marketShare}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: '#5A6E7A', lineHeight: 1.4 }}>{c.description}</div>
                <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 11, color: '#4A6A7D' }}>
                  {c.headquarters && <span>📍 {c.headquarters}</span>}
                  {c.revenue && <span>💰 {c.revenue}</span>}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Add custom */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
        <input
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addCustom()}
          placeholder="Add a competitor manually..."
          style={{
            flex: 1, padding: '10px 14px', borderRadius: 8,
            border: '1px solid #CCDFEA', background: '#FFFFFF',
            color: '#1B2A3D', fontSize: 13, outline: 'none',
          }}
        />
        <button
          onClick={addCustom}
          disabled={!customName.trim() || selectedCount >= MAX_COMPETITORS}
          style={{
            padding: '10px 20px', borderRadius: 8,
            border: `1px solid rgba(52,145,232,0.4)`,
            background: 'rgba(52,145,232,0.12)', color: ACCENT,
            fontSize: 13, fontWeight: 600,
            cursor: customName.trim() && selectedCount < MAX_COMPETITORS ? 'pointer' : 'not-allowed',
            opacity: customName.trim() && selectedCount < MAX_COMPETITORS ? 1 : 0.5,
          }}
        >
          + Add
        </button>
      </div>

      {/* Nav */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={onBack}
          style={{
            padding: '12px 24px', borderRadius: 8,
            border: '1px solid #CCDFEA', background: 'transparent',
            color: '#5A6E7A', fontSize: 14, fontWeight: 500, cursor: 'pointer',
          }}
        >
          ← Back
        </button>
        <div style={{ fontSize: 13, color: selectedCount >= MAX_COMPETITORS ? '#E63946' : '#5A6E7A' }}>
          {selectedCount}/{MAX_COMPETITORS} competitors selected
        </div>
        <button
          onClick={onNext}
          style={{
            padding: '12px 32px', borderRadius: 8, border: 'none',
            background: `linear-gradient(135deg, ${ACCENT}, #2563EB)`,
            color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}
        >
          Next: Review Scope →
        </button>
      </div>
    </div>
  );
}
