'use client';

interface YoYRow {
  name: string;
  revenue: string;
  percentage: number;
  yoyGrowth?: string;
}

interface YoYComparisonTableProps {
  data: YoYRow[];
  title: string;
  accent?: string;
}

function hexToRgb(hex: string): string {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)].join(',');
}

export default function YoYComparisonTable({ data, title, accent = '#22D3EE' }: YoYComparisonTableProps) {
  if (!data || data.length === 0) return null;

  return (
    <div>
      <div style={{
        fontSize: 11, fontWeight: 800, letterSpacing: 1.5,
        color: accent, marginBottom: 14,
        textTransform: 'uppercase',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        {title}
      </div>

      <div style={{
        background: 'linear-gradient(135deg, #0c1e2d, #080f16)',
        border: '1px solid #1e4a68',
        borderRadius: 10,
        overflow: 'hidden',
      }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          tableLayout: 'fixed',
        }}>
          <colgroup>
            <col style={{ width: '36%' }} />
            <col style={{ width: '28%' }} />
            <col style={{ width: '18%' }} />
            <col style={{ width: '18%' }} />
          </colgroup>
          <thead>
            <tr style={{ background: 'rgba(12,54,73,0.8)' }}>
              {['Name', 'Revenue', 'Share', 'YoY'].map((label) => (
                <th
                  key={label}
                  style={{
                    padding: '12px 14px',
                    fontSize: 10, fontWeight: 700,
                    letterSpacing: 1, color: accent,
                    textAlign: 'left',
                    borderBottom: `2px solid rgba(${hexToRgb(accent)},0.3)`,
                    borderRight: label !== 'YoY' ? '1px solid #1e4a68' : undefined,
                  }}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => {
              const yoyNum = row.yoyGrowth ? parseFloat(row.yoyGrowth.replace(/[^-\d.]/g, '')) : null;
              const yoyColor = yoyNum != null
                ? yoyNum > 0 ? '#34d399' : yoyNum < 0 ? '#f87171' : '#7eaabf'
                : '#4a7a96';

              return (
                <tr
                  key={idx}
                  style={{
                    background: idx % 2 === 0 ? 'rgba(8,15,22,0.4)' : 'rgba(12,30,45,0.4)',
                    borderBottom: '1px solid rgba(30,74,104,0.3)',
                  }}
                >
                  <td style={{
                    padding: '11px 14px',
                    fontSize: 12, fontWeight: 600, color: '#E8EDF5',
                    borderRight: '1px solid rgba(30,74,104,0.3)',
                    wordBreak: 'break-word',
                  }}>
                    {row.name}
                  </td>
                  <td style={{
                    padding: '11px 14px',
                    fontSize: 12, color: '#C4D4DE',
                    fontFamily: 'monospace',
                    borderRight: '1px solid rgba(30,74,104,0.3)',
                  }}>
                    {row.revenue}
                  </td>
                  <td style={{
                    padding: '11px 14px',
                    fontSize: 12, color: '#7eaabf',
                    fontFamily: 'monospace',
                    borderRight: '1px solid rgba(30,74,104,0.3)',
                  }}>
                    {row.percentage.toFixed(1)}%
                  </td>
                  <td style={{
                    padding: '11px 14px',
                    fontSize: 12, fontWeight: 600,
                    fontFamily: 'monospace',
                    color: yoyColor,
                  }}>
                    {row.yoyGrowth || '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
