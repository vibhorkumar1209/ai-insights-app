'use client';

import { BusinessSegment, StrategicEvolutionBullet } from '@ai-insights/types';

interface BusinessSegmentsTableProps {
  segments: BusinessSegment[];
  strategicEvolution?: StrategicEvolutionBullet[];
  companyName: string;
  onReset: () => void;
  completedAt?: string;
}

const ACCENT = '#7C3AED';

function hexToRgb(hex: string): string {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ].join(',');
}

export default function BusinessSegmentsTable({
  segments,
  strategicEvolution,
  companyName,
  onReset,
  completedAt,
}: BusinessSegmentsTableProps) {
  return (
    <div>
      {/* Results header bar */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        marginBottom: 24, gap: 16, flexWrap: 'wrap',
      }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#E8EDF5', marginBottom: 4 }}>
            {companyName}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: `rgba(${hexToRgb(ACCENT)},0.12)`,
              border: `1px solid rgba(${hexToRgb(ACCENT)},0.3)`,
              borderRadius: 6, padding: '4px 12px',
              fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: 1,
            }}>
              🏢 BUSINESS SEGMENTS
            </span>
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

      {/* Segments Table */}
      <div style={{
        background: 'linear-gradient(135deg, #0c1e2d, #080f16)',
        border: '1px solid #1e4a68',
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 24,
      }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          tableLayout: 'fixed',
        }}>
          <colgroup>
            <col style={{ width: '20%' }} />
            <col style={{ width: '50%' }} />
            <col style={{ width: '30%' }} />
          </colgroup>
          <thead>
            <tr style={{ background: 'rgba(12,54,73,0.8)' }}>
              {[
                { label: 'Segment Name', align: 'left' as const },
                { label: 'Description', align: 'left' as const },
                { label: 'Source', align: 'left' as const },
              ].map((col) => (
                <th
                  key={col.label}
                  style={{
                    padding: '14px 18px',
                    fontSize: 11, fontWeight: 700,
                    letterSpacing: 1, color: ACCENT,
                    textAlign: col.align,
                    borderBottom: `2px solid rgba(${hexToRgb(ACCENT)},0.3)`,
                    borderRight: '1px solid #1e4a68',
                  }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {segments.map((segment, idx) => (
              <tr
                key={idx}
                style={{
                  background: idx % 2 === 0
                    ? 'rgba(8,15,22,0.4)'
                    : 'rgba(12,30,45,0.4)',
                  borderBottom: '1px solid rgba(30,74,104,0.3)',
                }}
              >
                {/* Segment Name */}
                <td style={{
                  padding: '16px 18px',
                  fontSize: 13, fontWeight: 700,
                  color: ACCENT,
                  verticalAlign: 'top',
                  borderRight: '1px solid rgba(30,74,104,0.3)',
                  wordBreak: 'break-word',
                }}>
                  {segment.name}
                </td>

                {/* Description */}
                <td style={{
                  padding: '16px 18px',
                  fontSize: 12,
                  color: '#C4D4DE',
                  verticalAlign: 'top',
                  borderRight: '1px solid rgba(30,74,104,0.3)',
                  wordBreak: 'break-word',
                  lineHeight: 1.6,
                }}>
                  {segment.description.split('\n').map((line, i) => (
                    <div key={i}>{line}</div>
                  ))}
                </td>

                {/* Source */}
                <td style={{
                  padding: '16px 18px',
                  fontSize: 11,
                  color: '#A0B8C8',
                  verticalAlign: 'top',
                  wordBreak: 'break-word',
                  lineHeight: 1.5,
                  fontStyle: segment.source ? 'normal' : 'italic',
                }}>
                  {segment.source || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Strategic Evolution */}
      {strategicEvolution && strategicEvolution.length > 0 && (
        <div style={{
          background: `rgba(${hexToRgb(ACCENT)},0.05)`,
          border: `1px solid rgba(${hexToRgb(ACCENT)},0.2)`,
          borderRadius: 12,
          padding: 24,
        }}>
          <div style={{
            fontSize: 13, fontWeight: 700, color: ACCENT,
            textTransform: 'uppercase', letterSpacing: 1.2,
            marginBottom: 16,
          }}>
            Strategic Evolution
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {strategicEvolution.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{
                  width: 6, height: 6, minWidth: 6,
                  borderRadius: '50%', background: ACCENT,
                  marginTop: 6,
                }} />
                <span style={{ fontSize: 12, color: '#C4D4DE', lineHeight: 1.6 }}>
                  {item.point}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{
        marginTop: 16,
        fontSize: 11,
        color: '#4a7a96',
        textAlign: 'right',
      }}>
        Analysis based on filings, investor presentations, and press releases · {segments.length} segments identified
      </div>
    </div>
  );
}
