'use client';

import { KeyBuyerRow } from '@/lib/types';
import BulletText from '@/components/shared/BulletText';
import SourceLinks from '@/components/shared/SourceLinks';

interface KeyBuyersTableProps {
  rows: KeyBuyerRow[];
  companyName: string;
  onReset: () => void;
  completedAt?: string;
}

const ACCENT = '#3B82F6';

function hexToRgb(hex: string): string {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ].join(',');
}

export default function KeyBuyersTable({
  rows,
  companyName,
  onReset,
  completedAt,
}: KeyBuyersTableProps) {
  return (
    <div>
      {/* Results header bar */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        marginBottom: 24, gap: 16, flexWrap: 'wrap',
      }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#1B2A3D', marginBottom: 4 }}>
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
              KEY PROSPECTIVE BUYERS
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
              <span style={{ fontSize: 11, color: '#6B7280' }}>
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
            background: '#EDF4F8',
            border: '1px solid #CCDFEA',
            color: '#6B7280',
            borderRadius: 8, padding: '8px 18px',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          ← New Analysis
        </button>
      </div>

      {/* Table */}
      <div style={{
        background: 'linear-gradient(135deg, #0c3649, #12516E)',
        border: '1px solid #CCDFEA',
        borderRadius: 12,
        overflow: 'hidden',
      }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          tableLayout: 'fixed',
        }}>
          <colgroup>
            <col style={{ width: '20%' }} />
            <col style={{ width: '15%' }} />
            <col style={{ width: '18%' }} />
            <col style={{ width: '35%' }} />
            <col style={{ width: '12%' }} />
          </colgroup>
          <thead>
            <tr style={{ background: '#0c3649' }}>
              {[
                'Key Executive',
                'Theme',
                'Reference',
                'Excerpt',
                'Source',
              ].map((label) => (
                <th
                  key={label}
                  style={{
                    padding: '14px 18px',
                    fontSize: 11, fontWeight: 700,
                    letterSpacing: 1, color: ACCENT,
                    textAlign: 'left',
                    borderBottom: `2px solid rgba(${hexToRgb(ACCENT)},0.3)`,
                    borderRight: '1px solid #CCDFEA',
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
                    ? '#F3F8FA'
                    : '#FFFFFF',
                  borderBottom: '1px solid rgba(30,74,104,0.3)',
                }}
              >
                {/* Key Executive */}
                <td style={{
                  padding: '16px 18px',
                  fontSize: 12, color: '#1B2A3D',
                  verticalAlign: 'top',
                  borderRight: '1px solid rgba(30,74,104,0.3)',
                  wordBreak: 'break-word',
                  lineHeight: 1.5,
                  fontWeight: 600,
                }}>
                  {row.keyExecutive}
                </td>

                {/* Theme */}
                <td style={{
                  padding: '16px 18px',
                  fontSize: 12, fontWeight: 700,
                  color: ACCENT,
                  verticalAlign: 'top',
                  borderRight: '1px solid rgba(30,74,104,0.3)',
                  wordBreak: 'break-word',
                  lineHeight: 1.5,
                }}>
                  {row.theme}
                </td>

                {/* Reference (event where quote was mentioned) */}
                <td style={{
                  padding: '16px 18px',
                  fontSize: 12, color: '#93c5fd',
                  verticalAlign: 'top',
                  borderRight: '1px solid rgba(30,74,104,0.3)',
                  wordBreak: 'break-word',
                  lineHeight: 1.5,
                  fontStyle: 'italic',
                }}>
                  {row.reference}
                </td>

                {/* Excerpt */}
                <td style={{
                  padding: '16px 18px',
                  verticalAlign: 'top',
                  wordBreak: 'break-word',
                  background: 'rgba(59,130,246,0.03)',
                  borderRight: '1px solid rgba(30,74,104,0.3)',
                }}>
                  <BulletText text={row.excerpt} color="#1B2A3D" boldColor="#93c5fd" fontSize={13} bulletColor="#3B82F6" />
                </td>

                {/* Source */}
                <td style={{
                  padding: '16px 18px',
                  fontSize: 11,
                  color: '#6B7280',
                  verticalAlign: 'top',
                  wordBreak: 'break-word',
                  lineHeight: 1.5,
                }}>
                  <SourceLinks source={row.source} color="#6B7280" linkColor={ACCENT} fontSize={11} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer note */}
      <div style={{
        marginTop: 16,
        fontSize: 11,
        color: '#6B7280',
        textAlign: 'right',
      }}>
        Based on publicly available executive statements, interviews, and posts · {rows.length} insights
      </div>
    </div>
  );
}
