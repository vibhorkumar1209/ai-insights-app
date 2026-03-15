'use client';

import { IndustryTrendRow } from '@/lib/types';

interface IndustryTrendsTableProps {
  businessTrends: IndustryTrendRow[];
  techTrends: IndustryTrendRow[];
  industrySegment: string;
  geography?: string;
  onReset: () => void;
  completedAt?: string;
}

const ACCENT = '#A855F7';
const BIZ_ACCENT = '#F59E0B';
const TECH_ACCENT = '#22D3EE';

function hexToRgb(hex: string): string {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ].join(',');
}

/** Render a bullet-point string as separate <div> lines */
function BulletText({ text, color = '#E8EDF5' }: { text: string; color?: string }) {
  const lines = text.split('\n').filter((l) => l.trim());
  return (
    <div>
      {lines.map((line, i) => (
        <div key={i} style={{ marginBottom: i < lines.length - 1 ? 6 : 0, lineHeight: 1.55 }}>
          {line.trim().startsWith('•') ? (
            <span style={{ color }}>
              <span style={{ color: '#7eaabf', marginRight: 6 }}>{'\u2022'}</span>
              {line.trim().slice(1).trim()}
            </span>
          ) : (
            <span style={{ color }}>{line.trim()}</span>
          )}
        </div>
      ))}
    </div>
  );
}

function TrendTable({
  rows,
  sectionLabel,
  sectionIcon,
  sectionAccent,
}: {
  rows: IndustryTrendRow[];
  sectionLabel: string;
  sectionIcon: string;
  sectionAccent: string;
}) {
  if (rows.length === 0) return null;

  return (
    <div style={{ marginBottom: 36 }}>
      {/* Section heading */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        marginBottom: 16,
      }}>
        <span style={{ fontSize: 20 }}>{sectionIcon}</span>
        <span style={{
          fontSize: 14, fontWeight: 800, color: sectionAccent,
          letterSpacing: 1,
        }}>
          {sectionLabel}
        </span>
        <span style={{
          background: `rgba(${hexToRgb(sectionAccent)},0.12)`,
          border: `1px solid rgba(${hexToRgb(sectionAccent)},0.3)`,
          borderRadius: 5, padding: '2px 8px',
          fontSize: 10, fontWeight: 700, color: sectionAccent,
        }}>
          {rows.length} TRENDS
        </span>
      </div>

      <div style={{
        background: 'linear-gradient(135deg, #0c1e2d, #080f16)',
        border: '1px solid #1e4a68',
        borderRadius: 12,
        overflow: 'hidden',
      }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          tableLayout: 'fixed',
        }}>
          <colgroup>
            <col style={{ width: '15%' }} />
            <col style={{ width: '18%' }} />
            <col style={{ width: '35%' }} />
            <col style={{ width: '32%' }} />
          </colgroup>
          <thead>
            <tr style={{ background: 'rgba(12,54,73,0.8)' }}>
              {['Trend', 'Impact of Trend', 'Description', 'Examples'].map((label) => (
                <th
                  key={label}
                  style={{
                    padding: '14px 18px',
                    fontSize: 11, fontWeight: 700,
                    letterSpacing: 1, color: sectionAccent,
                    textAlign: 'left',
                    borderBottom: `2px solid rgba(${hexToRgb(sectionAccent)},0.3)`,
                    borderRight: '1px solid #1e4a68',
                  }}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr
                key={idx}
                style={{
                  background: idx % 2 === 0
                    ? 'rgba(8,15,22,0.4)'
                    : 'rgba(12,30,45,0.4)',
                  borderBottom: '1px solid rgba(30,74,104,0.3)',
                }}
              >
                {/* Trend */}
                <td style={{
                  padding: '16px 18px',
                  fontSize: 12, fontWeight: 700,
                  color: sectionAccent,
                  verticalAlign: 'top',
                  borderRight: '1px solid rgba(30,74,104,0.3)',
                  wordBreak: 'break-word',
                  lineHeight: 1.5,
                }}>
                  {row.trend}
                </td>

                {/* Impact */}
                <td style={{
                  padding: '16px 18px',
                  fontSize: 12, color: '#E8EDF5',
                  verticalAlign: 'top',
                  borderRight: '1px solid rgba(30,74,104,0.3)',
                  wordBreak: 'break-word',
                  lineHeight: 1.5,
                  fontStyle: 'italic',
                }}>
                  {row.impact}
                </td>

                {/* Description (bullets) */}
                <td style={{
                  padding: '16px 18px',
                  fontSize: 12,
                  verticalAlign: 'top',
                  borderRight: '1px solid rgba(30,74,104,0.3)',
                  wordBreak: 'break-word',
                }}>
                  <BulletText text={row.description} color="#E8EDF5" />
                </td>

                {/* Examples (bullets with regional labels) */}
                <td style={{
                  padding: '16px 18px',
                  fontSize: 12,
                  verticalAlign: 'top',
                  wordBreak: 'break-word',
                  background: `rgba(${hexToRgb(sectionAccent)},0.03)`,
                }}>
                  <BulletText text={row.examples} color="#c4d5e0" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function IndustryTrendsTable({
  businessTrends,
  techTrends,
  industrySegment,
  geography,
  onReset,
  completedAt,
}: IndustryTrendsTableProps) {
  return (
    <div>
      {/* Results header bar */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        marginBottom: 24, gap: 16, flexWrap: 'wrap',
      }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#E8EDF5', marginBottom: 4 }}>
            {industrySegment}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: `rgba(${hexToRgb(ACCENT)},0.12)`,
              border: `1px solid rgba(${hexToRgb(ACCENT)},0.3)`,
              borderRadius: 6, padding: '4px 12px',
              fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: 1,
            }}>
              INDUSTRY TRENDS
            </span>
            {geography && geography !== 'Global' && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                background: 'rgba(52,145,232,0.1)',
                border: '1px solid rgba(52,145,232,0.3)',
                borderRadius: 5, padding: '4px 10px',
                fontSize: 11, fontWeight: 700, color: '#3491E8', letterSpacing: 0.5,
              }}>
                🌐 {geography}
              </span>
            )}
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: 'rgba(16,185,129,0.1)',
              border: '1px solid rgba(16,185,129,0.3)',
              borderRadius: 5, padding: '4px 10px',
              fontSize: 11, fontWeight: 700, color: '#34d399', letterSpacing: 0.5,
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#34d399', display: 'inline-block' }} />
              COMPLETE
            </span>
            {completedAt && (
              <span style={{ fontSize: 11, color: '#4a7a96' }}>
                {new Date(completedAt).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric',
                })}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={onReset}
          style={{
            background: 'rgba(30,74,104,0.4)',
            border: '1px solid #1e4a68',
            color: '#7eaabf',
            borderRadius: 8, padding: '8px 18px',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          ← New Analysis
        </button>
      </div>

      {/* Block 1: Business Trends */}
      <TrendTable
        rows={businessTrends}
        sectionLabel="BUSINESS TRENDS"
        sectionIcon="💼"
        sectionAccent={BIZ_ACCENT}
      />

      {/* Block 2: Technology Trends */}
      <TrendTable
        rows={techTrends}
        sectionLabel="TECHNOLOGY TRENDS"
        sectionIcon="⚡"
        sectionAccent={TECH_ACCENT}
      />

      {/* Footer note */}
      <div style={{
        marginTop: 16,
        fontSize: 11,
        color: '#4a7a96',
        textAlign: 'right',
      }}>
        Based on analyst reports, industry publications, and publicly available data · {businessTrends.length + techTrends.length} trends
      </div>
    </div>
  );
}
