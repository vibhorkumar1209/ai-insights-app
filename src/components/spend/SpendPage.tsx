'use client';
import React, { useState, useRef, useEffect } from 'react';
import { SpendResult, SpendLineItem } from '@ai-insights/types';
import { API_ENDPOINTS } from '@/lib/config';
import ModuleIcon from '@/components/shared/ModuleIcon';
import HistoryDrawer from '@/components/shared/HistoryDrawer';
import { loadHistory, saveToHistory, loadEntryById, popPendingRestore, HistoryEntry } from '@/lib/history';

const ACCENT = '#3491E8';
const DS_RED = '#E63946';
const GOLD = '#F59E0B';

const LINE_DEFS: { key: 'itSpend' | 'rdSpend' | 'aiSpend'; label: string }[] = [
  { key: 'itSpend', label: 'IT Spend / Budget' },
  { key: 'rdSpend', label: 'R&D Spend / Budget' },
  { key: 'aiSpend', label: 'AI Spend / Budget' },
];

function SpendCard({ label, item }: { label: string; item?: SpendLineItem }) {
  const found = !!item?.found;
  return (
    <div style={{ background: '#F3F8FA', border: '1px solid #CCDFEA', borderRadius: 12, padding: '20px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: '#5A6E7A', textTransform: 'uppercase' }}>{label}</div>
        {found ? (
          <span style={{ fontSize: 11, fontWeight: 700, color: '#10B981', background: 'rgba(16,185,129,0.1)', padding: '3px 10px', borderRadius: 12 }}>Disclosed</span>
        ) : (
          <span style={{ fontSize: 11, fontWeight: 700, color: '#8A9DAD', background: 'rgba(138,157,173,0.12)', padding: '3px 10px', borderRadius: 12 }}>Not Disclosed</span>
        )}
      </div>

      {found ? (
        <>
          <div style={{ fontSize: 30, fontWeight: 900, color: '#1B2A3D', letterSpacing: -0.5, marginBottom: 4 }}>
            {item?.value || 'N/A'}
          </div>
          {item?.fiscalYear && (
            <div style={{ fontSize: 12, color: '#8A9DAD', marginBottom: 10 }}>{item.fiscalYear}</div>
          )}
          {item?.sourceType && (
            <div style={{ fontSize: 12, fontWeight: 600, color: ACCENT, marginBottom: 6 }}>Source: {item.sourceType}</div>
          )}
        </>
      ) : (
        <div style={{ fontSize: 20, fontWeight: 700, color: '#8A9DAD', marginBottom: 10 }}>Not publicly disclosed</div>
      )}

      {item?.sourceContext && (
        <div style={{ fontSize: 13, color: '#5A6E7A', lineHeight: 1.5, borderTop: '1px solid #CCDFEA', paddingTop: 10, marginTop: 4 }}>
          {item.sourceContext}
        </div>
      )}
    </div>
  );
}

export default function SpendPage() {
  const [companyName, setCompanyName] = useState('');
  const [companyDomain, setCompanyDomain] = useState('');
  const [geography, setGeography] = useState('');
  const [job, setJob] = useState<SpendResult | null>(null);
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
      if (entry?.moduleType === 'spend' && entry.spendData) {
        restoreEntry(entry);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function restoreEntry(entry: HistoryEntry) {
    if (entry.moduleType !== 'spend' || !entry.spendData) return;
    setCompanyName(entry.targetCompany);
    setCompanyDomain(entry.companyDomain ?? '');
    setGeography(entry.spendData.geography ?? '');
    setJob(entry.spendData);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!companyName.trim()) return;
    setError(null);
    setJob(null);
    esRef.current?.close();

    try {
      const res = await fetch(API_ENDPOINTS.spend, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: companyName.trim(),
          companyDomain: companyDomain.trim() || undefined,
          geography: geography.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error || `Server error ${res.status}`);
      }
      const { jobId } = await res.json() as { jobId: string };

      const es = new EventSource(API_ENDPOINTS.spendStream(jobId));
      esRef.current = es;

      es.addEventListener('progress', (ev) => {
        const data = JSON.parse((ev as MessageEvent).data) as Partial<SpendResult>;
        setJob((prev) => ({ ...(prev ?? {} as SpendResult), ...data }));
      });
      es.addEventListener('result', (ev) => {
        const data = JSON.parse((ev as MessageEvent).data) as SpendResult;
        setJob(data);
        es.close();
        if (data.status === 'complete') {
          saveToHistory({
            moduleType: 'spend',
            targetCompany: companyName.trim(),
            completedAt: new Date().toISOString(),
            companyDomain: companyDomain.trim() || undefined,
            spendData: data,
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
    setGeography('');
  }

  const isRunning = job && job.status !== 'complete' && job.status !== 'error';
  const isDone = job?.status === 'complete';

  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', display: 'flex', flexDirection: 'column' }}>
      {showHistory && (
        <HistoryDrawer
          currentModule="spend"
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
              <ModuleIcon id="spend" size={20} />
              <span style={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF' }}>Spend</span>
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
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: GOLD, textTransform: 'uppercase', marginBottom: 6 }}>IT / R&amp;D / AI Spend Lookup</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#FFFFFF', marginBottom: 8 }}>Corporate Spend Intelligence</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', maxWidth: 480, margin: '0 auto' }}>
                Retrieves publicly disclosed IT, R&amp;D, and AI budget figures from company filings or top-tier analyst firms (Gartner, IDC, Forrester, Everest Group) — never estimated. All figures in USD Million.
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
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.65)', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>GEOGRAPHY / HQ (optional)</label>
                <input
                  value={geography}
                  onChange={(e) => setGeography(e.target.value)}
                  placeholder="e.g. United States, India"
                  disabled={!!isRunning}
                  style={{ width: '100%', padding: '12px 14px', background: '#FFFFFF', border: '1px solid #CCDFEA', borderRadius: 8, color: '#1B2A3D', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              {/* Progress */}
              {isRunning && job && (
                <div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginBottom: 6 }}>{job.currentStep}</div>
                  <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: GOLD, width: `${job.progress}%`, transition: 'width 0.4s ease', borderRadius: 4 }} />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={!companyName.trim() || !!isRunning}
                style={{
                  padding: '14px', borderRadius: 8, border: 'none',
                  background: companyName.trim() && !isRunning ? `linear-gradient(135deg, ${GOLD}, #D97706)` : 'rgba(245,158,11,0.3)',
                  color: '#fff', fontSize: 14, fontWeight: 700,
                  cursor: companyName.trim() && !isRunning ? 'pointer' : 'not-allowed',
                  letterSpacing: 0.5,
                }}
              >
                {isRunning ? 'Researching…' : 'Get Spend Breakdown →'}
              </button>
            </form>
          </div>
        )}

        {/* Result cards */}
        {isDone && job && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ textAlign: 'center', marginBottom: 4 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#1B2A3D' }}>{job.companyName}</div>
              {job.geography && <div style={{ fontSize: 13, color: '#8A9DAD' }}>{job.geography}</div>}
            </div>

            {LINE_DEFS.map((def) => (
              <SpendCard key={def.key} label={def.label} item={job[def.key]} />
            ))}

            <div style={{ fontSize: 11, color: '#8A9DAD', textAlign: 'center', padding: '0 8px' }}>
              All figures in USD Million. Only values explicitly published by the company or a top-tier analyst firm are reported — nothing is estimated.
            </div>

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
