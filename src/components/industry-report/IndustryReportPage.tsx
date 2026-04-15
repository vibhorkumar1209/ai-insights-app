'use client';

import { useState, useEffect, useRef } from 'react';
import {
  IndustryReportJob, ScopeWizardResult, IndustryReportScope,
  MarketSegmentOption, KeyPlayerOption,
} from '@/lib/types';
import {
  saveToHistory,
  loadEntryById,
  popPendingRestore,
  HistoryEntry,
} from '@/lib/history';
import IndustryReportResults from './IndustryReportResults';
import WizardSegmentStep from './WizardSegmentStep';
import WizardPlayersStep from './WizardPlayersStep';
import WizardTocPreview from './WizardTocPreview';
import ModuleIcon from '@/components/shared/ModuleIcon';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').trim();
const ACCENT = '#3491E8';

type Step = 'input' | 'scoping' | 'segments' | 'players' | 'toc_preview' | 'analysing' | 'results';

const GEOGRAPHY_OPTIONS = [
  'Global',
  'North America',
  'LATAM',
  'Europe',
  'Africa',
  'Asia',
  'Custom',
] as const;

const ALL_REPORT_SECTIONS = [
  { id: 'market_overview', label: 'Market Overview', core: true },
  { id: 'market_size_by_segment', label: 'Market Size by Segment', core: true },
  { id: 'market_dynamics', label: 'Market Dynamics', core: true },
  { id: 'competition_analysis', label: 'Competition Analysis', core: true },
  { id: 'regulatory_overview', label: 'Regulatory Overview', core: false },
  { id: 'forecast', label: 'Market Forecast', core: true },
  { id: 'swot', label: 'SWOT Analysis', core: false },
  { id: 'porters_five_forces', label: "Porter's Five Forces", core: false },
  { id: 'tei_analysis', label: 'Macroeconomic Impact', core: false },
] as const;

const DEFAULT_SECTIONS = ALL_REPORT_SECTIONS.filter((s) => s.core).map((s) => s.id);

const inputStyle = {
  display: 'block' as const,
  width: '100%',
  marginTop: 8,
  padding: '12px 14px',
  background: 'rgba(8,15,22,0.8)',
  border: '1px solid #1e4a68',
  borderRadius: 8,
  color: '#E8EDF5',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box' as const,
  fontFamily: 'inherit',
};

const labelStyle = {
  fontSize: 12, fontWeight: 600 as const, color: '#7eaabf', letterSpacing: 0.5,
};

export default function IndustryReportPage() {
  const [step, setStep] = useState<Step>('input');
  // Form fields
  const [industry, setIndustry] = useState('');
  const [subIndustry, setSubIndustry] = useState('');
  const [selectedSections, setSelectedSections] = useState<string[]>([...DEFAULT_SECTIONS]);
  const [geography, setGeography] = useState('Global');
  const [customCountry, setCustomCountry] = useState('');
  const [excludeRegion, setExcludeRegion] = useState('');

  // Wizard state
  const [wizardData, setWizardData] = useState<ScopeWizardResult | null>(null);
  const [segments, setSegments] = useState<MarketSegmentOption[]>([]);
  const [players, setPlayers] = useState<KeyPlayerOption[]>([]);

  // Job state
  const [job, setJob] = useState<IndustryReportJob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeJobId = useRef<string | null>(null);

  const effectiveGeography = geography === 'Custom' ? customCountry.trim() : geography;

  // ── Restore from history ────────────────────────────────────────────────────
  useEffect(() => {
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
    setIndustry(entry.industryReportQuery || entry.targetCompany);

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

  // ── Polling fallback ────────────────────────────────────────────────────────
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
      } catch { /* ignore */ }
    }, 5000);
  }

  function saveReport(data: IndustryReportJob) {
    if ((data.sections?.length ?? 0) > 0 || data.executiveSummary) {
      saveToHistory({
        moduleType: 'industry-report',
        targetCompany: data.scope?.industry || industry.trim(),
        completedAt: data.completedAt || new Date().toISOString(),
        industryReportQuery: data.query || industry.trim(),
        industryReportScope: data.scope,
        industryReportSections: data.sections,
        industryReportMarketSizing: data.marketSizing,
        industryReportExecutiveSummary: data.executiveSummary,
      });
    }
  }

  // ── Step 1: Scope extraction with wizard ────────────────────────────────────
  async function handleScopeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!industry.trim()) return;
    setError(null);
    setStep('scoping');

    // Retry up to 2 times — first attempt may hit a cold Render server (30s spin-up)
    let lastErr: Error = new Error('Scope extraction failed');
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch(`${API_BASE}/api/industry-report/scope`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: industry.trim(),
            industry: industry.trim(),
            subIndustry: subIndustry.trim() || undefined,
            geography: effectiveGeography || undefined,
            excludeRegion: excludeRegion.trim() || undefined,
          }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error((body as { error?: string }).error || `Server error ${res.status}`);
        }

        const data = await res.json() as ScopeWizardResult;
        setWizardData(data);
        setSegments(data.suggestedSegments);
        setPlayers(data.suggestedPlayers);
        setStep('segments');
        return;
      } catch (err) {
        lastErr = err instanceof Error ? err : new Error('Scope extraction failed');
        const isFetchError = lastErr.message === 'Failed to fetch' || lastErr.message.includes('fetch');
        if (!isFetchError || attempt === 2) break;
        // Server waking up — wait 8s and retry
        await new Promise((r) => setTimeout(r, 8000));
      }
    }
    setError(lastErr.message);
    setStep('input');
  }

  // ── Generate report with wizard selections ──────────────────────────────────
  async function handleGenerate() {
    if (!wizardData) return;
    setError(null);
    setStep('analysing');
    setJob(null);

    const selectedSegs = segments.filter((s) => s.selected);
    const selectedPl = players.filter((p) => p.selected);

    const enrichedScope: IndustryReportScope = {
      ...wizardData.scope,
      selectedSections,
      selectedSegments: selectedSegs,
      selectedPlayers: selectedPl,
    };

    try {
      const res = await fetch(`${API_BASE}/api/industry-report/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scope: enrichedScope,
          selectedSegments: selectedSegs,
          selectedPlayers: selectedPl,
          allPlayers: players,
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
        // Only handle server-sent error events (with parseable data).
        // Native connection errors (no data) are handled by es.onerror → polling.
        const me = ev as MessageEvent;
        if (me.data) {
          try {
            const data = JSON.parse(me.data) as { error?: string };
            setError(data.error || 'Analysis failed — please try again.');
            setStep('input');
            es.close();
            return;
          } catch { /* not valid JSON — fall through to onerror/polling */ }
        }
      });

      es.onerror = () => {
        es.close();
        if (activeJobId.current) startPolling(activeJobId.current);
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setStep('input');
    }
  }

  async function handleAbort() {
    // Close SSE connection immediately
    eventSourceRef.current?.close();
    eventSourceRef.current = null;
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }

    // Tell backend to abort the job
    const jobId = activeJobId.current;
    if (jobId) {
      try {
        await fetch(`${API_BASE}/api/industry-report/${jobId}/abort`, { method: 'POST' });
      } catch { /* ignore - best effort */ }
    }

    activeJobId.current = null;
    setStep('input');
    setJob(null);
    setError(null);
  }

  function handleReset() {
    eventSourceRef.current?.close();
    if (pollRef.current) clearInterval(pollRef.current);
    activeJobId.current = null;
    setStep('input');
    setJob(null);
    setError(null);
    setIndustry('');
    setSubIndustry('');
    setSelectedSections([...DEFAULT_SECTIONS]);
    setGeography('Global');
    setCustomCountry('');
    setExcludeRegion('');
    setWizardData(null);
    setSegments([]);
    setPlayers([]);
  }

  return (
    <div style={{ minHeight: '100vh', background: '#080f16', display: 'flex', flexDirection: 'column' }}>

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
          <a href="/" style={{ color: '#7eaabf', textDecoration: 'none', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            ← Home
          </a>
          <div style={{ width: 1, height: 16, background: '#1e4a68', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, color: ACCENT, marginBottom: 3 }}>REFRACTONE</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ModuleIcon id="industry-report" size={20} />
              <span style={{ fontSize: 18, fontWeight: 800, color: '#E8EDF5' }}>Industry Report</span>
            </div>
          </div>
          <a
            href="/reports"
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(52,145,232,0.1)', border: '1px solid rgba(52,145,232,0.25)',
              color: '#22D3EE', borderRadius: 8, padding: '8px 16px',
              fontSize: 13, fontWeight: 600, textDecoration: 'none', flexShrink: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 28 28" fill="none">
              <path d="M7 3H18L23 8V25H7V3Z" stroke="#22D3EE" strokeWidth="1.5" strokeLinejoin="round" fill="#22D3EE" fillOpacity="0.08"/>
              <path d="M18 3V8H23" stroke="#22D3EE" strokeWidth="1.4" strokeLinejoin="round"/>
              <rect x="10" y="14" width="3" height="7" rx="0.5" fill="#22D3EE" opacity="0.7"/>
              <rect x="14.5" y="11" width="3" height="10" rx="0.5" fill="#22D3EE" opacity="0.5"/>
            </svg>
            Report Library
          </a>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, maxWidth: 1200, margin: '0 auto', width: '100%', padding: '32px' }}>

        {/* ═══════ INPUT FORM ═══════ */}
        {step === 'input' && (
          <div style={{ maxWidth: 680, margin: '32px auto 0' }}>
            {error && (
              <div style={{
                background: 'rgba(230,57,70,0.1)', border: '1px solid rgba(230,57,70,0.3)',
                borderRadius: 8, padding: '12px 16px', marginBottom: 24, fontSize: 13, color: '#ff6b75',
              }}>
                {error}
              </div>
            )}

            <div style={{
              background: 'linear-gradient(135deg, #0c3649, #0a2233)',
              border: '1px solid #1e4a68',
              borderRadius: 12, padding: '32px',
            }}>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: ACCENT, textTransform: 'uppercase' as const, marginBottom: 6 }}>
                  Step 1 of 5
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#E8EDF5' }}>
                  Define Research Scope
                </div>
                <div style={{ fontSize: 13, color: '#7eaabf', marginTop: 6 }}>
                  Provide the industry details to generate a comprehensive market intelligence report.
                </div>
              </div>

              <form onSubmit={handleScopeSubmit}>
                {/* Topic of Research */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                  <div>
                    <label style={labelStyle}>INDUSTRY / PRODUCT *</label>
                    <input
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      placeholder="e.g. Electric Vehicle Battery"
                      required
                      autoFocus
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>SUB-INDUSTRY / SUB-PRODUCT</label>
                    <input
                      value={subIndustry}
                      onChange={(e) => setSubIndustry(e.target.value)}
                      placeholder="e.g. Solid-state batteries"
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* Geography */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                  <div>
                    <label style={labelStyle}>GEOGRAPHY</label>
                    <select
                      value={geography}
                      onChange={(e) => {
                        setGeography(e.target.value);
                        if (e.target.value !== 'Custom') setCustomCountry('');
                      }}
                      style={{
                        ...inputStyle,
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
                      <option value="LATAM">LATAM</option>
                      <option value="Europe">Europe</option>
                      <option value="Africa">Africa</option>
                      <option value="Asia">Asia</option>
                      <option value="Custom">Specific Country...</option>
                    </select>
                    {geography === 'Custom' && (
                      <input
                        value={customCountry}
                        onChange={(e) => setCustomCountry(e.target.value)}
                        placeholder="e.g. India, Brazil, Germany"
                        style={{ ...inputStyle, marginTop: 10 }}
                      />
                    )}
                  </div>
                  <div>
                    <label style={labelStyle}>
                      EXCLUSION <span style={{ fontWeight: 400, opacity: 0.6 }}>(optional)</span>
                    </label>
                    <input
                      value={excludeRegion}
                      onChange={(e) => setExcludeRegion(e.target.value)}
                      placeholder="Region/country to exclude"
                      style={inputStyle}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!industry.trim() || (geography === 'Custom' && !customCountry.trim())}
                  style={{
                    width: '100%', padding: '14px',
                    background: industry.trim() ? `linear-gradient(135deg, ${ACCENT}, #2563EB)` : 'rgba(30,74,104,0.4)',
                    border: 'none', borderRadius: 8,
                    color: industry.trim() ? '#fff' : '#4a7a96',
                    fontSize: 14, fontWeight: 700,
                    cursor: industry.trim() ? 'pointer' : 'not-allowed',
                    letterSpacing: 0.5,
                  }}
                >
                  Extract Scope & Segments →
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ═══════ SCOPING (loading) ═══════ */}
        {step === 'scoping' && (
          <div style={{ maxWidth: 500, margin: '80px auto 0', textAlign: 'center' }}>
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
              Analysing Market Scope
            </div>
            <div style={{ fontSize: 13, color: '#7eaabf' }}>
              Identifying market segments and key players — this takes 15–30 seconds.
            </div>
          </div>
        )}

        {/* ═══════ SEGMENTS WIZARD ═══════ */}
        {step === 'segments' && (
          <div style={{ marginTop: 24 }}>
            <WizardSegmentStep
              segments={segments}
              onUpdate={setSegments}
              onNext={() => setStep('players')}
              onBack={() => setStep('input')}
            />
          </div>
        )}

        {/* ═══════ PLAYERS WIZARD ═══════ */}
        {step === 'players' && (
          <div style={{ marginTop: 24 }}>
            <WizardPlayersStep
              players={players}
              onUpdate={setPlayers}
              onNext={() => setStep('toc_preview')}
              onBack={() => setStep('segments')}
            />
          </div>
        )}

        {/* ═══════ TOC / SECTION SELECTION ═══════ */}
        {step === 'toc_preview' && wizardData && (
          <div style={{ marginTop: 24 }}>
            <WizardTocPreview
              scope={wizardData.scope}
              segments={segments}
              players={players}
              selectedSections={selectedSections}
              onUpdateSections={setSelectedSections}
              allSectionDefs={ALL_REPORT_SECTIONS as unknown as { id: string; label: string; core: boolean }[]}
              onGenerate={handleGenerate}
              onBack={() => setStep('players')}
            />
          </div>
        )}

        {/* ═══════ ANALYSING ═══════ */}
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
                  background: `linear-gradient(90deg, ${ACCENT}, #22D3EE)`,
                  borderRadius: 3,
                  transition: 'width 0.6s ease',
                }} />
              </div>
              <div style={{ fontSize: 11, color: '#4a7a96', marginTop: 8 }}>
                {job?.progress ?? 2}% complete
              </div>

              {/* Phase indicators */}
              <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 6, textAlign: 'left' }}>
                {(() => {
                  const phases: { key: string; label: string; range: number[] }[] = [
                    { key: 'researching', label: 'Market research (4 parallel queries)', range: [0, 50] },
                    { key: 'sizing', label: 'Market sizing analysis', range: [50, 60] },
                  ];
                  // Build drafting phases dynamically based on selected sections
                  const hasSec = (id: string) => selectedSections.includes(id);
                  const draftLabels: string[] = [];
                  if (hasSec('market_overview') || hasSec('segmentation_analysis')) draftLabels.push('Market overview & segmentation');
                  if (hasSec('trends_drivers_barriers') || hasSec('tech_trends') || hasSec('regulatory_overview')) draftLabels.push('Trends, tech & regulatory');
                  if (hasSec('competitive_landscape') || hasSec('forecast')) draftLabels.push('Competitive landscape & forecast');
                  if (hasSec('swot') || hasSec('porters_five_forces') || hasSec('tei_analysis')) draftLabels.push('SWOT, Porter\'s & TEI analysis');
                  if (draftLabels.length === 0) draftLabels.push('Drafting report sections');
                  const draftStart = 60, draftEnd = 88;
                  const draftStep = (draftEnd - draftStart) / draftLabels.length;
                  draftLabels.forEach((label, i) => {
                    phases.push({ key: `drafting${i}`, label, range: [draftStart + i * draftStep, draftStart + (i + 1) * draftStep] });
                  });
                  phases.push({ key: 'summarizing', label: 'Executive summary', range: [88, 100] });
                  return phases;
                })().map((phase) => {
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

              {/* Abort button */}
              <button
                onClick={handleAbort}
                style={{
                  marginTop: 28,
                  padding: '12px 32px',
                  borderRadius: 8,
                  border: '1px solid rgba(230,57,70,0.4)',
                  background: 'rgba(230,57,70,0.08)',
                  color: '#E63946',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  letterSpacing: 0.3,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(230,57,70,0.18)';
                  e.currentTarget.style.borderColor = 'rgba(230,57,70,0.6)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(230,57,70,0.08)';
                  e.currentTarget.style.borderColor = 'rgba(230,57,70,0.4)';
                }}
              >
                ✕ Stop Generation
              </button>
            </div>
          </div>
        )}

        {/* ═══════ RESULTS ═══════ */}
        {step === 'results' && job && (
          <IndustryReportResults job={job} onNewAnalysis={handleReset} />
        )}
      </div>
    </div>
  );
}
