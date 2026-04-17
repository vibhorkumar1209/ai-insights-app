'use client';
import React from 'react';
import { SWOTData, SWOTItem } from '@ai-insights/types';

interface Props {
  data: SWOTData;
}

const QUADRANTS: { key: keyof SWOTData; label: string; color: string; bg: string; border: string; icon: string }[] = [
  { key: 'strengths', label: 'Strengths', color: '#10B981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.25)', icon: 'S' },
  { key: 'weaknesses', label: 'Weaknesses', color: '#E63946', bg: 'rgba(230,57,70,0.08)', border: 'rgba(230,57,70,0.25)', icon: 'W' },
  { key: 'opportunities', label: 'Opportunities', color: '#3491E8', bg: 'rgba(52,145,232,0.08)', border: 'rgba(52,145,232,0.25)', icon: 'O' },
  { key: 'threats', label: 'Threats', color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)', icon: 'T' },
];

const IMPACT_BADGE: Record<string, { color: string; bg: string }> = {
  high: { color: '#E63946', bg: 'rgba(230,57,70,0.15)' },
  medium: { color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' },
  low: { color: '#6B8FA5', bg: 'rgba(107,143,165,0.15)' },
};

function ItemCard({ item, accentColor }: { item: SWOTItem; accentColor: string }) {
  const badge = IMPACT_BADGE[item.impact] || IMPACT_BADGE.medium;
  return (
    <div style={{
      padding: '10px 12px',
      background: 'rgba(8,15,22,0.4)',
      borderRadius: 8,
      borderLeft: `3px solid ${accentColor}`,
      marginBottom: 8,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#E2E8F0' }}>{item.title}</span>
        <span style={{
          fontSize: 9,
          fontWeight: 700,
          textTransform: 'uppercase' as const,
          padding: '2px 6px',
          borderRadius: 4,
          color: badge.color,
          background: badge.bg,
          letterSpacing: 0.5,
        }}>
          {item.impact}
        </span>
      </div>
      <div style={{ fontSize: 12, color: '#9AB4C4', lineHeight: 1.5 }}>{item.description}</div>
    </div>
  );
}

export default function SWOTDisplay({ data }: Props) {
  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {QUADRANTS.map((q) => (
          <div
            key={q.key}
            style={{
              background: q.bg,
              border: `1px solid ${q.border}`,
              borderRadius: 12,
              padding: 16,
              minHeight: 160,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{
                width: 26,
                height: 26,
                borderRadius: 6,
                background: q.border,
                color: q.color,
                fontSize: 13,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {q.icon}
              </span>
              <span style={{ fontSize: 14, fontWeight: 700, color: q.color }}>{q.label}</span>
            </div>
            {data[q.key]?.map((item, i) => (
              <ItemCard key={i} item={item} accentColor={q.color} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
