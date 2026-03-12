'use client';

import { useState } from 'react';
import { Competitor } from '@/lib/types';

interface CompetitorSelectionProps {
  targetCompany: string;
  discovered: Competitor[];
  onConfirm: (selected: string[]) => void;
  onBack: () => void;
}

export default function CompetitorSelection({
  targetCompany,
  discovered,
  onConfirm,
  onBack,
}: CompetitorSelectionProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [manualInput, setManualInput] = useState('');
  const [manual, setManual] = useState<string[]>([]);

  const MAX = 5;
  const allCompetitors = [...discovered.map((c) => c.name), ...manual];
  const totalSelected = selected.size;

  const toggle = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else if (next.size < MAX) {
        next.add(name);
      }
      return next;
    });
  };

  const addManual = () => {
    const name = manualInput.trim();
    if (!name || allCompetitors.includes(name) || manual.length >= 5) return;
    setManual((prev) => [...prev, name]);
    setManualInput('');
  };

  const removeManual = (name: string) => {
    setManual((prev) => prev.filter((m) => m !== name));
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(name);
      return next;
    });
  };

  const getScore = (name: string) => {
    const c = discovered.find((d) => d.name === name);
    return c?.relevanceScore;
  };

  return (
    <div style={{
      background: 'linear-gradient(160deg, #132d40, #0f2535)',
      border: '1px solid #1e4a68',
      borderRadius: 12,
      padding: 28,
    }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#3491E8', letterSpacing: 2, marginBottom: 6 }}>
          STEP 2 OF 3
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#E8EDF5' }}>Select Competitors</div>
        <div style={{ fontSize: 13, color: '#7eaabf', marginTop: 4 }}>
          Select up to {MAX} companies to benchmark against {targetCompany}.
          AI-identified peers are listed below, or add your own.
        </div>
      </div>

      {/* Selection counter */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(8,15,22,0.6)',
        border: `1px solid ${totalSelected >= MAX ? '#E63946' : '#1e4a68'}`,
        borderRadius: 8,
        padding: '8px 16px',
        marginBottom: 20,
      }}>
        <span style={{ fontSize: 13, color: '#7eaabf' }}>
          Selected: <strong style={{ color: totalSelected >= MAX ? '#ff6b75' : '#E8EDF5' }}>
            {totalSelected}/{MAX}
          </strong>
        </span>
        {totalSelected >= MAX && (
          <span style={{ fontSize: 11, color: '#ff6b75', fontWeight: 600 }}>
            Maximum reached — deselect to add another
          </span>
        )}
      </div>

      {/* Discovered competitors */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#7eaabf', letterSpacing: 1, marginBottom: 12 }}>
          AI-IDENTIFIED PEERS
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {discovered.map((c) => {
            const isSelected = selected.has(c.name);
            const disabled = !isSelected && totalSelected >= MAX;

            return (
              <button
                key={c.name}
                onClick={() => toggle(c.name)}
                disabled={disabled}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  background: isSelected ? 'rgba(52,145,232,0.12)' : 'rgba(8,15,22,0.4)',
                  border: `1px solid ${isSelected ? '#3491E8' : '#1e4a68'}`,
                  borderRadius: 8,
                  padding: '10px 14px',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  textAlign: 'left',
                  opacity: disabled ? 0.45 : 1,
                  transition: 'all 0.15s',
                  width: '100%',
                }}
              >
                {/* Checkbox */}
                <div style={{
                  width: 20, height: 20, borderRadius: 4, flexShrink: 0,
                  background: isSelected ? '#3491E8' : 'transparent',
                  border: `2px solid ${isSelected ? '#3491E8' : '#1e4a68'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {isSelected && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>

                {/* Content */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#E8EDF5' }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: '#7eaabf', marginTop: 2 }}>{c.description}</div>
                  {(c.headquarters || c.estimatedRevenue) && (
                    <div style={{ fontSize: 11, color: '#4a7a96', marginTop: 3 }}>
                      {[c.headquarters, c.estimatedRevenue, c.employees]
                        .filter(Boolean)
                        .join(' · ')}
                    </div>
                  )}
                </div>

                {/* Relevance score */}
                {c.relevanceScore && (
                  <div style={{
                    flexShrink: 0,
                    background: c.relevanceScore >= 8 ? 'rgba(52,145,232,0.15)' : 'rgba(30,74,104,0.3)',
                    border: `1px solid ${c.relevanceScore >= 8 ? 'rgba(52,145,232,0.3)' : '#1e4a68'}`,
                    color: c.relevanceScore >= 8 ? '#6ab8ff' : '#7eaabf',
                    fontSize: 11, fontWeight: 700,
                    padding: '2px 8px', borderRadius: 4,
                  }}>
                    {c.relevanceScore}/10
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Manual entry */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#7eaabf', letterSpacing: 1, marginBottom: 12 }}>
          ADD MANUALLY
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addManual()}
            placeholder="Type a company name and press Enter"
            style={{
              flex: 1,
              background: 'rgba(8,15,22,0.8)',
              border: '1px solid #1e4a68',
              borderRadius: 8,
              padding: '10px 14px',
              color: '#E8EDF5',
              fontSize: 13,
              outline: 'none',
            }}
          />
          <button
            onClick={addManual}
            disabled={!manualInput.trim() || totalSelected >= MAX || allCompetitors.includes(manualInput.trim())}
            style={{
              background: 'rgba(52,145,232,0.15)',
              border: '1px solid rgba(52,145,232,0.3)',
              color: '#6ab8ff',
              borderRadius: 8,
              padding: '10px 16px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            + Add
          </button>
        </div>

        {/* Manual entries */}
        {manual.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            {manual.map((name) => {
              const isSelected = selected.has(name);
              return (
                <div
                  key={name}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: isSelected ? 'rgba(52,145,232,0.12)' : 'rgba(30,74,104,0.2)',
                    border: `1px solid ${isSelected ? '#3491E8' : '#1e4a68'}`,
                    borderRadius: 6,
                    padding: '6px 12px',
                  }}
                >
                  <button onClick={() => toggle(name)} style={{
                    background: 'none', border: 'none', color: '#E8EDF5',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0,
                  }}>
                    {name}
                  </button>
                  <button onClick={() => removeManual(name)} style={{
                    background: 'none', border: 'none', color: '#7eaabf',
                    fontSize: 14, cursor: 'pointer', padding: 0, lineHeight: 1,
                  }}>×</button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={onBack}
          style={{
            background: 'transparent',
            border: '1px solid #1e4a68',
            color: '#7eaabf',
            borderRadius: 8,
            padding: '10px 20px',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          ← Back
        </button>
        <button
          onClick={() => onConfirm(Array.from(selected))}
          disabled={totalSelected === 0}
          style={{
            flex: 1,
            background: totalSelected > 0
              ? 'linear-gradient(135deg, #0e4560, #3491E8)'
              : 'rgba(30,74,104,0.3)',
            color: totalSelected > 0 ? '#fff' : '#4a7a96',
            border: 'none',
            borderRadius: 8,
            padding: '12px 28px',
            fontSize: 14,
            fontWeight: 700,
            cursor: totalSelected > 0 ? 'pointer' : 'not-allowed',
          }}
        >
          Run Benchmark with {totalSelected} Peer{totalSelected !== 1 ? 's' : ''} →
        </button>
      </div>
    </div>
  );
}
