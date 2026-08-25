'use client';
import React, { useState, useRef, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { SpendResult, SpendLineItem, SpendBreakdownNode, SpendEmergingTechNode } from '@ai-insights/types';
import { API_ENDPOINTS } from '@/lib/config';
import ModuleIcon from '@/components/shared/ModuleIcon';
import HistoryDrawer from '@/components/shared/HistoryDrawer';
import { loadHistory, saveToHistory, loadEntryById, popPendingRestore, HistoryEntry } from '@/lib/history';
import { normalizeSpendResult } from '@/lib/spendLegacyAdapter';

const ACCENT = '#3491E8';
const DS_RED = '#E63946';
const GOLD = '#F59E0B';

// Must match SPEND_CALCULATOR_INDUSTRIES in ai-insights-api/src/services/claudeAI.ts exactly.
const INDUSTRY_OPTIONS = [
  'Aerospace & Defence', 'Agriculture', 'Automotive', 'Business Services / Professional Services',
  'Construction', 'Consumer Products', 'Consumer Services', 'Ecommerce', 'Education',
  'Energy (Oil & Gas)', 'Financial Markets / Capital Markets / Investments', 'Healthcare Insurance (Payers)',
  'Healthcare Providers', 'High Tech / Technology', 'Hospitality / Travel',
  'Industrial Manufacturing – Discrete', 'Industrial Manufacturing – Process', 'IT Hardware',
  'IT Services', 'Life Insurance', 'Media & Entertainment', 'Medical Devices',
  'Mineral / Mining / Natural Resources', 'Non Profit / NGO', 'P&C Insurance',
  'Pharmaceuticals / Life Sciences', 'Public Sector & Government', 'Real Estate', 'Reinsurance',
  'Retail', 'Retail Banking / Commercial Banking', 'Software', 'Supply Chain / Logistics',
  'Telecommunications', 'Transportation', 'Utilities', 'Wholesale / Distribution',
];

const LINE_DEFS: { key: 'itSpendDisclosed' | 'rdSpendDisclosed' | 'aiSpendDisclosed'; label: string }[] = [
  { key: 'itSpendDisclosed', label: 'IT Spend / Budget' },
  { key: 'rdSpendDisclosed', label: 'R&D Spend / Budget' },
  { key: 'aiSpendDisclosed', label: 'AI Spend / Budget' },
];

function SpendCard({ label, item }: { label: string; item?: SpendLineItem }) {
  const found = !!item?.found;
  return (
    <div style={{ background: '#F3F8FA', border: '1px solid #CCDFEA', borderRadius: 12, padding: '20px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: '#5A6E7A', textTransform: 'uppercase' }}>{label}</div>
        {found ? (
          <span style={{ fontSize: 11, fontWeight: 700, color: '#10B981', background: 'rgba(16,185,129,0.1)', padding: '3px 10px', borderRadius: 12 }}>Disclosed</span>
        ) : (
          <span style={{ fontSize: 11, fontWeight: 700, color: '#8A9DAD', background: 'rgba(138,157,173,0.12)', padding: '3px 10px', borderRadius: 12 }}>Not Disclosed</span>
        )}
      </div>

      {found ? (
        <>
          <div style={{ fontSize: 30, fontWeight: 900, color: '#1B2A3D', letterSpacing: -0.5, marginBottom: 4 }}>
            {item?.value || 'N/A'}
          </div>
          {item?.fiscalYear && (
            <div style={{ fontSize: 12, color: '#8A9DAD', marginBottom: 10 }}>{item.fiscalYear}</div>
          )}
          {item?.sourceType && (
            <div style={{ fontSize: 12, fontWeight: 600, color: ACCENT, marginBottom: 6 }}>Source: {item.sourceType}</div>
          )}
        </>
      ) : (
        <div style={{ fontSize: 20, fontWeight: 700, color: '#8A9DAD', marginBottom: 10 }}>Not publicly disclosed</div>
      )}

      {item?.sourceContext && (
        <div style={{ fontSize: 13, color: '#5A6E7A', lineHeight: 1.5, borderTop: '1px solid #CCDFEA', paddingTop: 10, marginTop: 4 }}>
          {item.sourceContext}
        </div>
      )}
    </div>
  );
}

// Rounds/formats a USD-million figure into the most readable unit: $K below $1M,
// $M (1 decimal below $10M, whole number above) between $1M and $1B, $B above $1B.
function fmtM(usdMillion: number): string {
  const sign = usdMillion < 0 ? '-' : '';
  const abs = Math.abs(usdMillion);
  if (abs >= 1000) return `${sign}$${(abs / 1000).toFixed(2)}B`;
  if (abs >= 10) return `${sign}$${abs.toFixed(0)}M`;
  if (abs >= 1) return `${sign}$${abs.toFixed(1)}M`;
  return `${sign}$${(abs * 1000).toFixed(0)}K`;
}

// Generic recursive renderer for SpendBreakdownNode[] — handles both the
// nested IT tree (L1 -> L2 -> L3, via children[]) and the flat ERD list
// (no children, everything at depth 0) with the same component, since a
// flat list is just a tree with no children arrays.
function BreakdownTree({ nodes, depth = 0 }: { nodes: SpendBreakdownNode[]; depth?: number }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: depth === 0 ? 8 : 2 }}>
      {nodes.map((node) => {
        const hasChildren = !!node.children && node.children.length > 0;
        const isOpen = expanded.has(node.id);
        return (
          <div key={node.id}>
            <div
              onClick={hasChildren ? () => setExpanded((prev) => { const next = new Set(prev); next.has(node.id) ? next.delete(node.id) : next.add(node.id); return next; }) : undefined}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: depth === 0 ? '12px 16px' : '6px 16px',
                marginLeft: depth * 16,
                background: depth === 0 ? '#F3F8FA' : 'transparent',
                border: depth === 0 ? '1px solid #CCDFEA' : 'none',
                borderRadius: depth === 0 ? 8 : 0,
                cursor: hasChildren ? 'pointer' : 'default',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {hasChildren && <span style={{ fontSize: 12, color: '#8A9DAD', transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>&#8250;</span>}
                <span style={{ fontSize: depth === 0 ? 14 : 13, fontWeight: depth === 0 ? 600 : 400, color: depth === 0 ? '#1B2A3D' : '#5A6E7A' }}>{node.name}</span>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ fontSize: depth === 0 ? 14 : 13, fontWeight: depth === 0 ? 700 : 500, color: '#1B2A3D' }}>{fmtM(node.value)}</span>
                <span style={{ fontSize: 12, color: '#8A9DAD', minWidth: 40, textAlign: 'right' }}>{node.percentage.toFixed(1)}%</span>
              </div>
            </div>
            {hasChildren && isOpen && (
              <div style={{ padding: depth === 0 ? '4px 0 4px 8px' : 0 }}>
                <BreakdownTree nodes={node.children!} depth={depth + 1} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const CHART_COLORS = ['#3491E8', '#F59E0B', '#10B981', '#7C3AED', '#E63946', '#0EA5E9', '#EAB308', '#14B8A6'];

function BreakdownDonut({ data }: { data: { name: string; value: number }[] }) {
  const positive = data.filter((d) => d.value > 0);
  if (positive.length === 0) return null;
  return (
    <div style={{ background: '#F3F8FA', border: '1px solid #CCDFEA', borderRadius: 12, padding: '16px 8px', height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={positive} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={1}>
            {positive.map((entry, i) => (
              <Cell key={entry.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(v: number) => fmtM(v)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// dataKey selects which field the line plots — "itSpend" for ItSpendTrendPoint[],
// "erdSpend" for ErdSpendTrendPoint[] — since the two trend shapes use different
// field names for the $ series (per the reference JSON formats).
function TrendChart({ data, dataKey }: { data: Array<{ year: number }>; dataKey: string }) {
  if (!data || data.length === 0) return null;
  return (
    <div style={{ background: '#F3F8FA', border: '1px solid #CCDFEA', borderRadius: 12, padding: '16px 8px', height: 220 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#CCDFEA" />
          <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#8A9DAD' }} />
          <YAxis tick={{ fontSize: 11, fill: '#8A9DAD' }} tickFormatter={(v) => fmtM(v)} width={60} />
          <Tooltip formatter={(v: number) => fmtM(v)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
          <Line type="monotone" dataKey={dataKey} stroke={ACCENT} strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <div style={{ fontSize: 16, fontWeight: 700, color: '#1B2A3D', marginTop: 8, marginBottom: 2 }}>{title}</div>;
}

export default function SpendPage() {
  const [companyName, setCompanyName] = useState('');
  const [companyDomain, setCompanyDomain] = useState('');
  const [geography, setGeography] = useState('');
  const [industry, setIndustry] = useState('');
  const [revenue, setRevenue] = useState('');
  const [job, setJob] = useState<SpendResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [historyCount, setHistoryCount] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => () => { esRef.current?.close(); }, []);

  useEffect(() => {
    setHistoryCount(loadHistory().length);
    const pendingId = popPendingRestore();
    if (pendingId) {
      const entry = loadEntryById(pendingId);
      if (entry?.moduleType === 'spend' && entry.spendData) {
        restoreEntry(entry);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function restoreEntry(entry: HistoryEntry) {
    if (entry.moduleType !== 'spend' || !entry.spendData) return;
    // Older saved entries may predate the itSpend/erdSpend payload
    // restructure — reshape them into the current format so they still
    // render instead of showing blank breakdown sections.
    const normalized = normalizeSpendResult(entry.spendData);
    setCompanyName(entry.targetCompany);
    setCompanyDomain(entry.companyDomain ?? '');
    setGeography(normalized.geography ?? '');
    setIndustry(normalized.resolvedIndustry ?? '');
    setRevenue(normalized.revenueUsdMillion != null ? String(normalized.revenueUsdMillion) : '');
    setJob(normalized);
    setError(null);
  }

  const isFormValid = !!companyName.trim() && !!companyDomain.trim() && !!geography.trim() && !!industry && !!revenue.trim() && Number(revenue) > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isFormValid) return;
    setError(null);
    setJob(null);
    esRef.current?.close();

    try {
      const res = await fetch(API_ENDPOINTS.spend, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: companyName.trim(),
          companyDomain: companyDomain.trim(),
          geography: geography.trim(),
          industry,
          revenueUsdMillion: Number(revenue),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error || `Server error ${res.status}`);
      }
      const { jobId } = await res.json() as { jobId: string };

      const es = new EventSource(API_ENDPOINTS.spendStream(jobId));
      esRef.current = es;

      es.addEventListener('progress', (ev) => {
        const data = JSON.parse((ev as MessageEvent).data) as Partial<SpendResult>;
        setJob((prev) => ({ ...(prev ?? {} as SpendResult), ...data }));
      });
      es.addEventListener('result', (ev) => {
        const data = JSON.parse((ev as MessageEvent).data) as SpendResult;
        setJob(data);
        es.close();
        if (data.status === 'complete') {
          saveToHistory({
            moduleType: 'spend',
            targetCompany: companyName.trim(),
            completedAt: new Date().toISOString(),
            companyDomain: companyDomain.trim() || undefined,
            spendData: data,
          });
          setHistoryCount(loadHistory().length);
        }
      });
      es.addEventListener('error', (ev) => {
        const me = ev as MessageEvent;
        if (me.data) {
          try {
            const d = JSON.parse(me.data) as { error?: string };
            setError(d.error || 'Lookup failed');
            es.close();
          } catch { /* ignore */ }
        }
      });
      es.onerror = () => {
        // A dropped connection (not a job-reported 'error' event) previously
        // just closed the stream silently — isRunning is derived from
        // job.status, which was never updated, so the UI stayed stuck on
        // the in-progress view forever with no way to tell the job had
        // actually stopped.
        es.close();
        setError('Connection lost while looking up spend data. Please try again.');
        setJob((prev) => (prev ? { ...prev, status: 'error' } : prev));
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }

  function handleReset() {
    esRef.current?.close();
    setJob(null);
    setError(null);
    setCompanyName('');
    setCompanyDomain('');
    setGeography('');
    setIndustry('');
    setRevenue('');
  }

  const isRunning = job && job.status !== 'complete' && job.status !== 'error';
  const isDone = job?.status === 'complete';

  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', display: 'flex', flexDirection: 'column' }}>
      {showHistory && (
        <HistoryDrawer
          currentModule="spend"
          onSelectSameModule={restoreEntry}
          onClose={() => setShowHistory(false)}
        />
      )}

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0c3649, #12516E)', borderBottom: '1px solid #CCDFEA', padding: '16px 32px', flexShrink: 0 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 16 }}>
          <a href="/" style={{ color: 'rgba(255,255,255,0.65)', textDecoration: 'none', fontSize: 13 }}>← Home</a>
          <div style={{ width: 1, height: 16, background: '#CCDFEA' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, color: ACCENT, marginBottom: 3 }}>REFRACTONE</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ModuleIcon id="spend" size={20} />
              <span style={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF' }}>Spend</span>
            </div>
          </div>
          <button
            onClick={() => { setHistoryCount(loadHistory().length); setShowHistory(true); }}
            style={{
              background: 'rgba(52,145,232,0.1)', border: '1px solid rgba(52,145,232,0.3)',
              color: ACCENT, borderRadius: 8, padding: '7px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            History {historyCount > 0 && `(${historyCount})`}
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, maxWidth: isDone ? 800 : 700, margin: '0 auto', width: '100%', padding: '40px 24px' }}>

        {/* Input form */}
        {!isDone && (
          <div style={{ background: 'linear-gradient(135deg, #0c3649, #12516E)', border: '1px solid #CCDFEA', borderRadius: 12, padding: 32 }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: GOLD, textTransform: 'uppercase', marginBottom: 6 }}>IT / R&amp;D / AI Spend Lookup</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#FFFFFF', marginBottom: 8 }}>Corporate Spend Intelligence</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', maxWidth: 480, margin: '0 auto' }}>
                Uses publicly disclosed IT, R&amp;D, and AI budget figures from company filings or top-tier analyst firms (Gartner, IDC, Forrester, Everest Group) when available, with a full category breakdown calculated from that base value. Falls back to an industry-benchmark estimate when a figure isn&apos;t disclosed. All figures in USD Million.
              </div>
            </div>

            {error && (
              <div style={{ background: 'rgba(230,57,70,0.1)', border: '1px solid rgba(230,57,70,0.3)', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: DS_RED }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.65)', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>COMPANY NAME *</label>
                <input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Microsoft, Infosys, Banco Bradesco"
                  disabled={!!isRunning}
                  style={{ width: '100%', padding: '12px 14px', background: '#FFFFFF', border: '1px solid #CCDFEA', borderRadius: 8, color: '#1B2A3D', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.65)', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>COMPANY DOMAIN *</label>
                <input
                  value={companyDomain}
                  onChange={(e) => setCompanyDomain(e.target.value)}
                  placeholder="e.g. microsoft.com, infosys.com"
                  disabled={!!isRunning}
                  required
                  style={{ width: '100%', padding: '12px 14px', background: '#FFFFFF', border: '1px solid #CCDFEA', borderRadius: 8, color: '#1B2A3D', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.65)', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>GEOGRAPHY / HQ *</label>
                <input
                  value={geography}
                  onChange={(e) => setGeography(e.target.value)}
                  placeholder="e.g. United States, India"
                  disabled={!!isRunning}
                  required
                  style={{ width: '100%', padding: '12px 14px', background: '#FFFFFF', border: '1px solid #CCDFEA', borderRadius: 8, color: '#1B2A3D', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.65)', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>INDUSTRY *</label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  disabled={!!isRunning}
                  required
                  style={{ width: '100%', padding: '12px 14px', background: '#FFFFFF', border: '1px solid #CCDFEA', borderRadius: 8, color: '#1B2A3D', fontSize: 14, outline: 'none', boxSizing: 'border-box', appearance: 'none', cursor: isRunning ? 'default' : 'pointer' }}
                >
                  <option value="">Select industry</option>
                  {INDUSTRY_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.65)', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>ANNUAL REVENUE (USD MILLION) *</label>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={revenue}
                  onChange={(e) => setRevenue(e.target.value)}
                  placeholder="e.g. 5000 for $5B revenue"
                  disabled={!!isRunning}
                  required
                  style={{ width: '100%', padding: '12px 14px', background: '#FFFFFF', border: '1px solid #CCDFEA', borderRadius: 8, color: '#1B2A3D', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              {/* Progress */}
              {isRunning && job && (
                <div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginBottom: 6 }}>{job.currentStep}</div>
                  <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: GOLD, width: `${job.progress}%`, transition: 'width 0.4s ease', borderRadius: 4 }} />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={!isFormValid || !!isRunning}
                style={{
                  padding: '14px', borderRadius: 8, border: 'none',
                  background: isFormValid && !isRunning ? `linear-gradient(135deg, ${GOLD}, #D97706)` : 'rgba(245,158,11,0.3)',
                  color: '#fff', fontSize: 14, fontWeight: 700,
                  cursor: isFormValid && !isRunning ? 'pointer' : 'not-allowed',
                  letterSpacing: 0.5,
                }}
              >
                {isRunning ? 'Researching…' : 'Get Spend Breakdown →'}
              </button>
            </form>
          </div>
        )}

        {/* Result cards */}
        {isDone && job && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ textAlign: 'center', marginBottom: 4 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#1B2A3D' }}>{job.companyName}</div>
              {job.geography && <div style={{ fontSize: 13, color: '#8A9DAD' }}>{job.geography}</div>}
            </div>

            {job.resolvedIndustry && (
              <div style={{ fontSize: 12, color: '#8A9DAD', textAlign: 'center' }}>
                Classified as <strong style={{ color: '#5A6E7A' }}>{job.resolvedIndustry}</strong>
                {job.resolvedRegion && <> · Region: {job.resolvedRegion}</>}
              </div>
            )}

            {LINE_DEFS.map((def) => (
              <SpendCard key={def.key} label={def.label} item={job[def.key]} />
            ))}

            <div style={{ fontSize: 11, color: '#8A9DAD', textAlign: 'center', padding: '0 8px' }}>
              Disclosed figures are used when found; otherwise the industry-benchmark formula estimates the base value. All figures in USD Million.
            </div>

            {job.itSpend && job.itSpend.itBreakdown.length > 0 && (
              <>
                <SectionHeader title="IT Spend — Category Breakdown" />
                <div style={{ fontSize: 12, color: '#8A9DAD', marginBottom: 4 }}>
                  Base value: {fmtM(job.itSpend.itBreakdown.reduce((s, n) => s + n.value, 0))} {job.itSpendDisclosed?.found ? '(disclosed)' : '(industry benchmark estimate)'}
                  {' · CAGR: '}{job.itSpend.itCAGR_Historical.toFixed(1)}% historical / {job.itSpend.itCAGR_Forecast.toFixed(1)}% forecast
                </div>
                {job.itSpend.trends.length > 0 && (
                  <>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#5A6E7A', marginTop: 4 }}>IT Spend Trend (2022-2030)</div>
                    <TrendChart data={job.itSpend.trends} dataKey="itSpend" />
                  </>
                )}
                <div style={{ fontSize: 12, fontWeight: 600, color: '#5A6E7A', marginTop: 4 }}>IT Spend Breakdown by Category</div>
                <BreakdownDonut data={job.itSpend.itBreakdown.map((n: SpendBreakdownNode) => ({ name: n.name, value: n.value }))} />
                <BreakdownTree nodes={job.itSpend.itBreakdown} />
              </>
            )}

            {job.itSpend && job.itSpend.emergingTech.length > 0 && (
              <>
                <SectionHeader title="Emerging Tech Spend — Category Breakdown" />
                <div style={{ fontSize: 12, color: '#8A9DAD', marginBottom: 4 }}>
                  Total: {fmtM(job.itSpend.emergingTech.reduce((s, r) => s + r.value, 0))}
                  {job.aiSpendDisclosed?.found && ' · AI line uses disclosed value'}
                  {!job.aiSpendDisclosed?.found && job.erdSpend && ' · AI line uses ERD AI/ML & Data Engineering value'}
                  {' · Blockchain line uses IT Digital Enterprise value'}
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#5A6E7A', marginTop: 4 }}>Emerging Tech Breakdown</div>
                <BreakdownDonut data={job.itSpend.emergingTech.map((r: SpendEmergingTechNode) => ({ name: r.name, value: r.value }))} />
                <BreakdownTree nodes={job.itSpend.emergingTech.map((r: SpendEmergingTechNode) => ({ id: r.name, name: r.name, level: 0, value: r.value, percentage: r.adjTotal }))} />
              </>
            )}

            {job.erdSpend && job.erdSpend.erdBreakdown.length > 0 && (
              <>
                <SectionHeader title="ER&D Spend — Category Breakdown" />
                <div style={{ fontSize: 12, color: '#8A9DAD', marginBottom: 4 }}>
                  Base value: {fmtM(job.erdSpend.erdBreakdown.reduce((s, n) => s + n.value, 0))} {job.rdSpendDisclosed?.found ? '(disclosed)' : '(industry benchmark estimate)'}
                  {' · CAGR: '}{job.erdSpend.erdCAGR_Historical.toFixed(1)}% historical / {job.erdSpend.erdCAGR_Forecast.toFixed(1)}% forecast
                </div>
                {job.erdSpend.trends.length > 0 && (
                  <>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#5A6E7A', marginTop: 4 }}>ER&amp;D Spend Trend (2022-2030)</div>
                    <TrendChart data={job.erdSpend.trends} dataKey="erdSpend" />
                  </>
                )}
                <div style={{ fontSize: 12, fontWeight: 600, color: '#5A6E7A', marginTop: 4 }}>ER&amp;D Spend Breakdown by Category</div>
                <BreakdownDonut data={job.erdSpend.erdBreakdown.map((n: SpendBreakdownNode) => ({ name: n.name, value: n.value }))} />
                <BreakdownTree nodes={job.erdSpend.erdBreakdown} />
              </>
            )}

            {job.resolvedIndustry && !job.erdSpend && (
              <div style={{ fontSize: 12, color: '#8A9DAD', textAlign: 'center', fontStyle: 'italic' }}>
                ER&D Spend benchmark not available for {job.resolvedIndustry}.
              </div>
            )}

            <button
              onClick={handleReset}
              style={{ padding: '12px', borderRadius: 8, border: '1px solid #CCDFEA', background: 'transparent', color: '#5A6E7A', fontSize: 14, cursor: 'pointer' }}
            >
              ← New Lookup
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
