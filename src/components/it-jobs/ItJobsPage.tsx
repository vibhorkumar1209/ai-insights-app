'use client';
import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ItJobResult } from '@ai-insights/types';
import { API_ENDPOINTS } from '@/lib/config';
import ModuleIcon from '@/components/shared/ModuleIcon';
import HistoryDrawer from '@/components/shared/HistoryDrawer';
import { loadHistory, saveToHistory, loadEntryById, popPendingRestore, HistoryEntry } from '@/lib/history';

const ACCENT = '#3491E8';
const DS_RED = '#E63946';
const GREEN = '#10B981';

export default function ItJobsPage() {
  const [companyName, setCompanyName] = useState('');
  const [companyDomain, setCompanyDomain] = useState('');
  const [linkedinHandle, setLinkedinHandle] = useState('');
  const [job, setJob] = useState<ItJobResult | null>(null);
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
      if (entry?.moduleType === 'it-jobs' && entry.itJobData) {
        restoreEntry(entry);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function restoreEntry(entry: HistoryEntry) {
    if (entry.moduleType !== 'it-jobs' || !entry.itJobData) return;
    setCompanyName(entry.itJobData.companyName);
    setCompanyDomain(entry.itJobData.companyDomain ?? '');
    setLinkedinHandle(entry.itJobData.linkedinHandle ?? '');
    setJob(entry.itJobData);
    setError(null);
  }

  const isFormValid = !!companyName.trim() && !!companyDomain.trim();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isFormValid) return;
    setError(null);
    setJob(null);
    esRef.current?.close();

    try {
      const res = await fetch(API_ENDPOINTS.itJobs, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: companyName.trim(),
          companyDomain: companyDomain.trim(),
          linkedinHandle: linkedinHandle.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error || `Server error ${res.status}`);
      }
      const { jobId } = await res.json() as { jobId: string };

      const es = new EventSource(API_ENDPOINTS.itJobsStream(jobId));
      esRef.current = es;

      es.addEventListener('progress', (ev) => {
        const data = JSON.parse((ev as MessageEvent).data) as Partial<ItJobResult>;
        setJob((prev) => ({ ...(prev ?? {} as ItJobResult), ...data }));
      });
      es.addEventListener('result', (ev) => {
        const data = JSON.parse((ev as MessageEvent).data) as ItJobResult;
        setJob(data);
        es.close();
        if (data.status === 'complete') {
          saveToHistory({
            moduleType: 'it-jobs',
            targetCompany: companyName.trim(),
            completedAt: new Date().toISOString(),
            companyDomain: companyDomain.trim() || undefined,
            itJobData: data,
          });
          setHistoryCount(loadHistory().length);
        }
      });
      es.addEventListener('error', (ev) => {
        const me = ev as MessageEvent;
        if (me.data) {
          try {
            const d = JSON.parse(me.data) as { error?: string };
            setError(d.error || 'Search failed');
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
    setLinkedinHandle('');
  }

  const isRunning = job && job.status !== 'complete' && job.status !== 'error';
  const isDone = job?.status === 'complete' && !!job.content;

  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', display: 'flex', flexDirection: 'column' }}>
      {showHistory && (
        <HistoryDrawer
          currentModule="it-jobs"
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
              <ModuleIcon id="it-jobs" size={20} />
              <span style={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF' }}>IT Jobs</span>
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
      <div style={{ flex: 1, maxWidth: isDone ? 1200 : 700, margin: '0 auto', width: '100%', padding: '40px 24px' }}>

        {/* Input form */}
        {!isDone && (
          <div style={{ background: 'linear-gradient(135deg, #0c3649, #12516E)', border: '1px solid #CCDFEA', borderRadius: 12, padding: 32 }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: GREEN, textTransform: 'uppercase', marginBottom: 6 }}>OSINT Job Market Mapping</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#FFFFFF', marginBottom: 8 }}>IT Jobs</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', maxWidth: 520, margin: '0 auto' }}>
                Enter a company to map its open IT and Software Engineering roles posted in the last 6 months — crawled live from its Careers Portal and LinkedIn Jobs page, balanced across AMER, APAC, and EMEA.
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
                  placeholder="e.g. Microsoft, Infosys, Adobe"
                  disabled={!!isRunning}
                  style={{ width: '100%', padding: '12px 14px', background: '#FFFFFF', border: '1px solid #CCDFEA', borderRadius: 8, color: '#1B2A3D', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.65)', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>COMPANY DOMAIN *</label>
                <input
                  value={companyDomain}
                  onChange={(e) => setCompanyDomain(e.target.value)}
                  placeholder="e.g. microsoft.com, infosys.com"
                  disabled={!!isRunning}
                  style={{ width: '100%', padding: '12px 14px', background: '#FFFFFF', border: '1px solid #CCDFEA', borderRadius: 8, color: '#1B2A3D', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.65)', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>LINKEDIN COMPANY HANDLE (optional)</label>
                <input
                  value={linkedinHandle}
                  onChange={(e) => setLinkedinHandle(e.target.value)}
                  placeholder="e.g. stripe, or linkedin.com/company/stripe"
                  disabled={!!isRunning}
                  style={{ width: '100%', padding: '12px 14px', background: '#FFFFFF', border: '1px solid #CCDFEA', borderRadius: 8, color: '#1B2A3D', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                />
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 5 }}>
                  Anchors the LinkedIn Jobs research to the exact company page instead of guessing it from the name.
                </div>
              </div>

              {/* Progress */}
              {isRunning && job && (
                <div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginBottom: 6 }}>{job.currentStep}</div>
                  <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: GREEN, width: `${job.progress}%`, transition: 'width 0.4s ease', borderRadius: 4 }} />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={!isFormValid || !!isRunning}
                style={{
                  padding: '14px', borderRadius: 8, border: 'none',
                  background: isFormValid && !isRunning ? `linear-gradient(135deg, ${GREEN}, #059669)` : 'rgba(16,185,129,0.3)',
                  color: '#fff', fontSize: 14, fontWeight: 700,
                  cursor: isFormValid && !isRunning ? 'pointer' : 'not-allowed',
                  letterSpacing: 0.5,
                }}
              >
                {isRunning ? 'Mapping open roles (this takes a few minutes)…' : 'Map Open IT Roles →'}
              </button>
            </form>
          </div>
        )}

        {/* Result — rendered markdown table */}
        {isDone && job && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#1B2A3D' }}>{job.companyName}</div>
                {(job.companyDomain || job.linkedinHandle) && (
                  <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
                    {[job.companyDomain, job.linkedinHandle ? `linkedin.com/company/${job.linkedinHandle}` : ''].filter(Boolean).join(' · ')}
                  </div>
                )}
              </div>
              <button
                onClick={handleReset}
                style={{ padding: '10px 20px', borderRadius: 8, border: `1px solid ${GREEN}`, background: 'transparent', color: GREEN, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                ← New Search
              </button>
            </div>

            <div className="it-jobs-markdown" style={{ background: '#F3F8FA', border: '1px solid #CCDFEA', borderRadius: 14, padding: '24px', overflowX: 'auto' }}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{job.content}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .it-jobs-markdown table { width: 100%; border-collapse: collapse; font-size: 12.5px; background: #EDF4F8; border-radius: 10px; overflow: hidden; }
        .it-jobs-markdown th { text-align: left; padding: 10px 12px; background: rgba(16,185,129,0.1); color: #059669; font-weight: 700; font-size: 11px; letter-spacing: 0.3px; border-bottom: 1px solid rgba(30,74,104,0.35); white-space: nowrap; }
        .it-jobs-markdown td { padding: 9px 12px; color: #374B5C; border-bottom: 1px solid rgba(30,74,104,0.15); vertical-align: top; }
        .it-jobs-markdown tr:nth-child(even) td { background: #F0F7FB; }
        .it-jobs-markdown a { color: #3491E8; text-decoration: none; font-weight: 600; }
        .it-jobs-markdown a:hover { text-decoration: underline; }
        .it-jobs-markdown p { font-size: 13.5px; color: #374B5C; }
      `}</style>
    </div>
  );
}
