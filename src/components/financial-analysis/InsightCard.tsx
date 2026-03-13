'use client';

interface InsightCardProps {
  insight: string;
  accent?: string;
}

export default function InsightCard({ insight, accent = '#22D3EE' }: InsightCardProps) {
  return (
    <div style={{
      background: `rgba(${hexToRgb(accent)}, 0.04)`,
      border: `1px solid rgba(${hexToRgb(accent)}, 0.15)`,
      borderLeft: `3px solid ${accent}`,
      borderRadius: 8,
      padding: '14px 16px',
      marginTop: 12,
    }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>💡</span>
        <p style={{
          margin: 0, fontSize: 12, lineHeight: 1.7,
          color: '#C4D4DE', fontStyle: 'italic',
        }}>
          {insight}
        </p>
      </div>
    </div>
  );
}

function hexToRgb(hex: string): string {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ].join(',');
}
