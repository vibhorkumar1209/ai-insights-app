'use client';

import { useState, useEffect, useRef } from 'react';
import { FinancialAnalysisJob } from '@/lib/types';
import {
  loadHistory, saveToHistory, loadEntryById,
  popPendingRestore, HistoryEntry,
} from '@/lib/history';
import HistoryDrawer from '@/components/shared/HistoryDrawer';
import PublicCompanyView from './PublicCompanyView';
import PrivateCompanyCard from './PrivateCompanyCard';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const ACCENT = '#22D3EE';

function darken(hex: string): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, ((n >> 16) & 0xff) - 25);
  const g = Math.max(0, ((n >> 8) & 0xff) - 25);
  const b = Math.max(0, (n & 0xff) - 25);
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

const STATUS_LABELS: Record<string, string> = {
  detecting:   'Detecting company type…',
  fetching:    'Fetching financial data…',
  researching: 'Researching segment & geographic data…',
  synthesizing: 'Generating financial insights…',
};

export default function FinancialAnalysisPage() {
  const [step, setStep] = useState<'input' | 'analysing' | 'results'>('input');
  const [companyName, setCompanyName] = useState('');
  const [companyDomain, setCompanyDomain] = useState('');
  const [isPublicOverride, setIsPublicOverride] = useState<boolean | undefined>(undefined);
  const [job, setJob] = useState<FinancialAnalysisJob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [historyCount, setHistoryCount] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    setHistoryCount(loadHistory().length);
    const pendingId = popPendingRestore();
    if (pendingId) {
      const entry = loadEntryById(pendingId);
      if (entry?.moduleType === 'financial-analysis' && entry.financialData) {
        restoreEntry(entry);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => { eventSourceRef.current?.close(); };
  }, []);

  function restoreEntry(entry: HistoryEntry) {
    if (!entry.financialData) return;
    setCompanyName(entry.targetCompany);
    setJob(entry.financialData);
    setStep('results');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!companyName.trim()) return;

    setError(null);
    setStep('analysing');

    try {
      const res = await fetch(`${API_BASE}/api/financial-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: companyName.trim(),
          companyDomain: companyDomain.trim() || undefined,
          isPublic: isPublicOverride,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error || `Server error ${res.status}`);
      }

      const { jobId } = await res.json() as { jobId: string };
      const es = new EventSource(`${API_BASE}/api/financial-analysis/${jobId}/stream`);
      eventSourceRef.current = es;

      es.addEventListener('progress', (e) => {
        const data = JSON.parse(e.data) as Partial<FinancialAnalysisJob>;
        setJob((prev) => ({ ...(prev ?? {} as FinancialAnalysisJob), ...data }));
      });

      es.addEventListener('result', (e) => {
        const data = JSON.parse(e.data) as FinancialAnalysisJob;
        setJob(data);
        setStep('results');
        es.close();

        saveToHistory({
          moduleType: 'financial-analysis',
          targetCompany: companyName.trim(),
          completedAt: data.completedAt || new Date().toISOString(),
          financialData: data,
        });
        setHistoryCount(loadHistory().length);
      });

      es.addEventListener('error', (e) => {
        let msg = 'Analysis failed — please try again.';
        try { const d = JSON.parse((e as MessageEvent).data); if (d.error) msg = d.error; } catch { /* ignore */ }
        setError(msg);
        setStep('input');
        es.close();
      });

      es.onerror = () => {
        setError('Connection lost — please try again.');
        setStep('input');
        es.close();
      };
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
    setCompanyName('');
    setCompanyDomain('');
    setIsPublicOverride(undefined);
  }

  // Detect company type badge shown in results header
  const companyTypeBadge = job
    ? job.isPublic
      ? { label: `${job.ticker || 'PUBLIC'} · ${job.exchange || ''}`, color: '#22D3EE' }
      : { label: 'PRIVATE', color: '#F59E0B' }
    : null;

  return (
    <div style={{ minHeight: '100vh', background: '#080f16', display: 'flex', flexDirection: 'column' }}>

      {showHistory && (
        <HistoryDrawer
          currentModule="financial-analysis"
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
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 16 }}>
          <a href="/" style={{ color: '#7eaabf', textDecoration: 'none', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
            ← Home
          </a>
          <div style={{ width: 1, height: 16, background: '#1e4a68' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, color: ACCENT, marginBottom: 3 }}>REFRACTONE</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>📊</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: '#E8EDF5' }}>Financial Analysis</span>
            </div>
          </div>

          <button
            onClick={() => setShowHistory(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: `rgba(34,211,238,0.1)`,
              border: `1px solid rgba(34,211,238,0.25)`,
              color: ACCENT,
              borderRadius: 8, padding: '8px 16px',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="12" height="12" rx="2" stroke={ACCENT} strokeWidth="1.4" />
              <path d="M3.5 4.5h7M3.5 7h7M3.5 9.5h4" stroke={ACCENT} strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            Report History
            {historyCount > 0 && (
              <span style={{
                background: ACCENT, color: '#080f16',
                borderRadius: '50%', width: 18, height: 18,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 800,
              }}>{historyCount}</span>
            )}
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, maxWidth: 1200, margin: '0 auto', width: '100%', padding: '32px' }}>

        {/* ── INPUT ─────────────────────────────────────────────────────────── */}
        {step === 'input' && (
          <div style={{ maxWidth: 580, margin: '48px auto 0' }}>
            {error && (
              <div style={{
                background: 'rgba(230,57,70,0.1)', border: '1px solid rgba(230,57,70,0.3)',
                borderRadius: 8, padding: '12px 16px', marginBottom: 24,
                fontSize: 13, color: '#ff6b75',
              }}>
                {error}
              </div>
            )}
            <div style={{
              background: 'linear-gradient(135deg, #0c3649, #0a2233)',
              border: '1px solid #1e4a68', borderRadius: 12, padding: '32px',
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#E8EDF5', marginBottom: 6 }}>
                Company Financial Analysis
              </div>
              <div style={{ fontSize: 13, color: '#7eaabf', marginBottom: 28 }}>
                Enter a company name to generate a full financial profile — P&L, balance sheet, cash flow, charts and insights.
              </div>

              <form onSubmit={handleSubmit}>
                {/* Company name */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#7eaabf', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>
                    COMPANY NAME *
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Apple, Siemens, Medtronic"
                    required
                    autoFocus
                    style={{
                      display: 'block', width: '100%', padding: '11px 14px',
                      background: 'rgba(8,15,22,0.8)', border: '1px solid #1e4a68',
                      borderRadius: 8, color: '#E8EDF5', fontSize: 14, outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Domain (optional) */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#7eaabf', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>
                    COMPANY DOMAIN <span style={{ fontWeight: 400, color: '#4a7a96' }}>(optional, helps confirm ticker)</span>
                  </label>
                  <input
                    type="text"
                    value={companyDomain}
                    onChange={(e) => setCompanyDomain(e.target.value)}
                    placeholder="e.g. apple.com, siemens.com"
                    style={{
                      display: 'block', width: '100%', padding: '11px 14px',
                      background: 'rgba(8,15,22,0.8)', border: '1px solid #1e4a68',
                      borderRadius: 8, color: '#E8EDF5', fontSize: 14, outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Public / Private toggle */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#7eaabf', letterSpacing: 0.5, marginBottom: 8 }}>
                    COMPANY TYPE <span style={{ fontWeight: 400, color: '#4a7a96' }}>(auto-detected if not set)</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {(['auto', 'public', 'private'] as const).map((opt) => {
                      const selected = opt === 'auto'
                        ? isPublicOverride === undefined
                        : opt === 'public' ? isPublicOverride === true : isPublicOverride === false;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setIsPublicOverride(opt === 'auto' ? undefined : opt === 'public')}
                          style={{
                            padding: '7px 14px', borderRadius: 6,
                            fontSize: 12, fontWeight: 600, cursor: 'pointer',
                            border: selected ? `1px solid ${ACCENT}` : '1px solid #1e4a68',
                            background: selected ? `rgba(34,211,238,0.12)` : 'rgba(8,15,22,0.5)',
                            color: selected ? ACCENT : '#7eaabf',
                          }}
                        >
                          {opt === 'auto' ? '🔍 Auto-detect' : opt === 'public' ? '📈 Public' : '🔒 Private'}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!companyName.trim()}
                  style={{
                    width: '100%', padding: '13px',
                    background: companyName.trim()
                      ? `linear-gradient(135deg, ${ACCENT}, ${darken(ACCENT)})`
                      : 'rgba(30,74,104,0.4)',
                    border: 'none', borderRadius: 8,
                    color: companyName.trim() ? '#0a2233' : '#4a7a96',
                    fontSize: 14, fontWeight: 800,
                    cursor: companyName.trim() ? 'pointer' : 'not-allowed',
                  }}
                >
                  Analyse Financials →
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ── ANALYSING ─────────────────────────────────────────────────────── */}
        {step === 'analysing' && (
          <div style={{ maxWidth: 580, margin: '48px auto 0' }}>
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
                Analysing {companyName}
              </div>
              <div style={{ fontSize: 13, color: '#7eaabf', marginBottom: 24 }}>
                {job?.currentStep || STATUS_LABELS[job?.status || ''] || 'Gathering financial data — this takes 1–2 minutes.'}
              </div>
              {/* Public / Private detection badge */}
              {job?.isPublic !== undefined && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '4px 12px', borderRadius: 20, marginBottom: 20,
                  background: job.isPublic ? 'rgba(34,211,238,0.1)' : 'rgba(245,158,11,0.1)',
                  border: `1px solid ${job.isPublic ? 'rgba(34,211,238,0.3)' : 'rgba(245,158,11,0.3)'}`,
                  fontSize: 11, fontWeight: 700,
                  color: job.isPublic ? ACCENT : '#F59E0B',
                }}>
                  {job.isPublic ? `📈 ${job.ticker || 'PUBLIC'} · ${job.exchange || ''}` : '🔒 PRIVATE COMPANY'}
                </div>
              )}
              <div style={{ height: 4, background: 'rgba(30,74,104,0.5)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${job?.progress ?? 5}%`,
                  background: `linear-gradient(90deg, ${ACCENT}, #3491E8)`,
                  borderRadius: 2,
                  transition: 'width 0.6s ease',
                }} />
              </div>
              <div style={{ fontSize: 11, color: '#4a7a96', marginTop: 8 }}>
                {job?.progress ?? 5}% complete
              </div>
            </div>
          </div>
        )}

        {/* ── RESULTS ───────────────────────────────────────────────────────── */}
        {step === 'results' && job && (
          <div>
            {/* Results header */}
            <div style={{
              display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
              marginBottom: 24, gap: 16, flexWrap: 'wrap',
            }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#E8EDF5', marginBottom: 6 }}>
                  {job.companyName || companyName}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: `rgba(34,211,238,0.1)`,
                    border: `1px solid rgba(34,211,238,0.25)`,
                    borderRadius: 6, padding: '4px 12px',
                    fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: 1,
                  }}>
                    📊 FINANCIAL ANALYSIS
                  </span>
                  {companyTypeBadge && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      background: `rgba(${companyTypeBadge.color === ACCENT ? '34,211,238' : '245,158,11'}, 0.1)`,
                      border: `1px solid rgba(${companyTypeBadge.color === ACCENT ? '34,211,238' : '245,158,11'}, 0.25)`,
                      borderRadius: 6, padding: '4px 10px',
                      fontSize: 11, fontWeight: 700, color: companyTypeBadge.color,
                    }}>
                      {companyTypeBadge.label}
                    </span>
                  )}
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
                    borderRadius: 5, padding: '4px 10px',
                    fontSize: 11, fontWeight: 700, color: '#34d399',
                  }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#34d399', display: 'inline-block' }} />
                    COMPLETE
                  </span>
                  {job.completedAt && (
                    <span style={{ fontSize: 11, color: '#4a7a96' }}>
                      {new Date(job.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={handleReset}
                style={{
                  background: 'rgba(30,74,104,0.4)', border: '1px solid #1e4a68',
                  color: '#7eaabf', borderRadius: 8, padding: '8px 18px',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer', flexShrink: 0,
                }}
              >
                ← New Analysis
              </button>
            </div>

            {/* Render public or private view */}
            {job.isPublic ? (
              <PublicCompanyView job={job} />
            ) : (
              <PrivateCompanyCard job={job} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
