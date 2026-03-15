'use client';

interface MetricBox {
  label: string;
  value: string;
  accent: string;
  subtext?: string;
}

interface TopMetricBoxesProps {
  boxes: MetricBox[];
}

function hexToRgb(hex: string): string {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)].join(',');
}

export default function TopMetricBoxes({ boxes }: TopMetricBoxesProps) {
  return (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
      {boxes.map((box, i) => (
        <div
          key={i}
          style={{
            flex: '1 1 200px',
            background: `linear-gradient(135deg, rgba(${hexToRgb(box.accent)},0.08), rgba(${hexToRgb(box.accent)},0.02))`,
            border: `1px solid rgba(${hexToRgb(box.accent)},0.25)`,
            borderRadius: 12,
            padding: '22px 20px 18px',
            textAlign: 'center',
            minWidth: 0,
          }}
        >
          <div style={{
            fontSize: 9, fontWeight: 800, letterSpacing: 2,
            color: box.accent, marginBottom: 12, textTransform: 'uppercase',
          }}>
            {box.label}
          </div>
          <div style={{
            fontSize: 22, fontWeight: 900, color: '#E8EDF5',
            lineHeight: 1.2, marginBottom: 6, wordBreak: 'break-word',
          }}>
            {box.value}
          </div>
          {box.subtext && (
            <div style={{ fontSize: 10, color: '#4a7a96', fontStyle: 'italic' }}>
              {box.subtext}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
