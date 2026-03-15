'use client';

import { ReportTable } from '@/lib/types';

interface ReportTableViewProps {
  table: ReportTable;
  accent?: string;
}

export default function ReportTableView({ table, accent = '#059669' }: ReportTableViewProps) {
  if (!table?.headers?.length || !table?.rows?.length) return null;

  return (
    <div style={{ marginTop: 16 }}>
      {table.title && (
        <div style={{ fontSize: 13, fontWeight: 600, color: accent, marginBottom: 8, letterSpacing: 0.3 }}>
          {table.title}
        </div>
      )}
      <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid #1e4a68' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>
              {table.headers.map((h, i) => (
                <th
                  key={i}
                  style={{
                    padding: '10px 14px',
                    textAlign: 'left',
                    fontWeight: 600,
                    color: accent,
                    backgroundColor: 'rgba(5,150,105,0.06)',
                    borderBottom: '1px solid #1e4a68',
                    whiteSpace: 'nowrap',
                    letterSpacing: 0.3,
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, ri) => (
              <tr
                key={ri}
                style={{
                  backgroundColor: ri % 2 === 0 ? 'transparent' : 'rgba(14,50,75,0.25)',
                }}
              >
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    style={{
                      padding: '9px 14px',
                      color: ci === 0 ? '#E8EDF5' : '#C4D4DE',
                      fontWeight: ci === 0 ? 500 : 400,
                      borderBottom: ri < table.rows.length - 1 ? '1px solid rgba(30,74,104,0.3)' : 'none',
                      lineHeight: 1.55,
                    }}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
