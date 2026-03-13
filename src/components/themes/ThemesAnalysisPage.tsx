'use client';

import { useState, useEffect, useRef } from 'react';
import { ThemesJob, ThemeType } from '@/lib/types';
import ThemeTable from './ThemeTable';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

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

  const [step, setStep] = useState<'input' | 'analysing' | 'results'>('input');
  const [companyName, setCompanyName] = useState('');
  const [job, setJob] = useState<ThemesJob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Clean up SSE on unmount
  useEffect(() => {
    return () => {
      eventSourceRef.current?.close();
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!companyName.trim()) return;

    setError(null);
    setStep('analysing');

    try {
      // Create job
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

      // Open SSE stream
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
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0c3649 0%, #0a2233 100%)',
        borderBottom: '1px solid #1e4a68',
        padding: '20px 32px',
        flexShrink: 0,
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: cfg.accent, marginBottom: 4 }}>
              REFRACTONE
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>{cfg.icon}</span>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#E8EDF5' }}>{cfg.label}</div>
            </div>
            <div style={{ fontSize: 13, color: '#7eaabf', marginTop: 4 }}>{cfg.description}</div>
          </div>
          <a
            href="/"
            style={{
              background: 'rgba(30,74,104,0.3)',
              border: '1px solid #1e4a68',
              color: '#7eaabf',
              borderRadius: 8,
              padding: '8px 16px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'none',
            }}
          >
            ← All Modules
          </a>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, maxWidth: 1200, margin: '0 auto', width: '100%', padding: '32px' }}>

        {/* ── INPUT STEP ────────────────────────────────────────────────────── */}
        {step === 'input' && (
          <div style={{ maxWidth: 580, margin: '48px auto 0' }}>
            {error && (
              <div style={{
                background: 'rgba(230,57,70,0.1)',
                border: '1px solid rgba(230,57,70,0.3)',
                borderRadius: 8,
                padding: '12px 16px',
                marginBottom: 24,
                fontSize: 13,
                color: '#ff6b75',
              }}>
                {error}
              </div>
            )}

            <div style={{
              background: 'linear-gradient(135deg, #0c3649, #0a2233)',
              border: '1px solid #1e4a68',
              borderRadius: 12,
              padding: '32px',
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
                      display: 'block',
                      width: '100%',
                      marginTop: 8,
                      padding: '12px 14px',
                      background: 'rgba(8,15,22,0.8)',
                      border: '1px solid #1e4a68',
                      borderRadius: 8,
                      color: '#E8EDF5',
                      fontSize: 14,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={!companyName.trim()}
                  style={{
                    width: '100%',
                    padding: '13px',
                    background: companyName.trim()
                      ? `linear-gradient(135deg, ${cfg.accent}, ${darken(cfg.accent)})`
                      : 'rgba(30,74,104,0.4)',
                    border: 'none',
                    borderRadius: 8,
                    color: companyName.trim() ? '#fff' : '#4a7a96',
                    fontSize: 14,
                    fontWeight: 700,
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

        {/* ── ANALYSING STEP ────────────────────────────────────────────────── */}
        {step === 'analysing' && (
          <div style={{ maxWidth: 580, margin: '48px auto 0' }}>
            <div style={{
              background: 'linear-gradient(135deg, #0c3649, #0a2233)',
              border: '1px solid #1e4a68',
              borderRadius: 12,
              padding: '36px 32px',
              textAlign: 'center',
            }}>
              {/* Spinner */}
              <div style={{
                width: 48,
                height: 48,
                border: `3px solid rgba(30,74,104,0.4)`,
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

              {/* Progress bar */}
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

        {/* ── RESULTS STEP ──────────────────────────────────────────────────── */}
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

// ── Colour helpers ────────────────────────────────────────────────────────────
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
