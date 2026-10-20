'use client';

import { useState, useEffect } from 'react';
import { saveToHistory, HistoryEntry } from '@/lib/history';
import StuckJobBanner from '@/components/shared/StuckJobBanner';
import { API_ENDPOINTS } from '@/lib/config';
import { useJobManager } from '@/lib/useJobManager';
import type { CorporateSubsidiaryResult, CorporateEntity } from '@ai-insights/types';

const accent = '#7C3AED';
const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid #CCDFEA', background: '#FFFFFF', color: '#1B2A3D', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const };
const labelStyle = { fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 1, color: accent, display: 'block', marginBottom: 8 };
const cardStyle = { background: '#F3F8FA', border: '1px solid #CCDFEA', borderRadius: 14, padding: '24px 26px' };
const th = { textAlign: 'left' as const, padding: '10px 12px', fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: 0.8, color: '#6B7280', borderBottom: '1px solid #CCDFEA', background: '#EAF2F6' };
const td = { padding: '10px 12px', fontSize: 13, color: '#374B5C', borderBottom: '1px solid #E3EDF2', verticalAlign: 'top' as const };
const shortUrl = (u: string) => u.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
const cell = (v: string) => (v || '').replace(/\|/g, '/').replace(/\s*\n\s*/g, ' ').trim();

function toMarkdown(j: CorporateSubsidiaryResult): string {
  return [
    `# ${j.companyName}: Corporate Subsidiaries`, '',
    '| Name of Entity | Webpage URL | LinkedIn URL | Entity Type | Specific Function |',
    '| --- | --- | --- | --- | --- |',
    ...(j.entities || []).map((e) => `| ${cell(e.legalName)} | ${e.webpageUrl}${e.webpageIsParent ? ' (parent)' : ''} | ${e.linkedinUrl || 'Not found'}${e.linkedinIsParent && e.linkedinUrl ? ' (parent)' : ''} | ${cell(e.entityType)} | ${cell(e.specificFunction)} |`),
  ].join('\n');
}

interface Props {
  restore?: HistoryEntry | null;
  onSaved?: () => void;
  /** Runs the Business Segment dossier on the chosen entity. */
  onSelectEntity: (entity: CorporateEntity, parent: CorporateSubsidiaryResult) => void;
}

export default function CorporateSubsidiaryPanel({ restore, onSaved, onSelectEntity }: Props) {
  const [step, setStep] = useState<'input' | 'loading' | 'results'>('input');
  const [companyName, setCompanyName] = useState('');
  const [companyDomain, setCompanyDomain] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [data, setData] = useState<CorporateSubsidiaryResult | null>(null);
  const [selected, setSelected] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const { job, error, isStuck, startJob, retryJob } = useJobManager<CorporateSubsidiaryResult>({
    stuckThresholdMs: 300_000,
    onComplete: (j) => {
      if (!j.entities?.length) { setStep('input'); return; }
      setData(j);
      setSelected(j.entities[0].legalName);
      setStep('results');
      saveToHistory({
        moduleType: 'corporate-subsidiary',
        targetCompany: (j.companyName || companyName).trim(),
        completedAt: j.completedAt || new Date().toISOString(),
        companyDomain: j.companyDomain || companyDomain.trim(),
        corporateSubsidiaryData: j,
      });
      onSaved?.();
    },
    onError: () => setStep('input'),
  });

  useEffect(() => {
    const j = restore?.corporateSubsidiaryData;
    if (!j?.entities?.length) return;
    setCompanyName(j.companyName || restore?.targetCompany || '');
    setCompanyDomain(j.companyDomain || '');
    setLinkedinUrl(j.linkedinUrl || '');
    setData(j);
    setSelected(j.entities[0].legalName);
    setStep('results');
  }, [restore]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!companyName.trim() || !companyDomain.trim()) return;
    setStep('loading');
    await startJob({
      endpoint: API_ENDPOINTS.corporateSubsidiary,
      streamUrlFactory: (jobId) => API_ENDPOINTS.corporateSubsidiaryStream(jobId),
      payload: { companyName: companyName.trim(), companyDomain: companyDomain.trim(), linkedinUrl: linkedinUrl.trim() || undefined },
      persist: { moduleType: 'corporate-subsidiary', targetCompany: companyName.trim() },
    });
  }

  const entities = data?.entities || [];
  const chosen = entities.find((e) => e.legalName === selected);

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {step === 'input' && (
        <form onSubmit={handleSubmit} style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ ...cardStyle, padding: '32px 28px' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Corporate Subsidiary</h2>
            <p style={{ fontSize: 13, color: '#374B5C', marginBottom: 28, lineHeight: 1.5 }}>
              Maps the company&apos;s corporate family tree: its separate legal entities, operating subsidiaries, holding companies and regional arms. Then pick an entity to profile its segments, financials and decision makers. Research takes a minute or two, and links are only shown when research actually found them.
            </p>
            <label style={{ display: 'block', marginBottom: 20 }}>
              <span style={labelStyle}>Company Name *</span>
              <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="e.g. Franklin Templeton" required style={inputStyle} />
            </label>
            <label style={{ display: 'block', marginBottom: 20 }}>
              <span style={labelStyle}>Primary Corporate Webpage *</span>
              <input type="text" value={companyDomain} onChange={(e) => setCompanyDomain(e.target.value)} placeholder="e.g. franklintempleton.com" required style={inputStyle} />
            </label>
            <label style={{ display: 'block', marginBottom: 28 }}>
              <span style={labelStyle}>Primary LinkedIn URL (optional)</span>
              <input type="text" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="e.g. https://www.linkedin.com/company/franklin-templeton" style={inputStyle} />
            </label>
            {error && <div style={{ color: '#E63946', fontSize: 13, marginBottom: 16 }}>{error}</div>}
            <button type="submit" style={{ width: '100%', padding: '13px 0', borderRadius: 10, border: 'none', background: `linear-gradient(135deg, ${accent}, #5B21B6)`, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
              Map Corporate Family Tree &rarr;
            </button>
          </div>
        </form>
      )}

      {step === 'loading' && (
        <div style={{ ...cardStyle, padding: '48px 28px', textAlign: 'center', maxWidth: 900, margin: '0 auto' }}>
          <div style={{ width: 40, height: 40, border: '3px solid rgba(124,58,237,0.2)', borderTopColor: accent, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 20px' }} />
          <p style={{ fontSize: 14 }}>{job?.currentStep || <>Researching <strong>{companyName}</strong>...</>}</p>
          <p style={{ fontSize: 12, color: '#6B7280', marginTop: 8 }}>Reading subsidiary filings, registries and company pages.</p>
          {isStuck && <StuckJobBanner onRetry={retryJob} />}
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {step === 'results' && data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{data.companyName}</h2>
            <span style={{ fontSize: 12, color: '#6B7280', background: 'rgba(124,58,237,0.1)', borderRadius: 6, padding: '3px 8px' }}>{entities.length} legal entities</span>
            <span style={{ flex: 1 }} />
            <button onClick={async () => { try { await navigator.clipboard.writeText(toMarkdown(data)); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* blocked */ } }} style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${accent}`, background: 'transparent', color: accent, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              {copied ? 'Copied' : 'Copy as Markdown'}
            </button>
          </div>

          <section style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
                <thead><tr>
                  <th style={{ ...th, width: 36 }} aria-label="Select" />
                  <th style={th}>Name of Entity</th><th style={th}>Webpage URL</th><th style={th}>LinkedIn URL</th><th style={th}>Entity Type</th><th style={th}>Specific Function</th>
                </tr></thead>
                <tbody>
                  {entities.map((e) => {
                    const on = e.legalName === selected;
                    return (
                      <tr key={e.legalName} onClick={() => setSelected(e.legalName)} style={{ cursor: 'pointer', background: on ? 'rgba(124,58,237,0.07)' : undefined }}>
                        <td style={td}><input type="radio" name="entity" checked={on} onChange={() => setSelected(e.legalName)} aria-label={`Select ${e.legalName}`} /></td>
                        <td style={{ ...td, fontWeight: 600, color: '#1B2A3D' }}>{e.legalName}</td>
                        <td style={td}>
                          <a href={e.webpageUrl} target="_blank" rel="noopener noreferrer" onClick={(ev) => ev.stopPropagation()} style={{ color: accent, textDecoration: 'underline', wordBreak: 'break-all' }}>{shortUrl(e.webpageUrl)}</a>
                          {e.webpageIsParent && <span style={{ color: '#6B7280', fontSize: 11 }}> (integrated into parent)</span>}
                        </td>
                        <td style={td}>
                          {e.linkedinUrl
                            ? <><a href={e.linkedinUrl} target="_blank" rel="noopener noreferrer" onClick={(ev) => ev.stopPropagation()} style={{ color: accent, textDecoration: 'underline', wordBreak: 'break-all' }}>{shortUrl(e.linkedinUrl)}</a>{e.linkedinIsParent && <span style={{ color: '#6B7280', fontSize: 11 }}> (parent page)</span>}</>
                            : <span style={{ color: '#6B7280' }}>Not found</span>}
                        </td>
                        <td style={td}>{e.entityType}</td>
                        <td style={td}>{e.specificFunction}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section style={{ ...cardStyle, border: '1px solid rgba(124,58,237,0.3)', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 240 }}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: accent, marginBottom: 4 }}>Target Entity</div>
              <div style={{ fontSize: 14, color: '#374B5C' }}>{chosen ? <><strong>{chosen.legalName}</strong>. Profile its business segments, financials and key decision makers, then build a sales battlecard.</> : 'Select an entity in the table.'}</div>
            </div>
            <button disabled={!chosen} onClick={() => chosen && onSelectEntity(chosen, data)} style={{ padding: '12px 24px', borderRadius: 10, border: 'none', background: `linear-gradient(135deg, ${accent}, #5B21B6)`, color: '#fff', fontSize: 14, fontWeight: 700, cursor: chosen ? 'pointer' : 'not-allowed', opacity: chosen ? 1 : 0.6 }}>
              Analyse Selected Entity &rarr;
            </button>
          </section>

          <button onClick={() => { setStep('input'); setData(null); setCompanyName(''); setCompanyDomain(''); setLinkedinUrl(''); }} style={{ alignSelf: 'flex-start', padding: '10px 22px', borderRadius: 8, border: `1px solid ${accent}`, background: 'transparent', color: accent, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            New Company
          </button>
        </div>
      )}
    </div>
  );
}
