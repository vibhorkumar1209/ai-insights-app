'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { loadHistory, saveToHistory, loadEntryById, popPendingRestore, HistoryEntry } from '@/lib/history';
import HistoryDrawer from '@/components/shared/HistoryDrawer';
import ModuleIcon from '@/components/shared/ModuleIcon';
import StuckJobBanner from '@/components/shared/StuckJobBanner';
import { API_ENDPOINTS } from '@/lib/config';
import { useJobManager } from '@/lib/useJobManager';
import { BizDescripResult } from '@ai-insights/types';

type Step = 'input' | 'loading' | 'results';

export default function BizDescripPage() {
  const [step, setStep] = useState<Step>('input');
  const [companyName, setCompanyName] = useState('');
  const [companyDomain, setCompanyDomain] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [description, setDescription] = useState('');
  const [historyCount, setHistoryCount] = useState(0);
  const [showHistory, setShowHistory] = useState(false);

  // Async job + SSE (with polling fallback) — Claude-only single call, no
  // Parallel.AI/Gemini research step, so this typically completes in a few
  // seconds. Deliberately its own module/job store, separate from the
  // blocked Business Description module.
  const { job, error, isStuck, startJob, retryJob } = useJobManager<BizDescripResult>({
    onComplete: (j) => {
      if (!j.description) {
        setStep('input');
        return;
      }
      setDescription(j.description);
      setStep('results');
      saveToHistory({
        moduleType: 'biz-descrip',
        targetCompany: companyName.trim(),
        completedAt: j.completedAt || new Date().toISOString(),
        bizDescripDescription: j.description,
        companyDomain: companyDomain.trim(),
        bizDescripLinkedinUrl: linkedinUrl.trim() || undefined,
      });
      setHistoryCount(loadHistory().length);
    },
    onError: () => setStep('input'),
  });

  useEffect(() => {
    setHistoryCount(loadHistory().length);
    const pendingId = popPendingRestore();
    if (pendingId) {
      const entry = loadEntryById(pendingId);
      if (entry?.moduleType === 'biz-descrip' && entry.bizDescripDescription) {
        setCompanyName(entry.targetCompany);
        setCompanyDomain(entry.companyDomain ?? '');
        setLinkedinUrl(entry.bizDescripLinkedinUrl ?? '');
        setDescription(entry.bizDescripDescription);
        setStep('results');
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!companyName.trim() || !companyDomain.trim()) return;
    const name = companyName.trim();
    const domain = companyDomain.trim();
    const linkedin = linkedinUrl.trim();

    setStep('loading');

    await startJob({
      endpoint: API_ENDPOINTS.bizDescrip,
      streamUrlFactory: (jobId) => API_ENDPOINTS.bizDescripStream(jobId),
      payload: { companyName: name, companyDomain: domain, linkedinUrl: linkedin || undefined },
      persist: { moduleType: 'biz-descrip', targetCompany: name },
    });
  }

  function handleReset() {
    setStep('input');
    setCompanyName('');
    setCompanyDomain('');
    setLinkedinUrl('');
    setDescription('');
  }

  function restoreEntry(entry: HistoryEntry) {
    if (entry.moduleType !== 'biz-descrip' || !entry.bizDescripDescription) return;
    setCompanyName(entry.targetCompany);
    setCompanyDomain(entry.companyDomain ?? '');
    setLinkedinUrl(entry.bizDescripLinkedinUrl ?? '');
    setDescription(entry.bizDescripDescription);
    setStep('results');
  }

  const accent = '#3491E8';

  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', color: '#1B2A3D' }}>
      {showHistory && (
        <HistoryDrawer
          currentModule="biz-descrip"
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
            <ModuleIcon id="biz-descrip" size={22} fallback="📇" />
            <span style={{ fontWeight: 700, fontSize: 16, color: '#FFFFFF' }}>Biz Descrip</span>
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
                Biz Descrip
              </h2>
              <p style={{ fontSize: 13, color: '#374B5C', marginBottom: 28, lineHeight: 1.5 }}>
                Generate a 100&ndash;200 word description of a company&apos;s business. Claude-only &mdash; no live web research, just a fast, single AI call.
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

              <label style={{ display: 'block', marginBottom: 20 }}>
                <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: accent, display: 'block', marginBottom: 8 }}>
                  Company Domain *
                </span>
                <input
                  type="text"
                  value={companyDomain}
                  onChange={(e) => setCompanyDomain(e.target.value)}
                  placeholder="e.g. medtronic.com"
                  required
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid #CCDFEA', background: '#FFFFFF', color: '#1B2A3D', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                />
                <span style={{ fontSize: 11, color: '#6B7280', marginTop: 6, display: 'block' }}>
                  Anchors company identity &mdash; many company names are shared by unrelated businesses.
                </span>
              </label>

              <label style={{ display: 'block', marginBottom: 28 }}>
                <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: accent, display: 'block', marginBottom: 8 }}>
                  LinkedIn URL (optional)
                </span>
                <input
                  type="text"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="e.g. https://www.linkedin.com/company/medtronic"
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid #CCDFEA', background: '#FFFFFF', color: '#1B2A3D', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                />
                <span style={{ fontSize: 11, color: '#6B7280', marginTop: 6, display: 'block' }}>
                  If provided, used as a second identity anchor alongside the domain.
                </span>
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
              {job?.currentStep || <>Writing description for <strong>{companyName}</strong>...</>}
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

        {/* Results */}
        {step === 'results' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ background: '#F3F8FA', border: '1px solid rgba(6,182,212,0.2)', borderRadius: 14, padding: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
                <ModuleIcon id="biz-descrip" size={24} fallback="📇" />
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1B2A3D', margin: 0 }}>{companyName}</h2>
                {companyDomain && (
                  <span style={{ fontSize: 12, color: '#6B7280', background: 'rgba(6,182,212,0.1)', borderRadius: 6, padding: '3px 8px' }}>{companyDomain}</span>
                )}
                {linkedinUrl && (
                  <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: accent, textDecoration: 'underline' }}>
                    LinkedIn &rarr;
                  </a>
                )}
              </div>
              <div style={{ borderTop: '1px solid rgba(30,74,104,0.15)', paddingTop: 20 }}>
                <p style={{ fontSize: 15, lineHeight: 1.75, color: '#374B5C', whiteSpace: 'pre-wrap', margin: 0 }}>{description}</p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                <span style={{ fontSize: 11, color: '#6B7280' }}>{description.split(/\s+/).filter(Boolean).length} words</span>
              </div>
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
