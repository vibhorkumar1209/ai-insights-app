'use client';

import { useState } from 'react';
import { ReportSection, CompetitorProfile, ReportChartSpec, BCGMatrixItem } from '@ai-insights/types';
import BulletText from '@/components/shared/BulletText';
import ReportTableView from './ReportTableView';
import ReportChart from './ReportChart';
import SWOTDisplay from './SWOTDisplay';
import PortersDisplay from './PortersDisplay';
import TEIDisplay from './TEIDisplay';

interface ReportSectionCardProps {
  section: ReportSection;
  index: number;
  defaultExpanded?: boolean;
}

// ── Competitor Profile Card ───────────────────────────────────────────────────
function CompetitorProfileCard({ profile }: { profile: CompetitorProfile }) {
  const fields: { label: string; value?: string }[] = [
    { label: 'Parent Company', value: profile.parentCompany },
    { label: 'HQ Location', value: profile.hqLocation },
    { label: 'Key Products', value: profile.keyProducts },
    { label: 'Overall Revenue', value: profile.overallRevenue },
    { label: 'Category Revenue', value: profile.categoryRevenue },
    { label: 'Market Share', value: profile.marketShare },
    { label: 'Manufacturing', value: profile.manufacturingLocation },
    { label: 'Recent News', value: profile.recentNews },
    { label: 'JV / M&A / Partnerships', value: profile.jvMaPartnerships },
    { label: 'Other Insights', value: profile.otherInsights },
  ];

  return (
    <div style={{
      background: 'rgba(8,15,22,0.5)',
      border: '1px solid rgba(30,74,104,0.4)',
      borderRadius: 12,
      padding: '16px 18px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        background: '#3491E8',
        opacity: 0.4,
      }} />
      <div style={{
        fontSize: 14,
        fontWeight: 700,
        color: '#1B2A3D',
        marginBottom: 12,
        paddingBottom: 8,
        borderBottom: '1px solid rgba(30,74,104,0.3)',
      }}>
        {profile.name}
      </div>
      {fields.filter((f) => f.value).map((f, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: 12, lineHeight: 1.5 }}>
          <span style={{ color: '#6B8FA5', fontWeight: 600, minWidth: 100, flexShrink: 0 }}>{f.label}:</span>
          <span style={{ color: '#B8CCDA' }}>{f.value}</span>
        </div>
      ))}
    </div>
  );
}

// ── Multi-chart grid layout ───────────────────────────────────────────────────
function ChartsGrid({ charts }: { charts: ReportChartSpec[] }) {
  const cols = charts.length >= 3 ? 3 : charts.length;
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gap: 12,
      marginTop: 16,
    }}>
      {charts.map((chart, ci) => (
        <ReportChart key={ci} chartSpec={chart} />
      ))}
    </div>
  );
}

// ── Convert BCG Matrix data to scatter chart spec ──────────────────────────────
function bcgMatrixToChartSpec(data: BCGMatrixItem[]): ReportChartSpec {
  return {
    type: 'scatter',
    title: 'BCG Matrix: Competitive Positioning',
    xLabel: 'Market Size / Relative Market Share',
    yLabel: 'Growth Rate (%)',
    data: data.map((item) => ({
      label: item.name,
      value: item.marketSize,
      growth: item.growth,
      category: item.quadrant,
      name: item.name,
    })),
  };
}

export default function ReportSectionCard({ section, index, defaultExpanded = false }: ReportSectionCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  // For SWOT/Porter's/TEI: suppress empty bodyParagraphs
  const hasSpecialData = section.swotData || section.portersData || section.macroTeiData || section.teiData;
  const showBody = section.bodyParagraphs?.length > 0 && !(hasSpecialData && section.bodyParagraphs.every((p) => !p.trim()));

  return (
    <div
      style={{
        background: expanded
          ? 'linear-gradient(160deg, rgba(14,50,75,0.7), rgba(11,34,54,0.9))'
          : 'linear-gradient(160deg, rgba(14,50,75,0.5), rgba(11,34,54,0.7))',
        border: expanded ? '1px solid rgba(52,145,232,0.2)' : '1px solid rgba(30,74,104,0.4)',
        borderRadius: 14,
        overflow: 'hidden',
        transition: 'all 0.3s ease',
      }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '16px 20px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: expanded ? 'rgba(52,145,232,0.15)' : 'rgba(5,150,105,0.12)',
            color: expanded ? '#3491E8' : '#059669',
            fontSize: 13,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'all 0.2s',
          }}
        >
          {index + 1}
        </span>

        <span style={{ flex: 1, fontSize: 15, fontWeight: 600, color: '#1B2A3D', letterSpacing: 0.2 }}>
          {section.title}
        </span>

        <svg
          width="20" height="20" viewBox="0 0 24 24" fill="none"
          style={{ transition: 'transform 0.25s ease', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}
        >
          <path d="M6 9L12 15L18 9" stroke={expanded ? '#3491E8' : '#6B8FA5'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Body */}
      {expanded && (
        <div style={{ padding: '4px 22px 24px', width: '100%', boxSizing: 'border-box' }}>
          <div style={{ height: 1, background: 'rgba(30,74,104,0.3)', marginBottom: 20 }} />

          {/* Body paragraphs */}
          {showBody && section.bodyParagraphs.map((para, i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <BulletText text={para} color="#B8CCDA" boldColor="#1B2A3D" fontSize={13} bulletColor="#3491E8" />
            </div>
          ))}

          {/* Single key table */}
          {section.keyTable && (
            <div style={{ marginTop: 8 }}>
              <ReportTableView table={section.keyTable} />
            </div>
          )}

          {/* Multiple tables (market_dynamics, regulatory, forecast) */}
          {section.tables?.map((table, ti) => (
            <div key={ti} style={{ marginTop: ti === 0 ? 8 : 16 }}>
              <ReportTableView table={table} />
            </div>
          ))}

          {/* Single chart */}
          {section.chartSpec && <ReportChart chartSpec={section.chartSpec} />}

          {/* Multiple charts (forecast scenarios side-by-side) */}
          {section.charts && section.charts.length > 0 && (
            <ChartsGrid charts={section.charts} />
          )}

          {/* Competitor Profiles */}
          {section.competitorProfiles && section.competitorProfiles.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <div style={{
                fontSize: 12,
                fontWeight: 700,
                color: '#3491E8',
                textTransform: 'uppercase' as const,
                letterSpacing: 1.2,
                marginBottom: 14,
              }}>
                Competitor Profiles
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 14,
              }}>
                {section.competitorProfiles.map((profile, pi) => (
                  <CompetitorProfileCard key={pi} profile={profile} />
                ))}
              </div>
            </div>
          )}

          {/* BCG Matrix */}
          {section.bcgMatrixData && section.bcgMatrixData.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <ReportChart chartSpec={bcgMatrixToChartSpec(section.bcgMatrixData)} />
            </div>
          )}

          {/* SWOT Analysis */}
          {section.swotData && <SWOTDisplay data={section.swotData} />}

          {/* Porter's Five Forces */}
          {section.portersData && <PortersDisplay data={section.portersData} />}

          {/* Total Economic Impact (new macro format or legacy) */}
          {(section.macroTeiData || section.teiData) && (
            <TEIDisplay macroData={section.macroTeiData} data={section.teiData} />
          )}

          {/* Subsections */}
          {section.subsections?.map((sub, si) => (
            <div
              key={si}
              style={{
                marginTop: 24,
                paddingLeft: 16,
                borderLeft: '3px solid rgba(52,145,232,0.25)',
                position: 'relative',
                width: '100%',
                boxSizing: 'border-box',
              }}
            >
              <div style={{
                position: 'absolute', left: -5, top: 6, width: 7, height: 7,
                borderRadius: '50%', background: '#3491E8',
              }} />
              <div style={{ fontSize: 14, fontWeight: 600, color: '#22D3EE', marginBottom: 10, lineHeight: 1.4 }}>
                {sub.title}
              </div>
              <BulletText text={sub.content} color="#B8CCDA" boldColor="#1B2A3D" fontSize={13} bulletColor="#3491E8" />
              {sub.keyTable && <ReportTableView table={sub.keyTable} accent="#22D3EE" />}
              {sub.tables?.map((table, ti) => (
                <div key={ti} style={{ marginTop: 8 }}>
                  <ReportTableView table={table} accent="#22D3EE" />
                </div>
              ))}
              {sub.chartSpec && <ReportChart chartSpec={sub.chartSpec} />}
              {sub.charts && sub.charts.length > 0 && (
                <ChartsGrid charts={sub.charts} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
