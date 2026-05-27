'use client';
import StuckJobBanner from '@/components/shared/StuckJobBanner';
import KillSwitchButton from '@/components/shared/KillSwitchButton';

import { useState, useEffect, useCallback } from 'react';
import { MarketingStrategyJob, StrategyFramework, StrategyDimensionRow } from '@/lib/types';
import {
  loadHistory,
  saveToHistory,
  loadEntryById,
  popPendingRestore,
  HistoryEntry,
} from '@/lib/history';
import { API_ENDPOINTS } from '@/lib/config';
import { useJobManager } from '@/lib/useJobManager';
import HistoryDrawer from '@/components/shared/HistoryDrawer';
import ModuleIcon from '@/components/shared/ModuleIcon';

const ACCENT = '#E63946';

// ── VUCA helpers ──────────────────────────────────────────────────────────────
const VUCA_COLORS: Record<string, string> = {
  VOLATILE:  '#F97316',
  UNCERTAIN: '#EAB308',
  COMPLEX:   '#3B82F6',
  AMBIGUOUS: '#A855F7',
};

function safeStr(value: unknown): string {
  if (value == null) return '';
  if (Array.isArray(value)) return value.map((v) => String(v)).join(', ');
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const phases: string[] = [];
    if (obj.acute)          phases.push(`▸ Acute: ${obj.acute}`);
    if (obj.structural)     phases.push(`▸ Structural Reset: ${obj.structural}`);
    if (obj.structuralReset) phases.push(`▸ Structural Reset: ${obj.structuralReset}`);
    if (obj.recovery)       phases.push(`▸ Recovery: ${obj.recovery}`);
    if (phases.length > 0) return phases.join(' | ');
    return Object.entries(obj).map(([k, v]) => `${k}: ${v}`).join(' | ');
  }
  return String(value);
}

function BulletText({ text }: { text: unknown }) {
  const raw = safeStr(text);
  const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return null;
  return (
    <ul style={{ margin: 0, padding: '0 0 0 14px', listStyle: 'disc' }}>
      {lines.map((l, i) => (
        <li key={i} style={{ color: '#6B7280', fontSize: 12, lineHeight: 1.55, marginBottom: 3 }}>
          {l.replace(/^[•\-]\s*/, '')}
        </li>
      ))}
    </ul>
  );
}

function VucaBadge({ label }: { label: unknown }) {
  const s = safeStr(label).toUpperCase();
  const color = VUCA_COLORS[s] || '#888';
  return (
    <span style={{
      padding: '3px 9px', borderRadius: 10, fontSize: 10, fontWeight: 800,
      background: `${color}22`, color, letterSpacing: 0.5, whiteSpace: 'nowrap',
    }}>{s}</span>
  );
}

// ── VUCA Results View ─────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function VucaResultsView({ job, onReset }: { job: any; onReset: () => void }) {
  const TH = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
    <th style={{
      padding: '10px 12px', background: '#F3F8FA', color: '#6B7280',
      fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
      textAlign: 'left', verticalAlign: 'top', whiteSpace: 'nowrap', ...style,
    }}>{children}</th>
  );
  const TD = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
    <td style={{
      padding: '12px', borderBottom: '1px solid #E0ECF1',
      color: '#374B5C', fontSize: 12, verticalAlign: 'top', lineHeight: 1.55, ...style,
    }}>{children}</td>
  );
  const tableWrap: React.CSSProperties = {
    width: '100%', overflowX: 'auto', borderRadius: 10,
    border: '1px solid #CCDFEA', marginBottom: 28,
  };
  const tableStyle: React.CSSProperties = {
    width: '100%', borderCollapse: 'collapse', fontSize: 12,
  };
  const sectionTitle = (label: string, sub?: string) => (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: 1.5 }}>{label}</div>
      {sub && <div style={{ fontSize: 12, color: '#4A6274', marginTop: 3 }}>{sub}</div>}
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h2 style={{ color: '#1B2A3D', fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>
            VUCA × 4W1H Analysis
          </h2>
          <div style={{ color: '#4A6274', fontSize: 13 }}>
            {safeStr(job.industry)} · {safeStr(job.geography)}
          </div>
        </div>
        <button onClick={onReset} style={{
          padding: '10px 22px', borderRadius: 8, flexShrink: 0,
          border: `1px solid ${ACCENT}`, background: 'transparent',
          color: ACCENT, fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}>
          New Analysis
        </button>
      </div>

      {/* Table 0: VUCA Drivers, Effects & Demand */}
      {job.vucaDriverEffects?.length > 0 && (
        <div>
          {sectionTitle('TABLE 1 — VUCA DRIVERS, EFFECTS & DEMAND')}
          <div style={tableWrap}>
            <table style={tableStyle}>
              <thead><tr>
                <TH style={{ minWidth: 110 }}>VUCA Dimension</TH>
                <TH style={{ minWidth: 200 }}>Driver</TH>
                <TH style={{ minWidth: 220 }}>Effects on Industry</TH>
                <TH style={{ minWidth: 220 }}>IT / Tech Demand Created</TH>
              </tr></thead>
              <tbody>
                {job.vucaDriverEffects.map((row: any, i: number) => (
                  <tr key={i}>
                    <TD><VucaBadge label={row.vucaDimension} /></TD>
                    <TD>{safeStr(row.driver)}</TD>
                    <TD><BulletText text={row.effects} /></TD>
                    <TD><BulletText text={row.demand} /></TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Table 1: VUCA 4W1H Matrix */}
      {job.vuca4w1hMatrix?.length > 0 && (
        <div>
          {sectionTitle('TABLE 2 — VUCA × 4W1H MATRIX', 'What · Why · Where · When · How')}
          <div style={tableWrap}>
            <table style={tableStyle}>
              <thead><tr>
                <TH style={{ minWidth: 110 }}>VUCA</TH>
                <TH style={{ minWidth: 130 }}>Lens</TH>
                <TH style={{ minWidth: 180 }}>WHAT — Situation</TH>
                <TH style={{ minWidth: 160 }}>WHY — Root Cause</TH>
                <TH style={{ minWidth: 140 }}>WHERE</TH>
                <TH style={{ minWidth: 180 }}>WHEN — Timeline</TH>
                <TH style={{ minWidth: 200 }}>HOW — Adapt</TH>
              </tr></thead>
              <tbody>
                {job.vuca4w1hMatrix.map((row: any, i: number) => (
                  <tr key={i}>
                    <TD><VucaBadge label={row.vucaDimension} /></TD>
                    <TD style={{ fontWeight: 600, color: '#1B2A3D' }}>{safeStr(row.lens)}</TD>
                    <TD>{safeStr(row.what)}</TD>
                    <TD>{safeStr(row.why)}</TD>
                    <TD>{safeStr(row.where)}</TD>
                    <TD>
                      {safeStr(row.when).split(/\||\n/).map((p, pi, arr) => {
                        const t = p.trim(); if (!t) return null;
                        return <div key={pi} style={{ marginBottom: pi < arr.length - 1 ? 6 : 0, fontSize: 11 }}>{t}</div>;
                      })}
                    </TD>
                    <TD style={{ borderLeft: `2px solid ${ACCENT}44` }}>
                      <BulletText text={row.how} />
                    </TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Table 2: IT Spend Impact */}
      {job.clientITImpact?.length > 0 && (
        <div>
          {sectionTitle('TABLE 3 — IT SPEND IMPACT')}
          <div style={tableWrap}>
            <table style={tableStyle}>
              <thead><tr>
                <TH style={{ minWidth: 180 }}>Stress Event</TH>
                <TH style={{ minWidth: 100 }}>VUCA Driver</TH>
                <TH style={{ minWidth: 150 }}>Est. Impact on Tech Spend</TH>
                <TH style={{ minWidth: 50 }}>Impact</TH>
                <TH style={{ minWidth: 180 }}>Impacted IT Category</TH>
                <TH style={{ minWidth: 160 }}>Role in Organisation</TH>
                <TH style={{ minWidth: 200 }}>Recommendation</TH>
              </tr></thead>
              <tbody>
                {job.clientITImpact.map((row: any, i: number) => {
                  const impactColor = { H: '#EF4444', M: '#F59E0B', L: '#22C55E' }[safeStr(row.impact)] || '#888';
                  return (
                    <tr key={i}>
                      <TD style={{ fontWeight: 600, color: '#1B2A3D' }}>{safeStr(row.stressEvent)}</TD>
                      <TD><VucaBadge label={row.vucaDriver} /></TD>
                      <TD style={{ color: '#22C55E', fontWeight: 600 }}>{safeStr(row.estImpactOnTechSpending)}</TD>
                      <TD>
                        <span style={{ padding: '3px 8px', borderRadius: 8, fontSize: 11, fontWeight: 700, background: `${impactColor}22`, color: impactColor }}>
                          {safeStr(row.impact)}
                        </span>
                      </TD>
                      <TD><BulletText text={row.impactedTechSpendCategory} /></TD>
                      <TD style={{ color: '#6B7280' }}>{safeStr(row.roleInOrganization)}</TD>
                      <TD><BulletText text={row.recommendation} /></TD>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Table 3: Geopolitical Stress */}
      {job.geopoliticalStress?.length > 0 && (
        <div>
          {sectionTitle('TABLE 4 — GEOPOLITICAL STRESS OVERLAY')}
          <div style={tableWrap}>
            <table style={tableStyle}>
              <thead><tr>
                <TH style={{ minWidth: 180 }}>Stress Event</TH>
                <TH style={{ minWidth: 100 }}>Status</TH>
                <TH style={{ minWidth: 220 }}>Transmission Mechanism</TH>
                <TH style={{ minWidth: 80 }}>Severity</TH>
                <TH style={{ minWidth: 180 }}>Severity Rationale</TH>
                <TH style={{ minWidth: 220 }}>IT Budget Signal</TH>
              </tr></thead>
              <tbody>
                {job.geopoliticalStress.map((row: any, i: number) => {
                  const statusColor: Record<string, string> = { Active: '#EF4444', Escalating: '#F97316', Monitoring: '#EAB308', Resolved: '#22C55E' };
                  const sevColor = { High: '#EF4444', Medium: '#F59E0B', Low: '#22C55E' }[safeStr(row.severity)] || '#888';
                  const sc = statusColor[safeStr(row.status)] || '#888';
                  return (
                    <tr key={i}>
                      <TD style={{ fontWeight: 600, color: '#1B2A3D' }}>{safeStr(row.stressEvent)}</TD>
                      <TD>
                        <span style={{ padding: '3px 9px', borderRadius: 10, fontSize: 10, fontWeight: 700, background: `${sc}22`, color: sc }}>
                          {safeStr(row.status)}
                        </span>
                      </TD>
                      <TD>{safeStr(row.transmissionMechanism)}</TD>
                      <TD>
                        <span style={{ padding: '3px 9px', borderRadius: 10, fontSize: 10, fontWeight: 700, background: `${sevColor}22`, color: sevColor }}>
                          {safeStr(row.severity)}
                        </span>
                      </TD>
                      <TD style={{ color: '#6B7280' }}>{safeStr(row.severityRationale)}</TD>
                      <TD><BulletText text={row.itBudgetSignal} /></TD>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Framework list ────────────────────────────────────────────────────────────
const FRAMEWORKS: { value: StrategyFramework; label: string; description: string; icon?: string }[] = [
  { value: 'BCG Matrix', label: 'BCG Matrix', description: 'Growth-Share Matrix — classify products/segments as Stars, Cash Cows, Question Marks, or Dogs' },
  { value: 'SWOT', label: 'SWOT Analysis', description: 'Internal Strengths & Weaknesses, External Opportunities & Threats' },
  { value: 'Porters Five Forces', label: "Porter's Five Forces", description: 'Competitive Rivalry, New Entrants, Substitutes, Buyer & Supplier Power' },
  { value: 'Ansoff Matrix', label: 'Ansoff Matrix', description: 'Market Penetration, Market Development, Product Development, Diversification' },
  { value: '4P/7P Marketing Mix', label: '4P/7P Marketing Mix', description: 'Product, Price, Place, Promotion, People, Process, Physical Evidence' },
  { value: 'AIDA', label: 'AIDA Model', description: 'Attention, Interest, Desire, Action — buyer journey framework' },
  { value: 'PESTEL', label: 'PESTEL Analysis', description: 'Political, Economic, Social, Technological, Environmental, Legal factors' },
  { value: 'North Star', label: 'North Star Framework', description: 'Identify the one metric that best captures the core value delivered' },
  { value: 'Flywheel Model', label: 'Flywheel Model', description: 'Self-reinforcing growth loop — acquisition, activation, retention, revenue, referral' },
  { value: 'Blue Ocean', label: 'Blue Ocean Strategy', description: 'Eliminate, Reduce, Raise, Create — find uncontested market space' },
  { value: '7S Framework', label: 'McKinsey 7S', description: 'Strategy, Structure, Systems, Shared Values, Style, Staff, Skills' },
  { value: 'GE-McKinsey Matrix', label: 'GE-McKinsey Matrix', description: 'Industry Attractiveness vs Competitive Strength — Invest, Hold, or Harvest' },
  { value: 'Eisenhower Matrix', label: 'Eisenhower Matrix', description: 'Urgent/Important priority grid for strategic initiative triage' },
  { value: 'VUCA × 4W1H', label: 'VUCA × 4W1H', icon: '⚡', description: 'Volatile · Uncertain · Complex · Ambiguous — map risks, IT spend impact & geopolitical stress' },
];

const PRIORITY_COLORS: Record<string, string> = {
  High: '#EF4444',
  Medium: '#F59E0B',
  Low: '#22C55E',
};

// ── Main component ────────────────────────────────────────────────────────────
export default function MarketingStrategyPage() {
  const [step, setStep] = useState<'input' | 'analysing' | 'results'>('input');
  const [industryOrSegment, setIndustryOrSegment] = useState('');
  const [geography, setGeography] = useState('');
  const [selectedFramework, setSelectedFramework] = useState<StrategyFramework | ''>('');
  const [productContext, setProductContext] = useState('');
  const [historyCount, setHistoryCount] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [expandedDim, setExpandedDim] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [displayedJob, setDisplayedJob] = useState<any | null>(null);

  const isVuca = selectedFramework === 'VUCA × 4W1H';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { job, error, isStuck, retryJob, startJob, cancelJob } = useJobManager<any>({
    onProgress: () => setStep('analysing'),
    onComplete: (data) => {
      setStep('results');
      setDisplayedJob(data);
      if (isVuca || data.vuca4w1hMatrix) {
        saveToHistory({
          moduleType: 'marketing-strategy',
          targetCompany: industryOrSegment.trim(),
          completedAt: data.completedAt || new Date().toISOString(),
          strategyIndustry: industryOrSegment.trim(),
          strategyFramework: 'VUCA × 4W1H' as StrategyFramework,
          vucaResult: data,
        });
      } else {
        saveToHistory({
          moduleType: 'marketing-strategy',
          targetCompany: industryOrSegment.trim(),
          completedAt: data.completedAt || new Date().toISOString(),
          strategyIndustry: data.industryOrSegment,
          strategyFramework: data.framework,
          strategySummary: data.frameworkSummary,
          strategyDimensions: data.dimensions,
          strategyRecommendations: data.strategicRecommendations,
        });
      }
      setHistoryCount(loadHistory().length);
    },
  });

  useEffect(() => {
    setHistoryCount(loadHistory().length);
    const pendingId = popPendingRestore();
    if (pendingId) {
      const entry = loadEntryById(pendingId);
      if (entry && entry.moduleType === 'marketing-strategy') restoreEntry(entry);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const restoreEntry = useCallback((entry: HistoryEntry) => {
    const isVucaEntry = entry.strategyFramework === 'VUCA × 4W1H' || !!entry.vucaResult;
    if (isVucaEntry) {
      if (!entry.vucaResult) return;
      setIndustryOrSegment(entry.strategyIndustry || entry.targetCompany);
      setSelectedFramework('VUCA × 4W1H');
      setDisplayedJob(entry.vucaResult);
      setStep('results');
    } else {
      if (!entry.strategyDimensions) return;
      setIndustryOrSegment(entry.strategyIndustry || entry.targetCompany);
      setSelectedFramework(entry.strategyFramework || '');
      setDisplayedJob({
        jobId: entry.id,
        status: 'complete',
        progress: 100,
        industryOrSegment: entry.strategyIndustry,
        framework: entry.strategyFramework,
        frameworkSummary: entry.strategySummary,
        dimensions: entry.strategyDimensions,
        strategicRecommendations: entry.strategyRecommendations,
        createdAt: entry.completedAt,
        completedAt: entry.completedAt,
      } as MarketingStrategyJob);
      setStep('results');
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!industryOrSegment.trim() || !selectedFramework) return;

    if (isVuca) {
      await startJob({
        endpoint: API_ENDPOINTS.vucaAnalysis,
        payload: {
          industry: industryOrSegment.trim(),
          geography: geography.trim() || 'Global',
        },
        streamUrlFactory: (jobId) => API_ENDPOINTS.vucaAnalysisStream(jobId),
        persist: { moduleType: 'marketing-strategy', targetCompany: industryOrSegment.trim() },
      });
    } else {
      await startJob({
        endpoint: API_ENDPOINTS.marketingStrategy,
        payload: {
          industryOrSegment: industryOrSegment.trim(),
          framework: selectedFramework,
          productContext: productContext.trim() || undefined,
        },
        streamUrlFactory: (jobId) => API_ENDPOINTS.marketingStrategyStream(jobId),
        persist: { moduleType: 'marketing-strategy', targetCompany: industryOrSegment.trim() },
      });
    }
  }

  function handleReset() {
    cancelJob();
    setStep('input');
    setExpandedDim(null);
    setDisplayedJob(null);
  }

  // Group dimensions by dimension name (strategy mode only)
  const groupedDimensions: Record<string, StrategyDimensionRow[]> = {};
  const activeJob = displayedJob || job;
  if (activeJob?.dimensions) {
    for (const row of activeJob.dimensions) {
      if (!groupedDimensions[row.dimension]) groupedDimensions[row.dimension] = [];
      groupedDimensions[row.dimension].push(row);
    }
  }

  const isVucaResults = !!(activeJob?.vuca4w1hMatrix || activeJob?.vucaDriverEffects);

  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', display: 'flex', flexDirection: 'column' }}>
      {showHistory && (
        <HistoryDrawer
          currentModule="marketing-strategy"
          onSelectSameModule={restoreEntry}
          onClose={() => setShowHistory(false)}
        />
      )}

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0c3649, #12516E)',
        borderBottom: '1px solid #CCDFEA', padding: '16px 32px', flexShrink: 0,
      }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 16 }}>
          <a href="/" style={{ color: 'rgba(255,255,255,0.75)', textDecoration: 'none', fontSize: 13 }}>← Home</a>
          <div style={{ width: 1, height: 16, background: '#CCDFEA' }} />
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: ACCENT, letterSpacing: 2, marginBottom: 3 }}>REFRACTONE</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ModuleIcon id="marketing-strategy" size={20} />
              <span style={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF' }}>Marketing Strategy Framework</span>
            </div>
          </div>
          <button
            onClick={() => setShowHistory(true)}
            style={{
              marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8,
              background: `rgba(230,57,70,0.1)`, border: '1px solid rgba(230,57,70,0.25)',
              color: ACCENT, borderRadius: 8, padding: '8px 16px',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            History {historyCount > 0 && `(${historyCount})`}
          </button>
        </div>
      </div>

      <div style={{ flex: 1, maxWidth: 1400, margin: '0 auto', width: '100%', padding: '32px' }}>

        {/* ── INPUT STEP ── */}
        {step === 'input' && (
          <div style={{ maxWidth: 780, margin: '48px auto 0' }}>
            {error && (
              <div style={{
                background: 'rgba(230,57,70,0.1)', border: '1px solid rgba(230,57,70,0.3)',
                borderRadius: 8, padding: '12px 16px', marginBottom: 24, fontSize: 13, color: '#ff6b75',
              }}>{error}</div>
            )}
            <div style={{
              background: '#F3F8FA',
              border: '1px solid #CCDFEA', borderRadius: 12, padding: '32px',
            }}>
              <h2 style={{ color: '#1B2A3D', fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
                Marketing Strategy Framework
              </h2>
              <p style={{ color: '#6B7280', fontSize: 13, marginBottom: 24 }}>
                Select an industry and a strategic framework. Our AI will conduct McKinsey-grade analysis
                with specific data, company examples, and actionable recommendations.
              </p>
              <form onSubmit={handleSubmit}>
                <label style={{ display: 'block', marginBottom: 16 }}>
                  <span style={{ color: '#6B7280', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                    Industry / Segment *
                  </span>
                  <input
                    value={industryOrSegment}
                    onChange={(e) => setIndustryOrSegment(e.target.value)}
                    placeholder="e.g., Cloud Computing, Healthcare SaaS, Electric Vehicles..."
                    style={{
                      width: '100%', background: '#F3F8FA', border: '1px solid #CCDFEA', borderRadius: 8,
                      color: '#1B2A3D', padding: '12px', fontSize: 14, outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                </label>

                {/* Geography — only shown when VUCA selected */}
                {isVuca && (
                  <label style={{ display: 'block', marginBottom: 16 }}>
                    <span style={{ color: '#6B7280', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                      Geography
                    </span>
                    <input
                      value={geography}
                      onChange={(e) => setGeography(e.target.value)}
                      placeholder="e.g., Global, North America, Asia Pacific..."
                      style={{
                        width: '100%', background: '#F3F8FA', border: '1px solid #CCDFEA', borderRadius: 8,
                        color: '#1B2A3D', padding: '12px', fontSize: 14, outline: 'none', boxSizing: 'border-box',
                      }}
                    />
                  </label>
                )}

                <div style={{ marginBottom: 16 }}>
                  <span style={{ color: '#6B7280', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 10 }}>
                    Strategy Framework *
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
                    {FRAMEWORKS.map((fw) => {
                      const selected = selectedFramework === fw.value;
                      const isVucaCard = fw.value === 'VUCA × 4W1H';
                      const cardAccent = isVucaCard ? '#F97316' : ACCENT;
                      return (
                        <button
                          key={fw.value}
                          type="button"
                          onClick={() => setSelectedFramework(fw.value)}
                          style={{
                            textAlign: 'left', padding: '12px 14px', borderRadius: 8, cursor: 'pointer',
                            border: selected ? `2px solid ${cardAccent}` : isVucaCard ? '1px dashed #F9731644' : '1px solid #CCDFEA',
                            background: selected
                              ? (isVucaCard ? 'rgba(249,115,22,0.10)' : `rgba(230,57,70,0.12)`)
                              : (isVucaCard ? 'rgba(249,115,22,0.04)' : '#F3F8FA'),
                            transition: 'all 0.15s',
                          }}
                        >
                          <div style={{
                            fontSize: 13, fontWeight: 700,
                            color: selected ? cardAccent : (isVucaCard ? '#F97316cc' : '#1B2A3D'),
                            marginBottom: 3, display: 'flex', alignItems: 'center', gap: 5,
                          }}>
                            {fw.icon && <span>{fw.icon}</span>}
                            {fw.label}
                          </div>
                          <div style={{ fontSize: 11, color: '#4A6274', lineHeight: 1.4 }}>
                            {fw.description}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Product context — hidden for VUCA */}
                {!isVuca && (
                  <label style={{ display: 'block', marginBottom: 24 }}>
                    <span style={{ color: '#6B7280', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                      Product / Service Context (optional)
                    </span>
                    <textarea
                      value={productContext}
                      onChange={(e) => setProductContext(e.target.value)}
                      rows={3}
                      placeholder="Describe your product/service to tailor the analysis to your specific context..."
                      style={{
                        width: '100%', background: '#F3F8FA', border: '1px solid #CCDFEA', borderRadius: 8,
                        color: '#1B2A3D', padding: '12px', fontSize: 14, resize: 'vertical',
                        outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                      }}
                    />
                  </label>
                )}

                <button
                  type="submit"
                  disabled={!industryOrSegment.trim() || !selectedFramework}
                  style={{
                    width: '100%', padding: '13px',
                    background: (industryOrSegment.trim() && selectedFramework)
                      ? (isVuca
                          ? 'linear-gradient(135deg, #F97316, #EA580C)'
                          : `linear-gradient(135deg, ${ACCENT}, #6D28D9)`)
                      : '#CCDFEA',
                    border: 'none', borderRadius: 8,
                    color: '#fff', fontSize: 14, fontWeight: 700,
                    cursor: (industryOrSegment.trim() && selectedFramework) ? 'pointer' : 'not-allowed',
                    opacity: (industryOrSegment.trim() && selectedFramework) ? 1 : 0.5,
                    marginTop: isVuca ? 0 : undefined,
                  }}
                >
                  Run {selectedFramework || 'Framework'} Analysis →
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ── ANALYSING STEP ── */}
        {step === 'analysing' && (
          <div style={{ maxWidth: 580, margin: '48px auto 0' }}>
            <div style={{
              background: '#F3F8FA',
              border: '1px solid #CCDFEA', borderRadius: 12, padding: '36px 32px', textAlign: 'center',
            }}>
              <div style={{
                width: 48, height: 48,
                border: `3px solid #CCDFEA`,
                borderTopColor: isVuca ? '#F97316' : ACCENT,
                borderRadius: '50%', animation: 'spin 0.8s linear infinite',
                margin: '0 auto 24px',
              }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#1B2A3D', marginBottom: 8 }}>
                Running {selectedFramework} Analysis
              </div>
              {job?.currentStep && (
                <div style={{ color: '#6B7280', fontSize: 13, marginBottom: 16 }}>{job.currentStep}</div>
              )}
              {job?.progress != null && (
                <div style={{ background: '#F3F8FA', borderRadius: 6, height: 6, overflow: 'hidden' }}>
                  <div style={{
                    width: `${job.progress}%`, height: '100%',
                    background: isVuca
                      ? 'linear-gradient(90deg, #F97316, #FB923C)'
                      : `linear-gradient(90deg, ${ACCENT}, #A78BFA)`,
                    transition: 'width 0.5s ease',
                  }} />
                </div>
              )}
            </div>
            {isStuck && <StuckJobBanner onRetry={retryJob} />}
            <KillSwitchButton onCancel={() => { cancelJob(); setStep('input'); }} />
          </div>
        )}

        {/* ── RESULTS STEP ── */}
        {step === 'results' && activeJob && (
          isVucaResults
            ? <VucaResultsView job={activeJob} onReset={handleReset} />
            : (
              <div>
                {/* Results header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                  <div>
                    <h2 style={{ color: '#1B2A3D', fontSize: 22, fontWeight: 700, margin: 0 }}>
                      {activeJob.framework} — {activeJob.industryOrSegment}
                    </h2>
                  </div>
                  <button onClick={handleReset} style={{
                    padding: '10px 22px', borderRadius: 8, flexShrink: 0,
                    border: `1px solid ${ACCENT}`, background: 'transparent',
                    color: ACCENT, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  }}>
                    New Analysis
                  </button>
                </div>

                {/* Executive Summary */}
                {activeJob.frameworkSummary && (
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(230,57,70,0.08), rgba(184,28,39,0.05))',
                    border: '1px solid rgba(230,57,70,0.25)', borderRadius: 12,
                    padding: '20px 24px', marginBottom: 28,
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: 1, marginBottom: 8 }}>
                      EXECUTIVE SUMMARY
                    </div>
                    <p style={{ color: '#1B2A3D', fontSize: 14, lineHeight: 1.7, margin: 0 }}>
                      {activeJob.frameworkSummary}
                    </p>
                  </div>
                )}

                {/* Dimension cards */}
                {Object.entries(groupedDimensions).map(([dimName, rows]) => (
                  <div key={dimName} style={{ marginBottom: 20 }}>
                    <button
                      onClick={() => setExpandedDim(expandedDim === dimName ? null : dimName)}
                      style={{
                        width: '100%', textAlign: 'left', padding: '14px 20px',
                        background: '#F3F8FA',
                        border: '1px solid #CCDFEA', borderRadius: expandedDim === dimName ? '12px 12px 0 0' : 12,
                        cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{
                          width: 32, height: 32, borderRadius: 8,
                          background: `${ACCENT}22`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 14, fontWeight: 700, color: ACCENT,
                        }}>
                          {rows.length}
                        </span>
                        <span style={{ color: '#1B2A3D', fontSize: 15, fontWeight: 700 }}>{dimName}</span>
                      </div>
                      <span style={{ color: '#6B7280', fontSize: 18, transform: expandedDim === dimName ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                        ▾
                      </span>
                    </button>

                    {expandedDim === dimName && (
                      <div style={{
                        border: '1px solid #CCDFEA', borderTop: 'none',
                        borderRadius: '0 0 12px 12px', overflow: 'hidden',
                      }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, tableLayout: 'fixed' }}>
                          <colgroup>
                            {['14%', '42%', '36%', '8%'].map((w, ci) => <col key={ci} style={{ width: w }} />)}
                          </colgroup>
                          <thead>
                            <tr style={{ background: '#F3F8FA' }}>
                              {['Element', 'Analysis', 'Strategic Implication', 'Priority'].map((h) => (
                                <th key={h} style={{
                                  padding: '10px 14px', color: '#6B7280',
                                  fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
                                  textAlign: 'left', overflowWrap: 'break-word', wordBreak: 'break-word',
                                  whiteSpace: 'normal', verticalAlign: 'top',
                                }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {rows.map((row, i) => {
                              const cellBase: React.CSSProperties = {
                                padding: '14px', overflowWrap: 'break-word', wordBreak: 'break-word',
                                whiteSpace: 'normal', verticalAlign: 'top', lineHeight: 1.6,
                              };
                              return (
                                <tr key={i} style={{ borderBottom: '1px solid #E0ECF1' }}>
                                  <td style={{ ...cellBase, color: '#1B2A3D', fontWeight: 600 }}>{row.element}</td>
                                  <td style={{ ...cellBase, color: '#374B5C', fontSize: 13 }}>{row.analysis}</td>
                                  <td style={{ ...cellBase, color: '#6B7280', fontSize: 12 }}>{row.strategicImplication}</td>
                                  <td style={{ ...cellBase }}>
                                    <span style={{
                                      padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700,
                                      background: `${PRIORITY_COLORS[row.priority] || '#666'}22`,
                                      color: PRIORITY_COLORS[row.priority] || '#999',
                                    }}>
                                      {row.priority}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}

                {expandedDim === null && Object.keys(groupedDimensions).length > 0 && (
                  <div style={{ textAlign: 'center', marginBottom: 20 }}>
                    <button
                      onClick={() => setExpandedDim(Object.keys(groupedDimensions)[0])}
                      style={{
                        padding: '8px 20px', borderRadius: 8,
                        border: '1px solid #CCDFEA', background: 'transparent',
                        color: '#4A6274', fontSize: 12, cursor: 'pointer',
                      }}
                    >
                      Click any dimension above to expand details
                    </button>
                  </div>
                )}

                {/* Strategic Recommendations */}
                {activeJob.strategicRecommendations?.length > 0 && (
                  <div style={{
                    background: 'linear-gradient(135deg, #0c3649, #12516E)',
                    border: '1px solid #CCDFEA', borderRadius: 12, padding: '24px', marginTop: 28,
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: 1, marginBottom: 14 }}>
                      STRATEGIC RECOMMENDATIONS
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {activeJob.strategicRecommendations.map((rec: string, i: number) => (
                        <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                          <span style={{
                            minWidth: 24, height: 24, borderRadius: 6,
                            background: `${ACCENT}22`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 12, fontWeight: 700, color: ACCENT,
                          }}>{i + 1}</span>
                          <p style={{ color: '#1B2A3D', fontSize: 14, lineHeight: 1.6, margin: 0 }}>{rec}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
        )}
      </div>
    </div>
  );
}
