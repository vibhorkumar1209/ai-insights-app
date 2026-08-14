'use client';
import React, { useState, useRef, useEffect } from 'react';
import { CompetitionBenchmarkingResult, CompetitionBenchmarkingInput } from '@ai-insights/types';
import { API_ENDPOINTS } from '@/lib/config';
import ModuleIcon from '@/components/shared/ModuleIcon';
import { startCompetitionBenchmarking } from '@/lib/api';
import { exportCompetitionBenchmarkingDocx, competitionBenchmarkingQA } from '@/lib/exportReport';

const ACCENT = '#3491E8';
const DS_RED = '#E63946';
const NAVY_GRADIENT = 'linear-gradient(135deg, #0c3649, #12516E)';

const STEP_LABELS: Record<string, string> = {
  pending: 'Starting…',
  selecting: 'Selecting top 5 competitors…',
  researching: 'Researching companies…',
  synthesizing: 'Writing report…',
  complete: 'Complete',
  error: 'Failed',
};

export default function CompetitionBenchmarkingPage() {
  const [userFirm, setUserFirm] = useState('');
  const [userDomain, setUserDomain] = useState('');
  const [focusSegment, setFocusSegment] = useState('');
  const [focusTech, setFocusTech] = useState('');
  const [geoFocus, setGeoFocus] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');
  const [competitorListText, setCompetitorListText] = useState(''); // comma-separated, optional
  const [selectedCompetitors, setSelectedCompetitors] = useState<string[]>([]);
  const [autoSelect, setAutoSelect] = useState(true);

  const [job, setJob] = useState<CompetitionBenchmarkingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => () => { esRef.current?.close(); }, []);

  const competitorCandidates = competitorListText.split(',').map((s) => s.trim()).filter(Boolean);
  const hasCandidateList = competitorCandidates.length > 0;

  useEffect(() => {
    if (hasCandidateList) setAutoSelect(false);
  }, [hasCandidateList]);

  function toggleCompetitor(name: string) {
    setSelectedCompetitors((prev) => {
      if (prev.includes(name)) return prev.filter((c) => c !== name);
      if (prev.length >= 5) return prev; // capped at 5
      return [...prev, name];
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userFirm.trim() || !userDomain.trim()) return;
    setError(null);
    setJob(null);
    esRef.current?.close();

    const payload: CompetitionBenchmarkingInput = {
      userFirm: userFirm.trim(),
      userDomain: userDomain.trim(),
      focusSegment: focusSegment.trim() || undefined,
      focusTech: focusTech.trim() || undefined,
      geoFocus: geoFocus.trim() || undefined,
      additionalContext: additionalContext.trim() || undefined,
      competitorList: !autoSelect && hasCandidateList ? competitorCandidates : undefined,
      selectedCompetitors: !autoSelect && hasCandidateList ? selectedCompetitors : undefined,
    };

    try {
      const jobId = await startCompetitionBenchmarking(payload);

      const es = new EventSource(API_ENDPOINTS.competitionBenchmarkingStream(jobId));
      esRef.current = es;

      es.addEventListener('progress', (ev) => {
        const data = JSON.parse((ev as MessageEvent).data) as Partial<CompetitionBenchmarkingResult>;
        setJob((prev) => ({ ...(prev ?? {} as CompetitionBenchmarkingResult), ...data }));
      });
      es.addEventListener('result', (ev) => {
        const data = JSON.parse((ev as MessageEvent).data) as CompetitionBenchmarkingResult;
        setJob(data);
        es.close();
      });
      es.addEventListener('error', (ev) => {
        const me = ev as MessageEvent;
        if (me.data) {
          try {
            const d = JSON.parse(me.data) as { error?: string };
            setError(d.error || 'Report generation failed');
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
  }

  async function handleDownload() {
    if (!job) return;
    setDownloading(true);
    try {
      await exportCompetitionBenchmarkingDocx(job);
    } catch (err) {
      setError(err instanceof Error ? `DOCX generation failed: ${err.message}` : 'DOCX generation failed');
    } finally {
      setDownloading(false);
    }
  }

  const isRunning = job && job.status !== 'complete' && job.status !== 'error';
  const isDone = job?.status === 'complete';
  const qa = isDone && job ? competitionBenchmarkingQA(job) : null;
  const canSubmit = userFirm.trim().length >= 2 && userDomain.trim().length >= 2 &&
    (autoSelect || !hasCandidateList || selectedCompetitors.length > 0);

  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ background: NAVY_GRADIENT, borderBottom: '1px solid #CCDFEA', padding: '16px 32px', flexShrink: 0 }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 16 }}>
          <a href="/" style={{ color: 'rgba(255,255,255,0.65)', textDecoration: 'none', fontSize: 13 }}>← Home</a>
          <div style={{ width: 1, height: 16, background: '#CCDFEA' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, color: ACCENT, marginBottom: 3 }}>REFRACTONE</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ModuleIcon id="competition-benchmarking" size={20} fallback="🥊" />
              <span style={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF' }}>Competition Benchmarking</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, maxWidth: 1000, margin: '0 auto', width: '100%', padding: '40px 24px' }}>

        {/* ── Input form ── */}
        {!job && (
          <div style={{ background: NAVY_GRADIENT, border: '1px solid #CCDFEA', borderRadius: 12, padding: 32 }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: ACCENT, textTransform: 'uppercase', marginBottom: 6 }}>Competitive Benchmarking Report</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#FFFFFF', marginBottom: 8 }}>Verified Financials, Leadership &amp; Positioning</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', maxWidth: 560, margin: '0 auto' }}>
                Every fact in this report is verified via live web search before Claude writes a word of it. Anything that couldn&apos;t be confirmed is flagged, never guessed.
              </div>
            </div>

            {error && (
              <div style={{ background: 'rgba(230,57,70,0.1)', border: '1px solid rgba(230,57,70,0.3)', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: DS_RED }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={fieldLabel}>YOUR FIRM *</label>
                  <input value={userFirm} onChange={(e) => setUserFirm(e.target.value)} placeholder="e.g. Birlasoft" style={inputStyle} />
                </div>
                <div>
                  <label style={fieldLabel}>MARKET / DOMAIN *</label>
                  <input value={userDomain} onChange={(e) => setUserDomain(e.target.value)} placeholder="e.g. ERP and enterprise applications services" style={inputStyle} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={fieldLabel}>FOCUS SEGMENT (optional)</label>
                  <input value={focusSegment} onChange={(e) => setFocusSegment(e.target.value)} placeholder="e.g. JDE, Oracle, SAP practices" style={inputStyle} />
                </div>
                <div>
                  <label style={fieldLabel}>FOCUS TECHNOLOGY (optional)</label>
                  <input value={focusTech} onChange={(e) => setFocusTech(e.target.value)} placeholder="e.g. Agentic AI" style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={fieldLabel}>GEOGRAPHIC FOCUS (optional)</label>
                <input value={geoFocus} onChange={(e) => setGeoFocus(e.target.value)} placeholder="e.g. North America" style={inputStyle} />
              </div>
              <div>
                <label style={fieldLabel}>ADDITIONAL CONTEXT (optional)</label>
                <textarea value={additionalContext} onChange={(e) => setAdditionalContext(e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical' as const }} />
              </div>

              {/* Competitor selection */}
              <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: 16 }}>
                <label style={fieldLabel}>COMPETITORS (optional — leave blank to auto-select)</label>
                <input
                  value={competitorListText}
                  onChange={(e) => setCompetitorListText(e.target.value)}
                  placeholder="Comma-separated, e.g. SAP, Oracle, Infosys, TCS, Wipro"
                  style={inputStyle}
                />
                {hasCandidateList ? (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>Select up to 5 ({selectedCompetitors.length}/5):</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {competitorCandidates.map((name) => {
                        const checked = selectedCompetitors.includes(name);
                        const disabled = !checked && selectedCompetitors.length >= 5;
                        return (
                          <button
                            type="button"
                            key={name}
                            onClick={() => toggleCompetitor(name)}
                            disabled={disabled}
                            style={{
                              padding: '6px 12px', borderRadius: 16, fontSize: 13, cursor: disabled ? 'not-allowed' : 'pointer',
                              border: `1px solid ${checked ? ACCENT : 'rgba(255,255,255,0.25)'}`,
                              background: checked ? 'rgba(52,145,232,0.2)' : 'transparent',
                              color: checked ? '#FFFFFF' : 'rgba(255,255,255,0.6)',
                              opacity: disabled ? 0.4 : 1,
                            }}
                          >
                            {checked ? '✓ ' : ''}{name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div style={{ marginTop: 10, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                    RefractOne will select the top 5 competitors based on current market-share data — the report will cite the ranking source used.
                  </div>
                )}
              </div>

              {isRunning && job && (
                <div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginBottom: 6 }}>{job.currentStep || STEP_LABELS[job.status || 'pending']}</div>
                  <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: ACCENT, width: `${job.progress || 0}%`, transition: 'width 0.4s ease', borderRadius: 4 }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                    {['selecting', 'researching', 'synthesizing', 'complete'].map((s) => (
                      <span key={s} style={{ color: job.status === s ? ACCENT : undefined, fontWeight: job.status === s ? 700 : 400 }}>{STEP_LABELS[s]}</span>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={!canSubmit || !!isRunning}
                style={{
                  padding: '14px', borderRadius: 8, border: 'none',
                  background: canSubmit && !isRunning ? `linear-gradient(135deg, ${ACCENT}, #2563EB)` : 'rgba(52,145,232,0.3)',
                  color: '#fff', fontSize: 14, fontWeight: 700,
                  cursor: canSubmit && !isRunning ? 'pointer' : 'not-allowed', letterSpacing: 0.5,
                }}
              >
                {isRunning ? 'Generating report…' : 'Generate Benchmarking Report →'}
              </button>
            </form>
          </div>
        )}

        {/* ── Error (job-level, before any progress) ── */}
        {job?.status === 'error' && (
          <div style={{ background: 'rgba(230,57,70,0.1)', border: '1px solid rgba(230,57,70,0.3)', borderRadius: 8, padding: '16px 20px', fontSize: 14, color: DS_RED, marginTop: 20 }}>
            {job.error || 'Report generation failed.'}
            <div style={{ marginTop: 12 }}>
              <button onClick={handleReset} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid rgba(230,57,70,0.4)', background: 'transparent', color: DS_RED, cursor: 'pointer', fontSize: 13 }}>← Try again</button>
            </div>
          </div>
        )}

        {/* ── Results ── */}
        {isDone && job && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 20 }}>
            <div style={{ background: NAVY_GRADIENT, border: '1px solid #CCDFEA', borderRadius: 16, padding: '28px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#FFFFFF' }}>{job.input.userFirm} — Competitive Benchmarking</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>
                  vs. {(job.finalCompetitors || []).join(', ')}
                </div>
              </div>
              <button
                onClick={handleDownload}
                disabled={downloading || (qa?.blockingErrors.length ?? 0) > 0}
                style={{
                  padding: '12px 22px', borderRadius: 8, border: 'none',
                  background: `linear-gradient(135deg, ${ACCENT}, #2563EB)`, color: '#fff',
                  fontSize: 14, fontWeight: 700, cursor: downloading ? 'not-allowed' : 'pointer', opacity: downloading ? 0.6 : 1,
                }}
              >
                {downloading ? 'Generating DOCX…' : '⬇ Download Report (DOCX)'}
              </button>
            </div>

            {/* Verification Summary */}
            <div style={{ background: '#F3F8FA', border: '1px solid #CCDFEA', borderRadius: 12, padding: '20px 24px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: '#5A6E7A', textTransform: 'uppercase', marginBottom: 12 }}>Verification Summary</div>

              {job.competitorSelection && (
                <div style={{ fontSize: 13, color: '#1B2A3D', marginBottom: 12 }}>
                  Competitors selected using <strong>{job.competitorSelection.rankingSource}</strong> ({job.competitorSelection.rankingPeriod}).
                </div>
              )}

              <div style={{ display: 'flex', gap: 24, marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#1B2A3D' }}>{(job.totalFactCount || 0) - (job.unverifiedFactCount || 0)}</div>
                  <div style={{ fontSize: 12, color: '#5A6E7A' }}>Verified facts</div>
                </div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: (job.unverifiedFactCount || 0) > 0 ? DS_RED : '#1B2A3D' }}>{job.unverifiedFactCount || 0}</div>
                  <div style={{ fontSize: 12, color: '#5A6E7A' }}>Unverified / flagged</div>
                </div>
              </div>

              {qa && qa.warnings.map((w, i) => (
                <div key={i} style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 6, padding: '8px 12px', fontSize: 12, color: '#B45309', marginTop: 8 }}>
                  ⚠ {w}
                </div>
              ))}
              {qa && qa.blockingErrors.map((e, i) => (
                <div key={i} style={{ background: 'rgba(230,57,70,0.1)', border: '1px solid rgba(230,57,70,0.3)', borderRadius: 6, padding: '8px 12px', fontSize: 12, color: DS_RED, marginTop: 8 }}>
                  ✕ {e} — download disabled until this is fixed (retry the report).
                </div>
              ))}

              {job.dossier?.entities.map((entity) => (
                <div key={entity.entityName} style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #CCDFEA' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1B2A3D', marginBottom: 6 }}>{entity.entityName}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, fontSize: 12 }}>
                    <FactBadge label="Financials" verified={entity.financials.length > 0} />
                    <FactBadge label="Leadership" verified={entity.leadership.length > 0} />
                    <FactBadge label="Product names" verified={entity.productNames.length > 0} />
                    <FactBadge label="Market share" verified={!!entity.marketShare} />
                    {job.input.focusTech && <FactBadge label="Tech proof point" verified={!!entity.techProofPoint} />}
                  </div>
                </div>
              ))}
            </div>

            {/* Section preview */}
            {(job.sections || []).map((section, i) => (
              <div key={i} style={{ background: '#FFFFFF', border: '1px solid #CCDFEA', borderRadius: 12, padding: '20px 24px' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#0c3649', marginBottom: 10, borderBottom: '2px solid #B08A2E', paddingBottom: 6, display: 'inline-block' }}>{section.heading}</div>
                {section.paragraphs.map((p, pi) => (
                  <p key={pi} style={{ fontSize: 13, color: '#333333', lineHeight: 1.6, marginBottom: 8 }}>{p}</p>
                ))}
                {section.tables.map((t, ti) => (
                  <div key={ti} style={{ overflowX: 'auto', marginBottom: 8 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr>{t.headers.map((h, hi) => <th key={hi} style={{ background: '#0c3649', color: '#fff', padding: '8px 10px', textAlign: 'left' }}>{h}</th>)}</tr>
                      </thead>
                      <tbody>
                        {t.rows.map((row, ri) => (
                          <tr key={ri} style={{ background: ri % 2 === 1 ? '#EDEDED' : '#fff' }}>
                            {row.map((cell, ci) => <td key={ci} style={{ padding: '8px 10px', color: '#333333' }}>{cell || '—'}</td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
                {section.footnote && <div style={{ fontSize: 12, color: '#8A9DAD', fontStyle: 'italic', marginTop: 8 }}>{section.footnote}</div>}
                {section.flags.map((f, fi) => (
                  <div key={fi} style={{ fontSize: 12, color: '#8A9DAD', fontStyle: 'italic', marginTop: 4 }}>⚠ {f}</div>
                ))}
              </div>
            ))}

            <button onClick={handleReset} style={{ padding: '12px', borderRadius: 8, border: '1px solid #CCDFEA', background: 'transparent', color: '#5A6E7A', fontSize: 14, cursor: 'pointer' }}>
              ← New Report
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function FactBadge({ label, verified }: { label: string; verified: boolean }) {
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 12,
      background: verified ? 'rgba(16,185,129,0.12)' : 'rgba(138,157,173,0.12)',
      color: verified ? '#059669' : '#8A9DAD',
      fontWeight: 600,
    }}>
      {verified ? '✓' : '—'} {label}
    </span>
  );
}

const fieldLabel: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.65)', letterSpacing: 0.5, display: 'block', marginBottom: 6 };
const inputStyle: React.CSSProperties = { width: '100%', padding: '12px 14px', background: '#FFFFFF', border: '1px solid #CCDFEA', borderRadius: 8, color: '#1B2A3D', fontSize: 14, outline: 'none', boxSizing: 'border-box' };
