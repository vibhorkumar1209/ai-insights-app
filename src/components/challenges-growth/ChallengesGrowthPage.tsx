'use client';
import StuckJobBanner from '@/components/shared/StuckJobBanner';
import KillSwitchButton from '@/components/shared/KillSwitchButton';

import { useState, useEffect } from 'react';
import { ChallengesGrowthJob } from '@/lib/types';
import {
  loadHistory,
  saveToHistory,
  loadEntryById,
  popPendingRestore,
  HistoryEntry,
} from '@/lib/history';
import { API_ENDPOINTS } from '@/lib/config';
import { useJobManager } from '@/lib/useJobManager';
import ChallengesGrowthTable from './ChallengesGrowthTable';
import HistoryDrawer from '@/components/shared/HistoryDrawer';
import ModuleIcon from '@/components/shared/ModuleIcon';

const ACCENT = '#F59E0B';

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

export default function ChallengesGrowthPage() {
  const [step, setStep] = useState<'input' | 'analysing' | 'results'>('input');
  const [companyName, setCompanyName] = useState('');
  const [companyDomain, setCompanyDomain] = useState('');
  const [historyCount, setHistoryCount] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [displayedJob, setDisplayedJob] = useState<ChallengesGrowthJob | null>(null);

  const { job, error, isStuck, retryJob, startJob, cancelJob } = useJobManager<ChallengesGrowthJob>({
    onProgress: () => setStep('analysing'),
    onComplete: (data) => {
      setStep('results');
      setDisplayedJob(data);
      if (data.rows && data.rows.length > 0) {
        saveToHistory({
          moduleType: 'challenges-growth',
          targetCompany: companyName.trim(),
          completedAt: data.completedAt || new Date().toISOString(),
          challengesGrowthRows: data.rows,
        });
        setHistoryCount(loadHistory().length);
      }
    },
    onError: () => setStep('input'),
  });

  // On mount: load history count + check cross-page pending restore
  useEffect(() => {
    setHistoryCount(loadHistory().length);

    const pendingId = popPendingRestore();
    if (pendingId) {
      const entry = loadEntryById(pendingId);
      if (entry && entry.moduleType === 'challenges-growth') {
        restoreEntry(entry);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function restoreEntry(entry: HistoryEntry) {
    if (!entry.challengesGrowthRows) return;
    setCompanyName(entry.targetCompany);
    setDisplayedJob({
      jobId: entry.id,
      status: 'complete',
      progress: 100,
      rows: entry.challengesGrowthRows,
      companyName: entry.targetCompany,
      createdAt: entry.completedAt,
      completedAt: entry.completedAt,
    });
    setStep('results');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!companyName.trim() || !companyDomain.trim()) return;

    await startJob({
      endpoint: API_ENDPOINTS.challengesGrowth,
      payload: {
        companyName: companyName.trim(),
        companyDomain: companyDomain.trim(),
      },
      streamUrlFactory: (jobId) => API_ENDPOINTS.challengesGrowthStream(jobId),
      persist: { moduleType: 'challenges-growth', targetCompany: companyName.trim() },
    });
  }

  function handleReset() {
    cancelJob();
    setStep('input');
    setCompanyName('');
    setCompanyDomain('');
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', display: 'flex', flexDirection: 'column' }}>

      {/* History Drawer */}
      {showHistory && (
        <HistoryDrawer
          currentModule="challenges-growth"
          onSelectSameModule={restoreEntry}
          onClose={() => setShowHistory(false)}
        />
      )}

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0c3649, #12516E)',
        borderBottom: '1px solid #CCDFEA',
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
              color: 'rgba(255,255,255,0.65)', textDecoration: 'none', fontSize: 13,
              display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
            }}
          >
            ← Home
          </a>
          <div style={{ width: 1, height: 16, background: '#CCDFEA', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, color: ACCENT, marginBottom: 3 }}>
              REFRACTONE
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ModuleIcon id="challenges-growth" size={20} />
              <span style={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF' }}>Challenges &amp; Growth</span>
            </div>
          </div>

          {/* Report History button */}
          <button
            onClick={() => setShowHistory(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(245,158,11,0.1)',
              border: '1px solid rgba(245,158,11,0.25)',
              color: '#fbbf24',
              borderRadius: 8, padding: '8px 16px',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="12" height="12" rx="2" stroke="#fbbf24" strokeWidth="1.4" />
              <path d="M3.5 4.5h7M3.5 7h7M3.5 9.5h4" stroke="#fbbf24" strokeWidth="1.3" strokeLinecap="round" />
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
              background: 'linear-gradient(135deg, #0c3649, #12516E)',
              border: '1px solid #CCDFEA',
              borderRadius: 12, padding: '32px',
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1B2A3D', marginBottom: 6 }}>
                Company Analysis
              </div>
              <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 28 }}>
                Enter a company name to generate its key challenges and growth prospects.
              </div>

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', letterSpacing: 0.5 }}>
                    COMPANY NAME
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Siemens, GE Healthcare, Honeywell"
                    required
                    autoFocus
                    style={{
                      display: 'block', width: '100%',
                      marginTop: 8, padding: '12px 14px',
                      background: '#FFFFFF',
                      border: '1px solid #CCDFEA',
                      borderRadius: 8, color: '#1B2A3D',
                      fontSize: 14, outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', letterSpacing: 0.5 }}>
                    COMPANY DOMAIN <span style={{ color: '#E63946', fontWeight: 400 }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={companyDomain}
                    onChange={(e) => setCompanyDomain(e.target.value)}
                    placeholder="e.g. siemens.com, honeywell.com"
                    required
                    style={{
                      display: 'block', width: '100%',
                      marginTop: 8, padding: '12px 14px',
                      background: '#FFFFFF',
                      border: '1px solid #CCDFEA',
                      borderRadius: 8, color: '#1B2A3D',
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
                      ? `linear-gradient(135deg, ${ACCENT}, ${darken(ACCENT)})`
                      : '#EDF4F8',
                    border: 'none', borderRadius: 8,
                    color: companyName.trim() ? '#fff' : '#4a7a96',
                    fontSize: 14, fontWeight: 700,
                    cursor: companyName.trim() ? 'pointer' : 'not-allowed',
                    letterSpacing: 0.5,
                  }}
                >
                  Analyse Challenges &amp; Growth →
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ── ANALYSING ─────────────────────────────────────────────────────── */}
        {step === 'analysing' && (
          <div style={{ maxWidth: 580, margin: '48px auto 0' }}>
            <div style={{
              background: 'linear-gradient(135deg, #0c3649, #12516E)',
              border: '1px solid #CCDFEA',
              borderRadius: 12, padding: '36px 32px', textAlign: 'center',
            }}>
              <div style={{
                width: 48, height: 48,
                border: '3px solid #E8F4F8',
                borderTopColor: ACCENT,
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                margin: '0 auto 24px',
              }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#1B2A3D', marginBottom: 8 }}>
                Analysing {companyName}
              </div>
              <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 24 }}>
                {job?.currentStep || 'Researching challenges and growth prospects — this takes 1–2 minutes.'}
              </div>
              <div style={{ height: 4, background: '#E8F4F8', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${job?.progress ?? 10}%`,
                  background: `linear-gradient(90deg, ${ACCENT}, ${lighten(ACCENT)})`,
                  borderRadius: 2,
                  transition: 'width 0.5s ease',
                }} />
              </div>
              <div style={{ fontSize: 11, color: '#6B7280', marginTop: 8 }}>
                {job?.progress ?? 10}% complete
            {isStuck && <StuckJobBanner onRetry={retryJob} />}
              </div>
              <KillSwitchButton onCancel={handleReset} />
            </div>
          </div>
        )}

        {/* ── RESULTS ───────────────────────────────────────────────────────── */}
        {step === 'results' && (displayedJob || job)?.rows && (
          <ChallengesGrowthTable
            rows={(displayedJob || job)!.rows}
            companyName={(displayedJob || job)?.companyName ?? companyName}
            onReset={handleReset}
            completedAt={(displayedJob || job)?.completedAt}
          />
        )}
      </div>
    </div>
  );
}
