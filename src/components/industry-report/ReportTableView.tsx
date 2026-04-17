'use client';

import { ReportTable } from '@ai-insights/types';

interface ReportTableViewProps {
  table: ReportTable;
  accent?: string;
}

export default function ReportTableView({ table, accent = '#3491E8' }: ReportTableViewProps) {
  if (!table?.headers?.length || !table?.rows?.length) return null;

  return (
    <div style={{ marginTop: 18, marginBottom: 4 }}>
      {table.title && (
        <div style={{
          fontSize: 13,
          fontWeight: 600,
          color: accent,
          marginBottom: 10,
          letterSpacing: 0.2,
          lineHeight: 1.4,
        }}>
          {table.title}
        </div>
      )}
      <div style={{
        overflowX: 'auto',
        borderRadius: 10,
        border: '1px solid rgba(30,74,104,0.3)',
        background: 'rgba(8,15,22,0.3)',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>
              {table.headers.map((h, i) => (
                <th
                  key={i}
                  style={{
                    padding: '11px 16px',
                    textAlign: 'left',
                    fontWeight: 600,
                    color: accent,
                    backgroundColor: 'rgba(52,145,232,0.06)',
                    borderBottom: '1px solid rgba(30,74,104,0.35)',
                    whiteSpace: 'nowrap',
                    letterSpacing: 0.3,
                    fontSize: 11,
                    textTransform: i === 0 ? 'none' : undefined,
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
                  backgroundColor: ri % 2 === 0 ? 'transparent' : 'rgba(14,50,75,0.2)',
                  transition: 'background-color 0.15s',
                }}
              >
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    style={{
                      padding: '10px 16px',
                      color: ci === 0 ? '#E8EDF5' : '#B8CCDA',
                      fontWeight: ci === 0 ? 600 : 400,
                      borderBottom: ri < table.rows.length - 1 ? '1px solid rgba(30,74,104,0.2)' : 'none',
                      lineHeight: 1.6,
                      fontSize: 12,
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
