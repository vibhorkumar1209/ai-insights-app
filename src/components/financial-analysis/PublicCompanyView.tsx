'use client';

import { FinancialAnalysisJob } from '@/lib/types';
import RevenueChart from './RevenueChart';
import QuarterlyChart from './QuarterlyChart';
import RevenuePieChart from './RevenuePieChart';
import YoYComparisonTable from './YoYComparisonTable';
import TopMetricBoxes from './TopMetricBoxes';
import KeyHighlightsCard from './KeyHighlightsCard';

interface PublicCompanyViewProps {
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

function BulletInsights({ items, accent = ACCENT }: { items: string[]; accent?: string }) {
  if (!items || items.length === 0) return null;
  return (
    <SectionCard>
      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.5, color: accent, marginBottom: 14 }}>
        KEY INSIGHTS
      </div>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map((item, i) => (
          <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span style={{ color: accent, fontSize: 10, marginTop: 3, flexShrink: 0 }}>&#9670;</span>
            <span style={{ fontSize: 12, color: '#C4D4DE', lineHeight: 1.6 }}>{item}</span>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}

// ── Color palette for pie charts ────────────────────────────────────────────
const PIE_COLORS = ['#22D3EE', '#3491E8', '#8B5CF6', '#F59E0B', '#10B981', '#E63946', '#EC4899', '#6366F1'];

export default function PublicCompanyView({ job }: PublicCompanyViewProps) {
  // ── Derive top metric box values ────────────────────────────────────────────
  const latestRevenue = job.revenueHistory?.at(-1);
  const prevRevenue = job.revenueHistory?.at(-2);

  const totalRevenueLabel = latestRevenue?.revenueFormatted || '—';
  const yoyGrowthLabel = latestRevenue?.yoyGrowth != null
    ? `${latestRevenue.yoyGrowth >= 0 ? '+' : ''}${latestRevenue.yoyGrowth.toFixed(1)}%`
    : '—';

  // Profit margin change (YoY)
  const latestMargin = job.marginHistory?.at(-1);
  const prevMargin = job.marginHistory?.at(-2);
  let marginChangeLabel = '—';
  if (latestMargin && prevMargin) {
    const delta = latestMargin.netMargin - prevMargin.netMargin;
    marginChangeLabel = `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}pp`;
  } else if (latestMargin) {
    marginChangeLabel = `${latestMargin.netMargin.toFixed(1)}%`;
  }

  const topBoxes = [
    { label: `Total Revenue${latestRevenue ? ` (${latestRevenue.year})` : ''}`, value: totalRevenueLabel, accent: '#22D3EE', subtext: job.currency ? `(${job.currency})` : undefined },
    { label: 'Revenue Growth (YoY)', value: yoyGrowthLabel, accent: '#10B981', subtext: prevRevenue && latestRevenue ? `${prevRevenue.year} → ${latestRevenue.year}` : undefined },
    { label: 'Profit Margin Change (YoY)', value: marginChangeLabel, accent: '#F59E0B', subtext: prevMargin && latestMargin ? `${prevMargin.year} → ${latestMargin.year}` : undefined },
  ];

  // ── Prepare pie chart data ────────────────────────────────────────────────
  const geoPieData = (job.geoRevenue || []).map((g, i) => ({
    name: g.region,
    value: g.percentage,
    color: PIE_COLORS[i % PIE_COLORS.length],
  }));

  const segmentPieData = (job.segmentRevenue || []).map((s, i) => ({
    name: s.segment,
    value: s.percentage,
    color: PIE_COLORS[i % PIE_COLORS.length],
  }));

  // ── Prepare YoY table data ────────────────────────────────────────────────
  const geoTableData = (job.geoRevenue || []).map((g) => ({
    name: g.region,
    revenue: g.revenue,
    percentage: g.percentage,
    yoyGrowth: g.yoyGrowth,
  }));

  const segmentTableData = (job.segmentRevenue || []).map((s) => ({
    name: s.segment,
    revenue: s.revenue,
    percentage: s.percentage,
    yoyGrowth: s.yoyGrowth,
  }));

  const hasGeo = geoPieData.length > 0;
  const hasSegment = segmentPieData.length > 0;
  const hasCharts = (job.revenueHistory && job.revenueHistory.length > 0) ||
                    (job.quarterlyHistory && job.quarterlyHistory.length > 0);

  return (
    <div>
      {/* ── 1. Top Metric Boxes ──────────────────────────────────────────────── */}
      <TopMetricBoxes boxes={topBoxes} />

      {/* ── 2. Key Highlights ────────────────────────────────────────────────── */}
      {job.keyHighlights && (
        <KeyHighlightsCard highlights={job.keyHighlights} />
      )}

      {/* ── 3. Two Combo Charts Side-by-Side ─────────────────────────────────── */}
      {hasCharts && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: (job.revenueHistory?.length && job.quarterlyHistory?.length)
            ? 'repeat(auto-fit, minmax(380px, 1fr))'
            : '1fr',
          gap: 20,
          marginBottom: 20,
        }}>
          {/* Annual Revenue + Profit Margin */}
          {job.revenueHistory && job.revenueHistory.length > 0 && (
            <SectionCard style={{ marginBottom: 0 }}>
              <SectionTitle>
                Annual Revenue & Profit Margin ({job.revenueHistory[0].year}–{job.revenueHistory.at(-1)?.year})
              </SectionTitle>
              <RevenueChart data={job.revenueHistory} marginData={job.marginHistory} />
            </SectionCard>
          )}

          {/* Quarterly Revenue */}
          {job.quarterlyHistory && job.quarterlyHistory.length > 0 && (
            <SectionCard style={{ marginBottom: 0 }}>
              <SectionTitle>
                Quarterly Revenue (last {job.quarterlyHistory.length} quarters)
              </SectionTitle>
              <QuarterlyChart data={job.quarterlyHistory} currency={job.currency} />
            </SectionCard>
          )}
        </div>
      )}

      {/* ── 4. Chart Insights ────────────────────────────────────────────────── */}
      {job.chartInsights && job.chartInsights.length > 0 && (
        <BulletInsights items={job.chartInsights} accent={ACCENT} />
      )}

      {/* ── 5. Pie Charts Side-by-Side ───────────────────────────────────────── */}
      {(hasGeo || hasSegment) && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: (hasGeo && hasSegment)
            ? 'repeat(auto-fit, minmax(340px, 1fr))'
            : '1fr',
          gap: 20,
          marginBottom: 20,
        }}>
          {hasGeo && (
            <SectionCard style={{ marginBottom: 0 }}>
              <RevenuePieChart data={geoPieData} title="Revenue by Geography" accent="#10B981" />
            </SectionCard>
          )}
          {hasSegment && (
            <SectionCard style={{ marginBottom: 0 }}>
              <RevenuePieChart data={segmentPieData} title="Revenue by Business Segment" accent="#8B5CF6" />
            </SectionCard>
          )}
        </div>
      )}

      {/* ── 6. YoY Comparison Tables Side-by-Side ────────────────────────────── */}
      {(hasGeo || hasSegment) && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: (hasGeo && hasSegment)
            ? 'repeat(auto-fit, minmax(340px, 1fr))'
            : '1fr',
          gap: 20,
          marginBottom: 20,
        }}>
          {hasGeo && (
            <YoYComparisonTable data={geoTableData} title="Revenue by Geography (YoY)" accent="#10B981" />
          )}
          {hasSegment && (
            <YoYComparisonTable data={segmentTableData} title="Revenue by Segment (YoY)" accent="#8B5CF6" />
          )}
        </div>
      )}

      {/* ── 7. Geo/Segment Insights ──────────────────────────────────────────── */}
      {job.geoSegmentInsights && job.geoSegmentInsights.length > 0 && (
        <BulletInsights items={job.geoSegmentInsights} accent="#10B981" />
      )}

      {/* ── 8. Disclaimer ────────────────────────────────────────────────────── */}
      <div style={{ fontSize: 10, color: '#4a7a96', fontStyle: 'italic', textAlign: 'right', marginTop: 8 }}>
        Financial data sourced from Google Finance &middot; AI insights for informational purposes only &middot; Not investment advice
      </div>
    </div>
  );
}
