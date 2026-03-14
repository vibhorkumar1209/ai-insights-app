'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import ModuleIcon from '@/components/shared/ModuleIcon';
import HistoryDrawer from '@/components/shared/HistoryDrawer';
import {
  SalesPlayJob,
  SalesPlayPriorityRow,
  SalesPlayIndustrySolution,
  SalesPlayPartner,
  SalesPlayCaseStudy,
  SalesPlayPriorityMapping,
  SalesPlayObjectionRebuttal,
} from '@/lib/types';
import {
  loadHistory, saveToHistory, loadEntryById,
  popPendingRestore, HistoryEntry,
} from '@/lib/history';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const ACCENT = '#E63946';

type Step = 'input' | 'analysing' | 'results';

// ── Style constants ────────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 700,
  color: '#7eaabf', letterSpacing: '0.5px',
  textTransform: 'uppercase', marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px',
  background: 'rgba(8,15,22,0.8)', border: '1px solid #1e4a68',
  borderRadius: 8, color: '#E8EDF5', fontSize: 13,
  outline: 'none', boxSizing: 'border-box',
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle, resize: 'vertical', minHeight: 90, lineHeight: 1.55,
};

const subHead: React.CSSProperties = {
  fontSize: 12, fontWeight: 700, color: '#7eaabf',
  textTransform: 'uppercase', letterSpacing: '0.4px',
  marginBottom: 10, marginTop: 0,
};

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionBadge({ num }: { num: string }) {
  return (
    <div style={{
      width: 26, height: 26, borderRadius: '50%',
      background: `${ACCENT}22`, border: `1.5px solid ${ACCENT}66`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 12, fontWeight: 700, color: ACCENT, flexShrink: 0,
    }}>{num}</div>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: 'linear-gradient(160deg, #0e2535, #0c1e2e)',
      border: '1px solid #1e4a68', borderRadius: 10, padding: '16px 18px',
      ...style,
    }}>
      {children}
    </div>
  );
}

function Tag({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <span style={{
      display: 'inline-block', padding: '3px 9px',
      background: `${color || ACCENT}18`, border: `1px solid ${color || ACCENT}44`,
      borderRadius: 20, fontSize: 11, fontWeight: 600,
      color: color || ACCENT, marginRight: 6, marginBottom: 6,
    }}>{children}</span>
  );
}

// ── Priority Table (Section 1) ────────────────────────────────────────────────

function PriorityTable({ rows, yourCompany, competitorName }: {
  rows: SalesPlayPriorityRow[];
  yourCompany: string;
  competitorName: string;
}) {
  const colStyle = (w: string): React.CSSProperties => ({
    padding: '10px 14px', verticalAlign: 'top',
    fontSize: 12.5, lineHeight: 1.6, width: w,
  });
  const thStyle = (w: string): React.CSSProperties => ({
    ...colStyle(w), fontWeight: 700, fontSize: 11, letterSpacing: '0.4px',
    color: '#7eaabf', textTransform: 'uppercase', background: '#0a1e2e',
    borderBottom: `2px solid ${ACCENT}44`,
  });

  return (
    <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid #1e4a68' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
        <thead>
          <tr>
            <th style={thStyle('18%')}>Strategic Priority</th>
            <th style={thStyle('27%')}>{yourCompany} Solution</th>
            <th style={thStyle('27%')}>Proof Points</th>
            <th style={thStyle('28%')}>Why Not {competitorName}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{
              borderTop: '1px solid #1a3a50',
              background: i % 2 === 0 ? 'transparent' : 'rgba(10,30,46,0.4)',
            }}>
              <td style={{ ...colStyle('18%'), fontWeight: 700, color: ACCENT }}>{row.priority}</td>
              <td style={{ ...colStyle('27%'), color: '#d0dde8' }}>{row.companySolution}</td>
              <td style={{ ...colStyle('27%'), color: '#b5c8d9' }}>{row.proofPoints}</td>
              <td style={{ ...colStyle('28%'), color: '#9eb8c8' }}>{row.whyNotCompetitor}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Priority Mapping Table (Section 3) ────────────────────────────────────────

function MappingTable({ rows, yourCompany }: {
  rows: SalesPlayPriorityMapping[];
  yourCompany: string;
}) {
  const colStyle = (w: string): React.CSSProperties => ({
    padding: '10px 14px', verticalAlign: 'top', fontSize: 12.5, lineHeight: 1.6, width: w,
  });
  const thStyle = (w: string): React.CSSProperties => ({
    ...colStyle(w), fontWeight: 700, fontSize: 11, letterSpacing: '0.4px',
    color: '#7eaabf', textTransform: 'uppercase', background: '#0a1e2e',
    borderBottom: `2px solid ${ACCENT}44`,
  });

  return (
    <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid #1e4a68' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 680 }}>
        <thead>
          <tr>
            <th style={thStyle('22%')}>Priority</th>
            <th style={thStyle('28%')}>{yourCompany} Solution</th>
            <th style={thStyle('33%')}>Expected Outcome</th>
            <th style={thStyle('17%')}>Time to Value</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{
              borderTop: '1px solid #1a3a50',
              background: i % 2 === 0 ? 'transparent' : 'rgba(10,30,46,0.4)',
            }}>
              <td style={{ ...colStyle('22%'), fontWeight: 600, color: '#c8dae8' }}>{row.priority}</td>
              <td style={{ ...colStyle('28%'), color: ACCENT, fontWeight: 600 }}>{row.solution}</td>
              <td style={{ ...colStyle('33%'), color: '#b5c8d9' }}>{row.expectedOutcome}</td>
              <td style={{ ...colStyle('17%') }}><Tag color="#10B981">{row.timeToValue}</Tag></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Results View ──────────────────────────────────────────────────────────────

function ResultsView({ job, onReset }: { job: SalesPlayJob; onReset: () => void }) {
  return (
    <div>
      {/* Header card */}
      <div style={{
        background: `linear-gradient(135deg, ${ACCENT}18 0%, transparent 60%)`,
        border: `1px solid ${ACCENT}33`, borderRadius: 12,
        padding: '16px 20px', marginBottom: 28,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12,
      }}>
        <div>
          <div style={{ fontSize: 11, color: ACCENT, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 4 }}>
            Sales Play &amp; Opportunity
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#E8EDF5' }}>
            {job.yourCompany} → {job.targetAccount}
          </div>
          <div style={{ fontSize: 12, color: '#7eaabf', marginTop: 3 }}>
            vs {job.competitorName} &nbsp;·&nbsp; {job.targetIndustry}
          </div>
        </div>
        <button onClick={onReset} style={{
          background: 'rgba(255,255,255,0.05)', border: '1px solid #2a5070',
          borderRadius: 8, padding: '7px 14px', color: '#7eaabf',
          fontSize: 12, cursor: 'pointer',
        }}>
          ← New Analysis
        </button>
      </div>

      {/* ── SECTION 1 ──────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <SectionBadge num="1" />
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#E8EDF5' }}>
            {job.yourCompany}&apos;s Solutions Aligned to {job.targetAccount}&apos;s Priorities
          </h2>
        </div>
        {job.priorityTable && job.priorityTable.length > 0
          ? <PriorityTable rows={job.priorityTable} yourCompany={job.yourCompany || ''} competitorName={job.competitorName || ''} />
          : <div style={{ color: '#7eaabf', fontSize: 13 }}>No priority data available.</div>
        }
      </div>

      {/* ── SECTION 2 ──────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <SectionBadge num="2" />
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#E8EDF5' }}>
            Industry Solutions, Technology &amp; Partner Ecosystem
          </h2>
        </div>

        {/* 2A Industry Solutions */}
        {job.industrySolutions && job.industrySolutions.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <p style={subHead}>A. Industry-Specific Solutions ({job.targetIndustry})</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
              {job.industrySolutions.map((sol: SalesPlayIndustrySolution, i: number) => (
                <Card key={i}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: ACCENT, marginBottom: 6 }}>{sol.name}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#4a8fa8', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 }}>
                    Solves: {sol.problemSolved}
                  </div>
                  <div style={{ fontSize: 12.5, color: '#b5c8d9', lineHeight: 1.6 }}>{sol.description}</div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* 2B Technology */}
        {job.techSummary && (
          <div style={{ marginBottom: 20 }}>
            <p style={subHead}>B. Technology Stack &amp; Differentiators</p>
            <Card>
              <p style={{ margin: 0, fontSize: 13, color: '#c8dae8', lineHeight: 1.7 }}>{job.techSummary}</p>
            </Card>
          </div>
        )}

        {/* 2C Partner Ecosystem */}
        {((job.technologyPartners && job.technologyPartners.length > 0) || (job.siPartners && job.siPartners.length > 0)) && (
          <div style={{ marginBottom: 20 }}>
            <p style={subHead}>C. Partner Ecosystem</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {job.technologyPartners && job.technologyPartners.length > 0 && (
                <Card>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#7eaabf', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Technology Partners</div>
                  {job.technologyPartners.map((p: SalesPlayPartner, i: number) => (
                    <div key={i} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: i < (job.technologyPartners?.length ?? 0) - 1 ? '1px solid #1a3a50' : 'none' }}>
                      <div style={{ fontWeight: 700, color: '#E8EDF5', fontSize: 13 }}>{p.name}</div>
                      <div style={{ color: '#8aadbe', fontSize: 12, marginTop: 2 }}>{p.capability}</div>
                    </div>
                  ))}
                </Card>
              )}
              {job.siPartners && job.siPartners.length > 0 && (
                <Card>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#7eaabf', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.4px' }}>SI &amp; Advisory Partners</div>
                  {job.siPartners.map((p: SalesPlayPartner, i: number) => (
                    <div key={i} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: i < (job.siPartners?.length ?? 0) - 1 ? '1px solid #1a3a50' : 'none' }}>
                      <div style={{ fontWeight: 700, color: '#E8EDF5', fontSize: 13 }}>{p.name}</div>
                      <div style={{ color: '#8aadbe', fontSize: 12, marginTop: 2 }}>{p.capability}</div>
                    </div>
                  ))}
                </Card>
              )}
            </div>
          </div>
        )}

        {/* 2D Case Studies */}
        {job.caseStudies && job.caseStudies.length > 0 && (
          <div>
            <p style={subHead}>D. Supporting Case Studies</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
              {job.caseStudies.map((cs: SalesPlayCaseStudy, i: number) => (
                <Card key={i} style={{ borderLeft: `3px solid ${ACCENT}66` }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#E8EDF5', marginBottom: 10 }}>{cs.client}</div>
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#7eaabf', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 3 }}>Challenge</div>
                    <div style={{ fontSize: 12.5, color: '#b5c8d9', lineHeight: 1.5 }}>{cs.challenge}</div>
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#7eaabf', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 3 }}>Solution</div>
                    <div style={{ fontSize: 12.5, color: '#b5c8d9', lineHeight: 1.5 }}>{cs.solution}</div>
                  </div>
                  <div style={{ background: `${ACCENT}12`, border: `1px solid ${ACCENT}33`, borderRadius: 6, padding: '8px 10px', marginTop: 4 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: ACCENT, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 3 }}>Outcome</div>
                    <div style={{ fontSize: 12.5, color: '#E8EDF5', fontWeight: 600 }}>{cs.outcome}</div>
                  </div>
                  {cs.testimonial && (
                    <blockquote style={{ margin: '10px 0 0', padding: '8px 12px', borderLeft: `2px solid ${ACCENT}55`, background: 'rgba(230,57,70,0.05)', borderRadius: '0 6px 6px 0' }}>
                      <div style={{ fontSize: 12, color: '#9eb8c8', fontStyle: 'italic', lineHeight: 1.5 }}>
                        &ldquo;{cs.testimonial}&rdquo;
                      </div>
                    </blockquote>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── SECTION 3 ──────────────────────────────────────────────────────── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <SectionBadge num="3" />
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#E8EDF5' }}>
            Why {job.yourCompany} — Competitive Positioning &amp; Next Steps
          </h2>
        </div>

        {/* 3A Priority Mapping */}
        {job.priorityMapping && job.priorityMapping.length > 0 && (
          <div style={{ marginBottom: 22 }}>
            <p style={subHead}>A. Priority-to-Solution Mapping</p>
            <MappingTable rows={job.priorityMapping} yourCompany={job.yourCompany || ''} />
          </div>
        )}

        {/* 3B Competitive Statement */}
        {job.competitiveStatement && (
          <div style={{ marginBottom: 22 }}>
            <p style={subHead}>B. Competitive Positioning Statement</p>
            <div style={{
              background: `linear-gradient(135deg, ${ACCENT}10, transparent 70%)`,
              border: `1px solid ${ACCENT}44`, borderLeft: `4px solid ${ACCENT}`,
              borderRadius: '0 10px 10px 0', padding: '16px 20px',
            }}>
              <p style={{ margin: 0, fontSize: 13.5, color: '#d0dde8', lineHeight: 1.75, fontStyle: 'italic' }}>
                &ldquo;{job.competitiveStatement}&rdquo;
              </p>
            </div>
          </div>
        )}

        {/* 3C Objection Handling */}
        {job.objectionRebuttals && job.objectionRebuttals.length > 0 && (
          <div style={{ marginBottom: 22 }}>
            <p style={subHead}>C. Objection Handling</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {job.objectionRebuttals.map((item: SalesPlayObjectionRebuttal, i: number) => (
                <Card key={i}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                      background: 'rgba(230,57,70,0.12)', border: '1px solid rgba(230,57,70,0.3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, color: ACCENT, fontWeight: 700, marginTop: 1,
                    }}>?</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#E8EDF5', marginBottom: 6 }}>
                        &ldquo;{item.objection}&rdquo;
                      </div>
                      <div style={{ fontSize: 12.5, color: '#b5c8d9', lineHeight: 1.65, paddingLeft: 10, borderLeft: '2px solid #1e5a70' }}>
                        {item.rebuttal}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* 3D CTA */}
        {job.callToAction && (
          <div>
            <p style={subHead}>D. Recommended Next Step</p>
            <div style={{ background: `${ACCENT}14`, border: `1px solid ${ACCENT}55`, borderRadius: 10, padding: '14px 18px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>🎯</div>
              <p style={{ margin: 0, fontSize: 13.5, color: '#E8EDF5', lineHeight: 1.65, fontWeight: 500 }}>{job.callToAction}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SalesPlayPage() {
  const [step, setStep]               = useState<Step>('input');
  const [job, setJob]                 = useState<Partial<SalesPlayJob> | null>(null);
  const [error, setError]             = useState<string | null>(null);
  const [historyCount, setHistoryCount] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const eventSourceRef                = useRef<EventSource | null>(null);
  const resultReceivedRef             = useRef(false);
  const errorHandledRef               = useRef(false); // set when named SSE 'error' event is received

  // Form fields
  const [yourCompany,          setYourCompany]          = useState('');
  const [competitorName,       setCompetitorName]       = useState('');
  const [targetAccount,        setTargetAccount]        = useState('');
  const [targetIndustry,       setTargetIndustry]       = useState('');
  const [strategicPriorities,  setStrategicPriorities]  = useState('');
  const [solutionAreas,        setSolutionAreas]        = useState('');
  const [competitorWeaknesses, setCompetitorWeaknesses] = useState('');

  useEffect(() => {
    setHistoryCount(loadHistory().length);
    const pendingId = popPendingRestore();
    if (pendingId) {
      const entry = loadEntryById(pendingId);
      if (entry && entry.moduleType === 'sales-play' && entry.salesPlayData) {
        restoreEntry(entry);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { return () => { eventSourceRef.current?.close(); }; }, []);

  function restoreEntry(entry: HistoryEntry) {
    if (entry.salesPlayData) {
      setJob(entry.salesPlayData);
      setStep('results');
    }
  }

  const canSubmit = !!(
    yourCompany.trim() && competitorName.trim() &&
    targetAccount.trim() && targetIndustry.trim()
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    resultReceivedRef.current = false;
    errorHandledRef.current = false;
    setStep('analysing');

    const priorities = strategicPriorities.split('\n').map((p) => p.trim()).filter(Boolean);

    try {
      const res = await fetch(`${API_BASE}/api/sales-play`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          yourCompany:          yourCompany.trim(),
          competitorName:       competitorName.trim(),
          targetAccount:        targetAccount.trim(),
          targetIndustry:       targetIndustry.trim(),
          // Only send optional fields if the user actually filled them in
          ...(priorities.length > 0    && { strategicPriorities: priorities }),
          ...(solutionAreas.trim()     && { solutionAreas: solutionAreas.trim() }),
          ...(competitorWeaknesses.trim() && { competitorWeaknesses: competitorWeaknesses.trim() }),
        }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error((errBody as { error?: string }).error || `HTTP ${res.status}`);
      }

      const { jobId } = await res.json() as { jobId: string };
      setJob({ jobId });

      const es = new EventSource(`${API_BASE}/api/sales-play/${jobId}/stream`);
      eventSourceRef.current = es;

      es.addEventListener('progress', (e) => {
        const data = JSON.parse(e.data) as Partial<SalesPlayJob>;
        setJob((prev) => ({ ...(prev ?? {}), ...data }));
      });

      es.addEventListener('result', (e) => {
        resultReceivedRef.current = true;
        const data = JSON.parse(e.data) as SalesPlayJob;
        setJob(data);
        setStep('results');
        es.close();
        setHistoryCount((n) => n + 1);
        saveToHistory({
          moduleType:    'sales-play',
          targetCompany: data.targetAccount || targetAccount,
          completedAt:   data.completedAt || new Date().toISOString(),
          salesPlayData: data,
        } as Omit<HistoryEntry, 'id'>);
      });

      es.addEventListener('error', (ev) => {
        errorHandledRef.current = true;
        let msg = 'Sales play generation failed — please try again.';
        try { const d = JSON.parse((ev as MessageEvent).data); if (d.error) msg = d.error; } catch {}
        setError(msg); setStep('input'); es.close();
      });

      es.onerror = () => {
        // Suppress if a result or a named SSE 'error' event was already handled
        if (resultReceivedRef.current || errorHandledRef.current) return;
        setError('Connection lost — please try again.');
        setStep('input'); es.close();
      };

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error');
      setStep('input');
    }
  }

  function handleReset() {
    eventSourceRef.current?.close();
    setStep('input'); setJob(null); setError(null);
    resultReceivedRef.current = false;
    errorHandledRef.current = false;
  }

  const progress = job?.progress ?? 0;

  return (
    <div style={{ minHeight: '100vh', background: '#080f16', color: '#E8EDF5', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {showHistory && (
        <HistoryDrawer
          currentModule="sales-play"
          onSelectSameModule={restoreEntry}
          onClose={() => setShowHistory(false)}
        />
      )}

      {/* Top nav */}
      <div style={{ background: 'linear-gradient(135deg, #0c3649 0%, #0a2233 100%)', borderBottom: '1px solid #1e4a68', padding: '16px 32px', flexShrink: 0 }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/" style={{ color: '#7eaabf', fontSize: 12, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            ← Dashboard
          </Link>
          <div style={{ width: 1, height: 16, background: '#1e4a68', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, color: ACCENT, marginBottom: 3 }}>REFRACTONE</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ModuleIcon id="sales-play" size={20} />
              <span style={{ fontSize: 18, fontWeight: 800, color: '#E8EDF5' }}>Sales Play &amp; Opportunity</span>
            </div>
          </div>
          <button
            onClick={() => setShowHistory(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(230,57,70,0.1)', border: '1px solid rgba(230,57,70,0.25)',
              color: '#ff8a8a', borderRadius: 8, padding: '8px 16px',
              fontSize: 13, fontWeight: 600, cursor: 'pointer', flexShrink: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="12" height="12" rx="2" stroke="#ff8a8a" strokeWidth="1.4" />
              <path d="M3.5 4.5h7M3.5 7h7M3.5 9.5h4" stroke="#ff8a8a" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            Report History
            {historyCount > 0 && (
              <span style={{ background: ACCENT, color: '#fff', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>
                {historyCount > 9 ? '9+' : historyCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 20px' }}>

        {/* ── INPUT ──────────────────────────────────────────────────────────── */}
        {step === 'input' && (
          <div>
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#E8EDF5' }}>Build a Sales Play</h1>
              <p style={{ margin: '8px 0 0', fontSize: 13.5, color: '#7eaabf', lineHeight: 1.6, maxWidth: 620 }}>
                Only 4 fields are required. Strategic priorities, solution areas, and competitor weaknesses are all
                optional — the AI will research and discover them automatically if left blank.
              </p>
            </div>

            {error && (
              <div style={{ background: 'rgba(230,57,70,0.1)', border: '1px solid rgba(230,57,70,0.4)', borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: '#ff8a8a' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={labelStyle}>Your Company *</label>
                  <input style={inputStyle} placeholder="e.g. Infosys, SAP, EdgeVerve" value={yourCompany} onChange={(e) => setYourCompany(e.target.value)} required />
                </div>
                <div>
                  <label style={labelStyle}>Competitor to Displace *</label>
                  <input style={inputStyle} placeholder="e.g. Oracle, Salesforce, TCS" value={competitorName} onChange={(e) => setCompetitorName(e.target.value)} required />
                </div>
                <div>
                  <label style={labelStyle}>Target Account *</label>
                  <input style={inputStyle} placeholder="e.g. Ford Motor Company" value={targetAccount} onChange={(e) => setTargetAccount(e.target.value)} required />
                </div>
                <div>
                  <label style={labelStyle}>Target Industry *</label>
                  <input style={inputStyle} placeholder="e.g. Automotive, Financial Services" value={targetIndustry} onChange={(e) => setTargetIndustry(e.target.value)} required />
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>
                  Target Account&apos;s Strategic Priorities
                  <span style={{ color: '#4a7a96', textTransform: 'none', fontWeight: 400, letterSpacing: 0, marginLeft: 6 }}>(optional — one per line · AI will research if left blank)</span>
                </label>
                <textarea
                  style={{ ...textareaStyle, borderColor: strategicPriorities.trim() ? '#1e4a68' : 'rgba(30,74,104,0.5)' }}
                  placeholder={`Leave blank for AI to discover automatically, or enter:\nDigital transformation\nCost reduction\nSupply chain resilience\nAI & automation adoption`}
                  value={strategicPriorities}
                  onChange={(e) => setStrategicPriorities(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>
                  Your Key Solution Areas
                  <span style={{ color: '#4a7a96', textTransform: 'none', fontWeight: 400, letterSpacing: 0, marginLeft: 6 }}>(optional — AI will research if left blank)</span>
                </label>
                <textarea
                  style={{ ...textareaStyle, borderColor: solutionAreas.trim() ? '#1e4a68' : 'rgba(30,74,104,0.5)' }}
                  placeholder="Leave blank for AI to discover automatically, or enter: AI-driven ERP modernisation, Supply Chain Analytics, Intelligent Automation, Cloud migration"
                  value={solutionAreas}
                  onChange={(e) => setSolutionAreas(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: 28 }}>
                <label style={labelStyle}>
                  Known Competitor Weaknesses
                  <span style={{ color: '#4a7a96', textTransform: 'none', fontWeight: 400, letterSpacing: 0, marginLeft: 6 }}>(optional — AI will also research this)</span>
                </label>
                <textarea style={{ ...textareaStyle, minHeight: 70 }} placeholder="Leave blank for AI to research, or enter: High implementation costs, poor post-sale support, lack of industry-specific templates" value={competitorWeaknesses} onChange={(e) => setCompetitorWeaknesses(e.target.value)} />
              </div>

              <button
                type="submit" disabled={!canSubmit}
                style={{
                  background: canSubmit ? ACCENT : 'rgba(230,57,70,0.25)', border: 'none',
                  borderRadius: 8, padding: '12px 28px', fontSize: 13.5, fontWeight: 700,
                  color: canSubmit ? '#fff' : '#7a4550', cursor: canSubmit ? 'pointer' : 'not-allowed', transition: 'all 0.2s',
                }}
              >
                Generate Sales Play →
              </button>
            </form>
          </div>
        )}

        {/* ── ANALYSING ──────────────────────────────────────────────────────── */}
        {step === 'analysing' && (
          <div style={{ textAlign: 'center', padding: '70px 20px' }}>
            <div style={{ marginBottom: 20 }}><ModuleIcon id="sales-play" size={48} /></div>
            <h2 style={{ margin: '0 0 8px', fontSize: 19, fontWeight: 700, color: '#E8EDF5' }}>Building your Sales Play…</h2>
            <p style={{ margin: '0 0 32px', fontSize: 13, color: '#7eaabf' }}>{job?.currentStep || 'Initialising…'}</p>
            <div style={{ width: '100%', maxWidth: 440, margin: '0 auto 12px', height: 6, background: '#0e2535', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 3, background: `linear-gradient(90deg, ${ACCENT}, #ff6b74)`, width: `${progress}%`, transition: 'width 0.6s ease' }} />
            </div>
            <div style={{ fontSize: 12, color: '#4a7a96', marginBottom: 32 }}>{progress}% complete</div>
            <div style={{ fontSize: 12, color: '#3a6a80', maxWidth: 420, margin: '0 auto' }}>
              Researching {targetAccount}&apos;s technology landscape &amp; competitive intelligence on {competitorName}, then synthesising the full 3-section document — typically 90–180 seconds.
            </div>
          </div>
        )}

        {/* ── RESULTS ────────────────────────────────────────────────────────── */}
        {step === 'results' && job && (job as SalesPlayJob).status === 'complete' && (
          <ResultsView job={job as SalesPlayJob} onReset={handleReset} />
        )}
      </div>
    </div>
  );
}
