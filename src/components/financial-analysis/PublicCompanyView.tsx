'use client';

import { FinancialAnalysisJob } from '@/lib/types';
import RevenueChart from './RevenueChart';
import MarginChart from './MarginChart';
import SegmentChart from './SegmentChart';
import GeoChart from './GeoChart';
import FinancialTable from './FinancialTable';
import InsightCard from './InsightCard';

interface PublicCompanyViewProps {
  job: FinancialAnalysisJob;
}

const ACCENT = '#22D3EE';

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

function NotAvailableNote({ label }: { label: string }) {
  return (
    <div style={{
      padding: '16px 0', fontSize: 12, color: '#4a7a96', fontStyle: 'italic',
      textAlign: 'center',
    }}>
      {label} data not available for this company.
    </div>
  );
}

export default function PublicCompanyView({ job }: PublicCompanyViewProps) {
  const latestYear = job.revenueHistory?.at(-1)?.year;

  return (
    <div>
      {/* Key Highlights Strip */}
      {job.keyHighlights && job.keyHighlights.length > 0 && (
        <div style={{
          background: `rgba(34,211,238,0.06)`,
          border: '1px solid rgba(34,211,238,0.2)',
          borderRadius: 10,
          padding: '16px 20px',
          marginBottom: 24,
        }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.5, color: ACCENT, marginBottom: 12 }}>
            KEY HIGHLIGHTS
          </div>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {job.keyHighlights.map((h, i) => (
              <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ color: ACCENT, fontSize: 10, marginTop: 3, flexShrink: 0 }}>◆</span>
                <span style={{ fontSize: 12, color: '#C4D4DE', lineHeight: 1.6 }}>{h}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Revenue Trend ─────────────────────────────────────────────────────── */}
      {job.revenueHistory && job.revenueHistory.length > 0 && (
        <SectionCard>
          <SectionTitle>📈 Revenue Trend ({job.revenueHistory[0].year}–{latestYear})</SectionTitle>
          <RevenueChart data={job.revenueHistory} />
          {job.revenueInsight && <InsightCard insight={job.revenueInsight} accent={ACCENT} />}
        </SectionCard>
      )}

      {/* ── Margin Trend ─────────────────────────────────────────────────────── */}
      {job.marginHistory && job.marginHistory.length > 0 && (
        <SectionCard>
          <SectionTitle>📉 Margin Trend ({job.marginHistory[0].year}–{latestYear})</SectionTitle>
          <MarginChart data={job.marginHistory} />
          {job.marginInsight && <InsightCard insight={job.marginInsight} accent="#E63946" />}
        </SectionCard>
      )}

      {/* ── Segment + Geo side by side (if both available) ─────────────────── */}
      {(job.segmentRevenue?.length || job.geoRevenue?.length) && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20, marginBottom: 20 }}>
          {/* Segment */}
          <SectionCard style={{ marginBottom: 0 }}>
            {job.segmentRevenue && job.segmentRevenue.length > 0 ? (
              <>
                <SegmentChart data={job.segmentRevenue} title="REVENUE BY SEGMENT" />
                {job.segmentInsight && <InsightCard insight={job.segmentInsight} accent="#8B5CF6" />}
              </>
            ) : (
              <>
                <SectionTitle>📦 Revenue by Segment</SectionTitle>
                <NotAvailableNote label="Segment revenue" />
              </>
            )}
          </SectionCard>

          {/* Geography */}
          <SectionCard style={{ marginBottom: 0 }}>
            {job.geoRevenue && job.geoRevenue.length > 0 ? (
              <>
                <GeoChart data={job.geoRevenue} />
                {job.geoInsight && <InsightCard insight={job.geoInsight} accent="#10B981" />}
              </>
            ) : (
              <>
                <SectionTitle>🌍 Revenue by Geography</SectionTitle>
                <NotAvailableNote label="Geographic revenue" />
              </>
            )}
          </SectionCard>
        </div>
      )}

      {/* ── Financial Statements ──────────────────────────────────────────────── */}
      <div style={{ marginBottom: 6 }}>
        <div style={{
          fontSize: 13, fontWeight: 800, color: '#E8EDF5',
          marginBottom: 20, paddingBottom: 12,
          borderBottom: '1px solid #1e4a68',
          letterSpacing: 0.5,
        }}>
          Financial Statements {latestYear ? `— FY${latestYear}` : '— Current Year'}
        </div>
      </div>

      {/* P&L */}
      {job.plStatement && job.plStatement.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#7eaabf', marginBottom: 10, letterSpacing: 0.5 }}>
            INCOME STATEMENT (P&L)
          </div>
          <FinancialTable rows={job.plStatement} accent={ACCENT} />
          {job.plInsight && <InsightCard insight={job.plInsight} accent={ACCENT} />}
        </div>
      )}

      {/* Balance Sheet */}
      {job.balanceSheet && job.balanceSheet.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#7eaabf', marginBottom: 10, letterSpacing: 0.5 }}>
            BALANCE SHEET
          </div>
          <FinancialTable rows={job.balanceSheet} accent="#3491E8" />
          {job.bsInsight && <InsightCard insight={job.bsInsight} accent="#3491E8" />}
        </div>
      )}

      {/* Cash Flow */}
      {job.cashFlow && job.cashFlow.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#7eaabf', marginBottom: 10, letterSpacing: 0.5 }}>
            CASH FLOW STATEMENT
          </div>
          <FinancialTable rows={job.cashFlow} accent="#10B981" />
          {job.cfInsight && <InsightCard insight={job.cfInsight} accent="#10B981" />}
        </div>
      )}

      {/* Disclaimer */}
      <div style={{ fontSize: 10, color: '#4a7a96', fontStyle: 'italic', textAlign: 'right', marginTop: 8 }}>
        Data sourced from Yahoo Finance · Not investment advice
      </div>
    </div>
  );
}
