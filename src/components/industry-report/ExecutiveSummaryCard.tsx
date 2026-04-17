'use client';

import { ExecutiveSummary } from '@ai-insights/types';
import BulletText from '@/components/shared/BulletText';
import ReportChart from './ReportChart';

interface ExecutiveSummaryCardProps {
  summary: ExecutiveSummary;
}

const TREND_ICONS: Record<string, { symbol: string; color: string; bg: string }> = {
  up:   { symbol: '▲', color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  down: { symbol: '▼', color: '#E63946', bg: 'rgba(230,57,70,0.12)' },
  flat: { symbol: '●', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
};

const SCENARIO_STYLES: Record<string, { bg: string; border: string; accent: string; icon: string }> = {
  Bull: { bg: 'rgba(16,185,129,0.06)', border: 'rgba(16,185,129,0.2)', accent: '#10B981', icon: '↑' },
  Base: { bg: 'rgba(52,145,232,0.06)', border: 'rgba(52,145,232,0.2)', accent: '#3491E8', icon: '→' },
  Bear: { bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.2)', accent: '#F59E0B', icon: '↓' },
};

function InsightCard({ title, content, accent }: { title: string; content: string; accent: string }) {
  return (
    <div style={{
      background: 'rgba(8,15,22,0.4)',
      border: '1px solid rgba(30,74,104,0.35)',
      borderRadius: 10,
      padding: '14px 16px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, bottom: 0, width: 3,
        background: accent, opacity: 0.6,
      }} />
      <div style={{
        fontSize: 10, fontWeight: 700, color: accent,
        textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 8,
      }}>
        {title}
      </div>
      <div style={{ fontSize: 12, color: '#B8CCDA', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
        {content}
      </div>
    </div>
  );
}

export default function ExecutiveSummaryCard({ summary }: ExecutiveSummaryCardProps) {
  if (!summary) return null;

  const tickers = summary.tickerBoxes?.length ? summary.tickerBoxes : null;
  const kpis = tickers ? null : summary.kpis;

  return (
    <div
      style={{
        background: 'linear-gradient(160deg, rgba(14,50,75,0.8), rgba(11,34,54,0.95))',
        border: '1px solid rgba(52,145,232,0.2)',
        borderRadius: 16,
        padding: '28px 26px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: 'linear-gradient(90deg, #3491E8, #10B981, #22D3EE)', opacity: 0.7,
      }} />

      <div style={{
        fontSize: 11, color: '#3491E8', fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12,
      }}>
        Executive Summary
      </div>

      <h2 style={{
        fontSize: 20, fontWeight: 700, color: '#E8EDF5',
        lineHeight: 1.4, margin: '0 0 24px', letterSpacing: -0.2,
      }}>
        {summary.headline}
      </h2>

      {/* Ticker Boxes (new enhanced format) */}
      {tickers && tickers.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${Math.min(tickers.length, 5)}, 1fr)`,
          gap: 12, marginBottom: 26,
        }}>
          {tickers.map((ticker, i) => {
            const trend = TREND_ICONS[ticker.trend || 'flat'] || TREND_ICONS.flat;
            return (
              <div key={i} style={{
                background: 'rgba(8,15,22,0.5)',
                border: '1px solid rgba(30,74,104,0.4)',
                borderRadius: 12, padding: '14px 16px', textAlign: 'center',
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute', top: 0, left: '20%', right: '20%', height: 2,
                  background: trend.color, opacity: 0.4, borderRadius: '0 0 2px 2px',
                }} />
                <div style={{
                  fontSize: 9, color: '#6B8FA5', textTransform: 'uppercase',
                  letterSpacing: 1, marginBottom: 8, fontWeight: 600,
                }}>
                  {ticker.label}
                </div>
                <div style={{
                  fontSize: 18, fontWeight: 700, color: '#E8EDF5',
                  lineHeight: 1.2, fontVariantNumeric: 'tabular-nums',
                }}>
                  {ticker.value}
                </div>
                {ticker.secondaryValue && (
                  <div style={{ fontSize: 11, color: '#6B8FA5', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
                    {ticker.secondaryValue}
                  </div>
                )}
                {ticker.trend && (
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    marginTop: 6, fontSize: 10, color: trend.color, background: trend.bg,
                    borderRadius: 4, padding: '2px 6px', fontWeight: 600,
                  }}>
                    {trend.symbol}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Legacy KPI Row (fallback) */}
      {kpis && kpis.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${Math.min(kpis.length, 5)}, 1fr)`,
          gap: 12, marginBottom: 26,
        }}>
          {kpis.map((kpi, i) => {
            const trend = TREND_ICONS[kpi.trend || 'flat'] || TREND_ICONS.flat;
            return (
              <div key={i} style={{
                background: 'rgba(8,15,22,0.5)',
                border: '1px solid rgba(30,74,104,0.4)',
                borderRadius: 12, padding: '14px 16px', textAlign: 'center',
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute', top: 0, left: '20%', right: '20%', height: 2,
                  background: trend.color, opacity: 0.4, borderRadius: '0 0 2px 2px',
                }} />
                <div style={{
                  fontSize: 9, color: '#6B8FA5', textTransform: 'uppercase',
                  letterSpacing: 1, marginBottom: 8, fontWeight: 600,
                }}>
                  {kpi.label}
                </div>
                <div style={{
                  fontSize: 18, fontWeight: 700, color: '#E8EDF5',
                  lineHeight: 1.2, fontVariantNumeric: 'tabular-nums',
                }}>
                  {kpi.value}
                </div>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  marginTop: 6, fontSize: 10, color: trend.color, background: trend.bg,
                  borderRadius: 4, padding: '2px 6px', fontWeight: 600,
                }}>
                  {trend.symbol}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Market Size Chart — Historical to Future */}
      {summary.marketSizeChartSpec && (
        <div style={{ marginBottom: 24 }}>
          <ReportChart chartSpec={summary.marketSizeChartSpec} />
        </div>
      )}

      {/* Insight Cards */}
      {(summary.concentrationInsights || summary.keyPlayersInsights || summary.topTrends?.length || summary.recentMaJvInsights) && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 24 }}>
          {summary.concentrationInsights && (
            <InsightCard title="Market Concentration" content={summary.concentrationInsights} accent="#8B5CF6" />
          )}
          {summary.keyPlayersInsights && (
            <InsightCard title="Key Players & Market Share" content={summary.keyPlayersInsights} accent="#3491E8" />
          )}
          {summary.topTrends && summary.topTrends.length > 0 && (
            <InsightCard
              title={`Top ${summary.topTrends.length} Market Trends`}
              content={summary.topTrends.map((t, i) => `${i + 1}. ${t}`).join('\n')}
              accent="#10B981"
            />
          )}
          {summary.recentMaJvInsights && (
            <InsightCard title="Recent M&A, JVs & New Entrants" content={summary.recentMaJvInsights} accent="#F59E0B" />
          )}
        </div>
      )}

      {/* Summary paragraphs */}
      {summary.paragraphs?.map((para, i) => (
        <div key={i} style={{ marginBottom: 14 }}>
          <BulletText text={para} color="#B8CCDA" boldColor="#E8EDF5" fontSize={13} bulletColor="#3491E8" />
        </div>
      ))}

      {/* Scenario Row */}
      {summary.scenarios?.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div style={{
            fontSize: 10, color: '#6B8FA5', textTransform: 'uppercase',
            letterSpacing: 1.2, marginBottom: 12, fontWeight: 700,
          }}>
            Scenario Outlook
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${summary.scenarios.length}, 1fr)`, gap: 12 }}>
            {summary.scenarios.map((scenario, i) => {
              const style = SCENARIO_STYLES[scenario.name] || SCENARIO_STYLES.Base;
              return (
                <div key={i} style={{
                  background: style.bg,
                  border: `1px solid ${style.border}`,
                  borderRadius: 12, padding: '16px 18px',
                  position: 'relative', overflow: 'hidden',
                }}>
                  <div style={{
                    position: 'absolute', top: 0, left: 0, bottom: 0, width: 3,
                    background: style.accent, opacity: 0.6,
                  }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <span style={{ fontSize: 14, color: style.accent }}>{style.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: style.accent }}>
                      {scenario.name} Case
                    </span>
                  </div>
                  <div style={{
                    fontSize: 17, fontWeight: 700, color: '#E8EDF5',
                    marginBottom: 10, fontVariantNumeric: 'tabular-nums',
                  }}>
                    {scenario.marketSize}
                  </div>
                  <div style={{ fontSize: 11, color: '#B8CCDA', lineHeight: 1.6 }}>
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
