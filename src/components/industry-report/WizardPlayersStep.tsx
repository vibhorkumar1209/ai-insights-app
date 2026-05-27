'use client';
import React, { useState } from 'react';
import { KeyPlayerOption } from '@ai-insights/types';

interface Props {
  players: KeyPlayerOption[];
  onUpdate: (players: KeyPlayerOption[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function WizardPlayersStep({ players, onUpdate, onNext, onBack }: Props) {
  const [customName, setCustomName] = useState('');

  const togglePlayer = (name: string) => {
    const selectedCount = players.filter((p) => p.selected).length;
    onUpdate(
      players.map((p) => {
        if (p.name !== name) return p;
        if (!p.selected && selectedCount >= 10) return p; // max 10
        return { ...p, selected: !p.selected };
      })
    );
  };

  const addCustom = () => {
    if (!customName.trim()) return;
    const newPlayer: KeyPlayerOption = {
      name: customName.trim(),
      description: 'User-added company',
      selected: true,
    };
    onUpdate([...players, newPlayer]);
    setCustomName('');
  };

  const selectedCount = players.filter((p) => p.selected).length;

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 16px' }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: '#3491E8', textTransform: 'uppercase' as const, marginBottom: 8 }}>
          Step 3 of 5
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#E2E8F0', margin: 0 }}>
          Select Key Players
        </h2>
        <p style={{ fontSize: 13, color: '#5A6E7A', marginTop: 8 }}>
          Select up to 10 companies for detailed competitive analysis. Click to select or deselect.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 20 }}>
        {players.map((player) => (
          <button
            key={player.name}
            onClick={() => togglePlayer(player.name)}
            style={{
              padding: '14px 16px',
              borderRadius: 10,
              border: player.selected ? '1px solid rgba(52,145,232,0.5)' : '1px solid rgba(30,74,104,0.3)',
              background: player.selected ? 'rgba(52,145,232,0.1)' : '#F3F8FA',
              cursor: !player.selected && selectedCount >= 10 ? 'not-allowed' : 'pointer',
              opacity: !player.selected && selectedCount >= 10 ? 0.4 : 1,
              textAlign: 'left' as const,
              transition: 'all 0.15s',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: player.selected ? '#22D3EE' : '#C4D4DE' }}>
                {player.selected ? '✓ ' : ''}{player.name}
              </span>
              {player.marketShare && (
                <span style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: 4,
                  background: 'rgba(16,185,129,0.12)',
                  color: '#10B981',
                }}>
                  {player.marketShare}
                </span>
              )}
            </div>
            <div style={{ fontSize: 12, color: '#5A6E7A', lineHeight: 1.4 }}>
              {player.description}
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 11, color: '#4A6A7D' }}>
              {player.headquarters && <span>📍 {player.headquarters}</span>}
              {player.revenue && <span>💰 {player.revenue}</span>}
            </div>
          </button>
        ))}
      </div>

      {/* Add custom player */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
        <input
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
          placeholder="Add a company..."
          onKeyDown={(e) => e.key === 'Enter' && addCustom()}
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: 8,
            border: '1px solid rgba(30,74,104,0.4)',
            background: '#EDF4F8',
            color: '#E2E8F0',
            fontSize: 13,
            outline: 'none',
          }}
        />
        <button
          onClick={addCustom}
          disabled={!customName.trim()}
          style={{
            padding: '10px 20px',
            borderRadius: 8,
            border: '1px solid rgba(52,145,232,0.4)',
            background: 'rgba(52,145,232,0.15)',
            color: '#3491E8',
            fontSize: 13,
            fontWeight: 600,
            cursor: customName.trim() ? 'pointer' : 'not-allowed',
            opacity: customName.trim() ? 1 : 0.5,
          }}
        >
          + Add
        </button>
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={onBack}
          style={{
            padding: '12px 24px',
            borderRadius: 8,
            border: '1px solid rgba(30,74,104,0.4)',
            background: 'transparent',
            color: '#5A6E7A',
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          ← Back
        </button>
        <div style={{ fontSize: 13, color: selectedCount > 10 ? '#E63946' : '#5A6E7A' }}>
          {selectedCount}/10 players selected
        </div>
        <button
          onClick={onNext}
          disabled={selectedCount === 0}
          style={{
            padding: '12px 32px',
            borderRadius: 8,
            border: 'none',
            background: selectedCount > 0 ? 'linear-gradient(135deg, #3491E8, #2563EB)' : 'rgba(30,74,104,0.4)',
            color: selectedCount > 0 ? '#fff' : '#4A6A7D',
            fontSize: 14,
            fontWeight: 600,
            cursor: selectedCount > 0 ? 'pointer' : 'not-allowed',
          }}
        >
          Next: Review Scope →
        </button>
      </div>
    </div>
  );
}
