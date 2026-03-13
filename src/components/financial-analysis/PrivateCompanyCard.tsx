'use client';

import { FinancialAnalysisJob } from '@/lib/types';

interface PrivateCompanyCardProps {
  job: FinancialAnalysisJob;
}

const ACCENT = '#22D3EE';

function hexToRgb(hex: string): string {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)].join(',');
}

interface TickerBoxProps {
  label: string;
  value: string;
  accent: string;
  note?: string;
}

function TickerBox({ label, value, accent, note }: TickerBoxProps) {
  return (
    <div style={{
      flex: '1 1 200px',
      background: `rgba(${hexToRgb(accent)}, 0.06)`,
      border: `1px solid rgba(${hexToRgb(accent)}, 0.25)`,
      borderRadius: 12,
      padding: '20px 20px 16px',
      textAlign: 'center',
      minWidth: 0,
    }}>
      <div style={{
        fontSize: 9, fontWeight: 800, letterSpacing: 2,
        color: accent, marginBottom: 10, textTransform: 'uppercase',
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 18, fontWeight: 900, color: '#E8EDF5',
        lineHeight: 1.2, marginBottom: 6, wordBreak: 'break-word',
      }}>
        {value}
      </div>
      {note && (
        <div style={{ fontSize: 10, color: '#4a7a96', fontStyle: 'italic' }}>
          {note}
        </div>
      )}
    </div>
  );
}

export default function PrivateCompanyCard({ job }: PrivateCompanyCardProps) {
  return (
    <div>
      {/* Ticker boxes */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <TickerBox
          label="Est. Annual Revenue"
          value={job.estimatedRevenue || 'Not disclosed'}
          accent={ACCENT}
          note="(est. from public sources)"
        />
        <TickerBox
          label="Profitability Margin"
          value={job.profitabilityMargin || 'Not disclosed'}
          accent="#10B981"
          note="(est.)"
        />
        <TickerBox
          label="YoY Revenue Growth"
          value={job.estimatedYoyGrowth || 'Not disclosed'}
          accent="#F59E0B"
          note="(est.)"
        />
      </div>

      {/* Funding info */}
      {(job.fundingInfo || job.lastValuation) && (
        <div style={{
          background: 'rgba(12,54,73,0.3)',
          border: '1px solid #1e4a68',
          borderRadius: 10, padding: '16px 20px',
          marginBottom: 20,
          display: 'flex', flexWrap: 'wrap', gap: 24,
        }}>
          {job.fundingInfo && (
            <div>
              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 2, color: '#4a7a96', marginBottom: 4 }}>
                FUNDING
              </div>
              <div style={{ fontSize: 13, color: '#E8EDF5', fontWeight: 600 }}>{job.fundingInfo}</div>
            </div>
          )}
          {job.lastValuation && (
            <div>
              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 2, color: '#4a7a96', marginBottom: 4 }}>
                LAST VALUATION
              </div>
              <div style={{ fontSize: 13, color: '#E8EDF5', fontWeight: 600 }}>{job.lastValuation}</div>
            </div>
          )}
        </div>
      )}

      {/* Private insights */}
      {job.privateInsights && job.privateInsights.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #0c1e2d, #080f16)',
          border: '1px solid #1e4a68',
          borderLeft: `3px solid ${ACCENT}`,
          borderRadius: 10,
          padding: '16px 20px',
        }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.5, color: ACCENT, marginBottom: 14 }}>
            KEY INSIGHTS
          </div>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {job.privateInsights.map((insight, idx) => (
              <li key={idx} style={{
                display: 'flex', gap: 10, alignItems: 'flex-start',
                marginBottom: idx < job.privateInsights!.length - 1 ? 12 : 0,
              }}>
                <span style={{ color: ACCENT, fontSize: 10, marginTop: 3, flexShrink: 0 }}>●</span>
                <span style={{ fontSize: 12, color: '#C4D4DE', lineHeight: 1.6 }}>{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Disclaimer */}
      <div style={{
        marginTop: 16, fontSize: 10, color: '#4a7a96', fontStyle: 'italic', textAlign: 'right',
      }}>
        Estimates based on public sources (Crunchbase, news, LinkedIn, industry reports) · Not investment advice
      </div>
    </div>
  );
}
