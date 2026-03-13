'use client';

import { FinancialStatementRow } from '@/lib/types';

interface FinancialTableProps {
  rows: FinancialStatementRow[];
  accent?: string;
}

export default function FinancialTable({ rows, accent = '#22D3EE' }: FinancialTableProps) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #0c1e2d, #080f16)',
      border: '1px solid #1e4a68',
      borderRadius: 10,
      overflow: 'hidden',
    }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <colgroup>
          <col style={{ width: '55%' }} />
          <col style={{ width: '25%' }} />
          <col style={{ width: '20%' }} />
        </colgroup>
        <thead>
          <tr style={{ background: 'rgba(12,54,73,0.7)' }}>
            <th style={{
              padding: '10px 14px', fontSize: 10, fontWeight: 700,
              letterSpacing: 1, color: accent, textAlign: 'left',
              borderBottom: `1px solid rgba(34,211,238,0.25)`,
            }}>LINE ITEM</th>
            <th style={{
              padding: '10px 14px', fontSize: 10, fontWeight: 700,
              letterSpacing: 1, color: accent, textAlign: 'right',
              borderBottom: `1px solid rgba(34,211,238,0.25)`,
              borderLeft: '1px solid rgba(30,74,104,0.4)',
            }}>VALUE</th>
            <th style={{
              padding: '10px 14px', fontSize: 10, fontWeight: 700,
              letterSpacing: 1, color: accent, textAlign: 'right',
              borderBottom: `1px solid rgba(34,211,238,0.25)`,
              borderLeft: '1px solid rgba(30,74,104,0.4)',
            }}>YoY</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => {
            if (row.isSection) {
              return (
                <tr key={idx} style={{ background: 'rgba(12,54,73,0.4)' }}>
                  <td colSpan={3} style={{
                    padding: '8px 14px 6px',
                    fontSize: 10, fontWeight: 800,
                    letterSpacing: 1.5, color: '#4a7a96',
                    borderTop: idx > 0 ? '1px solid rgba(30,74,104,0.3)' : 'none',
                  }}>
                    {row.label.toUpperCase()}
                  </td>
                </tr>
              );
            }

            const isEven = idx % 2 === 0;
            const yoyColor = row.yoy
              ? row.yoy.startsWith('+') ? '#34d399' : row.yoy.startsWith('-') ? '#E63946' : '#7eaabf'
              : '#7eaabf';

            return (
              <tr key={idx} style={{
                background: isEven ? 'rgba(8,15,22,0.3)' : 'rgba(12,30,45,0.3)',
                borderBottom: '1px solid rgba(30,74,104,0.2)',
              }}>
                <td style={{
                  padding: row.isBold ? '10px 14px' : '8px 14px 8px 22px',
                  fontSize: row.isBold ? 12 : 11,
                  fontWeight: row.isBold ? 700 : 400,
                  color: row.isBold ? '#E8EDF5' : '#C4D4DE',
                  wordBreak: 'break-word',
                }}>
                  {row.label}
                </td>
                <td style={{
                  padding: row.isBold ? '10px 14px' : '8px 14px',
                  fontSize: row.isBold ? 12 : 11,
                  fontWeight: row.isBold ? 700 : 400,
                  color: row.isBold ? '#E8EDF5' : '#C4D4DE',
                  textAlign: 'right',
                  borderLeft: '1px solid rgba(30,74,104,0.2)',
                  fontFamily: 'monospace',
                }}>
                  {row.value}
                </td>
                <td style={{
                  padding: '8px 14px',
                  fontSize: 11,
                  color: yoyColor,
                  textAlign: 'right',
                  borderLeft: '1px solid rgba(30,74,104,0.2)',
                  fontFamily: 'monospace',
                }}>
                  {row.yoy || '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
