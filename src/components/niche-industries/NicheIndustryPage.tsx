'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { NicheIndustryJob, NicheTopicRow, NicheOutputMode, NicheSegmentationDepth } from '@/lib/types';
import {
  loadHistory,
  saveToHistory,
  loadEntryById,
  popPendingRestore,
  HistoryEntry,
} from '@/lib/history';
import HistoryDrawer from '@/components/shared/HistoryDrawer';
import ModuleIcon from '@/components/shared/ModuleIcon';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').trim();
const ACCENT = '#059669';

const GEOGRAPHY_OPTIONS = [
  'Global', 'North America', 'Europe', 'Asia Pacific', 'Latin America',
  'Middle East & Africa', 'United States', 'China', 'India', 'Japan',
  'Germany', 'United Kingdom', 'Southeast Asia',
];

const CAGR_OPTIONS = [
  { value: '5', label: '5%+' },
  { value: '8', label: '8%+' },
  { value: '12', label: '12%+' },
  { value: '18', label: '18%+' },
];

const OUTPUT_MODE_OPTIONS: { value: NicheOutputMode; label: string }[] = [
  { value: 'both', label: 'Both (White Space + Bestseller)' },
  { value: 'white_space', label: 'White Space Only' },
  { value: 'bestseller', label: 'Bestseller Only' },
];

const TOPICS_OPTIONS = [8, 12, 16];

const DEPTH_OPTIONS: { value: NicheSegmentationDepth; label: string }[] = [
  { value: 'standard', label: 'Standard' },
  { value: 'deep', label: 'Deep' },
];

const VERDICT_COLORS: Record<string, string> = {
  'strong buy': '#22C55E',
  'pursue': '#3491E8',
  'monitor': '#F59E0B',
};

const COMPETITION_COLORS: Record<string, string> = {
  none: '#22C55E',
  low: '#3491E8',
  moderate: '#F59E0B',
  high: '#EF4444',
};

const TYPE_COLORS: Record<string, string> = {
  white_space: '#8B5CF6',
  bestseller: '#3491E8',
};

export default function NicheIndustryPage() {
  const [step, setStep] = useState<'input' | 'analysing' | 'results'>('input');
  const [industryVertical, setIndustryVertical] = useState('');
  const [subSegmentOrTheme, setSubSegmentOrTheme] = useState('');
  const [geography, setGeography] = useState('Global');
  const [minimumCAGR, setMinimumCAGR] = useState('8');
  const [outputMode, setOutputMode] = useState<NicheOutputMode>('both');
  const [additionalContext, setAdditionalContext] = useState('');
  const [numberOfTopics, setNumberOfTopics] = useState(12);
  const [segmentationDepth, setSegmentationDepth] = useState<NicheSegmentationDepth>('standard');
  const [job, setJob] = useState<NicheIndustryJob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [historyCount, setHistoryCount] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    setHistoryCount(loadHistory().length);
    const pendingId = popPendingRestore();
    if (pendingId) {
      const entry = loadEntryById(pendingId);
      if (entry && entry.moduleType === 'niche-industries') restoreEntry(entry);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => { eventSourceRef.current?.close(); };
  }, []);

  const restoreEntry = useCallback((entry: HistoryEntry) => {
    if (!entry.nicheTopics) return;
    setIndustryVertical(entry.nicheIndustryVertical || entry.targetCompany);
    setJob({
      jobId: entry.id,
      status: 'complete',
      progress: 100,
      topics: entry.nicheTopics,
      createdAt: entry.completedAt,
      completedAt: entry.completedAt,
    });
    setStep('results');
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!industryVertical.trim()) return;
    setError(null);
    setStep('analysing');

    try {
      const res = await fetch(`${API_BASE}/api/niche-industries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          industryVertical: industryVertical.trim(),
          subSegmentOrTheme: subSegmentOrTheme.trim() || undefined,
          geography,
          minimumCAGR,
          outputMode,
          additionalContext: additionalContext.trim() || undefined,
          numberOfTopics,
          segmentationDepth,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error || `Server error ${res.status}`);
      }

      const { jobId } = (await res.json()) as { jobId: string };
      const es = new EventSource(`${API_BASE}/api/niche-industries/${jobId}/stream`);
      eventSourceRef.current = es;

      es.addEventListener('progress', (e) => {
        const data = JSON.parse(e.data) as Partial<NicheIndustryJob>;
        setJob((prev) => ({ ...(prev ?? {} as NicheIndustryJob), ...data }));
      });

      es.addEventListener('result', (e) => {
        const data = JSON.parse(e.data) as NicheIndustryJob;
        setJob(data);
        setStep('results');
        es.close();
        saveToHistory({
          moduleType: 'niche-industries',
          targetCompany: industryVertical.trim(),
          completedAt: data.completedAt || new Date().toISOString(),
          nicheIndustryVertical: industryVertical.trim(),
          nicheTopics: data.topics,
        });
        setHistoryCount(loadHistory().length);
      });

      es.addEventListener('error', (e) => {
        let msg = 'Analysis failed';
        try {
          const data = JSON.parse((e as MessageEvent).data) as { error?: string };
          if (data.error) msg = data.error;
        } catch { /* ignore */ }
        setError(msg);
        setStep('input');
        es.close();
      });

      es.onerror = () => { setError('Connection lost'); setStep('input'); es.close(); };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setStep('input');
    }
  }

  function handleReset() {
    eventSourceRef.current?.close();
    setStep('input');
    setJob(null);
    setError(null);
  }

  const topics = job?.topics || [];

  // Summary metrics
  const avgCagr = topics.length > 0
    ? (topics.reduce((sum, t) => sum + parseFloat(t.estimated_cagr) || 0, 0) / topics.length).toFixed(1)
    : '0';
  const strongBuyCount = topics.filter((t) => t.verdict === 'strong buy').length;
  const avgWhiteSpace = topics.length > 0
    ? (topics.reduce((sum, t) => sum + t.white_space_score, 0) / topics.length).toFixed(1)
    : '0';

  const selectStyle: React.CSSProperties = {
    width: '100%', background: '#0a1929', border: '1px solid #1e4a68', borderRadius: 8,
    color: '#E8EDF5', padding: '10px 12px', fontSize: 14, outline: 'none',
    appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%237eaabf' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center',
    cursor: 'pointer',
  };

  const labelStyle: React.CSSProperties = {
    color: '#a0c4d8', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6,
  };

  return (
    <div style={{ minHeight: '100vh', background: '#080f16', display: 'flex', flexDirection: 'column' }}>
      {showHistory && (
        <HistoryDrawer
          currentModule="niche-industries"
          onSelectSameModule={restoreEntry}
          onClose={() => setShowHistory(false)}
        />
      )}

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0c3649 0%, #0a2233 100%)',
        borderBottom: '1px solid #1e4a68',
        padding: '16px 32px',
        flexShrink: 0,
      }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 16 }}>
          <a href="/" style={{ color: '#7eaabf', textDecoration: 'none', fontSize: 13 }}>← Home</a>
          <div style={{ width: 1, height: 16, background: '#1e4a68' }} />
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: ACCENT, letterSpacing: 2, marginBottom: 3 }}>REFRACTONE</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ModuleIcon id="niche-industries" size={20} />
              <span style={{ fontSize: 18, fontWeight: 800, color: '#E8EDF5' }}>High Growth Niche Industries</span>
            </div>
          </div>
          <button
            onClick={() => setShowHistory(true)}
            style={{
              marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(5,150,105,0.1)', border: '1px solid rgba(5,150,105,0.25)',
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
          <div style={{ maxWidth: 700, margin: '48px auto 0' }}>
            {error && (
              <div style={{
                background: 'rgba(230,57,70,0.1)', border: '1px solid rgba(230,57,70,0.3)',
                borderRadius: 8, padding: '12px 16px', marginBottom: 24, fontSize: 13, color: '#ff6b75',
              }}>{error}</div>
            )}
            <div style={{
              background: 'linear-gradient(135deg, #0c3649, #0a2233)',
              border: '1px solid #1e4a68', borderRadius: 12, padding: '32px',
            }}>
              <h2 style={{ color: '#E8EDF5', fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
                Discover High Growth Niche Industries
              </h2>
              <p style={{ color: '#7eaabf', fontSize: 13, marginBottom: 24 }}>
                Identify niche, high-growth market report topics in the style of MarketsandMarkets,
                GlobalData, Grand View Research, and other leading research firms.
              </p>
              <form onSubmit={handleSubmit}>
                {/* Industry Vertical */}
                <label style={{ display: 'block', marginBottom: 16 }}>
                  <span style={labelStyle}>Industry Vertical *</span>
                  <input
                    value={industryVertical}
                    onChange={(e) => setIndustryVertical(e.target.value)}
                    placeholder="e.g. Electric Vehicles, Digital Health, Sustainable Packaging..."
                    style={{
                      width: '100%', background: '#0a1929', border: '1px solid #1e4a68', borderRadius: 8,
                      color: '#E8EDF5', padding: '12px', fontSize: 14, outline: 'none',
                    }}
                  />
                </label>

                {/* Sub-Segment or Theme */}
                <label style={{ display: 'block', marginBottom: 16 }}>
                  <span style={labelStyle}>Sub-Segment or Theme (optional)</span>
                  <input
                    value={subSegmentOrTheme}
                    onChange={(e) => setSubSegmentOrTheme(e.target.value)}
                    placeholder="e.g. Battery Management Systems, Telemedicine Platforms..."
                    style={{
                      width: '100%', background: '#0a1929', border: '1px solid #1e4a68', borderRadius: 8,
                      color: '#E8EDF5', padding: '12px', fontSize: 14, outline: 'none',
                    }}
                  />
                </label>

                {/* 2-column grid for dropdowns */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  {/* Geography */}
                  <label>
                    <span style={labelStyle}>Geography</span>
                    <select value={geography} onChange={(e) => setGeography(e.target.value)} style={selectStyle}>
                      {GEOGRAPHY_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </label>

                  {/* Minimum CAGR */}
                  <label>
                    <span style={labelStyle}>Minimum CAGR Threshold</span>
                    <select value={minimumCAGR} onChange={(e) => setMinimumCAGR(e.target.value)} style={selectStyle}>
                      {CAGR_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </label>

                  {/* Output Mode */}
                  <label>
                    <span style={labelStyle}>Output Mode</span>
                    <select value={outputMode} onChange={(e) => setOutputMode(e.target.value as NicheOutputMode)} style={selectStyle}>
                      {OUTPUT_MODE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </label>

                  {/* Number of Topics */}
                  <label>
                    <span style={labelStyle}>Number of Topics</span>
                    <select value={numberOfTopics} onChange={(e) => setNumberOfTopics(Number(e.target.value))} style={selectStyle}>
                      {TOPICS_OPTIONS.map((n) => <option key={n} value={n}>{n} topics</option>)}
                    </select>
                  </label>
                </div>

                {/* Segmentation Depth */}
                <label style={{ display: 'block', marginBottom: 16 }}>
                  <span style={labelStyle}>Segmentation Depth</span>
                  <select value={segmentationDepth} onChange={(e) => setSegmentationDepth(e.target.value as NicheSegmentationDepth)} style={selectStyle}>
                    {DEPTH_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </label>

                {/* Additional Context */}
                <label style={{ display: 'block', marginBottom: 24 }}>
                  <span style={labelStyle}>Additional Context (optional)</span>
                  <textarea
                    value={additionalContext}
                    onChange={(e) => setAdditionalContext(e.target.value)}
                    rows={3}
                    placeholder="Any specific focus areas, technologies, or market dynamics to consider..."
                    style={{
                      width: '100%', background: '#0a1929', border: '1px solid #1e4a68', borderRadius: 8,
                      color: '#E8EDF5', padding: '12px', fontSize: 14, resize: 'vertical',
                      outline: 'none', fontFamily: 'inherit',
                    }}
                  />
                </label>

                <button
                  type="submit"
                  disabled={!industryVertical.trim()}
                  style={{
                    width: '100%', padding: '13px',
                    background: industryVertical.trim()
                      ? `linear-gradient(135deg, ${ACCENT}, #047857)`
                      : '#1e4a68',
                    border: 'none', borderRadius: 8,
                    color: '#fff', fontSize: 14, fontWeight: 700,
                    cursor: industryVertical.trim() ? 'pointer' : 'not-allowed',
                    opacity: industryVertical.trim() ? 1 : 0.5,
                  }}
                >
                  Discover Niche Topics →
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ── ANALYSING STEP ── */}
        {step === 'analysing' && (
          <div style={{ maxWidth: 580, margin: '48px auto 0' }}>
            <div style={{
              background: 'linear-gradient(135deg, #0c3649, #0a2233)',
              border: '1px solid #1e4a68', borderRadius: 12, padding: '36px 32px', textAlign: 'center',
            }}>
              <div style={{
                width: 48, height: 48,
                border: '3px solid rgba(30,74,104,0.4)', borderTopColor: ACCENT,
                borderRadius: '50%', animation: 'spin 0.8s linear infinite',
                margin: '0 auto 24px',
              }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#E8EDF5', marginBottom: 8 }}>
                Discovering Niche Industry Topics
              </div>
              {job?.currentStep && (
                <div style={{ color: '#7eaabf', fontSize: 13, marginBottom: 16 }}>{job.currentStep}</div>
              )}
              {job?.progress != null && (
                <div style={{ background: '#0a1929', borderRadius: 6, height: 6, overflow: 'hidden' }}>
                  <div style={{
                    width: `${job.progress}%`, height: '100%',
                    background: `linear-gradient(90deg, ${ACCENT}, #22C55E)`,
                    transition: 'width 0.5s ease',
                  }} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── RESULTS STEP ── */}
        {step === 'results' && job && (
          <div>
            {/* Results header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div>
                <h2 style={{ color: '#E8EDF5', fontSize: 22, fontWeight: 700, margin: 0 }}>
                  Niche Industry Topics
                </h2>
                <p style={{ color: '#7eaabf', fontSize: 13, margin: '4px 0 0' }}>
                  {industryVertical}{subSegmentOrTheme ? ` / ${subSegmentOrTheme}` : ''} — {geography}
                </p>
              </div>
              <button onClick={handleReset} style={{
                padding: '10px 22px', borderRadius: 8,
                border: `1px solid ${ACCENT}`, background: 'transparent',
                color: ACCENT, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}>
                New Analysis
              </button>
            </div>

            {/* Summary metric cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
              <MetricCard label="Avg. CAGR" value={`${avgCagr}%`} color="#22C55E" />
              <MetricCard label="Strong Buy Topics" value={String(strongBuyCount)} color="#3491E8" />
              <MetricCard label="Avg. White Space Score" value={`${avgWhiteSpace}/10`} color="#8B5CF6" />
            </div>

            {/* Results table */}
            <NicheTopicsTable rows={topics} />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Metric Card ─────────────────────────────────────────────────────────────

function MetricCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #0c3649, #0a2233)',
      border: '1px solid #1e4a68', borderRadius: 10, padding: '20px 24px',
    }}>
      <div style={{ color: '#7eaabf', fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ color, fontSize: 28, fontWeight: 800 }}>{value}</div>
    </div>
  );
}

// ── Shared cell style ───────────────────────────────────────────────────────

const CELL_BASE: React.CSSProperties = {
  padding: '14px 10px',
  overflowWrap: 'break-word',
  wordBreak: 'break-word',
  whiteSpace: 'normal',
  verticalAlign: 'top',
  lineHeight: 1.5,
};

// ── Topics Table ────────────────────────────────────────────────────────────

function NicheTopicsTable({ rows }: { rows: NicheTopicRow[] }) {
  if (!rows.length) {
    return <div style={{ color: '#7eaabf', textAlign: 'center', padding: 32 }}>No topics found.</div>;
  }

  // Column widths: Title 22%, CAGR 7%, Size 8%, WS Score 8%, Competition 8%, Verdict 8%, Rationale 39%
  const colWidths = ['22%', '7%', '8%', '8%', '8%', '8%', '39%'];
  const headers = ['Report Title', 'CAGR', 'Base Size', 'WS Score', 'Competition', 'Verdict', 'Rationale & Segmentation'];

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, tableLayout: 'fixed' }}>
        <colgroup>
          {colWidths.map((w, i) => <col key={i} style={{ width: w }} />)}
        </colgroup>
        <thead>
          <tr style={{ borderBottom: '2px solid #1e4a68' }}>
            {headers.map((h) => (
              <th key={h} style={{
                ...CELL_BASE, color: '#a0c4d8',
                fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #142d3e' }}>
              {/* Title + type pill */}
              <td style={{ ...CELL_BASE }}>
                <div style={{ color: '#E8EDF5', fontWeight: 600, marginBottom: 4 }}>{row.topic_title}</div>
                <span style={{
                  display: 'inline-block',
                  padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700,
                  background: `${TYPE_COLORS[row.type]}22`,
                  color: TYPE_COLORS[row.type],
                  border: `1px solid ${TYPE_COLORS[row.type]}44`,
                  textTransform: 'uppercase', letterSpacing: 0.5,
                }}>
                  {row.type === 'white_space' ? 'White Space' : 'Bestseller'}
                </span>
              </td>

              {/* CAGR */}
              <td style={{ ...CELL_BASE, color: '#22C55E', fontWeight: 700, fontSize: 14 }}>
                {row.estimated_cagr}
              </td>

              {/* Base Market Size */}
              <td style={{ ...CELL_BASE, color: '#7eaabf', fontSize: 12 }}>
                {row.base_market_size}
              </td>

              {/* White Space Score - visual bar */}
              <td style={{ ...CELL_BASE }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{
                    flex: 1, height: 6, background: '#0a1929', borderRadius: 3, overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${row.white_space_score * 10}%`, height: '100%',
                      background: row.white_space_score >= 7 ? '#22C55E'
                        : row.white_space_score >= 4 ? '#F59E0B' : '#EF4444',
                      borderRadius: 3,
                    }} />
                  </div>
                  <span style={{ color: '#E8EDF5', fontSize: 12, fontWeight: 600, minWidth: 20 }}>
                    {row.white_space_score}
                  </span>
                </div>
              </td>

              {/* Competition Level pill */}
              <td style={{ ...CELL_BASE }}>
                <span style={{
                  display: 'inline-block',
                  padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                  background: `${COMPETITION_COLORS[row.competition_level]}22`,
                  color: COMPETITION_COLORS[row.competition_level],
                  border: `1px solid ${COMPETITION_COLORS[row.competition_level]}44`,
                  textTransform: 'capitalize',
                }}>
                  {row.competition_level}
                </span>
              </td>

              {/* Verdict pill */}
              <td style={{ ...CELL_BASE }}>
                <span style={{
                  display: 'inline-block',
                  padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700,
                  background: `${VERDICT_COLORS[row.verdict]}22`,
                  color: VERDICT_COLORS[row.verdict],
                  border: `1px solid ${VERDICT_COLORS[row.verdict]}44`,
                  textTransform: 'uppercase', letterSpacing: 0.5,
                }}>
                  {row.verdict}
                </span>
              </td>

              {/* Rationale + Segmentation */}
              <td style={{ ...CELL_BASE, color: '#7eaabf', fontSize: 12 }}>
                <div style={{ marginBottom: 6 }}>{row.rationale}</div>
                {row.segmentation_axes && row.segmentation_axes.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {row.segmentation_axes.map((axis, j) => (
                      <span key={j} style={{
                        display: 'inline-block',
                        padding: '2px 8px', borderRadius: 6, fontSize: 10,
                        background: 'rgba(52,145,232,0.1)', border: '1px solid rgba(52,145,232,0.2)',
                        color: '#3491E8',
                      }}>
                        {axis}
                      </span>
                    ))}
                  </div>
                )}
                {row.primary_growth_driver && (
                  <div style={{ marginTop: 4, fontSize: 11, color: '#a0c4d8' }}>
                    <strong style={{ color: '#059669' }}>Driver:</strong> {row.primary_growth_driver}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
