'use client';

import { ThemeRow, ThemeType } from '@/lib/types';

const TYPE_CONFIG: Record<ThemeType, { accent: string; label: string; slideLabel: string }> = {
  business: {
    accent: '#3491E8',
    label: 'Business Themes',
    slideLabel: 'BUSINESS THEMES ANALYSIS',
  },
  technology: {
    accent: '#8B5CF6',
    label: 'Technology Themes',
    slideLabel: 'TECHNOLOGY THEMES ANALYSIS',
  },
  sustainability: {
    accent: '#10B981',
    label: 'Sustainability Themes',
    slideLabel: 'SUSTAINABILITY THEMES ANALYSIS',
  },
};

interface ThemeTableProps {
  rows: ThemeRow[];
  companyName: string;
  themeType: ThemeType;
  onReset: () => void;
  completedAt?: string;
}

export default function ThemeTable({
  rows,
  companyName,
  themeType,
  onReset,
  completedAt,
}: ThemeTableProps) {
  const cfg = TYPE_CONFIG[themeType];

  return (
    <div>
      {/* Header bar */}
      <div style={{
        background: 'linear-gradient(135deg, #0c3649, #0a2233)',
        border: '1px solid #1e4a68',
        borderRadius: 12,
        padding: '16px 24px',
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: cfg.accent, letterSpacing: 2 }}>
            {cfg.slideLabel}
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#E8EDF5', marginTop: 4 }}>
            {companyName}
          </div>
          <div style={{ fontSize: 12, color: '#7eaabf', marginTop: 2 }}>
            {rows.length} themes identified
            {completedAt ? ` · ${new Date(completedAt).toLocaleTimeString()}` : ''}
          </div>
        </div>
        <button
          onClick={onReset}
          style={{
            background: 'rgba(52,145,232,0.1)',
            border: '1px solid rgba(52,145,232,0.25)',
            color: '#6ab8ff',
            borderRadius: 8,
            padding: '8px 18px',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          New Analysis
        </button>
      </div>

      {/* Table */}
      <div style={{
        background: 'rgba(8,15,22,0.6)',
        border: '1px solid #1e4a68',
        borderRadius: 10,
        overflow: 'hidden',
      }}>
        {/* Section header */}
        <div style={{ background: '#0c3649', padding: '12px 20px', borderBottom: '1px solid #1e4a68' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ height: 2, width: 28, background: cfg.accent, borderRadius: 1 }} />
            <div style={{ fontSize: 11, fontWeight: 700, color: cfg.accent, letterSpacing: 2 }}>
              {cfg.label.toUpperCase()} — {companyName.toUpperCase()}
            </div>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            minWidth: 800,
            tableLayout: 'fixed',
          }}>
            <colgroup>
              <col style={{ width: '14%' }} />
              <col style={{ width: '28%' }} />
              <col style={{ width: '30%' }} />
              <col style={{ width: '28%' }} />
            </colgroup>
            <thead>
              <tr>
                {['Theme', 'Description', 'Examples (Use Cases)', 'Strategic Impact'].map((h, i) => (
                  <th key={h} style={{
                    padding: '10px 14px',
                    fontSize: 11,
                    fontWeight: 700,
                    color: i === 0 ? cfg.accent : '#7eaabf',
                    letterSpacing: 0.8,
                    textTransform: 'uppercase',
                    borderBottom: '1px solid #1e4a68',
                    background: i === 0
                      ? `rgba(${hexToRgb(cfg.accent)},0.08)`
                      : 'rgba(15,37,53,0.8)',
                    textAlign: 'left',
                    whiteSpace: 'nowrap',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr
                  key={ri}
                  style={{ background: ri % 2 === 0 ? 'transparent' : 'rgba(15,37,53,0.3)' }}
                >
                  {/* Theme name */}
                  <td style={{
                    padding: '14px 14px',
                    fontWeight: 700,
                    fontSize: 13,
                    color: '#E8EDF5',
                    background: `rgba(${hexToRgb(cfg.accent)},0.06)`,
                    borderRight: '1px solid #1e4a68',
                    borderBottom: '1px solid rgba(30,74,104,0.3)',
                    verticalAlign: 'top',
                    wordBreak: 'break-word',
                  }}>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'flex-start',
                      gap: 6,
                    }}>
                      <div style={{
                        width: 4,
                        minWidth: 4,
                        height: 4,
                        borderRadius: '50%',
                        background: cfg.accent,
                        marginTop: 5,
                        flexShrink: 0,
                      }} />
                      {row.theme}
                    </div>
                  </td>

                  {/* Description */}
                  <td style={tdStyle}>
                    <div style={{ fontSize: 12, color: '#C4D4DE', lineHeight: 1.65 }}>
                      {row.description}
                    </div>
                  </td>

                  {/* Examples */}
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {row.examples.split('|').map((ex, ei) => (
                        <div key={ei} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                          <div style={{
                            width: 5,
                            minWidth: 5,
                            height: 5,
                            borderRadius: 1,
                            background: cfg.accent,
                            opacity: 0.6,
                            marginTop: 5,
                            flexShrink: 0,
                          }} />
                          <span style={{ fontSize: 12, color: '#C4D4DE', lineHeight: 1.6 }}>
                            {ex.trim()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </td>

                  {/* Strategic impact */}
                  <td style={{ ...tdStyle, background: `rgba(${hexToRgb(cfg.accent)},0.03)` }}>
                    <div style={{ fontSize: 12, color: '#C4D4DE', lineHeight: 1.65, fontStyle: 'italic' }}>
                      {row.strategicImpact}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Helper: convert 6-char hex to "r,g,b" for rgba()
function hexToRgb(hex: string): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `${r},${g},${b}`;
}

const tdStyle: React.CSSProperties = {
  padding: '14px 14px',
  fontSize: 12,
  color: '#C4D4DE',
  borderBottom: '1px solid rgba(30,74,104,0.3)',
  verticalAlign: 'top',
  wordBreak: 'break-word',
};
