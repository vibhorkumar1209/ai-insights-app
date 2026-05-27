'use client';

import { FinancialStatementRow } from '@ai-insights/types';

interface FinancialTableProps {
  rows: FinancialStatementRow[];
  accent?: string;
}

export default function FinancialTable({ rows, accent = '#3491E8' }: FinancialTableProps) {
  // Detect if any row has previousValue data
  const hasPrevYear = rows.some((r) => !r.isSection && r.previousValue && r.previousValue !== 'N/A' && r.previousValue.trim() !== '');
  // Detect if any row has meaningful YoY data
  const hasYoY = rows.some((r) => !r.isSection && r.yoy && r.yoy !== '—' && r.yoy.trim() !== '');

  // Column count for colSpan on section rows
  const colCount = 1 + 1 + (hasPrevYear ? 1 : 0) + (hasYoY ? 1 : 0); // label + current + prev? + yoy?

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0c3649, #12516E)',
      border: '1px solid #CCDFEA',
      borderRadius: 10,
      overflow: 'hidden',
    }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <colgroup>
          {hasPrevYear && hasYoY ? (
            <>
              <col style={{ width: '40%' }} />
              <col style={{ width: '22%' }} />
              <col style={{ width: '22%' }} />
              <col style={{ width: '16%' }} />
            </>
          ) : hasPrevYear ? (
            <>
              <col style={{ width: '45%' }} />
              <col style={{ width: '27.5%' }} />
              <col style={{ width: '27.5%' }} />
            </>
          ) : hasYoY ? (
            <>
              <col style={{ width: '55%' }} />
              <col style={{ width: '25%' }} />
              <col style={{ width: '20%' }} />
            </>
          ) : (
            <>
              <col style={{ width: '60%' }} />
              <col style={{ width: '40%' }} />
            </>
          )}
        </colgroup>
        <thead>
          <tr style={{ background: '#0c3649' }}>
            <th style={{
              padding: '10px 14px', fontSize: 10, fontWeight: 700,
              letterSpacing: 1, color: accent, textAlign: 'left',
              borderBottom: '1px solid rgba(255,255,255,0.15)',
            }}>LINE ITEM</th>
            <th style={{
              padding: '10px 14px', fontSize: 10, fontWeight: 700,
              letterSpacing: 1, color: accent, textAlign: 'right',
              borderBottom: '1px solid rgba(255,255,255,0.15)',
              borderLeft: '1px solid rgba(255,255,255,0.1)',
            }}>CURRENT YEAR</th>
            {hasPrevYear && (
              <th style={{
                padding: '10px 14px', fontSize: 10, fontWeight: 700,
                letterSpacing: 1, color: 'rgba(255,255,255,0.7)', textAlign: 'right',
                borderBottom: '1px solid rgba(255,255,255,0.15)',
                borderLeft: '1px solid rgba(255,255,255,0.1)',
              }}>PREVIOUS YEAR</th>
            )}
            {hasYoY && (
              <th style={{
                padding: '10px 14px', fontSize: 10, fontWeight: 700,
                letterSpacing: 1, color: accent, textAlign: 'right',
                borderBottom: '1px solid rgba(255,255,255,0.15)',
                borderLeft: '1px solid rgba(255,255,255,0.1)',
              }}>YoY</th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => {
            if (row.isSection) {
              return (
                <tr key={idx} style={{ background: '#F3F8FA' }}>
                  <td colSpan={colCount} style={{
                    padding: '8px 14px 6px',
                    fontSize: 10, fontWeight: 800,
                    letterSpacing: 1.5, color: '#6B7280',
                    borderTop: idx > 0 ? '1px solid rgba(30,74,104,0.3)' : 'none',
                  }}>
                    {row.label.toUpperCase()}
                  </td>
                </tr>
              );
            }

            const isEven = idx % 2 === 0;
            const yoyColor = row.yoy
              ? row.yoy.startsWith('+') ? '#34d399' : row.yoy.startsWith('-') ? '#E63946' : '#4A6274'
              : '#4A6274';

            return (
              <tr key={idx} style={{
                background: isEven ? '#FFFFFF' : '#F3F8FA',
                borderBottom: '1px solid rgba(30,74,104,0.2)',
              }}>
                <td style={{
                  padding: row.isBold ? '10px 14px' : '8px 14px 8px 22px',
                  fontSize: row.isBold ? 12 : 11,
                  fontWeight: row.isBold ? 700 : 400,
                  color: row.isBold ? '#1B2A3D' : '#6B7280',
                  wordBreak: 'break-word',
                }}>
                  {row.label}
                </td>
                <td style={{
                  padding: row.isBold ? '10px 14px' : '8px 14px',
                  fontSize: row.isBold ? 12 : 11,
                  fontWeight: row.isBold ? 700 : 400,
                  color: row.isBold ? '#1B2A3D' : '#6B7280',
                  textAlign: 'right',
                  borderLeft: '1px solid rgba(30,74,104,0.2)',
                  fontFamily: 'monospace',
                }}>
                  {row.value}
                </td>
                {hasPrevYear && (
                  <td style={{
                    padding: row.isBold ? '10px 14px' : '8px 14px',
                    fontSize: row.isBold ? 12 : 11,
                    fontWeight: row.isBold ? 600 : 400,
                    color: '#6B7280',
                    textAlign: 'right',
                    borderLeft: '1px solid rgba(30,74,104,0.2)',
                    fontFamily: 'monospace',
                  }}>
                    {row.previousValue || '—'}
                  </td>
                )}
                {hasYoY && (
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
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
