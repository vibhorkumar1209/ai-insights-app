'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { loadHistory, saveToHistory, loadEntryById, popPendingRestore, HistoryEntry } from '@/lib/history';
import HistoryDrawer from '@/components/shared/HistoryDrawer';
import ModuleIcon from '@/components/shared/ModuleIcon';
import StuckJobBanner from '@/components/shared/StuckJobBanner';
import { API_ENDPOINTS } from '@/lib/config';
import { useJobManager } from '@/lib/useJobManager';
import { FirmographicResult, BusinessDescriptionResult } from '@ai-insights/types';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').trim();

type Step = 'input' | 'loading' | 'results';

export default function BusinessDescriptionPage() {
  const [step, setStep] = useState<Step>('input');
  const [companyName, setCompanyName] = useState('');
  const [domain, setDomain] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [historyCount, setHistoryCount] = useState(0);
  const [showHistory, setShowHistory] = useState(false);

  // Firmographic widget state
  const [firmographicJob, setFirmographicJob] = useState<FirmographicResult | null>(null);
  const firmographicEsRef = useRef<EventSource | null>(null);

  // Business description job — async job + SSE (with a polling fallback if
  // the SSE connection drops), replacing what used to be a single blocking
  // fetch that could take up to ~5 minutes and had no retry or progress
  // feedback if a gateway timed it out.
  const { job, isStuck, startJob, retryJob } = useJobManager<BusinessDescriptionResult>({
    onComplete: (j) => {
      if (!j.description) {
        setError('No description could be generated for this company');
        setStep('input');
        return;
      }
      setDescription(j.description);
      setStep('results');
      saveToHistory({
        moduleType: 'business-description',
        targetCompany: companyName.trim(),
        completedAt: j.completedAt || new Date().toISOString(),
        businessDescription: j.description,
        companyDomain: domain.trim() || undefined,
      });
      setHistoryCount(loadHistory().length);
    },
    onError: (msg) => {
      setError(msg);
      setStep('input');
    },
  });

  useEffect(() => {
    setHistoryCount(loadHistory().length);
    const pendingId = popPendingRestore();
    if (pendingId) {
      const entry = loadEntryById(pendingId);
      if (entry?.moduleType === 'business-description' && entry.businessDescription) {
        setCompanyName(entry.targetCompany);
        setDomain(entry.companyDomain ?? '');
        setDescription(entry.businessDescription);
        setStep('results');
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => { firmographicEsRef.current?.close(); }, []);

  // Kick off firmographic lookup (fire-and-forget alongside business description)
  async function fetchFirmographic(name: string, domainHint: string) {
    try {
      const res = await fetch(`${API_URL}/api/firmographic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName: name, companyDomain: domainHint || undefined }),
      });
      if (!res.ok) return;
      const { jobId } = await res.json() as { jobId: string };

      const es = new EventSource(`${API_URL}/api/firmographic/${jobId}/stream`);
      firmographicEsRef.current = es;

      es.addEventListener('progress', (ev) => {
        const d = JSON.parse((ev as MessageEvent).data) as Partial<FirmographicResult>;
        setFirmographicJob((prev) => ({ ...(prev ?? {} as FirmographicResult), ...d }));
      });
      es.addEventListener('result', (ev) => {
        const d = JSON.parse((ev as MessageEvent).data) as FirmographicResult;
        setFirmographicJob(d);
        es.close();
      });
      es.onerror = () => es.close();
    } catch { /* non-blocking */ }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!companyName.trim()) return;
    const name = companyName.trim();
    const domainTrimmed = domain.trim();

    setError('');
    setStep('loading');
    setFirmographicJob(null);
    firmographicEsRef.current?.close();

    // Fire firmographic lookup in parallel (don't await)
    fetchFirmographic(name, domainTrimmed);

    await startJob({
      endpoint: API_ENDPOINTS.businessDescription,
      streamUrlFactory: (jobId) => API_ENDPOINTS.businessDescriptionStream(jobId),
      payload: { companyName: name, domain: domainTrimmed || undefined },
      persist: { moduleType: 'business-description', targetCompany: name },
    });
  }

  function handleReset() {
    firmographicEsRef.current?.close();
    setStep('input');
    setCompanyName('');
    setDomain('');
    setDescription('');
    setError('');
    setFirmographicJob(null);
  }

  function restoreEntry(entry: HistoryEntry) {
    if (entry.moduleType !== 'business-description' || !entry.businessDescription) return;
    setCompanyName(entry.targetCompany);
    setDomain(entry.companyDomain ?? '');
    setDescription(entry.businessDescription);
    setStep('results');
  }

  const accent = '#3491E8';
  const firmographicReady = firmographicJob?.status === 'complete' && !!firmographicJob.latestRevenue;
  const firmographicPending = firmographicJob && firmographicJob.status !== 'complete' && firmographicJob.status !== 'error';
  const headquarters = firmographicJob
    ? [firmographicJob.headquartersCity, firmographicJob.headquartersState, firmographicJob.headquartersCountry].filter(Boolean).join(', ')
    : '';

  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', color: '#1B2A3D' }}>
      {showHistory && (
        <HistoryDrawer
          currentModule="business-description"
          onSelectSameModule={restoreEntry}
          onClose={() => setShowHistory(false)}
        />
      )}

      {/* Header */}
      <header style={{
        background: 'linear-gradient(135deg, #0c3649, #12516E)',
        borderBottom: '1px solid #CCDFEA',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link href="/" style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, textDecoration: 'none' }}>
            &larr; Home
          </Link>
          <span style={{ color: '#CCDFEA' }}>|</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ModuleIcon id="business-description" size={22} />
            <span style={{ fontWeight: 700, fontSize: 16, color: '#FFFFFF' }}>Business Description</span>
          </div>
        </div>
        <button
          onClick={() => setShowHistory(true)}
          style={{
            background: 'rgba(6,182,212,0.1)',
            border: '1px solid rgba(6,182,212,0.3)',
            color: accent,
            borderRadius: 8,
            padding: '7px 14px',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          History {historyCount > 0 && `(${historyCount})`}
        </button>
      </header>

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '40px 20px' }}>
        {/* Input Form */}
        {step === 'input' && (
          <form onSubmit={handleSubmit}>
            <div style={{
              background: '#F3F8FA',
              border: '1px solid #CCDFEA',
              borderRadius: 14,
              padding: '32px 28px',
            }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6, color: '#1B2A3D' }}>
                Business Description
              </h2>
              <p style={{ fontSize: 13, color: '#374B5C', marginBottom: 28, lineHeight: 1.5 }}>
                Generate a concise 100–250 word description of any company&apos;s business, plus its latest annual revenue.
              </p>

              <label style={{ display: 'block', marginBottom: 20 }}>
                <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: accent, display: 'block', marginBottom: 8 }}>
                  Company Name *
                </span>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Medtronic, Salesforce, Tesla"
                  required
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid #CCDFEA', background: '#FFFFFF', color: '#1B2A3D', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                />
              </label>

              <label style={{ display: 'block', marginBottom: 28 }}>
                <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: accent, display: 'block', marginBottom: 8 }}>
                  Domain (optional)
                </span>
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="e.g. medtronic.com"
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid #CCDFEA', background: '#FFFFFF', color: '#1B2A3D', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                />
              </label>

              {error && <div style={{ color: '#E63946', fontSize: 13, marginBottom: 16 }}>{error}</div>}

              <button
                type="submit"
                style={{
                  width: '100%', padding: '13px 0', borderRadius: 10, border: 'none',
                  background: `linear-gradient(135deg, ${accent}, #0891B2)`,
                  color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer',
                }}
              >
                Generate Description &rarr;
              </button>
            </div>
          </form>
        )}

        {/* Loading */}
        {step === 'loading' && (
          <div style={{ background: '#F3F8FA', border: '1px solid #CCDFEA', borderRadius: 14, padding: '48px 28px', textAlign: 'center' }}>
            <div style={{ width: 40, height: 40, border: `3px solid rgba(6,182,212,0.2)`, borderTopColor: accent, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 20px' }} />
            <p style={{ color: '#1B2A3D', fontSize: 14 }}>
              {job?.currentStep || <>Researching <strong>{companyName}</strong>...</>}
            </p>
            {typeof job?.progress === 'number' && (
              <div style={{ width: '100%', maxWidth: 280, height: 6, background: '#CCDFEA', borderRadius: 4, margin: '16px auto 0', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${job.progress}%`, background: accent, transition: 'width 0.4s ease', borderRadius: 4 }} />
              </div>
            )}
            {isStuck && <StuckJobBanner onRetry={retryJob} />}
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Results — description + firmographic profile side by side */}
        {step === 'results' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Firmographic card — compact, above or beside description */}
            <div style={{ display: 'grid', gridTemplateColumns: firmographicReady ? '1fr 260px' : '1fr', gap: 16, alignItems: 'start' }}>

              {/* Business Description card */}
              <div style={{ background: '#F3F8FA', border: '1px solid rgba(6,182,212,0.2)', borderRadius: 14, padding: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <ModuleIcon id="business-description" size={24} />
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1B2A3D', margin: 0 }}>{companyName}</h2>
                  {domain && (
                    <span style={{ fontSize: 12, color: '#6B7280', background: 'rgba(6,182,212,0.1)', borderRadius: 6, padding: '3px 8px' }}>{domain}</span>
                  )}
                </div>
                <div style={{ borderTop: '1px solid rgba(30,74,104,0.15)', paddingTop: 20 }}>
                  <p style={{ fontSize: 15, lineHeight: 1.75, color: '#374B5C', whiteSpace: 'pre-wrap', margin: 0 }}>{description}</p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                  <span style={{ fontSize: 11, color: '#6B7280' }}>{description.split(/\s+/).filter(Boolean).length} words</span>
                </div>
              </div>

              {/* Firmographic card — shown when ready */}
              {firmographicReady && firmographicJob && (
                <div style={{ background: 'linear-gradient(135deg, #0c3649, #12516E)', border: '1px solid #1E4A68', borderRadius: 14, padding: '24px 20px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 12 }}>
                    <ModuleIcon id="firmographic" size={16} />
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Annual Revenue</span>
                  </div>
                  <div style={{ fontSize: 38, fontWeight: 900, color: '#FFFFFF', letterSpacing: -1, lineHeight: 1 }}>
                    {firmographicJob.latestRevenue}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 6, marginBottom: 12 }}>
                    FY{firmographicJob.revenueYear}
                    {firmographicJob.currency && firmographicJob.currency !== 'USD' ? ` · ${firmographicJob.currency}` : ''}
                  </div>
                  {firmographicJob.yoyGrowth != null && (
                    <div style={{
                      display: 'inline-block', padding: '4px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700,
                      background: firmographicJob.yoyGrowth >= 0 ? 'rgba(16,185,129,0.15)' : 'rgba(230,57,70,0.15)',
                      color: firmographicJob.yoyGrowth >= 0 ? '#10B981' : '#E63946',
                    }}>
                      {firmographicJob.yoyGrowth >= 0 ? '▲' : '▼'} {Math.abs(firmographicJob.yoyGrowth).toFixed(1)}% YoY
                    </div>
                  )}
                  {firmographicJob.previousRevenue && (
                    <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                      Prior year (FY{firmographicJob.previousYear}): {firmographicJob.previousRevenue}
                    </div>
                  )}
                  {firmographicJob.ticker && (
                    <div style={{ marginTop: 8, fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                      <span style={{ fontFamily: 'monospace', color: accent }}>{firmographicJob.ticker}</span>
                      {firmographicJob.exchange ? ` · ${firmographicJob.exchange}` : ''}
                    </div>
                  )}

                  {/* Firmographic profile fields */}
                  {(firmographicJob.foundedYear || headquarters || firmographicJob.employeeRange || firmographicJob.website || firmographicJob.linkedinUrl) && (
                    <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.08)', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {firmographicJob.foundedYear && (
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>Founded: <span style={{ color: '#fff', fontWeight: 600 }}>{firmographicJob.foundedYear}</span></div>
                      )}
                      {headquarters && (
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>HQ: <span style={{ color: '#fff', fontWeight: 600 }}>{headquarters}</span></div>
                      )}
                      {firmographicJob.employeeRange && (
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>Employees: <span style={{ color: '#fff', fontWeight: 600 }}>{firmographicJob.employeeRange}</span></div>
                      )}
                      {firmographicJob.website && (
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>
                          Website: <a href={firmographicJob.website} target="_blank" rel="noopener noreferrer" style={{ color: accent, fontWeight: 600, textDecoration: 'none' }}>
                            {firmographicJob.website.replace(/^https?:\/\//, '')}
                          </a>
                        </div>
                      )}
                      {firmographicJob.linkedinUrl && (
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>
                          <a href={firmographicJob.linkedinUrl} target="_blank" rel="noopener noreferrer" style={{ color: accent, fontWeight: 600, textDecoration: 'none' }}>
                            LinkedIn →
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Firmographic loading indicator */}
              {firmographicPending && (
                <div style={{ background: '#F3F8FA', border: '1px solid #CCDFEA', borderRadius: 14, padding: '24px 20px', textAlign: 'center' }}>
                  <div style={{ width: 24, height: 24, border: `2px solid rgba(52,145,232,0.2)`, borderTopColor: accent, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 10px' }} />
                  <div style={{ fontSize: 12, color: '#6B7280' }}>{firmographicJob?.currentStep || 'Fetching company profile…'}</div>
                </div>
              )}
            </div>

            <button
              onClick={handleReset}
              style={{ alignSelf: 'flex-start', padding: '10px 22px', borderRadius: 8, border: `1px solid ${accent}`, background: 'transparent', color: accent, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              New Description
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
