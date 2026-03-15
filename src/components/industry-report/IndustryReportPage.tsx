'use client';

import { useState, useEffect, useRef } from 'react';
import { IndustryReportJob } from '@/lib/types';
import {
  loadHistory,
  saveToHistory,
  loadEntryById,
  popPendingRestore,
  HistoryEntry,
} from '@/lib/history';
import IndustryReportResults from './IndustryReportResults';
import HistoryDrawer from '@/components/shared/HistoryDrawer';
import ModuleIcon from '@/components/shared/ModuleIcon';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const ACCENT = '#059669';

const GEOGRAPHY_OPTIONS = [
  'Global',
  'North America',
  'Europe',
  'Asia-Pacific',
  'Latin America',
  'Middle East & Africa',
  'Custom',
] as const;

export default function IndustryReportPage() {
  const [step, setStep] = useState<'input' | 'analysing' | 'results'>('input');
  const [query, setQuery] = useState('');
  const [geography, setGeography] = useState('Global');
  const [customCountry, setCustomCountry] = useState('');
  const [job, setJob] = useState<IndustryReportJob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [historyCount, setHistoryCount] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeJobId = useRef<string | null>(null);

  const effectiveGeography = geography === 'Custom' ? customCountry.trim() : geography;

  useEffect(() => {
    setHistoryCount(loadHistory().length);
    const pendingId = popPendingRestore();
    if (pendingId) {
      const entry = loadEntryById(pendingId);
      if (entry && entry.moduleType === 'industry-report') restoreEntry(entry);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => {
      eventSourceRef.current?.close();
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  function restoreEntry(entry: HistoryEntry) {
    if (!entry.industryReportSections && !entry.industryReportExecutiveSummary) return;
    setQuery(entry.industryReportQuery || entry.targetCompany);

    const geo = entry.industryReportScope?.geography || 'Global';
    const presets = GEOGRAPHY_OPTIONS.filter((o) => o !== 'Custom');
    if ((presets as readonly string[]).includes(geo)) {
      setGeography(geo);
      setCustomCountry('');
    } else {
      setGeography('Custom');
      setCustomCountry(geo);
    }

    setJob({
      jobId: entry.id,
      status: 'complete',
      progress: 100,
      query: entry.industryReportQuery || entry.targetCompany,
      scope: entry.industryReportScope,
      marketSizing: entry.industryReportMarketSizing,
      sections: entry.industryReportSections,
      executiveSummary: entry.industryReportExecutiveSummary,
      createdAt: entry.completedAt,
      completedAt: entry.completedAt,
    });
    setStep('results');
  }

  // Auto-reconnect: poll job status if SSE drops
  function startPolling(jobId: string) {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/industry-report/${jobId}`);
        if (!res.ok) return;
        const data = await res.json() as IndustryReportJob;
        setJob(data);
        if (data.status === 'complete') {
          if (pollRef.current) clearInterval(pollRef.current);
          setStep('results');
          saveReport(data);
        } else if (data.status === 'error') {
          if (pollRef.current) clearInterval(pollRef.current);
          setError(data.error || 'Analysis failed');
          setStep('input');
        }
      } catch { /* ignore polling errors */ }
    }, 5000);
  }

  function saveReport(data: IndustryReportJob) {
    if ((data.sections?.length ?? 0) > 0 || data.executiveSummary) {
      saveToHistory({
        moduleType: 'industry-report',
        targetCompany: data.scope?.industry || query.trim(),
        completedAt: data.completedAt || new Date().toISOString(),
        industryReportQuery: data.query || query.trim(),
        industryReportScope: data.scope,
        industryReportSections: data.sections,
        industryReportMarketSizing: data.marketSizing,
        industryReportExecutiveSummary: data.executiveSummary,
      });
      setHistoryCount(loadHistory().length);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setError(null);
    setStep('analysing');
    setJob(null);

    try {
      const res = await fetch(`${API_BASE}/api/industry-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query.trim(),
          geography: effectiveGeography || undefined,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error || `Server error ${res.status}`);
      }

      const { jobId } = await res.json() as { jobId: string };
      activeJobId.current = jobId;

      const es = new EventSource(`${API_BASE}/api/industry-report/${jobId}/stream`);
      eventSourceRef.current = es;

      es.addEventListener('progress', (ev) => {
        const data = JSON.parse(ev.data) as Partial<IndustryReportJob>;
        setJob((prev) => ({ ...(prev ?? {} as IndustryReportJob), ...data }));
      });

      es.addEventListener('result', (ev) => {
        const data = JSON.parse(ev.data) as IndustryReportJob;
        setJob(data);
        setStep('results');
        es.close();
        saveReport(data);
      });

      es.addEventListener('error', (ev) => {
        let msg = 'Analysis failed — please try again.';
        try {
          const data = JSON.parse((ev as MessageEvent).data) as { error?: string };
          if (data.error) msg = data.error;
        } catch { /* ignore */ }
        setError(msg);
        setStep('input');
        es.close();
      });

      // Auto-reconnect on SSE drop
      es.onerror = () => {
        es.close();
        if (activeJobId.current) startPolling(activeJobId.current);
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setStep('input');
    }
  }

  function handleReset() {
    eventSourceRef.current?.close();
    if (pollRef.current) clearInterval(pollRef.current);
    activeJobId.current = null;
    setStep('input');
    setJob(null);
    setError(null);
    setQuery('');
    setGeography('Global');
    setCustomCountry('');
  }

  return (
    <div style={{ minHeight: '100vh', background: '#080f16', display: 'flex', flexDirection: 'column' }}>

      {showHistory && (
        <HistoryDrawer
          currentModule="industry-report"
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
        <div style={{
          maxWidth: 1200, margin: '0 auto',
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
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
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, color: ACCENT, marginBottom: 3 }}>
              REFRACTONE
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ModuleIcon id="industry-report" size={20} />
              <span style={{ fontSize: 18, fontWeight: 800, color: '#E8EDF5' }}>Industry Report</span>
            </div>
          </div>

          <button
            onClick={() => setShowHistory(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(5,150,105,0.1)',
              border: '1px solid rgba(5,150,105,0.25)',
              color: '#34d399',
              borderRadius: 8, padding: '8px 16px',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="12" height="12" rx="2" stroke="#34d399" strokeWidth="1.4" />
              <path d="M3.5 4.5h7M3.5 7h7M3.5 9.5h4" stroke="#34d399" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            Report History
            {historyCount > 0 && (
              <span style={{
                background: ACCENT, color: '#fff',
                borderRadius: '50%', width: 18, height: 18,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 700,
              }}>
                {historyCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, maxWidth: 1200, margin: '0 auto', width: '100%', padding: '32px' }}>

        {/* INPUT */}
        {step === 'input' && (
          <div style={{ maxWidth: 620, margin: '48px auto 0' }}>
            {error && (
              <div style={{
                background: 'rgba(230,57,70,0.1)',
                border: '1px solid rgba(230,57,70,0.3)',
                borderRadius: 8, padding: '12px 16px',
                marginBottom: 24, fontSize: 13, color: '#ff6b75',
              }}>
                {error}
              </div>
            )}

            <div style={{
              background: 'linear-gradient(135deg, #0c3649, #0a2233)',
              border: '1px solid #1e4a68',
              borderRadius: 12, padding: '32px',
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#E8EDF5', marginBottom: 6 }}>
                Industry Report
              </div>
              <div style={{ fontSize: 13, color: '#7eaabf', marginBottom: 28 }}>
                Describe the market you want to analyse. We will generate a comprehensive report with market sizing, segmentation, trends, competitive landscape, and forecasts.
              </div>

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 24 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#7eaabf', letterSpacing: 0.5 }}>
                    MARKET / INDUSTRY
                  </label>
                  <textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g. Electric vehicle battery market in North America, Cloud computing in healthcare, AI chips for edge computing"
                    required
                    autoFocus
                    rows={3}
                    style={{
                      display: 'block', width: '100%',
                      marginTop: 8, padding: '12px 14px',
                      background: 'rgba(8,15,22,0.8)',
                      border: '1px solid #1e4a68',
                      borderRadius: 8, color: '#E8EDF5',
                      fontSize: 14, outline: 'none',
                      boxSizing: 'border-box',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>

                {/* Geography selector */}
                <div style={{ marginBottom: 24 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#7eaabf', letterSpacing: 0.5 }}>
                    GEOGRAPHY <span style={{ fontWeight: 400, opacity: 0.6 }}>(optional)</span>
                  </label>
                  <select
                    value={geography}
                    onChange={(e) => {
                      setGeography(e.target.value);
                      if (e.target.value !== 'Custom') setCustomCountry('');
                    }}
                    style={{
                      display: 'block', width: '100%',
                      marginTop: 8, padding: '12px 14px',
                      background: 'rgba(8,15,22,0.8)',
                      border: '1px solid #1e4a68',
                      borderRadius: 8, color: '#E8EDF5',
                      fontSize: 14, outline: 'none',
                      boxSizing: 'border-box' as const,
                      cursor: 'pointer',
                      appearance: 'none' as const,
                      WebkitAppearance: 'none' as const,
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' fill='none' stroke='%237eaabf' stroke-width='1.5'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 14px center',
                    }}
                  >
                    <option value="Global">Global (all regions)</option>
                    <option value="North America">North America</option>
                    <option value="Europe">Europe</option>
                    <option value="Asia-Pacific">Asia-Pacific</option>
                    <option value="Latin America">Latin America</option>
                    <option value="Middle East & Africa">Middle East &amp; Africa</option>
                    <option value="Custom">Specific Country...</option>
                  </select>

                  {geography === 'Custom' && (
                    <input
                      type="text"
                      value={customCountry}
                      onChange={(e) => setCustomCountry(e.target.value)}
                      placeholder="e.g. India, Brazil, Germany, Japan"
                      style={{
                        display: 'block', width: '100%',
                        marginTop: 10, padding: '12px 14px',
                        background: 'rgba(8,15,22,0.8)',
                        border: '1px solid #1e4a68',
                        borderRadius: 8, color: '#E8EDF5',
                        fontSize: 14, outline: 'none',
                        boxSizing: 'border-box' as const,
                      }}
                    />
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!query.trim() || (geography === 'Custom' && !customCountry.trim())}
                  style={{
                    width: '100%', padding: '13px',
                    background: (query.trim() && !(geography === 'Custom' && !customCountry.trim()))
                      ? `linear-gradient(135deg, ${ACCENT}, #047857)`
                      : 'rgba(30,74,104,0.4)',
                    border: 'none', borderRadius: 8,
                    color: (query.trim() && !(geography === 'Custom' && !customCountry.trim())) ? '#fff' : '#4a7a96',
                    fontSize: 14, fontWeight: 700,
                    cursor: (query.trim() && !(geography === 'Custom' && !customCountry.trim())) ? 'pointer' : 'not-allowed',
                    letterSpacing: 0.5,
                  }}
                >
                  Generate Industry Report →
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ANALYSING */}
        {step === 'analysing' && (
          <div style={{ maxWidth: 620, margin: '48px auto 0' }}>
            <div style={{
              background: 'linear-gradient(135deg, #0c3649, #0a2233)',
              border: '1px solid #1e4a68',
              borderRadius: 12, padding: '36px 32px', textAlign: 'center',
            }}>
              <div style={{
                width: 48, height: 48,
                border: '3px solid rgba(30,74,104,0.4)',
                borderTopColor: ACCENT,
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                margin: '0 auto 24px',
              }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#E8EDF5', marginBottom: 8 }}>
                Generating Industry Report
              </div>
              <div style={{ fontSize: 13, color: '#7eaabf', marginBottom: 24 }}>
                {job?.currentStep || 'Initialising report pipeline — this takes 5–8 minutes.'}
              </div>
              <div style={{ height: 6, background: 'rgba(30,74,104,0.5)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${job?.progress ?? 2}%`,
                  background: `linear-gradient(90deg, ${ACCENT}, #34d399)`,
                  borderRadius: 3,
                  transition: 'width 0.6s ease',
                }} />
              </div>
              <div style={{ fontSize: 11, color: '#4a7a96', marginTop: 8 }}>
                {job?.progress ?? 2}% complete
              </div>

              {/* Phase indicators */}
              <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 6, textAlign: 'left' }}>
                {[
                  { key: 'scoping', label: 'Scope extraction', range: [0, 10] },
                  { key: 'researching', label: 'Market research (4 parallel queries)', range: [10, 50] },
                  { key: 'sizing', label: 'Market sizing analysis', range: [50, 60] },
                  { key: 'drafting', label: 'Section drafting (3 batches)', range: [60, 85] },
                  { key: 'summarizing', label: 'Executive summary', range: [85, 100] },
                ].map((phase) => {
                  const prog = job?.progress ?? 0;
                  const isActive = prog >= phase.range[0] && prog < phase.range[1];
                  const isDone = prog >= phase.range[1];
                  return (
                    <div
                      key={phase.key}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        fontSize: 12,
                        color: isDone ? '#10B981' : isActive ? '#E8EDF5' : '#4a7a96',
                        fontWeight: isActive ? 600 : 400,
                      }}
                    >
                      <span style={{ fontSize: 14 }}>
                        {isDone ? '✓' : isActive ? '◉' : '○'}
                      </span>
                      {phase.label}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* RESULTS */}
        {step === 'results' && job && (
          <IndustryReportResults job={job} onNewAnalysis={handleReset} />
        )}
      </div>
    </div>
  );
}
