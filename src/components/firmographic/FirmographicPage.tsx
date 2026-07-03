'use client';
import React, { useState, useRef, useEffect } from 'react';
import { FirmographicResult } from '@ai-insights/types';
import { API_ENDPOINTS } from '@/lib/config';
import ModuleIcon from '@/components/shared/ModuleIcon';
import HistoryDrawer from '@/components/shared/HistoryDrawer';
import { loadHistory, saveToHistory, loadEntryById, popPendingRestore, HistoryEntry } from '@/lib/history';

const ACCENT = '#3491E8';
const DS_RED = '#E63946';

function formatHeadquarters(job: FirmographicResult): string {
  return [job.headquartersCity, job.headquartersState, job.headquartersCountry].filter(Boolean).join(', ');
}

export default function FirmographicPage() {
  const [companyName, setCompanyName] = useState('');
  const [companyDomain, setCompanyDomain] = useState('');
  const [job, setJob] = useState<FirmographicResult | null>(null);
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
      if (entry?.moduleType === 'firmographic' && entry.firmographicData) {
        setCompanyName(entry.targetCompany);
        setCompanyDomain(entry.companyDomain ?? '');
        setJob(entry.firmographicData);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function restoreEntry(entry: HistoryEntry) {
    if (entry.moduleType !== 'firmographic' || !entry.firmographicData) return;
    setCompanyName(entry.targetCompany);
    setCompanyDomain(entry.companyDomain ?? '');
    setJob(entry.firmographicData);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!companyName.trim()) return;
    setError(null);
    setJob(null);
    esRef.current?.close();

    try {
      const res = await fetch(API_ENDPOINTS.firmographic, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName: companyName.trim(), companyDomain: companyDomain.trim() || undefined }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error || `Server error ${res.status}`);
      }
      const { jobId } = await res.json() as { jobId: string };

      const es = new EventSource(API_ENDPOINTS.firmographicStream(jobId));
      esRef.current = es;

      es.addEventListener('progress', (ev) => {
        const data = JSON.parse((ev as MessageEvent).data) as Partial<FirmographicResult>;
        setJob((prev) => ({ ...(prev ?? {} as FirmographicResult), ...data }));
      });
      es.addEventListener('result', (ev) => {
        const data = JSON.parse((ev as MessageEvent).data) as FirmographicResult;
        setJob(data);
        es.close();
        if (data.status === 'complete') {
          saveToHistory({
            moduleType: 'firmographic',
            targetCompany: companyName.trim(),
            completedAt: new Date().toISOString(),
            companyDomain: companyDomain.trim() || undefined,
            firmographicData: data,
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
      es.onerror = () => { es.close(); };
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
  }

  const isRunning = job && job.status !== 'complete' && job.status !== 'error';
  const isDone = job?.status === 'complete';
  const headquarters = job ? formatHeadquarters(job) : '';

  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', display: 'flex', flexDirection: 'column' }}>
      {showHistory && (
        <HistoryDrawer
          currentModule="firmographic"
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
              <ModuleIcon id="firmographic" size={20} />
              <span style={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF' }}>Firmographic</span>
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
      <div style={{ flex: 1, maxWidth: 700, margin: '0 auto', width: '100%', padding: '40px 24px' }}>

        {/* Input form */}
        {!isDone && (
          <div style={{ background: 'linear-gradient(135deg, #0c3649, #12516E)', border: '1px solid #CCDFEA', borderRadius: 12, padding: 32 }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: ACCENT, textTransform: 'uppercase', marginBottom: 6 }}>Company Firmographic Lookup</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#FFFFFF', marginBottom: 8 }}>Revenue &amp; Company Profile</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', maxWidth: 460, margin: '0 auto' }}>
                Enter a company name (and optionally domain) to retrieve its latest annual revenue plus founding year, headquarters, employee count, website, and LinkedIn profile.
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
                <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.65)', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>COMPANY DOMAIN (optional)</label>
                <input
                  value={companyDomain}
                  onChange={(e) => setCompanyDomain(e.target.value)}
                  placeholder="e.g. microsoft.com, infosys.com"
                  disabled={!!isRunning}
                  style={{ width: '100%', padding: '12px 14px', background: '#FFFFFF', border: '1px solid #CCDFEA', borderRadius: 8, color: '#1B2A3D', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              {/* Progress */}
              {isRunning && job && (
                <div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginBottom: 6 }}>{job.currentStep}</div>
                  <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: ACCENT, width: `${job.progress}%`, transition: 'width 0.4s ease', borderRadius: 4 }} />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={!companyName.trim() || !!isRunning}
                style={{
                  padding: '14px', borderRadius: 8, border: 'none',
                  background: companyName.trim() && !isRunning ? `linear-gradient(135deg, ${ACCENT}, #2563EB)` : 'rgba(52,145,232,0.3)',
                  color: '#fff', fontSize: 14, fontWeight: 700,
                  cursor: companyName.trim() && !isRunning ? 'pointer' : 'not-allowed',
                  letterSpacing: 0.5,
                }}
              >
                {isRunning ? 'Looking up…' : 'Get Firmographic Profile →'}
              </button>
            </form>
          </div>
        )}

        {/* Result card */}
        {isDone && job && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Main revenue card */}
            <div style={{ background: 'linear-gradient(135deg, #0c3649, #12516E)', border: '1px solid #CCDFEA', borderRadius: 16, padding: '36px 32px', textAlign: 'center' }}>
              {job.companyInfo?.name && (
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
                  {job.ticker && <span style={{ fontFamily: 'monospace', color: ACCENT, fontWeight: 700 }}>{job.ticker}</span>}
                  {job.exchange && <span style={{ color: 'rgba(255,255,255,0.4)' }}> · {job.exchange}</span>}
                </div>
              )}
              <div style={{ fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>
                {job.companyInfo?.name || job.companyName}
              </div>
              <div style={{ fontSize: 52, fontWeight: 900, color: '#FFFFFF', letterSpacing: -1, lineHeight: 1.1, marginBottom: 8 }}>
                {job.latestRevenue || 'N/A'}
              </div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', marginBottom: 16 }}>
                Annual Revenue · FY{job.revenueYear || ''}
                {job.currency && job.currency !== 'USD' && ` · ${job.currency}`}
              </div>
              {job.yoyGrowth != null && (
                <div style={{
                  display: 'inline-block', padding: '6px 18px', borderRadius: 20,
                  background: job.yoyGrowth >= 0 ? 'rgba(16,185,129,0.15)' : 'rgba(230,57,70,0.15)',
                  color: job.yoyGrowth >= 0 ? '#10B981' : DS_RED,
                  fontWeight: 700, fontSize: 15,
                }}>
                  {job.yoyGrowth >= 0 ? '▲' : '▼'} {Math.abs(job.yoyGrowth).toFixed(1)}% YoY
                </div>
              )}
            </div>

            {/* Prior year */}
            {job.previousRevenue && (
              <div style={{ background: '#F3F8FA', border: '1px solid #CCDFEA', borderRadius: 12, padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 13, color: '#5A6E7A' }}>Previous Year (FY{job.previousYear})</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#1B2A3D' }}>{job.previousRevenue}</div>
              </div>
            )}

            {/* Data source */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: '#8A9DAD', padding: '0 4px' }}>
              <span>Source: {job.dataSource || 'Yahoo Finance'}</span>
              {job.companyInfo?.marketCap && <span>Market Cap: {job.companyInfo.marketCap}</span>}
            </div>

            {/* Firmographic profile */}
            {(job.foundedYear || headquarters || job.employeeRange || job.website || job.linkedinUrl) && (
              <div style={{ background: '#F3F8FA', border: '1px solid #CCDFEA', borderRadius: 12, padding: '20px 24px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: '#5A6E7A', textTransform: 'uppercase', marginBottom: 14 }}>
                  Company Profile
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px' }}>
                  {job.foundedYear && (
                    <div>
                      <div style={{ fontSize: 11, color: '#8A9DAD', marginBottom: 3 }}>Founded</div>
                      <div style={{ fontSize: 14, color: '#1B2A3D', fontWeight: 600 }}>{job.foundedYear}</div>
                    </div>
                  )}
                  {headquarters && (
                    <div>
                      <div style={{ fontSize: 11, color: '#8A9DAD', marginBottom: 3 }}>Headquarters</div>
                      <div style={{ fontSize: 14, color: '#1B2A3D', fontWeight: 600 }}>{headquarters}</div>
                    </div>
                  )}
                  {job.employeeRange && (
                    <div>
                      <div style={{ fontSize: 11, color: '#8A9DAD', marginBottom: 3 }}>Employees</div>
                      <div style={{ fontSize: 14, color: '#1B2A3D', fontWeight: 600 }}>{job.employeeRange}</div>
                    </div>
                  )}
                  {job.website && (
                    <div>
                      <div style={{ fontSize: 11, color: '#8A9DAD', marginBottom: 3 }}>Website</div>
                      <a href={job.website} target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, color: ACCENT, fontWeight: 600, textDecoration: 'none' }}>
                        {job.website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  )}
                  {job.linkedinUrl && (
                    <div>
                      <div style={{ fontSize: 11, color: '#8A9DAD', marginBottom: 3 }}>LinkedIn</div>
                      <a href={job.linkedinUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, color: ACCENT, fontWeight: 600, textDecoration: 'none' }}>
                        View company page →
                      </a>
                    </div>
                  )}
                </div>
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
