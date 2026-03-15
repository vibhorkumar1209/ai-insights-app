'use client';

import { ReportExecutiveSummary } from '@/lib/types';
import BulletText from '@/components/shared/BulletText';

interface ExecutiveSummaryCardProps {
  summary: ReportExecutiveSummary;
}

const TREND_ICONS: Record<string, { symbol: string; color: string }> = {
  up:   { symbol: '▲', color: '#10B981' },
  down: { symbol: '▼', color: '#E63946' },
  flat: { symbol: '●', color: '#F59E0B' },
};

const SCENARIO_STYLES: Record<string, { bg: string; border: string; accent: string }> = {
  Bull: { bg: 'rgba(16,185,129,0.06)', border: 'rgba(16,185,129,0.25)', accent: '#10B981' },
  Base: { bg: 'rgba(52,145,232,0.06)', border: 'rgba(52,145,232,0.25)', accent: '#3491E8' },
  Bear: { bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.25)', accent: '#F59E0B' },
};

export default function ExecutiveSummaryCard({ summary }: ExecutiveSummaryCardProps) {
  if (!summary) return null;

  return (
    <div
      style={{
        background: 'linear-gradient(160deg, #0e324b, #0b2236)',
        border: '1px solid rgba(5,150,105,0.3)',
        borderRadius: 14,
        padding: '24px 22px',
      }}
    >
      {/* Section label */}
      <div style={{ fontSize: 11, color: '#059669', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8 }}>
        Executive Summary
      </div>

      {/* Headline */}
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#E8EDF5', lineHeight: 1.35, margin: '0 0 20px' }}>
        {summary.headline}
      </h2>

      {/* KPI Row */}
      {summary.kpis?.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${Math.min(summary.kpis.length, 5)}, 1fr)`,
            gap: 10,
            marginBottom: 22,
          }}
        >
          {summary.kpis.map((kpi, i) => {
            const trend = TREND_ICONS[kpi.trend || 'flat'] || TREND_ICONS.flat;
            return (
              <div
                key={i}
                style={{
                  background: 'rgba(8,15,22,0.6)',
                  border: '1px solid #1e4a68',
                  borderRadius: 10,
                  padding: '12px 14px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 10, color: '#5a8a9f', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>
                  {kpi.label}
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#E8EDF5' }}>
                  {kpi.value}
                </div>
                <div style={{ fontSize: 10, color: trend.color, marginTop: 4 }}>
                  {trend.symbol}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary paragraphs */}
      {summary.paragraphs?.map((para, i) => (
        <div key={i} style={{ marginBottom: 12 }}>
          <BulletText text={para} color="#C4D4DE" boldColor="#E8EDF5" fontSize={13} bulletColor="#059669" />
        </div>
      ))}

      {/* Scenario Row */}
      {summary.scenarios?.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 11, color: '#5a8a9f', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, fontWeight: 600 }}>
            Scenario Outlook
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${summary.scenarios.length}, 1fr)`, gap: 10 }}>
            {summary.scenarios.map((scenario, i) => {
              const style = SCENARIO_STYLES[scenario.name] || SCENARIO_STYLES.Base;
              return (
                <div
                  key={i}
                  style={{
                    background: style.bg,
                    border: `1px solid ${style.border}`,
                    borderRadius: 10,
                    padding: '14px 16px',
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: style.accent, marginBottom: 6 }}>
                    {scenario.name} Case
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#E8EDF5', marginBottom: 8 }}>
                    {scenario.marketSize}
                  </div>
                  <div style={{ fontSize: 11, color: '#C4D4DE', lineHeight: 1.55 }}>
                    {scenario.description}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
