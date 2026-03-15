'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  loadHistory,
  deleteHistoryEntry,
  setPendingRestore,
  HistoryEntry,
  ModuleType,
} from '@/lib/history';
import ModuleIcon from '@/components/shared/ModuleIcon';

// ── Module config ─────────────────────────────────────────────────────────────

interface ModuleMeta {
  label: string;
  accent: string;
  route: string;
}

const MODULE_META: Record<ModuleType, ModuleMeta> = {
  'industry-report':    { label: 'Industry Report',       accent: '#059669', route: '/industry-report' },
  'financial-analysis': { label: 'Financial Analysis',     accent: '#22D3EE', route: '/financial-analysis' },
  'peer-benchmarking':  { label: 'Peer Benchmarking',      accent: '#3491E8', route: '/peer-benchmarking' },
  'business-themes':    { label: 'Business Themes',        accent: '#F59E0B', route: '/business-themes' },
  'technology-themes':  { label: 'Technology Themes',      accent: '#8B5CF6', route: '/technology-themes' },
  'sustainability':     { label: 'Sustainability Themes',  accent: '#10B981', route: '/sustainability' },
  'challenges-growth':  { label: 'Challenges & Growth',    accent: '#F59E0B', route: '/challenges-growth' },
  'sales-play':         { label: 'Sales Play',             accent: '#E63946', route: '/sales-play' },
  'key-buyers':         { label: 'Key Prospective Buyers', accent: '#3B82F6', route: '/key-buyers' },
  'industry-trends':    { label: 'Industry Trends',        accent: '#A855F7', route: '/industry-trends' },
};

// ── Helper: extract display info from a history entry ─────────────────────────

function entryTitle(entry: HistoryEntry): string {
  if (entry.moduleType === 'industry-report') {
    return entry.industryReportScope?.industry || entry.industryReportQuery || entry.targetCompany;
  }
  return entry.targetCompany || 'Untitled';
}

function entrySubtitle(entry: HistoryEntry): string {
  if (entry.moduleType === 'industry-report') {
    const geo = entry.industryReportScope?.geography || '';
    const horizon = entry.industryReportScope?.timeHorizon || '';
    return [geo, horizon].filter(Boolean).join(' · ');
  }
  if (entry.moduleType === 'financial-analysis') {
    const fd = entry.financialData;
    if (fd?.isPublic && fd.ticker) return `${fd.ticker} · ${fd.exchange || 'Public'}`;
    return fd ? 'Private Company' : '';
  }
  if (entry.moduleType === 'peer-benchmarking' && entry.selectedPeers?.length) {
    return `vs ${entry.selectedPeers.slice(0, 3).join(', ')}`;
  }
  if (entry.moduleType === 'sales-play' && entry.salesPlayData?.competitorName) {
    return `vs ${entry.salesPlayData.competitorName}`;
  }
  if (entry.moduleType === 'industry-trends') {
    return entry.industryGeography && entry.industryGeography !== 'Global' ? entry.industryGeography : '';
  }
  return '';
}

function entryMetrics(entry: HistoryEntry): string {
  if (entry.moduleType === 'industry-report') {
    const sections = entry.industryReportSections?.length ?? 0;
    const kpis = entry.industryReportExecutiveSummary?.kpis?.length ?? 0;
    const mktSize = entry.industryReportMarketSizing?.currentMarketSize;
    const parts: string[] = [];
    if (mktSize) parts.push(mktSize);
    if (sections > 0) parts.push(`${sections} sections`);
    if (kpis > 0) parts.push(`${kpis} KPIs`);
    return parts.join(' · ');
  }
  if (entry.moduleType === 'peer-benchmarking') {
    const dims = entry.benchmarkingTable?.length ?? 0;
    const gaps = entry.gapAnalysis?.length ?? 0;
    return `${dims} dimensions · ${gaps} gaps`;
  }
  if (entry.moduleType === 'financial-analysis') {
    const fd = entry.financialData;
    if (fd?.isPublic && fd.revenueHistory?.length) {
      const latest = fd.revenueHistory[fd.revenueHistory.length - 1];
      return latest?.revenueFormatted ? `Revenue: ${latest.revenueFormatted}` : '';
    }
    return fd?.estimatedRevenue ? `Est. ${fd.estimatedRevenue}` : '';
  }
  if (entry.themeRows?.length) return `${entry.themeRows.length} themes`;
  if (entry.challengesGrowthRows?.length) return `${entry.challengesGrowthRows.length} dimensions`;
  if (entry.keyBuyerRows?.length) return `${entry.keyBuyerRows.length} insights`;
  if (entry.moduleType === 'industry-trends') {
    const biz = entry.industryBusinessTrends?.length ?? 0;
    const tech = entry.industryTechTrends?.length ?? 0;
    return `${biz} business · ${tech} tech trends`;
  }
  return '';
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

// ── Available type filters ────────────────────────────────────────────────────

type TypeFilter = 'all' | ModuleType;

const TYPE_FILTERS: { value: TypeFilter; label: string; accent: string }[] = [
  { value: 'all', label: 'All Types', accent: '#7eaabf' },
  { value: 'industry-report', label: 'Industry Report', accent: '#059669' },
  { value: 'financial-analysis', label: 'Financial Analysis', accent: '#22D3EE' },
  { value: 'peer-benchmarking', label: 'Peer Benchmarking', accent: '#3491E8' },
  { value: 'industry-trends', label: 'Industry Trends', accent: '#A855F7' },
  { value: 'sales-play', label: 'Sales Play', accent: '#E63946' },
];

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function ReportsLibraryPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    setEntries(loadHistory());
  }, []);

  // Filtered entries
  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (typeFilter !== 'all' && e.moduleType !== typeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const title = entryTitle(e).toLowerCase();
        const sub = entrySubtitle(e).toLowerCase();
        if (!title.includes(q) && !sub.includes(q) && !e.targetCompany.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [entries, typeFilter, search]);

  // Counts per type
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { all: entries.length };
    for (const e of entries) counts[e.moduleType] = (counts[e.moduleType] || 0) + 1;
    return counts;
  }, [entries]);

  function handleView(entry: HistoryEntry) {
    const meta = MODULE_META[entry.moduleType];
    if (!meta) return;
    setPendingRestore(entry.id);
    router.push(meta.route);
  }

  function handleDelete(id: string) {
    deleteHistoryEntry(id);
    setEntries(loadHistory());
    setConfirmDelete(null);
  }

  return (
    <div style={{ minHeight: '100vh', background: '#080f16', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0c3649 0%, #0a2233 100%)',
        borderBottom: '1px solid #1e4a68',
        padding: '20px 32px',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 16 }}>
          <a
            href="/"
            style={{
              color: '#7eaabf', textDecoration: 'none', fontSize: 13,
              display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
            }}
          >
            ← Home
          </a>
          <div style={{ width: 1, height: 16, background: '#1e4a68', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, color: '#059669', marginBottom: 3 }}>
              LIBRARY
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
                <path d="M7 3H18L23 8V25H7V3Z" stroke="#059669" strokeWidth="1.5" strokeLinejoin="round" fill="#059669" fillOpacity="0.08"/>
                <path d="M18 3V8H23" stroke="#059669" strokeWidth="1.4" strokeLinejoin="round"/>
                <rect x="10" y="14" width="3" height="7" rx="0.5" fill="#059669" opacity="0.7"/>
                <rect x="14.5" y="11" width="3" height="10" rx="0.5" fill="#059669" opacity="0.5"/>
                <rect x="19" y="16" width="3" height="5" rx="0.5" fill="#059669" opacity="0.35"/>
              </svg>
              <span style={{ fontSize: 20, fontWeight: 800, color: '#E8EDF5' }}>Report History</span>
            </div>
          </div>
          <div style={{ fontSize: 13, color: '#5a8a9f' }}>
            {entries.length} total report{entries.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, maxWidth: 1200, margin: '0 auto', width: '100%', padding: '24px 32px' }}>

        {/* Type filter pills */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {TYPE_FILTERS.map((f) => {
            const isActive = typeFilter === f.value;
            const count = typeCounts[f.value] || 0;
            return (
              <button
                key={f.value}
                onClick={() => setTypeFilter(f.value)}
                style={{
                  padding: '7px 14px',
                  fontSize: 12,
                  fontWeight: 600,
                  borderRadius: 20,
                  border: `1px solid ${isActive ? f.accent : '#1e4a68'}`,
                  background: isActive ? `${f.accent}18` : 'transparent',
                  color: isActive ? f.accent : '#5a8a9f',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                {f.label}
                <span style={{
                  fontSize: 10,
                  opacity: 0.7,
                  background: isActive ? `${f.accent}25` : 'rgba(30,74,104,0.3)',
                  borderRadius: 8,
                  padding: '1px 6px',
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search bar */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ position: 'relative' }}>
            <svg
              width="16" height="16" viewBox="0 0 16 16" fill="none"
              style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}
            >
              <circle cx="7" cy="7" r="5" stroke="#5a8a9f" strokeWidth="1.5" />
              <path d="M11 11L14 14" stroke="#5a8a9f" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reports..."
              style={{
                width: '100%',
                padding: '11px 14px 11px 40px',
                background: 'rgba(8,15,22,0.8)',
                border: '1px solid #1e4a68',
                borderRadius: 10,
                color: '#E8EDF5',
                fontSize: 13,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        {/* Report table */}
        {filtered.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 24px',
            border: '2px dashed #1e4a68',
            borderRadius: 14,
            background: 'rgba(14,50,75,0.15)',
          }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#7eaabf', marginBottom: 6 }}>
              No reports found
            </div>
            <div style={{ fontSize: 13, color: '#4a7a96', marginBottom: 20 }}>
              {entries.length === 0
                ? 'Generate your first report to see it here.'
                : 'Try adjusting the filters or search term.'}
            </div>
            <a
              href="/industry-report"
              style={{
                display: 'inline-block',
                padding: '10px 22px',
                background: 'linear-gradient(135deg, #059669, #047857)',
                color: '#fff',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              + New Report
            </a>
          </div>
        ) : (
          <div style={{ borderRadius: 12, border: '1px solid #1e4a68', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(14,50,75,0.4)' }}>
                  {['Report', 'Type', 'Details', 'Generated', ''].map((h, i) => (
                    <th
                      key={i}
                      style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#5a8a9f',
                        letterSpacing: 0.8,
                        textTransform: 'uppercase',
                        borderBottom: '1px solid #1e4a68',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((entry) => {
                  const meta = MODULE_META[entry.moduleType];
                  return (
                    <tr
                      key={entry.id}
                      style={{
                        borderBottom: '1px solid rgba(30,74,104,0.25)',
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(14,50,75,0.3)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      onClick={() => handleView(entry)}
                    >
                      {/* Title & subtitle */}
                      <td style={{ padding: '14px 16px', maxWidth: 360 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#E8EDF5', lineHeight: 1.35, marginBottom: 2 }}>
                          {entryTitle(entry)}
                        </div>
                        {entrySubtitle(entry) && (
                          <div style={{ fontSize: 11, color: '#5a8a9f' }}>{entrySubtitle(entry)}</div>
                        )}
                      </td>

                      {/* Type badge */}
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '4px 10px',
                          borderRadius: 12,
                          fontSize: 11,
                          fontWeight: 600,
                          color: meta?.accent || '#7eaabf',
                          background: `${meta?.accent || '#7eaabf'}14`,
                          border: `1px solid ${meta?.accent || '#7eaabf'}30`,
                          whiteSpace: 'nowrap',
                        }}>
                          <ModuleIcon id={entry.moduleType} size={14} />
                          {meta?.label || entry.moduleType}
                        </span>
                      </td>

                      {/* Metrics */}
                      <td style={{ padding: '14px 16px', fontSize: 12, color: '#7eaabf' }}>
                        {entryMetrics(entry)}
                      </td>

                      {/* Date */}
                      <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                        <div style={{ fontSize: 12, color: '#C4D4DE' }}>{formatDate(entry.completedAt)}</div>
                        <div style={{ fontSize: 10, color: '#4a7a96' }}>{formatTime(entry.completedAt)}</div>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }} onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleView(entry)}
                            style={{
                              padding: '5px 12px',
                              fontSize: 11,
                              fontWeight: 600,
                              color: '#059669',
                              background: 'rgba(5,150,105,0.1)',
                              border: '1px solid rgba(5,150,105,0.25)',
                              borderRadius: 6,
                              cursor: 'pointer',
                            }}
                          >
                            View
                          </button>
                          {confirmDelete === entry.id ? (
                            <button
                              onClick={() => handleDelete(entry.id)}
                              style={{
                                padding: '5px 12px',
                                fontSize: 11,
                                fontWeight: 600,
                                color: '#E63946',
                                background: 'rgba(230,57,70,0.12)',
                                border: '1px solid rgba(230,57,70,0.3)',
                                borderRadius: 6,
                                cursor: 'pointer',
                              }}
                            >
                              Confirm
                            </button>
                          ) : (
                            <button
                              onClick={() => setConfirmDelete(entry.id)}
                              style={{
                                padding: '5px 10px',
                                fontSize: 11,
                                color: '#4a7a96',
                                background: 'none',
                                border: '1px solid rgba(30,74,104,0.3)',
                                borderRadius: 6,
                                cursor: 'pointer',
                              }}
                            >
                              <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                                <path d="M2 4H12M5 4V2.5C5 2.22 5.22 2 5.5 2H8.5C8.78 2 9 2.22 9 2.5V4M6 7V10M8 7V10M3 4L3.5 11.5C3.5 11.78 3.72 12 4 12H10C10.28 12 10.5 11.78 10.5 11.5L11 4" stroke="#4a7a96" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Bottom stats */}
        {filtered.length > 0 && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 16,
            fontSize: 11,
            color: '#4a7a96',
          }}>
            <span>
              Showing {filtered.length} of {entries.length} report{entries.length !== 1 ? 's' : ''}
            </span>
            <span>Stored locally in browser</span>
          </div>
        )}
      </div>
    </div>
  );
}
