'use client';
import React from 'react';
import { PortersForcesData, ForceAnalysis } from '@ai-insights/types';

interface Props {
  data: PortersForcesData;
}

const RATING_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  high: { color: '#E63946', bg: 'rgba(230,57,70,0.15)', label: 'High' },
  medium: { color: '#F59E0B', bg: 'rgba(245,158,11,0.15)', label: 'Medium' },
  low: { color: '#10B981', bg: 'rgba(16,185,129,0.15)', label: 'Low' },
};

const FORCES: { key: keyof PortersForcesData; label: string; icon: string; color: string }[] = [
  { key: 'competitiveRivalry', label: 'Competitive Rivalry', icon: '⚔', color: '#E63946' },
  { key: 'threatOfNewEntry', label: 'Threat of New Entrants', icon: '🚪', color: '#F59E0B' },
  { key: 'supplierPower', label: 'Supplier Power', icon: '🏭', color: '#3491E8' },
  { key: 'buyerPower', label: 'Buyer Power', icon: '🛒', color: '#22D3EE' },
  { key: 'threatOfSubstitution', label: 'Threat of Substitutes', icon: '🔄', color: '#10B981' },
];

function ForceCard({ force, label, icon, accentColor }: { force: ForceAnalysis; label: string; icon: string; accentColor: string }) {
  const rating = RATING_STYLE[force.rating] || RATING_STYLE.medium;
  return (
    <div style={{
      background: 'rgba(14,50,75,0.5)',
      border: '1px solid rgba(30,74,104,0.3)',
      borderRadius: 12,
      padding: 16,
      position: 'relative' as const,
      overflow: 'hidden',
    }}>
      {/* Top accent */}
      <div style={{ position: 'absolute' as const, top: 0, left: 0, right: 0, height: 3, background: accentColor, opacity: 0.5 }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>{icon}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#E2E8F0' }}>{label}</span>
        </div>
        <span style={{
          fontSize: 10,
          fontWeight: 700,
          textTransform: 'uppercase' as const,
          padding: '3px 10px',
          borderRadius: 6,
          color: rating.color,
          background: rating.bg,
          letterSpacing: 0.5,
        }}>
          {rating.label}
        </span>
      </div>

      <div style={{ fontSize: 12, color: '#9AB4C4', lineHeight: 1.5, marginBottom: 10 }}>
        {force.description}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
        {force.factors?.map((factor, i) => (
          <span key={i} style={{
            fontSize: 11,
            padding: '3px 10px',
            borderRadius: 6,
            background: 'rgba(8,15,22,0.5)',
            border: '1px solid rgba(30,74,104,0.3)',
            color: '#B8CCDA',
          }}>
            {factor}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function PortersDisplay({ data }: Props) {
  // Center card = competitive rivalry, surrounding 4 in a grid
  const center = FORCES[0]; // competitiveRivalry
  const surrounding = FORCES.slice(1);

  return (
    <div style={{ marginTop: 20 }}>
      {/* Center: Competitive Rivalry */}
      <ForceCard force={data[center.key]} label={center.label} icon={center.icon} accentColor={center.color} />

      {/* Surrounding 4 forces in 2x2 grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
        {surrounding.map((f) => (
          <ForceCard key={f.key} force={data[f.key]} label={f.label} icon={f.icon} accentColor={f.color} />
        ))}
      </div>
    </div>
  );
}
