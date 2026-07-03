'use client';

import { ReportTable } from '@ai-insights/types';

interface ReportTableViewProps {
  table: ReportTable;
  accent?: string;
}

// Renders a cell as a clickable link if it's a bare URL, otherwise as plain text
function CellContent({ cell, accent }: { cell: string; accent: string }) {
  const trimmed = cell.trim();
  if (/^https?:\/\/\S+$/.test(trimmed)) {
    return (
      <a
        href={trimmed}
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: accent, textDecoration: 'none' }}
        onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline'; }}
        onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none'; }}
      >
        Source ↗
      </a>
    );
  }
  return <>{cell}</>;
}

export default function ReportTableView({ table, accent = '#3491E8' }: ReportTableViewProps) {
  if (!table?.headers?.length || !table?.rows?.length) return null;

  const descriptionColIndex = table.headers.findIndex((h) => h.trim().toLowerCase() === 'description');

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
        background: '#EDF4F8',
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
                    minWidth: i === descriptionColIndex ? 320 : undefined,
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
                  backgroundColor: ri % 2 === 0 ? 'transparent' : '#F0F7FB',
                  transition: 'background-color 0.15s',
                }}
              >
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    style={{
                      padding: '10px 16px',
                      color: ci === 0 ? '#1B2A3D' : '#374B5C',
                      fontWeight: ci === 0 ? 600 : 400,
                      borderBottom: ri < table.rows.length - 1 ? '1px solid rgba(30,74,104,0.2)' : 'none',
                      lineHeight: 1.6,
                      fontSize: 12,
                      minWidth: ci === descriptionColIndex ? 320 : undefined,
                    }}
                  >
                    <CellContent cell={cell} accent={accent} />
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
