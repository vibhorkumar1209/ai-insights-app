'use client';

import { FinancialAnalysisJob } from '@/lib/types';
import TopMetricBoxes from './TopMetricBoxes';
import KeyHighlightsCard from './KeyHighlightsCard';
import RevenueChart from './RevenueChart';
import QuarterlyChart from './QuarterlyChart';

interface PrivateCompanyCardProps {
  job: FinancialAnalysisJob;
}

const ACCENT = '#22D3EE';

function SectionCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #0c1e2d, #080f16)',
      border: '1px solid #1e4a68',
      borderRadius: 12,
      padding: '20px 24px',
      marginBottom: 20,
      ...style,
    }}>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 800, letterSpacing: 1.5,
      color: ACCENT, textTransform: 'uppercase',
      marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8,
    }}>
      {children}
    </div>
  );
}

export default function PrivateCompanyCard({ job }: PrivateCompanyCardProps) {
  // ── 1. Top Metric Boxes ─────────────────────────────────────────────────────
  const topBoxes = [
    {
      label: 'Est. Annual Revenue',
      value: job.estimatedRevenue || 'Not disclosed',
      accent: '#22D3EE',
      subtext: '(est. from public sources)',
    },
    {
      label: 'YoY Revenue Growth',
      value: job.estimatedYoyGrowth || 'Not disclosed',
      accent: '#10B981',
      subtext: '(est.)',
    },
    {
      label: 'Profitability Margin',
      value: job.profitabilityMargin || 'Not disclosed',
      accent: '#F59E0B',
      subtext: '(est.)',
    },
  ];

  // ── Check if chart data is available ──────────────────────────────────────
  const hasAnnualCharts = job.revenueHistory && job.revenueHistory.length > 0;
  const hasQuarterlyCharts = job.quarterlyHistory && job.quarterlyHistory.length > 0;
  const hasCharts = hasAnnualCharts || hasQuarterlyCharts;

  return (
    <div>
      {/* ── 1. Top Metric Boxes ──────────────────────────────────────────────── */}
      <TopMetricBoxes boxes={topBoxes} />

      {/* ── Funding / Valuation strip ────────────────────────────────────────── */}
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

      {/* ── 2. Key Highlights (structured 5 categories) ──────────────────────── */}
      {job.privateKeyHighlights && (
        <KeyHighlightsCard highlights={job.privateKeyHighlights} />
      )}

      {/* ── 3. Charts (conditional — only if data from Parallel.AI) ───────────── */}
      {hasCharts && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: (hasAnnualCharts && hasQuarterlyCharts)
            ? 'repeat(auto-fit, minmax(380px, 1fr))'
            : '1fr',
          gap: 20,
          marginBottom: 20,
        }}>
          {hasAnnualCharts && (
            <SectionCard style={{ marginBottom: 0 }}>
              <SectionTitle>
                Annual Revenue ({job.revenueHistory![0].year}–{job.revenueHistory!.at(-1)?.year})
              </SectionTitle>
              <RevenueChart data={job.revenueHistory!} marginData={job.marginHistory} />
            </SectionCard>
          )}
          {hasQuarterlyCharts && (
            <SectionCard style={{ marginBottom: 0 }}>
              <SectionTitle>
                Quarterly Revenue (last {job.quarterlyHistory!.length} quarters)
              </SectionTitle>
              <QuarterlyChart data={job.quarterlyHistory!} currency={job.currency} />
            </SectionCard>
          )}
        </div>
      )}

      {/* ── Disclaimer ───────────────────────────────────────────────────────── */}
      <div style={{
        marginTop: 16, fontSize: 10, color: '#4a7a96', fontStyle: 'italic', textAlign: 'right',
      }}>
        Estimates based on public sources (Crunchbase, news, LinkedIn, industry reports) &middot; Not investment advice
      </div>
    </div>
  );
}
