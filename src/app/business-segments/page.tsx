'use client';
import StuckJobBanner from '@/components/shared/StuckJobBanner';
import KillSwitchButton from '@/components/shared/KillSwitchButton';

import { useState, useEffect } from 'react';
import { BusinessSegmentsJob } from '@/lib/types';
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
const STATUS_LABELS: Record<string, string> = {
  researching: 'Researching business segments…',
  synthesizing: 'Analyzing segments and strategy…',
};

export default function BusinessSegmentsPage() {
  const [step, setStep] = useState<'input' | 'analysing' | 'results'>('input');
  const [companyName, setCompanyName] = useState('');
  const [companyDomain, setCompanyDomain] = useState('');
  const [historyCount, setHistoryCount] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [displayedJob, setDisplayedJob] = useState<BusinessSegmentsJob | null>(null);

  const { job, error, isStuck, retryJob, startJob, cancelJob } = useJobManager<BusinessSegmentsJob>({
    onProgress: () => setStep('analysing'),
    onComplete: (data) => {
      setStep('results');
      setDisplayedJob(data);
      saveToHistory({
        moduleType: 'business-segments',
        targetCompany: companyName.trim(),
        completedAt: data.completedAt || new Date().toISOString(),
        businessSegmentsData: data,
      });
      setHistoryCount(loadHistory().length);
    },
  });

  // On mount: load history count + check pending restore
  useEffect(() => {
    setHistoryCount(loadHistory().length);
    const pendingId = popPendingRestore();
    if (pendingId) {
      const entry = loadEntryById(pendingId);
      if (entry?.moduleType === 'business-segments' && entry.businessSegmentsData) {
        restoreEntry(entry);
      }
    }
  }, []);

  function restoreEntry(entry: HistoryEntry) {
    if (!entry.businessSegmentsData) return;
    setCompanyName(entry.targetCompany);
    setDisplayedJob(entry.businessSegmentsData);
    setStep('results');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!companyName.trim()) return;

    await startJob({
      endpoint: API_ENDPOINTS.businessSegments,
      payload: {
        companyName: companyName.trim(),
        domain: companyDomain.trim() || undefined,
      },
      streamUrlFactory: (jobId) => API_ENDPOINTS.businessSegmentsStream(jobId),
      persist: { moduleType: 'business-segments', targetCompany: companyName.trim() },
    });
  }

  function handleReset() {
    cancelJob();
    setStep('input');
    setCompanyName('');
    setCompanyDomain('');
  }

  const currentJob = displayedJob || job;

  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', display: 'flex', flexDirection: 'column' }}>
      {showHistory && (
        <HistoryDrawer
          currentModule="business-segments"
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
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 16 }}>
          <a href="/" style={{ color: 'rgba(255,255,255,0.65)', textDecoration: 'none', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
            ← Home
          </a>
          <div style={{ width: 1, height: 16, background: '#CCDFEA' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, color: ACCENT, marginBottom: 3 }}>REFRACTONE</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ModuleIcon id="business-segments" size={20} />
              <span style={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF' }}>Business Segments</span>
            </div>
          </div>
          <button
            onClick={() => setShowHistory(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: `rgba(124,58,237,0.1)`,
              border: `1px solid rgba(124,58,237,0.25)`,
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
                background: ACCENT, color: '#FFFFFF',
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

      {/* Main Content */}
      <div style={{ flex: 1, padding: '32px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 700 }}>
          {step === 'input' && (
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: '#1B2A3D', marginBottom: 8 }}>Analyze Business Segments</h2>
              <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 32 }}>
                Understand current business segments and strategic role of a company
              </p>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 8 }}>
                    Company Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Apple, Microsoft, Tesla"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: '#FFFFFF',
                      border: '1px solid #CCDFEA',
                      borderRadius: 8,
                      color: '#1B2A3D',
                      fontSize: 13,
                      fontFamily: 'inherit',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 8 }}>
                    Domain <span style={{ color: '#5a7f8f' }}>(optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., apple.com"
                    value={companyDomain}
                    onChange={(e) => setCompanyDomain(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: '#FFFFFF',
                      border: '1px solid #CCDFEA',
                      borderRadius: 8,
                      color: '#1B2A3D',
                      fontSize: 13,
                      fontFamily: 'inherit',
                    }}
                  />
                </div>
                <button
                  type="submit"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: ACCENT,
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Analyze Segments
                </button>
              </form>
            </div>
          )}

          {step === 'analysing' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: ACCENT, marginBottom: 24 }}>
                {STATUS_LABELS[job?.currentStep || 'researching'] || 'Analyzing segments…'}
              </div>
              <div style={{ width: '100%', height: 6, background: '#E8F4F8', borderRadius: 4, overflow: 'hidden', marginBottom: 16 }}>
                <div style={{
                  height: '100%',
                  background: ACCENT,
                  width: `${job?.progress || 0}%`,
                  transition: 'width 0.3s ease',
                }} />
              </div>
              <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 24 }}>
                {job?.progress || 0}% complete
            {isStuck && <StuckJobBanner onRetry={retryJob} />}
              </div>
              <KillSwitchButton onCancel={cancelJob} />
              <button
                onClick={() => cancelJob()}
                style={{
                  padding: '10px 20px',
                  background: 'transparent',
                  color: '#EF4444',
                  border: '1px solid #EF4444',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          )}

          {step === 'results' && currentJob && (
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: '#FFFFFF', marginBottom: 24 }}>
                {currentJob.companyName}
              </h2>

              {currentJob.segments && currentJob.segments.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {currentJob.segments.map((segment, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: '#F3F8FA',
                        border: '1px solid #CCDFEA',
                        borderRadius: 8,
                        padding: 16,
                      }}
                    >
                      <h3 style={{ fontSize: 14, fontWeight: 700, color: ACCENT, marginBottom: 8 }}>
                        {segment.name}
                      </h3>
                      <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>
                        {segment.description}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: 14, color: '#6B7280' }}>No business segments found for this company.</div>
              )}

              {error && (
                <div style={{ marginTop: 16, padding: 16, background: '#3d1e1e', borderRadius: 8, color: '#EF4444', fontSize: 13 }}>
                  Error: {error}
                </div>
              )}

              <button
                onClick={handleReset}
                style={{
                  marginTop: 24,
                  width: '100%',
                  padding: '12px 16px',
                  background: ACCENT,
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Analyze Another Company
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
