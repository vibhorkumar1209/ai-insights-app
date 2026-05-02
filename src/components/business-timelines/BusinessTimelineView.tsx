'use client';

import { TimelineBlock, StrategicEvolutionBullet } from '@ai-insights/types';

interface BusinessTimelineViewProps {
  timelineBlocks: TimelineBlock[];
  strategicEvolution?: StrategicEvolutionBullet[];
  companyName: string;
  onReset: () => void;
  completedAt?: string;
}

const ACCENT = '#06B6D4';

function hexToRgb(hex: string): string {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ].join(',');
}

export default function BusinessTimelineView({
  timelineBlocks,
  strategicEvolution,
  companyName,
  onReset,
  completedAt,
}: BusinessTimelineViewProps) {
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
              📈 BUSINESS TIMELINE
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

      {/* Timeline */}
      <div style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
      }}>
        {/* Vertical timeline line */}
        <div style={{
          position: 'absolute',
          left: 15,
          top: 0,
          bottom: 0,
          width: 2,
          background: `rgba(${hexToRgb(ACCENT)},0.2)`,
          zIndex: 0,
        }} />

        {timelineBlocks.map((block, idx) => (
          <div key={idx} style={{
            position: 'relative',
            paddingLeft: 60,
            paddingBottom: idx === timelineBlocks.length - 1 ? 0 : 32,
            zIndex: 1,
          }}>
            {/* Timeline dot */}
            <div style={{
              position: 'absolute',
              left: 0,
              top: 4,
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: `rgba(${hexToRgb(ACCENT)},0.1)`,
              border: `2px solid ${ACCENT}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <div style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: ACCENT,
              }} />
            </div>

            {/* Timeline block content */}
            <div style={{
              background: `rgba(${hexToRgb(ACCENT)},0.03)`,
              border: `1px solid rgba(${hexToRgb(ACCENT)},0.15)`,
              borderRadius: 10,
              padding: 20,
            }}>
              {/* Period header */}
              <div style={{
                fontSize: 13,
                fontWeight: 700,
                color: ACCENT,
                textTransform: 'uppercase',
                letterSpacing: 1.2,
                marginBottom: 12,
              }}>
                {block.period}
              </div>

              {/* Narrative */}
              <div style={{
                fontSize: 13,
                color: '#C4D4DE',
                lineHeight: 1.7,
                marginBottom: 12,
                fontStyle: 'normal',
              }}>
                {block.narrative.split('\n').map((line, i) => (
                  <p key={i} style={{ margin: '0 0 8px 0' }}>
                    {line}
                  </p>
                ))}
              </div>

              {/* Source */}
              {block.source && (
                <div style={{
                  fontSize: 11,
                  color: '#6B8FA5',
                  fontStyle: 'italic',
                  paddingTop: 8,
                  borderTop: `1px solid rgba(${hexToRgb(ACCENT)},0.1)`,
                }}>
                  Source: {block.source}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Strategic Evolution */}
      {strategicEvolution && strategicEvolution.length > 0 && (
        <div style={{
          marginTop: 32,
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
            Strategic Evolution Summary
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
        marginTop: 24,
        fontSize: 11,
        color: '#4a7a96',
        textAlign: 'right',
      }}>
        Analysis based on 10-K filings, earnings calls, and press releases · {timelineBlocks.length} strategic phases
      </div>
    </div>
  );
}
