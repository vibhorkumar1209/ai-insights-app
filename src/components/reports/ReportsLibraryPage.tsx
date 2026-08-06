'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  loadHistory,
  deleteHistoryEntry,
  setPendingRestore,
  seedMarketIntelReports,
  HistoryEntry,
  ModuleType,
} from '@/lib/history';
import { IndustryReportJob } from '@/lib/types';
import { exportToDocx, exportToPdf, exportToPptx, entryToGenericJob, ExportOptions } from '@/lib/exportReport';
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
  'technology-themes':  { label: 'Technology Themes',      accent: '#E63946', route: '/technology-themes' },
  'sustainability':     { label: 'Sustainability Themes',  accent: '#10B981', route: '/sustainability' },
  'challenges-growth':  { label: 'Challenges & Growth',    accent: '#F59E0B', route: '/challenges-growth' },
  'sales-play':         { label: 'Sales Play',             accent: '#E63946', route: '/sales-play' },
  'sales-play-2':       { label: 'Sales Play II',          accent: '#E63946', route: '/sales-play-2' },
  'key-buyers':         { label: 'Key Opinion Leaders', accent: '#3B82F6', route: '/key-buyers' },
  'consulting-intelligence': { label: 'Consulting Intelligence', accent: '#7C3AED', route: '/consulting-intelligence' },
  'industry-trends':    { label: 'Industry Trends',        accent: '#A855F7', route: '/industry-trends' },
  'business-description': { label: 'Business Description', accent: '#06B6D4', route: '/business-description' },
  'peers':              { label: 'Peers',                   accent: '#6366F1', route: '/peers' },
  'niche-industries':   { label: 'High Growth Niche Industries', accent: '#059669', route: '/niche-industries' },
  'marketing-strategy': { label: 'Marketing Strategy',      accent: '#E63946', route: '/marketing-strategy' },
  'business-segments':  { label: 'Business Segments',      accent: '#7C3AED', route: '/business-segments' },
  'business-timelines': { label: 'Business Timelines',     accent: '#06B6D4', route: '/business-timelines' },
  'technology-heat-map': { label: 'Technology Heat Map',    accent: '#E63946', route: '/technology-heat-map' },
  'industry-blog': { label: 'Industry Blog',                accent: '#3491E8', route: '/industry-blog' },
  'industry-thought-leadership': { label: 'Thought Leadership', accent: '#3491E8', route: '/industry-thought-leadership' },
  'vuca-analysis':  { label: 'VUCA × 4W1H Analysis',        accent: '#E63946', route: '/vuca-analysis' },
  'firmographic':       { label: 'Firmographic',            accent: '#10B981', route: '/firmographic' },
  'spend':              { label: 'Spend',                   accent: '#F59E0B', route: '/spend' },
  'industry-outsourcing-report': { label: 'Industry Outsourcing Report', accent: '#F59E0B', route: '/industry-outsourcing-report' },
  'gcc-sales-play': { label: 'GCC Sales Play', accent: '#7C3AED', route: '/gcc-sales-play' },
  'it-jobs': { label: 'IT Jobs', accent: '#10B981', route: '/it-jobs' },
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
  if (entry.moduleType === 'vuca-analysis') {
    return [entry.vucaGeography, entry.vucaResult?.companyName].filter(Boolean).join(' · ');
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
  if (entry.moduleType === 'vuca-analysis') {
    const r = entry.vucaResult;
    const matrix = r?.vuca4w1hMatrix?.length ?? 0;
    const table2 = (r?.clientITImpact?.length ?? 0) || (r?.itSpendImpact?.length ?? 0);
    const geo = r?.geopoliticalStress?.length ?? 0;
    return `${matrix} VUCA drivers · ${table2} IT rows · ${geo} geo events`;
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

// Build filter pills dynamically from MODULE_META — only show types that have entries
function buildTypeFilters(entries: HistoryEntry[]): { value: TypeFilter; label: string; accent: string }[] {
  const present = new Set(entries.map((e) => e.moduleType));
  const filters: { value: TypeFilter; label: string; accent: string }[] = [
    { value: 'all', label: 'All Types', accent: '#4A6274' },
  ];
  for (const [key, meta] of Object.entries(MODULE_META)) {
    if (present.has(key as ModuleType)) {
      filters.push({ value: key as ModuleType, label: meta.label, accent: meta.accent });
    }
  }
  return filters;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

// Section selection modal state
interface ExportModalState {
  entry: HistoryEntry;
  format: 'docx' | 'pdf' | 'pptx';
  allSections: { id: string; title: string }[];
  selectedIds: string[];
}

export default function ReportsLibraryPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [exporting, setExporting] = useState<string | null>(null);
  const [exportModal, setExportModal] = useState<ExportModalState | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Close dropdown menu on outside click (modal has its own backdrop handler)
  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenu(null);
  }, []);
  useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [handleClickOutside]);

  function openExportModal(entry: HistoryEntry, format: 'docx' | 'pdf' | 'pptx') {
    setOpenMenu(null);
    const job = entryToGenericJob(entry);
    const allSections = [
      ...(job.executiveSummary ? [{ id: '__exec_summary__', title: 'Executive Summary' }] : []),
      ...(job.sections || []).map((s) => ({ id: s.id, title: s.title })),
    ];
    setExportModal({
      entry,
      format,
      allSections,
      selectedIds: allSections.map((s) => s.id),
    });
  }

  function toggleModalSection(id: string) {
    if (!exportModal) return;
    const cur = exportModal.selectedIds;
    setExportModal({
      ...exportModal,
      selectedIds: cur.includes(id) ? cur.filter((s) => s !== id) : [...cur, id],
    });
  }

  async function confirmExport() {
    if (!exportModal) return;
    const { entry, format, selectedIds } = exportModal;
    setExportModal(null);
    setExporting(entry.id);
    try {
      const job = entryToGenericJob(entry);
      const sectionFilter = selectedIds.filter((id) => id !== '__exec_summary__');
      const includeExecSummary = selectedIds.includes('__exec_summary__');
      // If exec summary is deselected, clear it from job
      const exportJob = includeExecSummary ? job : { ...job, executiveSummary: undefined };
      const opts: ExportOptions = { sectionFilter: sectionFilter.length > 0 ? sectionFilter : undefined };
      if (format === 'docx') await exportToDocx(exportJob, opts);
      else if (format === 'pdf') await exportToPdf(exportJob, opts);
      else await exportToPptx(exportJob, opts);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(null);
    }
  }

  useEffect(() => {
    seedMarketIntelReports().then(() => {
      setEntries(loadHistory());
    });
  }, []);

  // Filtered entries
  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (!(e.moduleType in MODULE_META)) return false; // skip legacy/unknown module types
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
    window.location.href = meta.route;
  }

  function handleDelete(id: string) {
    deleteHistoryEntry(id);
    setEntries(loadHistory());
    setConfirmDelete(null);
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0c3649, #12516E)',
        borderBottom: '1px solid #CCDFEA',
        padding: '20px 32px',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 16 }}>
          <a
            href="/"
            style={{
              color: 'rgba(255,255,255,0.65)', textDecoration: 'none', fontSize: 13,
              display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
            }}
          >
            ← Home
          </a>
          <div style={{ width: 1, height: 16, background: '#CCDFEA', flexShrink: 0 }} />
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
              <span style={{ fontSize: 20, fontWeight: 800, color: '#FFFFFF' }}>Report History</span>
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
          {buildTypeFilters(entries).map((f) => {
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
                  border: `1px solid ${isActive ? f.accent : '#CCDFEA'}`,
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
                  background: isActive ? `${f.accent}25` : '#F3F8FA',
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
                background: '#FFFFFF',
                border: '1px solid #CCDFEA',
                borderRadius: 10,
                color: '#1B2A3D',
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
            border: '2px dashed #CCDFEA',
            borderRadius: 14,
            background: '#F3F8FA',
          }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#6B7280', marginBottom: 6 }}>
              No reports found
            </div>
            <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 20 }}>
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
          <div style={{ borderRadius: 12, border: '1px solid #CCDFEA', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F3F8FA' }}>
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
                        borderBottom: '1px solid #CCDFEA',
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
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#EDF4F8')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      onClick={() => handleView(entry)}
                    >
                      {/* Title & subtitle */}
                      <td style={{ padding: '14px 16px', maxWidth: 360 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#1B2A3D', lineHeight: 1.35, marginBottom: 2 }}>
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
                          color: meta?.accent || '#4A6274',
                          background: `${meta?.accent || '#4A6274'}14`,
                          border: `1px solid ${meta?.accent || '#4A6274'}30`,
                          whiteSpace: 'nowrap',
                        }}>
                          <ModuleIcon id={entry.moduleType} size={14} />
                          {meta?.label || entry.moduleType}
                        </span>
                      </td>

                      {/* Metrics */}
                      <td style={{ padding: '14px 16px', fontSize: 12, color: '#6B7280' }}>
                        {entryMetrics(entry)}
                      </td>

                      {/* Date */}
                      <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                        <div style={{ fontSize: 12, color: '#374B5C' }}>{formatDate(entry.completedAt)}</div>
                        <div style={{ fontSize: 10, color: '#6B7280' }}>{formatTime(entry.completedAt)}</div>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
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

                          {/* Download dropdown — available for all report types */}
                          <div style={{ position: 'relative' }} ref={openMenu === entry.id ? menuRef : undefined}>
                            <button
                              onClick={() => setOpenMenu(openMenu === entry.id ? null : entry.id)}
                              style={{
                                padding: '5px 10px',
                                fontSize: 11,
                                fontWeight: 600,
                                color: '#3491E8',
                                background: 'rgba(52,145,232,0.08)',
                                border: '1px solid rgba(52,145,232,0.25)',
                                borderRadius: 6,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              {exporting === entry.id ? (
                                <span style={{ fontSize: 10 }}>...</span>
                              ) : (
                                <>
                                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                                    <path d="M8 2V10M8 10L5 7M8 10L11 7M3 13H13" stroke="#3491E8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                                    <path d="M2 3L4 5L6 3" stroke="#3491E8" strokeWidth="1.2" strokeLinecap="round"/>
                                  </svg>
                                </>
                              )}
                            </button>
                            {openMenu === entry.id && (
                              <div style={{
                                position: 'absolute',
                                right: 0,
                                top: '100%',
                                marginTop: 4,
                                background: '#FFFFFF',
                                border: '1px solid #CCDFEA',
                                borderRadius: 8,
                                overflow: 'hidden',
                                zIndex: 50,
                                minWidth: 150,
                                boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                              }}>
                                {([
                                  { format: 'docx' as const, label: 'Word (.docx)', icon: 'W' },
                                  { format: 'pdf' as const, label: 'PDF (.pdf)', icon: 'P' },
                                  { format: 'pptx' as const, label: 'PowerPoint (.pptx)', icon: 'S' },
                                ]).map((opt) => (
                                  <button
                                    key={opt.format}
                                    onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); openExportModal(entry, opt.format); }}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 10,
                                      width: '100%',
                                      padding: '9px 14px',
                                      background: 'none',
                                      border: 'none',
                                      borderBottom: '1px solid rgba(30,74,104,0.2)',
                                      color: '#374B5C',
                                      fontSize: 12,
                                      cursor: 'pointer',
                                      textAlign: 'left',
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(52,145,232,0.12)')}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                                  >
                                    <span style={{
                                      width: 22, height: 22, borderRadius: 4,
                                      background: opt.format === 'docx' ? 'rgba(37,99,235,0.15)' : opt.format === 'pdf' ? 'rgba(230,57,70,0.15)' : 'rgba(245,158,11,0.15)',
                                      color: opt.format === 'docx' ? '#3B82F6' : opt.format === 'pdf' ? '#E63946' : '#F59E0B',
                                      fontSize: 10, fontWeight: 700,
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                      {opt.icon}
                                    </span>
                                    {opt.label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

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
                                color: '#6B7280',
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
            color: '#6B7280',
          }}>
            <span>
              Showing {filtered.length} of {entries.length} report{entries.length !== 1 ? 's' : ''}
            </span>
            <span>Stored locally in browser</span>
          </div>
        )}
      </div>

      {/* ═══════ SECTION SELECTION MODAL ═══════ */}
      {exportModal && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setExportModal(null); }}
          style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(4px)',
        }}>
          <div
            ref={modalRef}
            style={{
              background: '#FFFFFF',
              border: '1px solid #CCDFEA',
              borderRadius: 16,
              padding: '28px 32px',
              maxWidth: 520,
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1B2A3D' }}>
                  Select Sections to Export
                </div>
                <div style={{ fontSize: 12, color: '#5A6E7A', marginTop: 4 }}>
                  {exportModal.format === 'docx' ? 'Word' : exportModal.format === 'pdf' ? 'PDF' : 'PowerPoint'} — {entryTitle(exportModal.entry)}
                </div>
              </div>
              <button
                onClick={() => setExportModal(null)}
                style={{ background: 'none', border: 'none', color: '#5A6E7A', fontSize: 20, cursor: 'pointer', padding: 4 }}
              >
                ✕
              </button>
            </div>

            {/* Quick actions */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <button
                onClick={() => setExportModal({ ...exportModal, selectedIds: exportModal.allSections.map((s) => s.id) })}
                style={{ background: 'none', border: 'none', color: '#3491E8', fontSize: 12, cursor: 'pointer', fontWeight: 600, padding: 0 }}
              >
                Select All
              </button>
              <button
                onClick={() => setExportModal({ ...exportModal, selectedIds: [] })}
                style={{ background: 'none', border: 'none', color: '#5A6E7A', fontSize: 12, cursor: 'pointer', fontWeight: 600, padding: 0 }}
              >
                Deselect All
              </button>
            </div>

            {/* Section list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 24 }}>
              {exportModal.allSections.map((sec, idx) => {
                const active = exportModal.selectedIds.includes(sec.id);
                return (
                  <button
                    key={sec.id}
                    onClick={() => toggleModalSection(sec.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 14px',
                      background: active ? 'rgba(52,145,232,0.1)' : '#F3F8FA',
                      border: active ? '1px solid rgba(52,145,232,0.3)' : '1px solid rgba(30,74,104,0.2)',
                      borderRadius: 8,
                      cursor: 'pointer',
                      textAlign: 'left' as const,
                      width: '100%',
                      transition: 'all 0.15s',
                    }}
                  >
                    <span style={{
                      width: 22, height: 22, borderRadius: 6,
                      background: active ? 'rgba(52,145,232,0.25)' : '#F3F8FA',
                      color: active ? '#3491E8' : '#4A6A7D',
                      fontSize: 11, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {active ? '✓' : idx + 1}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 500, color: active ? '#1B2A3D' : '#6B7280', flex: 1 }}>
                      {sec.title}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#5A6E7A' }}>
                {exportModal.selectedIds.length}/{exportModal.allSections.length} sections
              </span>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setExportModal(null)}
                  style={{
                    padding: '10px 20px', borderRadius: 8,
                    border: '1px solid rgba(30,74,104,0.4)', background: 'transparent',
                    color: '#5A6E7A', fontSize: 13, fontWeight: 500, cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmExport}
                  disabled={exportModal.selectedIds.length === 0}
                  style={{
                    padding: '10px 28px', borderRadius: 8,
                    border: 'none',
                    background: exportModal.selectedIds.length > 0
                      ? 'linear-gradient(135deg, #3491E8, #2563EB)' : '#CCDFEA',
                    color: exportModal.selectedIds.length > 0 ? '#fff' : '#6B7280',
                    fontSize: 13, fontWeight: 700,
                    cursor: exportModal.selectedIds.length > 0 ? 'pointer' : 'not-allowed',
                    boxShadow: exportModal.selectedIds.length > 0 ? '0 4px 16px rgba(52,145,232,0.3)' : 'none',
                  }}
                >
                  Download {exportModal.format === 'docx' ? 'Word' : exportModal.format === 'pdf' ? 'PDF' : 'PPT'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
