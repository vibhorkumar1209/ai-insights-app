'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { loadHistory, saveToHistory, loadEntryById, popPendingRestore, HistoryEntry } from '@/lib/history';
import HistoryDrawer from '@/components/shared/HistoryDrawer';
import ModuleIcon from '@/components/shared/ModuleIcon';
import StuckJobBanner from '@/components/shared/StuckJobBanner';
import { API_ENDPOINTS } from '@/lib/config';
import { useJobManager } from '@/lib/useJobManager';
import { dossierToMarkdown, battlecardToMarkdown, linkedinSearchUrl } from '@/lib/businessSegmentMarkdown';
import type { BusinessSegmentResult, Battlecard, BattlecardInput, SegmentDossierEntry } from '@ai-insights/types';

type Step = 'input' | 'loading' | 'results';

const accent = '#7C3AED';
const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid #CCDFEA', background: '#FFFFFF', color: '#1B2A3D', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const };
const labelStyle = { fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 1, color: accent, display: 'block', marginBottom: 8 };
const cardStyle = { background: '#F3F8FA', border: '1px solid #CCDFEA', borderRadius: 14, padding: '24px 26px' };
const th = { textAlign: 'left' as const, padding: '10px 12px', fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: 0.8, color: '#6B7280', borderBottom: '1px solid #CCDFEA', background: '#EAF2F6' };
const td = { padding: '10px 12px', fontSize: 13, color: '#374B5C', borderBottom: '1px solid #E3EDF2', verticalAlign: 'top' as const };

function ExtLink({ href, children, note }: { href: string; children: React.ReactNode; note?: string }) {
  return (
    <>
      <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: accent, textDecoration: 'underline', wordBreak: 'break-all' }}>{children}</a>
      {note && <span style={{ color: '#6B7280', fontSize: 11 }}> {note}</span>}
    </>
  );
}

const shortUrl = (u: string) => u.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');

export default function BusinessSegmentPage() {
  const [step, setStep] = useState<Step>('input');
  const [companyName, setCompanyName] = useState('');
  const [companyDomain, setCompanyDomain] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [data, setData] = useState<BusinessSegmentResult | null>(null);
  const [historyCount, setHistoryCount] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [copied, setCopied] = useState('');

  const [bc, setBc] = useState<BattlecardInput>({ segmentName: '', yourCompany: '', yourUrl: '', yourSolution: '', competitorName: '', competitorUrl: '' });
  const [bcError, setBcError] = useState('');
  const [bcBusy, setBcBusy] = useState(false);
  const dataRef = useRef<BusinessSegmentResult | null>(null);
  dataRef.current = data;

  // Segment dossiers use live web research across the whole company (segments,
  // financials, and leaders for each), which runs several minutes, so the
  // default 45s "taking longer than expected" banner would fire on every run.
  const { job, error, isStuck, startJob, retryJob } = useJobManager<BusinessSegmentResult>({
    stuckThresholdMs: 420_000,
    onComplete: (j) => {
      if (!j.segments?.length) { setStep('input'); return; }
      setData(j);
      setBc((p) => ({ ...p, segmentName: j.segments?.[0]?.name || '' }));
      setStep('results');
      persist(j);
    },
    onError: () => setStep('input'),
  });

  function persist(j: BusinessSegmentResult) {
    saveToHistory({
      moduleType: 'business-segment',
      targetCompany: (j.companyName || companyName).trim(),
      // Same completedAt on every save: history replaces an entry with an
      // identical company, module and timestamp, so adding a battlecard
      // updates the saved report instead of duplicating it.
      completedAt: j.completedAt || new Date().toISOString(),
      companyDomain: j.companyDomain || companyDomain.trim(),
      businessSegmentData: j,
    });
    setHistoryCount(loadHistory().length);
  }

  function restoreEntry(entry: HistoryEntry) {
    if (entry.moduleType !== 'business-segment' || !entry.businessSegmentData?.segments?.length) return;
    const j = entry.businessSegmentData;
    setCompanyName(entry.targetCompany);
    setCompanyDomain(j.companyDomain ?? entry.companyDomain ?? '');
    setLinkedinUrl(j.linkedinUrl ?? '');
    setData(j);
    setBc((p) => ({ ...p, segmentName: j.segments?.[0]?.name || '' }));
    setStep('results');
  }

  useEffect(() => {
    setHistoryCount(loadHistory().length);
    const pendingId = popPendingRestore();
    if (pendingId) {
      const entry = loadEntryById(pendingId);
      if (entry) restoreEntry(entry);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Poll any battlecard still being written.
  useEffect(() => {
    if (!data?.jobId) return;
    const pending = (data.battlecards || []).filter((b) => b.status === 'researching' || b.status === 'pending');
    if (pending.length === 0) return;
    const timer = setInterval(async () => {
      const cur = dataRef.current;
      if (!cur) return;
      let changed = false;
      const next = await Promise.all((cur.battlecards || []).map(async (b) => {
        if (b.status !== 'researching' && b.status !== 'pending') return b;
        try {
          const res = await fetch(API_ENDPOINTS.businessSegmentBattlecardStatus(cur.jobId, b.battlecardId));
          if (!res.ok) return b;
          const fresh = (await res.json()) as Battlecard;
          if (fresh.status !== b.status) changed = true;
          return fresh;
        } catch { return b; }
      }));
      if (changed) {
        const updated = { ...cur, battlecards: next };
        setData(updated);
        persist(updated);
      }
    }, 4000);
    return () => clearInterval(timer);
  }, [data?.jobId, data?.battlecards]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!companyName.trim() || !companyDomain.trim()) return;
    setStep('loading');
    await startJob({
      endpoint: API_ENDPOINTS.businessSegment,
      streamUrlFactory: (jobId) => API_ENDPOINTS.businessSegmentStream(jobId),
      payload: { companyName: companyName.trim(), companyDomain: companyDomain.trim(), linkedinUrl: linkedinUrl.trim() || undefined },
      persist: { moduleType: 'business-segment', targetCompany: companyName.trim() },
    });
  }

  async function handleBattlecard(e: React.FormEvent) {
    e.preventDefault();
    if (!data) return;
    setBcError('');
    setBcBusy(true);
    try {
      const res = await fetch(API_ENDPOINTS.businessSegmentBattlecard(data.jobId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bc),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
      const started: Battlecard = { battlecardId: body.battlecardId, status: 'researching', inputs: { ...bc }, createdAt: new Date().toISOString() };
      setData({ ...data, battlecards: [...(data.battlecards || []), started] });
    } catch (err) {
      setBcError(err instanceof Error ? err.message : 'Could not start the battlecard');
    } finally {
      setBcBusy(false);
    }
  }

  function handleReset() {
    setStep('input');
    setCompanyName(''); setCompanyDomain(''); setLinkedinUrl('');
    setData(null);
    setBc({ segmentName: '', yourCompany: '', yourUrl: '', yourSolution: '', competitorName: '', competitorUrl: '' });
  }

  async function copy(text: string, key: string) {
    try { await navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(''), 1800); } catch { /* clipboard blocked */ }
  }

  const segments: SegmentDossierEntry[] = data?.segments || [];
  const company = data?.companyName || companyName;

  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', color: '#1B2A3D' }}>
      {showHistory && <HistoryDrawer currentModule="business-segment" onSelectSameModule={restoreEntry} onClose={() => setShowHistory(false)} />}

      <header style={{ background: 'linear-gradient(135deg, #0c3649, #12516E)', borderBottom: '1px solid #CCDFEA', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link href="/" style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, textDecoration: 'none' }}>&larr; Home</Link>
          <span style={{ color: '#CCDFEA' }}>|</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ModuleIcon id="business-segment" size={22} fallback="🧩" />
            <span style={{ fontWeight: 700, fontSize: 16, color: '#FFFFFF' }}>Business Segment</span>
          </div>
        </div>
        <button onClick={() => setShowHistory(true)} style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.35)', color: '#FFFFFF', borderRadius: 8, padding: '7px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          History {historyCount > 0 && `(${historyCount})`}
        </button>
      </header>

      <main style={{ maxWidth: 1040, margin: '0 auto', padding: '40px 20px' }}>
        {step === 'input' && (
          <form onSubmit={handleSubmit} style={{ maxWidth: 900, margin: '0 auto' }}>
            <div style={{ ...cardStyle, padding: '32px 28px' }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Business Segment</h2>
              <p style={{ fontSize: 13, color: '#374B5C', marginBottom: 28, lineHeight: 1.5 }}>
                Maps a company&apos;s business segments and subsidiaries with revenue contribution, financial baseline, products and key decision makers, then builds a competitive sales battlecard for the segment you pick. Everything is researched live on the web, so a full dossier takes several minutes. Links are only shown when research actually found them.
              </p>
              <label style={{ display: 'block', marginBottom: 20 }}>
                <span style={labelStyle}>Company Name *</span>
                <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="e.g. Franklin Templeton" required style={inputStyle} />
              </label>
              <label style={{ display: 'block', marginBottom: 20 }}>
                <span style={labelStyle}>Company Domain *</span>
                <input type="text" value={companyDomain} onChange={(e) => setCompanyDomain(e.target.value)} placeholder="e.g. franklintempleton.com" required style={inputStyle} />
                <span style={{ fontSize: 11, color: '#6B7280', marginTop: 6, display: 'block' }}>Anchors company identity, since many names are shared by unrelated businesses.</span>
              </label>
              <label style={{ display: 'block', marginBottom: 28 }}>
                <span style={labelStyle}>Parent LinkedIn URL (optional)</span>
                <input type="text" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="e.g. https://www.linkedin.com/company/franklin-templeton" style={inputStyle} />
              </label>
              {error && <div style={{ color: '#E63946', fontSize: 13, marginBottom: 16 }}>{error}</div>}
              <button type="submit" style={{ width: '100%', padding: '13px 0', borderRadius: 10, border: 'none', background: `linear-gradient(135deg, ${accent}, #5B21B6)`, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                Build Segment Dossier &rarr;
              </button>
            </div>
          </form>
        )}

        {step === 'loading' && (
          <div style={{ ...cardStyle, padding: '48px 28px', textAlign: 'center', maxWidth: 900, margin: '0 auto' }}>
            <div style={{ width: 40, height: 40, border: '3px solid rgba(124,58,237,0.2)', borderTopColor: accent, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 20px' }} />
            <p style={{ fontSize: 14 }}>{job?.currentStep || <>Researching <strong>{companyName}</strong>...</>}</p>
            <p style={{ fontSize: 12, color: '#6B7280', marginTop: 8 }}>This reads annual reports, company pages and leadership listings, so expect a few minutes.</p>
            {typeof job?.progress === 'number' && (
              <div style={{ width: '100%', maxWidth: 280, height: 6, background: '#CCDFEA', borderRadius: 4, margin: '16px auto 0', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${job.progress}%`, background: accent, transition: 'width 0.4s ease', borderRadius: 4 }} />
              </div>
            )}
            {isStuck && <StuckJobBanner onRetry={retryJob} />}
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {step === 'results' && data && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{company}</h2>
              {(data.companyDomain || companyDomain) && <span style={{ fontSize: 12, color: '#6B7280', background: 'rgba(124,58,237,0.1)', borderRadius: 6, padding: '3px 8px' }}>{data.companyDomain || companyDomain}</span>}
              <span style={{ flex: 1 }} />
              <button onClick={() => copy(dossierToMarkdown(data), 'all')} style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${accent}`, background: 'transparent', color: accent, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                {copied === 'all' ? 'Copied' : 'Copy as Markdown'}
              </button>
            </div>

            {/* 1. Executive summary */}
            <section style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '18px 22px 12px', fontSize: 12, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: accent }}>1. Executive Summary</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
                  <thead><tr>
                    <th style={th}>Segment / Subsidiary</th><th style={th}>Core Focus</th><th style={th}>Revenue % / AUM</th><th style={th}>Webpage</th><th style={th}>LinkedIn</th>
                  </tr></thead>
                  <tbody>
                    {segments.map((s) => (
                      <tr key={s.name}>
                        <td style={{ ...td, fontWeight: 600, color: '#1B2A3D' }}>{s.name}</td>
                        <td style={td}>{s.coreFocus}</td>
                        <td style={td}>{s.contribution}</td>
                        <td style={td}><ExtLink href={s.webpageUrl} note={s.webpageRollsUp ? '(rolls up to parent site)' : undefined}>{shortUrl(s.webpageUrl)}</ExtLink></td>
                        <td style={td}>{s.linkedinUrl ? <ExtLink href={s.linkedinUrl} note={s.linkedinRollsUp ? '(parent page)' : undefined}>{shortUrl(s.linkedinUrl)}</ExtLink> : <span style={{ color: '#6B7280' }}>Not found</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* 2 + 3. Deep dive and decision makers */}
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: accent, marginBottom: -8 }}>2. Segment Breakdown and 3. Key Decision Makers</div>
            {segments.map((s) => (
              <section key={s.name} style={cardStyle}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 14px' }}>{s.name}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.7, color: '#374B5C', margin: '0 0 10px' }}><strong style={{ color: '#1B2A3D' }}>Overview: </strong>{s.overview}</p>
                <p style={{ fontSize: 14, lineHeight: 1.7, color: '#374B5C', margin: '0 0 10px' }}><strong style={{ color: '#1B2A3D' }}>Financial Baseline: </strong>{s.financialBaseline}</p>
                {s.keyProducts.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <strong style={{ fontSize: 14, color: '#1B2A3D' }}>Key Products/Services</strong>
                    <ul style={{ margin: '6px 0 0', paddingLeft: 20, color: '#374B5C', fontSize: 14, lineHeight: 1.6 }}>
                      {s.keyProducts.map((p, i) => <li key={i}>{p}</li>)}
                    </ul>
                  </div>
                )}
                <div style={{ borderTop: '1px solid #CCDFEA', paddingTop: 14 }}>
                  <strong style={{ fontSize: 14, color: '#1B2A3D' }}>Key Decision Makers</strong>
                  {s.leaders.length === 0 ? (
                    <p style={{ fontSize: 13, color: '#6B7280', margin: '6px 0 0' }}>Not publicly identified for this segment.</p>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12, marginTop: 10 }}>
                      {s.leaders.map((l) => (
                        <div key={l.name} style={{ background: '#FFFFFF', border: '1px solid #CCDFEA', borderRadius: 10, padding: '12px 14px' }}>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>{l.name}</div>
                          <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 6 }}>{l.title}</div>
                          <div style={{ fontSize: 13, color: '#374B5C', lineHeight: 1.55, marginBottom: 8 }}>{l.profile}</div>
                          {l.linkedinUrl
                            ? <ExtLink href={l.linkedinUrl}>LinkedIn profile</ExtLink>
                            : <ExtLink href={linkedinSearchUrl(l.name, company)} note="(profile link not found, opens a search)">Search on LinkedIn</ExtLink>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            ))}

            {/* Phase 2 */}
            <section style={{ ...cardStyle, border: `1px solid rgba(124,58,237,0.3)` }}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: accent, marginBottom: 8 }}>Build a Competitive Sales Play</div>
              <p style={{ fontSize: 13, color: '#374B5C', margin: '0 0 18px', lineHeight: 1.5 }}>
                Select one of the business segments above to expand on and target, then tell us about your company and the competitor you face. You get a battlecard with segment context, a core win theme, opportunity areas and a side-by-side comparison.
              </p>
              <form onSubmit={handleBattlecard}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
                  <label>
                    <span style={labelStyle}>Target Segment *</span>
                    <select value={bc.segmentName} onChange={(e) => setBc({ ...bc, segmentName: e.target.value })} required style={inputStyle}>
                      {segments.map((s) => <option key={s.name} value={s.name}>{s.name}</option>)}
                    </select>
                  </label>
                  <label><span style={labelStyle}>Your Company Name *</span><input style={inputStyle} required value={bc.yourCompany} onChange={(e) => setBc({ ...bc, yourCompany: e.target.value })} /></label>
                  <label><span style={labelStyle}>Your Company URL *</span><input style={inputStyle} required value={bc.yourUrl} onChange={(e) => setBc({ ...bc, yourUrl: e.target.value })} placeholder="e.g. yourcompany.com" /></label>
                  <label><span style={labelStyle}>Your Focus Solution / Product *</span><input style={inputStyle} required value={bc.yourSolution} onChange={(e) => setBc({ ...bc, yourSolution: e.target.value })} /></label>
                  <label><span style={labelStyle}>Your Competitor Name *</span><input style={inputStyle} required value={bc.competitorName} onChange={(e) => setBc({ ...bc, competitorName: e.target.value })} /></label>
                  <label><span style={labelStyle}>Your Competitor URL *</span><input style={inputStyle} required value={bc.competitorUrl} onChange={(e) => setBc({ ...bc, competitorUrl: e.target.value })} placeholder="e.g. competitor.com" /></label>
                </div>
                {bcError && <div style={{ color: '#E63946', fontSize: 13, marginTop: 14 }}>{bcError}</div>}
                <button type="submit" disabled={bcBusy} style={{ marginTop: 18, padding: '12px 26px', borderRadius: 10, border: 'none', background: `linear-gradient(135deg, ${accent}, #5B21B6)`, color: '#fff', fontSize: 14, fontWeight: 700, cursor: bcBusy ? 'wait' : 'pointer', opacity: bcBusy ? 0.7 : 1 }}>
                  Generate Battlecard &rarr;
                </button>
              </form>
            </section>

            {[...(data.battlecards || [])].reverse().map((b) => (
              <section key={b.battlecardId} style={{ ...cardStyle, border: '1px solid rgba(124,58,237,0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Competitive Sales Battlecard: {b.inputs.segmentName}</h3>
                  <span style={{ fontSize: 12, color: '#6B7280' }}>{b.inputs.yourCompany} vs {b.inputs.competitorName}</span>
                  <span style={{ flex: 1 }} />
                  {b.status === 'complete' && (
                    <button onClick={() => copy(battlecardToMarkdown(b), b.battlecardId)} style={{ padding: '6px 14px', borderRadius: 8, border: `1px solid ${accent}`, background: 'transparent', color: accent, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      {copied === b.battlecardId ? 'Copied' : 'Copy as Markdown'}
                    </button>
                  )}
                </div>
                {(b.status === 'researching' || b.status === 'pending') && <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>Researching both companies and building the battlecard. This takes a minute or two.</p>}
                {b.status === 'error' && <p style={{ fontSize: 13, color: '#E63946', margin: 0 }}>{b.error || 'The battlecard failed.'} Submit the form again to retry.</p>}
                {b.status === 'complete' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div><strong>1. Target Segment Context</strong><p style={{ fontSize: 14, lineHeight: 1.7, color: '#374B5C', margin: '4px 0 0' }}>{b.segmentContext}</p></div>
                    <div><strong>2. Core Win Theme</strong><p style={{ fontSize: 14, lineHeight: 1.7, color: '#374B5C', margin: '4px 0 0' }}>{b.coreWinTheme}</p></div>
                    <div><strong>3. Opportunity Area</strong>
                      <ul style={{ margin: '4px 0 0', paddingLeft: 20, color: '#374B5C', fontSize: 14, lineHeight: 1.65 }}>{(b.opportunityAreas || []).map((o, i) => <li key={i}>{o}</li>)}</ul>
                    </div>
                    <div><strong>4. Positioning &amp; Differentiation vs. Competition</strong>
                      <div style={{ overflowX: 'auto', marginTop: 8, border: '1px solid #CCDFEA', borderRadius: 10 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 620 }}>
                          <thead><tr><th style={th}>Dimension</th><th style={th}>{b.inputs.yourCompany}</th><th style={th}>{b.inputs.competitorName}</th></tr></thead>
                          <tbody>{(b.comparison || []).map((r, i) => (
                            <tr key={i}><td style={{ ...td, fontWeight: 600, color: '#1B2A3D' }}>{r.dimension}</td><td style={td}>{r.yourSolution}</td><td style={td}>{r.competitor}</td></tr>
                          ))}</tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            ))}

            <button onClick={handleReset} style={{ alignSelf: 'flex-start', padding: '10px 22px', borderRadius: 8, border: `1px solid ${accent}`, background: 'transparent', color: accent, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              New Company
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
