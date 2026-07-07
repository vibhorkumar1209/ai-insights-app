'use client';

import { useState, useEffect } from 'react';
import {
  HistoryEntry,
  ModuleType,
  loadHistory,
  deleteHistoryEntry,
  setPendingRestore,
} from '@/lib/history';
import ModuleIcon from './ModuleIcon';

// ── Config ────────────────────────────────────────────────────────────────────

const MODULE_CONFIG: Record<
  ModuleType,
  { label: string; accent: string; route: string }
> = {
  'peer-benchmarking': {
    label: 'Peer Benchmarking',
    accent: '#3491E8',
    route: '/peer-benchmarking',
  },
  'business-themes': {
    label: 'Business Themes',
    accent: '#3491E8',
    route: '/business-themes',
  },
  'technology-themes': {
    label: 'Technology Themes',
    accent: '#E63946',
    route: '/technology-themes',
  },
  sustainability: {
    label: 'Sustainability Themes',
    accent: '#10B981',
    route: '/sustainability',
  },
  'challenges-growth': {
    label: 'Challenges & Growth',
    accent: '#F59E0B',
    route: '/challenges-growth',
  },
  'financial-analysis': {
    label: 'Financial Analysis',
    accent: '#22D3EE',
    route: '/financial-analysis',
  },
  'sales-play': {
    label: 'Sales Play',
    accent: '#E63946',
    route: '/sales-play',
  },
  'sales-play-2': {
    label: 'Sales Play II',
    accent: '#E63946',
    route: '/sales-play-2',
  },
  'key-buyers': {
    label: 'Key Opinion Leaders',
    accent: '#3B82F6',
    route: '/key-buyers',
  },
  'consulting-intelligence': {
    label: 'Consulting Intelligence',
    accent: '#7C3AED',
    route: '/consulting-intelligence',
  },
  'industry-trends': {
    label: 'Industry Trends',
    accent: '#A855F7',
    route: '/industry-trends',
  },
  'industry-report': {
    label: 'Industry Report',
    accent: '#059669',
    route: '/industry-report',
  },
  'business-description': {
    label: 'Business Description',
    accent: '#06B6D4',
    route: '/business-description',
  },
  peers: {
    label: 'Peers',
    accent: '#6366F1',
    route: '/peers',
  },
  'niche-industries': {
    label: 'High Growth Niche Industries',
    accent: '#059669',
    route: '/niche-industries',
  },
  'marketing-strategy': {
    label: 'Marketing Strategy',
    accent: '#E63946',
    route: '/marketing-strategy',
  },
  'business-segments': {
    label: 'Business Segments',
    accent: '#7C3AED',
    route: '/business-segments',
  },
  'business-timelines': {
    label: 'Business Timelines',
    accent: '#06B6D4',
    route: '/business-timelines',
  },
  'technology-heat-map': {
    label: 'Technology Heat Map',
    accent: '#E63946',
    route: '/technology-heat-map',
  },
  'industry-blog': {
    label: 'Industry Blog',
    accent: '#3491E8',
    route: '/industry-blog',
  },
  'industry-thought-leadership': {
    label: 'Thought Leadership',
    accent: '#3491E8',
    route: '/industry-thought-leadership',
  },
  'vuca-analysis': {
    label: 'VUCA Analysis',
    accent: '#F59E0B',
    route: '/vuca-analysis',
  },
  firmographic: {
    label: 'Firmographic',
    accent: '#10B981',
    route: '/firmographic',
  },
  'industry-outsourcing-report': {
    label: 'Industry Outsourcing Report',
    accent: '#F59E0B',
    route: '/industry-outsourcing-report',
  },
  'gcc-sales-play': {
    label: 'GCC Sales Play',
    accent: '#7C3AED',
    route: '/gcc-sales-play',
  },
};

// ── Helper renderers ──────────────────────────────────────────────────────────

function entrySubtitle(entry: HistoryEntry): string {
  if (entry.moduleType === 'peer-benchmarking' && entry.selectedPeers?.length) {
    return `vs ${entry.selectedPeers.join(', ')}`;
  }
  if (entry.moduleType === 'challenges-growth' && entry.challengesGrowthRows?.length) {
    return `${entry.challengesGrowthRows.length} dimensions analysed`;
  }
  if (entry.moduleType === 'financial-analysis' && entry.financialData) {
    const fd = entry.financialData;
    return fd.isPublic && fd.ticker ? `${fd.ticker} · ${fd.exchange || 'Public'}` : 'Private Company';
  }
  if (entry.moduleType === 'sales-play' && entry.salesPlayData) {
    const sp = entry.salesPlayData;
    return sp.competitorName ? `vs ${sp.competitorName}` : 'Sales Play';
  }
  if (entry.moduleType === 'sales-play-2' && entry.salesPlay2Data) {
    return `${entry.salesPlay2Data.winThemes?.length || 0} win themes · ${entry.salesPlay2Data.opportunities?.length || 0} opportunities`;
  }
  if (entry.moduleType === 'key-buyers' && entry.keyBuyerRows?.length) {
    return `${entry.keyBuyerRows.length} executive insights`;
  }
  if (entry.moduleType === 'industry-trends') {
    const biz = entry.industryBusinessTrends?.length ?? 0;
    const tech = entry.industryTechTrends?.length ?? 0;
    const geo = entry.industryGeography && entry.industryGeography !== 'Global'
      ? ` · ${entry.industryGeography}`
      : '';
    return biz + tech > 0 ? `${biz} business · ${tech} tech trends${geo}` : 'Industry Trends';
  }
  if (entry.moduleType === 'industry-report' && entry.industryReportScope) {
    const geo = entry.industryReportScope.geography;
    const sections = entry.industryReportSections?.length ?? 0;
    return sections > 0 ? `${geo} · ${sections} sections` : geo;
  }
  if (entry.moduleType === 'business-segments' && entry.businessSegments?.length) {
    return `${entry.businessSegments.length} segments analysed`;
  }
  if (entry.moduleType === 'business-timelines' && entry.timelineBlocks?.length) {
    return `${entry.timelineBlocks.length} strategic phases`;
  }
  if (entry.themeRows?.length) {
    return `${entry.themeRows.length} themes identified`;
  }
  return '';
}

function entryMeta(entry: HistoryEntry): string {
  if (entry.moduleType === 'peer-benchmarking') {
    const parts: string[] = [];
    if (entry.benchmarkingTable?.length) parts.push(`${entry.benchmarkingTable.length} dimensions`);
    if (entry.gapAnalysis?.length) parts.push(`${entry.gapAnalysis.length} gap rows`);
    if (entry.industryContext) parts.push(entry.industryContext);
    return parts.join(' · ');
  }
  if (entry.moduleType === 'challenges-growth') {
    return 'Challenges & Growth Analysis';
  }
  if (entry.moduleType === 'financial-analysis') {
    const fd = entry.financialData;
    if (!fd) return 'Financial Analysis';
    if (fd.isPublic) {
      const rev = fd.revenueHistory?.at(-1)?.revenueFormatted;
      return rev ? `Revenue: ${rev}` : 'Public Company';
    }
    return fd.estimatedRevenue ? `Est. Revenue: ${fd.estimatedRevenue}` : 'Private Company';
  }
  if (entry.moduleType === 'sales-play') {
    const sp = entry.salesPlayData;
    if (!sp) return 'Sales Play & Opportunity';
    const priorities = sp.priorityTable?.length ?? 0;
    return `${sp.yourCompany || ''} · ${priorities} priorities · ${sp.targetIndustry || ''}`;
  }
  if (entry.moduleType === 'key-buyers') {
    return entry.keyBuyerRows?.length ? `${entry.keyBuyerRows.length} executive insights mapped` : 'Key Opinion Leaders';
  }
  if (entry.moduleType === 'industry-trends') {
    const biz = entry.industryBusinessTrends?.length ?? 0;
    const tech = entry.industryTechTrends?.length ?? 0;
    const geo = entry.industryGeography && entry.industryGeography !== 'Global'
      ? ` · ${entry.industryGeography}`
      : '';
    return `${biz} business trends · ${tech} technology trends${geo}`;
  }
  if (entry.moduleType === 'industry-report') {
    const kpis = entry.industryReportExecutiveSummary?.kpis?.length ?? 0;
    const sections = entry.industryReportSections?.length ?? 0;
    return `${sections} sections · ${kpis} KPIs`;
  }
  if (entry.themeType) {
    return `${entry.themeType.charAt(0).toUpperCase() + entry.themeType.slice(1)} themes`;
  }
  return '';
}

// ── Component ─────────────────────────────────────────────────────────────────

interface HistoryDrawerProps {
  currentModule: ModuleType;
  onSelectSameModule: (entry: HistoryEntry) => void;
  onClose: () => void;
}

export default function HistoryDrawer({
  currentModule,
  onSelectSameModule,
  onClose,
}: HistoryDrawerProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  function handleView(entry: HistoryEntry) {
    if (entry.moduleType === currentModule) {
      onSelectSameModule(entry);
      onClose();
    } else {
      // Navigate to the correct module page; target page will auto-restore
      setPendingRestore(entry.id);
      const cfg = MODULE_CONFIG[entry.moduleType];
      if (!cfg) return;
      window.location.href = cfg.route;
    }
  }

  function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    deleteHistoryEntry(id);
    setHistory((prev) => prev.filter((h) => h.id !== id));
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: '#F3F8FA',
          zIndex: 40,
          backdropFilter: 'blur(2px)',
        }}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed',
        top: 0, right: 0, bottom: 0,
        width: 500, maxWidth: '95vw',
        background: '#FFFFFF',
        borderLeft: '1px solid #CCDFEA',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-8px 0 48px rgba(0,0,0,0.6)',
      }}>

        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #CCDFEA',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div>
            <div style={{
              fontSize: 11, fontWeight: 700, color: '#3491E8',
              letterSpacing: 2, marginBottom: 4,
            }}>
              REFRACTONE
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#1B2A3D' }}>
              Report History
            </div>
            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
              {history.length} saved {history.length === 1 ? 'analysis' : 'analyses'} across all modules
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#EDF4F8',
              border: '1px solid #CCDFEA',
              color: '#6B7280',
              borderRadius: 8,
              width: 36, height: 36,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, lineHeight: 1, flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>

        {/* Entry list */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}>
          {history.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '56px 0',
              color: '#6B7280',
              fontSize: 13,
            }}>
              No analyses yet. Run your first analysis to see it here.
            </div>
          ) : (
            history.filter((entry) => entry.moduleType in MODULE_CONFIG).map((entry) => {
              const cfg = MODULE_CONFIG[entry.moduleType];
              const isCurrent = entry.moduleType === currentModule;

              return (
                <div
                  key={entry.id}
                  style={{
                    background: '#FFFFFF',
                    border: `1px solid ${isCurrent ? 'rgba(52,145,232,0.25)' : '#CCDFEA'}`,
                    borderRadius: 10,
                    padding: '14px 16px',
                  }}
                >
                  {/* Top row: module badge + COMPLETE + date + delete */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 10,
                    flexWrap: 'wrap',
                    gap: 6,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      {/* Module badge — SVG icon + label */}
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        background: `rgba(${hexToRgb(cfg.accent)},0.12)`,
                        border: `1px solid rgba(${hexToRgb(cfg.accent)},0.3)`,
                        borderRadius: 5,
                        padding: '3px 8px',
                        fontSize: 10, fontWeight: 700,
                        color: cfg.accent, letterSpacing: 0.5,
                      }}>
                        <ModuleIcon id={entry.moduleType} size={11} />
                        {cfg.label.toUpperCase()}
                      </span>
                      {/* COMPLETE badge */}
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        background: 'rgba(16,185,129,0.1)',
                        border: '1px solid rgba(16,185,129,0.3)',
                        borderRadius: 5, padding: '2px 8px',
                        fontSize: 10, fontWeight: 700,
                        color: '#34d399', letterSpacing: 0.5,
                      }}>
                        <div style={{
                          width: 5, height: 5, borderRadius: '50%',
                          background: '#34d399',
                        }} />
                        COMPLETE
                      </span>
                      {/* DEMO badge */}
                      {entry.id === 'medtronic-demo-2026' && (
                        <span style={{
                          fontSize: 9, fontWeight: 700, color: '#3491E8',
                          background: 'rgba(52,145,232,0.12)',
                          border: '1px solid rgba(52,145,232,0.3)',
                          borderRadius: 4, padding: '2px 6px', letterSpacing: 1,
                        }}>
                          DEMO
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      <span style={{ fontSize: 11, color: '#6B7280' }}>
                        {new Date(entry.completedAt).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </span>
                      {/* Delete button */}
                      <button
                        onClick={(e) => handleDelete(entry.id, e)}
                        title="Delete this report"
                        style={{
                          background: 'transparent',
                          border: '1px solid rgba(230,57,70,0.25)',
                          color: 'rgba(230,57,70,0.6)',
                          borderRadius: 5, width: 22, height: 22,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', fontSize: 13, lineHeight: 1, flexShrink: 0,
                          padding: 0,
                        }}
                      >
                        ×
                      </button>
                    </div>
                  </div>

                  {/* Company + subtitle */}
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#1B2A3D', marginBottom: 3 }}>
                      {entry.targetCompany}
                    </div>
                    {entrySubtitle(entry) && (
                      <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 2 }}>
                        {entrySubtitle(entry)}
                      </div>
                    )}
                    {entryMeta(entry) && (
                      <div style={{ fontSize: 11, color: '#6B7280' }}>
                        {entryMeta(entry)}
                        {entry.userOrganization ? ` · ${entry.userOrganization}` : ''}
                      </div>
                    )}
                  </div>

                  {/* View button */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => handleView(entry)}
                      style={{
                        background: isCurrent
                          ? `linear-gradient(135deg, #0e4560, ${cfg.accent})`
                          : '#F3F8FA',
                        border: isCurrent ? 'none' : '1px solid #CCDFEA',
                        color: isCurrent ? '#fff' : '#374B5C',
                        borderRadius: 7,
                        padding: '7px 16px',
                        fontSize: 12, fontWeight: 700, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 5,
                      }}
                    >
                      {isCurrent ? 'View Report →' : `Open in ${cfg.label} ↗`}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}

function hexToRgb(hex: string): string {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ].join(',');
}
