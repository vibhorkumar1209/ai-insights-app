'use client';

import { useState, useEffect, useRef } from 'react';
import { ThemesJob, ThemeType } from '@/lib/types';
import {
  loadHistory,
  saveToHistory,
  loadEntryById,
  popPendingRestore,
  HistoryEntry,
  ModuleType,
} from '@/lib/history';
import ThemeTable from './ThemeTable';
import HistoryDrawer from '@/components/shared/HistoryDrawer';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// Map ThemeType → ModuleType for history
const THEME_TO_MODULE: Record<ThemeType, ModuleType> = {
  business: 'business-themes',
  technology: 'technology-themes',
  sustainability: 'sustainability',
};

const TYPE_CONFIG: Record<ThemeType, {
  label: string;
  icon: string;
  accent: string;
  inputPlaceholder: string;
  description: string;
}> = {
  business: {
    label: 'Business Themes',
    icon: '💼',
    accent: '#3491E8',
    inputPlaceholder: 'e.g. Siemens, Unilever, Caterpillar',
    description: 'Strategic priorities, growth initiatives and corporate direction',
  },
  technology: {
    label: 'Technology Themes',
    icon: '⚙️',
    accent: '#8B5CF6',
    inputPlaceholder: 'e.g. Volkswagen, HSBC, Johnson Controls',
    description: 'Digital transformation, AI adoption and technology investment priorities',
  },
  sustainability: {
    label: 'Sustainability Themes',
    icon: '🌱',
    accent: '#10B981',
    inputPlaceholder: 'e.g. Shell, Nestlé, Schneider Electric',
    description: 'ESG commitments, carbon targets and sustainability strategy',
  },
};

interface ThemesAnalysisPageProps {
  themeType: ThemeType;
}

export default function ThemesAnalysisPage({ themeType }: ThemesAnalysisPageProps) {
  const cfg = TYPE_CONFIG[themeType];
  const moduleType = THEME_TO_MODULE[themeType];

  const [step, setStep] = useState<'input' | 'analysing' | 'results'>('input');
  const [companyName, setCompanyName] = useState('');
  const [job, setJob] = useState<ThemesJob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [historyCount, setHistoryCount] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  // On mount: load history count + check cross-page pending restore
  useEffect(() => {
    setHistoryCount(loadHistory().length);

    const pendingId = popPendingRestore();
    if (pendingId) {
      const entry = loadEntryById(pendingId);
      if (entry && entry.moduleType === moduleType) {
        restoreEntry(entry);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Clean up SSE on unmount
  useEffect(() => {
    return () => { eventSourceRef.current?.close(); };
  }, []);

  function restoreEntry(entry: HistoryEntry) {
    if (!entry.themeRows) return;
    setCompanyName(entry.targetCompany);
    setJob({
      jobId: entry.id,
      status: 'complete',
      progress: 100,
      rows: entry.themeRows,
      themeType: entry.themeType as ThemeType,
      companyName: entry.targetCompany,
      createdAt: entry.completedAt,
      completedAt: entry.completedAt,
    });
    setStep('results');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!companyName.trim()) return;

    setError(null);
    setStep('analysing');

    try {
      const res = await fetch(`${API_BASE}/api/themes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName: companyName.trim(), themeType }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error || `Server error ${res.status}`);
      }

      const { jobId } = await res.json() as { jobId: string };

      const es = new EventSource(`${API_BASE}/api/themes/${jobId}/stream`);
      eventSourceRef.current = es;

      es.addEventListener('progress', (e) => {
        const data = JSON.parse(e.data) as Partial<ThemesJob>;
        setJob((prev) => ({ ...(prev ?? {} as ThemesJob), ...data }));
      });

      es.addEventListener('result', (e) => {
        const data = JSON.parse(e.data) as ThemesJob;
        setJob(data);
        setStep('results');
        es.close();

        // Save to history
        if (data.rows && data.rows.length > 0) {
          saveToHistory({
            moduleType,
            targetCompany: companyName.trim(),
            completedAt: data.completedAt || new Date().toISOString(),
            themeType,
            themeRows: data.rows,
          });
          setHistoryCount(loadHistory().length);
        }
      });

      es.addEventListener('error', (e) => {
        let msg = 'Analysis failed — please try again.';
        try {
          const data = JSON.parse((e as MessageEvent).data) as { error?: string };
          if (data.error) msg = data.error;
        } catch { /* ignore */ }
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
  }

  return (
    <div style={{ minHeight: '100vh', background: '#080f16', display: 'flex', flexDirection: 'column' }}>

      {/* History Drawer */}
      {showHistory && (
        <HistoryDrawer
          currentModule={moduleType}
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
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, color: cfg.accent, marginBottom: 3 }}>
              REFRACTONE
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>{cfg.icon}</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: '#E8EDF5' }}>{cfg.label}</span>
            </div>
          </div>

          {/* Report History button */}
          <button
            onClick={() => setShowHistory(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(52,145,232,0.1)',
              border: '1px solid rgba(52,145,232,0.25)',
              color: '#6ab8ff',
              borderRadius: 8, padding: '8px 16px',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="12" height="12" rx="2" stroke="#6ab8ff" strokeWidth="1.4" />
              <path d="M3.5 4.5h7M3.5 7h7M3.5 9.5h4" stroke="#6ab8ff" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            Report History
            {historyCount > 0 && (
              <span style={{
                background: '#3491E8', color: '#fff',
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

        {/* ── INPUT ─────────────────────────────────────────────────────────── */}
        {step === 'input' && (
          <div style={{ maxWidth: 580, margin: '48px auto 0' }}>
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
                Company Analysis
              </div>
              <div style={{ fontSize: 13, color: '#7eaabf', marginBottom: 28 }}>
                Enter a company name to generate its key {cfg.label.toLowerCase()}.
              </div>

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#7eaabf', letterSpacing: 0.5 }}>
                    COMPANY NAME
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder={cfg.inputPlaceholder}
                    required
                    autoFocus
                    style={{
                      display: 'block', width: '100%',
                      marginTop: 8, padding: '12px 14px',
                      background: 'rgba(8,15,22,0.8)',
                      border: '1px solid #1e4a68',
                      borderRadius: 8, color: '#E8EDF5',
                      fontSize: 14, outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={!companyName.trim()}
                  style={{
                    width: '100%', padding: '13px',
                    background: companyName.trim()
                      ? `linear-gradient(135deg, ${cfg.accent}, ${darken(cfg.accent)})`
                      : 'rgba(30,74,104,0.4)',
                    border: 'none', borderRadius: 8,
                    color: companyName.trim() ? '#fff' : '#4a7a96',
                    fontSize: 14, fontWeight: 700,
                    cursor: companyName.trim() ? 'pointer' : 'not-allowed',
                    letterSpacing: 0.5,
                  }}
                >
                  Analyse {cfg.label} →
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
                borderTopColor: cfg.accent,
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                margin: '0 auto 24px',
              }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#E8EDF5', marginBottom: 8 }}>
                Analysing {companyName}
              </div>
              <div style={{ fontSize: 13, color: '#7eaabf', marginBottom: 24 }}>
                {job?.currentStep || 'Gathering intelligence and synthesizing themes — this takes 1–2 minutes.'}
              </div>
              <div style={{ height: 4, background: 'rgba(30,74,104,0.5)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${job?.progress ?? 10}%`,
                  background: `linear-gradient(90deg, ${cfg.accent}, ${lighten(cfg.accent)})`,
                  borderRadius: 2,
                  transition: 'width 0.5s ease',
                }} />
              </div>
              <div style={{ fontSize: 11, color: '#4a7a96', marginTop: 8 }}>
                {job?.progress ?? 10}% complete
              </div>
            </div>
          </div>
        )}

        {/* ── RESULTS ───────────────────────────────────────────────────────── */}
        {step === 'results' && job?.rows && (
          <ThemeTable
            rows={job.rows}
            companyName={job.companyName ?? companyName}
            themeType={themeType}
            onReset={handleReset}
            completedAt={job.completedAt}
          />
        )}
      </div>
    </div>
  );
}

function darken(hex: string): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, ((n >> 16) & 0xff) - 30);
  const g = Math.max(0, ((n >> 8) & 0xff) - 30);
  const b = Math.max(0, (n & 0xff) - 30);
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

function lighten(hex: string): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, ((n >> 16) & 0xff) + 40);
  const g = Math.min(255, ((n >> 8) & 0xff) + 40);
  const b = Math.min(255, (n & 0xff) + 40);
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}
