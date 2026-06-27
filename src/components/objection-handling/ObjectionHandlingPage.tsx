'use client';
import StuckJobBanner from '@/components/shared/StuckJobBanner';
import KillSwitchButton from '@/components/shared/KillSwitchButton';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ModuleIcon from '@/components/shared/ModuleIcon';
import BulletText from '@/components/shared/BulletText';
import { ObjectionHandlingJob, ObjectionHandlingItem, IncumbentDisplacementTactic } from '@/lib/types';
import { API_ENDPOINTS } from '@/lib/config';
import { useJobManager } from '@/lib/useJobManager';
import { loadHistory } from '@/lib/history';

const ACCENT = '#E63946';
const BLUE   = '#0c3649';

type Step = 'input' | 'analysing' | 'results' | 'error';

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 700,
  color: '#6B7280', letterSpacing: '0.5px',
  textTransform: 'uppercase', marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px',
  background: '#FFFFFF', border: '1px solid #CCDFEA',
  borderRadius: 8, color: '#1B2A3D', fontSize: 13,
  outline: 'none', boxSizing: 'border-box',
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle, resize: 'vertical', minHeight: 80, lineHeight: 1.55,
};

const subHead: React.CSSProperties = {
  fontSize: 12, fontWeight: 700, color: '#6B7280',
  textTransform: 'uppercase', letterSpacing: '0.4px',
  marginBottom: 10, marginTop: 0,
};

// ── Category colour map ───────────────────────────────────────────────────────
const CATEGORY_COLORS: Record<string, string> = {
  'Switching Cost':             '#F59E0B',
  'Switching Cost / Risk':      '#F59E0B',
  'Technical Risk':             '#8B5CF6',
  'Product Capability Gap':     '#3B82F6',
  'Relationship & Politics':    '#EC4899',
  'Relationship':               '#EC4899',
  'Commercial / Pricing':       '#10B981',
  'Commercial':                 '#10B981',
  'Implementation Complexity':  '#6366F1',
  'Support & Service':          '#14B8A6',
  'Strategic Fit':              '#F97316',
};
function catColor(cat: string): string {
  return CATEGORY_COLORS[cat] || ACCENT;
}

// ── Card ─────────────────────────────────────────────────────────────────────
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: '#F3F8FA', border: '1px solid #CCDFEA',
      borderRadius: 10, padding: '16px 18px', ...style,
    }}>
      {children}
    </div>
  );
}

// ── Objection card ─────────────────────────────────────────────────────────────
function ObjectionCard({ item, idx }: { item: ObjectionHandlingItem; idx: number }) {
  const [open, setOpen] = useState(true);
  const color = catColor(item.category);

  return (
    <Card style={{ borderLeft: `3px solid ${color}`, padding: 0, overflow: 'hidden' }}>
      {/* header */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'flex', alignItems: 'flex-start', gap: 12,
          width: '100%', padding: '14px 16px', background: 'none',
          border: 'none', cursor: 'pointer', textAlign: 'left',
        }}
      >
        <div style={{
          minWidth: 26, height: 26, borderRadius: '50%', flexShrink: 0,
          background: `${color}18`, border: `1.5px solid ${color}55`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, color, fontWeight: 800,
        }}>{idx + 1}</div>
        <div style={{ flex: 1 }}>
          <div style={{
            display: 'inline-block', padding: '2px 8px', borderRadius: 12,
            background: `${color}15`, border: `1px solid ${color}40`,
            fontSize: 10, fontWeight: 700, color, letterSpacing: '0.4px',
            textTransform: 'uppercase', marginBottom: 5,
          }}>{item.category}</div>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: '#1B2A3D', lineHeight: 1.4 }}>
            &ldquo;{item.objection}&rdquo;
          </div>
        </div>
        <div style={{ fontSize: 16, color: '#9CA3AF', flexShrink: 0, marginTop: 2 }}>{open ? '▾' : '▸'}</div>
      </button>

      {/* body */}
      {open && (
        <div style={{ padding: '0 16px 16px 16px', borderTop: '1px solid #E0ECF1' }}>
          {/* rebuttal */}
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 }}>Rebuttal</div>
            <div style={{ paddingLeft: 10, borderLeft: '2px solid #0c364944' }}>
              <BulletText text={item.rebuttal} color="#374B5C" boldColor="#1B2A3D" fontSize={12.5} bulletColor="#10B981" />
            </div>
          </div>

          {/* proof point */}
          {item.proofPoint && (
            <div style={{ marginTop: 12, background: '#EDF4F8', border: '1px solid #CCDFEA', borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 4 }}>Proof Point</div>
              <div style={{ fontSize: 12.5, color: '#1B2A3D', fontWeight: 600, lineHeight: 1.5 }}>{item.proofPoint}</div>
            </div>
          )}

          {/* talk track */}
          {item.talkTrack && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 5 }}>Suggested Talk Track</div>
              <blockquote style={{
                margin: 0, padding: '10px 14px',
                background: `${ACCENT}08`, border: `1px solid ${ACCENT}30`,
                borderLeft: `3px solid ${ACCENT}`, borderRadius: '0 8px 8px 0',
              }}>
                <div style={{ fontSize: 12.5, color: '#374B5C', fontStyle: 'italic', lineHeight: 1.6 }}>
                  &ldquo;{item.talkTrack}&rdquo;
                </div>
              </blockquote>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

// ── Incumbent tactic card ──────────────────────────────────────────────────────
function TacticCard({ tactic, idx }: { tactic: IncumbentDisplacementTactic; idx: number }) {
  return (
    <div style={{
      display: 'flex', gap: 14, padding: '14px 16px',
      background: idx % 2 === 0 ? '#FFFFFF' : '#F3F8FA',
      borderBottom: '1px solid #E0ECF1',
    }}>
      <div style={{
        minWidth: 28, height: 28, borderRadius: '50%', flexShrink: 0,
        background: `${BLUE}18`, border: `1.5px solid ${BLUE}40`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 800, color: BLUE,
      }}>{idx + 1}</div>
      <div style={{ flex: 1 }}>
        <div style={{
          display: 'inline-block', padding: '2px 8px', borderRadius: 12,
          background: '#EDF4F8', border: '1px solid #CCDFEA',
          fontSize: 10, fontWeight: 700, color: BLUE, letterSpacing: '0.4px',
          textTransform: 'uppercase', marginBottom: 5,
        }}>{tactic.phase}</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#1B2A3D', marginBottom: 4 }}>{tactic.tactic}</div>
        <div style={{ fontSize: 12.5, color: '#374B5C', lineHeight: 1.55 }}>{tactic.rationale}</div>
      </div>
    </div>
  );
}

// ── Results view ──────────────────────────────────────────────────────────────
function ResultsView({ job, onReset }: { job: ObjectionHandlingJob; onReset: () => void }) {
  return (
    <div>
      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${ACCENT}18 0%, transparent 60%)`,
        border: `1px solid ${ACCENT}33`, borderRadius: 12,
        padding: '16px 20px', marginBottom: 28,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12,
      }}>
        <div>
          <div style={{ fontSize: 11, color: ACCENT, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 4 }}>
            Objection Handling Playbook
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#1B2A3D' }}>
            {job.yourCompany} → {job.targetAccount}
          </div>
          <div style={{ fontSize: 12, color: '#6B7280', marginTop: 3, display: 'flex', alignItems: 'center', gap: 8 }}>
            vs {job.competitorName}&nbsp;·&nbsp;{job.targetIndustry}
            {job.isIncumbent && (
              <span style={{
                background: '#F59E0B18', border: '1px solid #F59E0B55',
                color: '#B45309', fontSize: 10, fontWeight: 700,
                padding: '2px 8px', borderRadius: 12, textTransform: 'uppercase', letterSpacing: '0.4px',
              }}>⚠ Incumbent</span>
            )}
          </div>
        </div>
        <button onClick={onReset} style={{
          background: '#FFFFFF', border: '1px solid #CCDFEA',
          borderRadius: 8, padding: '7px 14px', color: '#374B5C',
          fontSize: 12, cursor: 'pointer',
        }}>← New Analysis</button>
      </div>

      {/* Exec Summary */}
      {job.execSummary && (
        <div style={{ marginBottom: 28 }}>
          <p style={subHead}>Executive Summary</p>
          <div style={{
            background: `linear-gradient(135deg, ${BLUE}10, transparent 70%)`,
            border: `1px solid ${BLUE}30`, borderLeft: `4px solid ${BLUE}`,
            borderRadius: '0 10px 10px 0', padding: '14px 18px',
          }}>
            <p style={{ margin: 0, fontSize: 13.5, color: '#374B5C', lineHeight: 1.75 }}>{job.execSummary}</p>
          </div>
        </div>
      )}

      {/* Battle Card */}
      {job.battleCard && (
        <div style={{ marginBottom: 28 }}>
          <p style={subHead}>Battle Card — Head-to-Head Summary</p>
          <Card style={{ background: '#EDF4F8', borderColor: '#B8D0D8' }}>
            <p style={{ margin: 0, fontSize: 13, color: '#1B2A3D', lineHeight: 1.7, fontWeight: 500 }}>{job.battleCard}</p>
          </Card>
        </div>
      )}

      {/* Objections */}
      {job.objections && job.objections.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <p style={{ ...subHead, marginBottom: 0 }}>
              Objection Rebuttals &amp; Talk Tracks
              <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 400, color: '#9CA3AF', textTransform: 'none', letterSpacing: 0 }}>
                {job.objections.length} objections{job.isIncumbent ? ' (incumbent displacement mode)' : ''}
              </span>
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {job.objections.map((item, i) => (
              <ObjectionCard key={i} item={item} idx={i} />
            ))}
          </div>
        </div>
      )}

      {/* Incumbent displacement tactics */}
      {job.isIncumbent && job.incumbentDisplacementTactics && job.incumbentDisplacementTactics.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <p style={subHead}>Incumbent Displacement Playbook — Phased Tactics</p>
          <div style={{ border: '1px solid #CCDFEA', borderRadius: 10, overflow: 'hidden' }}>
            {job.incumbentDisplacementTactics.map((t, i) => (
              <TacticCard key={i} tactic={t} idx={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ObjectionHandlingPage() {
  const [step, setStep]             = useState<Step>('input');
  const [historyCount, setHistoryCount] = useState(0);
  const [displayedJob, setDisplayedJob] = useState<ObjectionHandlingJob | null>(null);

  const [yourCompany,          setYourCompany]          = useState('');
  const [competitorName,       setCompetitorName]       = useState('');
  const [targetAccount,        setTargetAccount]        = useState('');
  const [targetIndustry,       setTargetIndustry]       = useState('');
  const [isIncumbent,          setIsIncumbent]          = useState(false);
  const [strategicPriorities,  setStrategicPriorities]  = useState('');
  const [solutionAreas,        setSolutionAreas]        = useState('');
  const [competitorWeaknesses, setCompetitorWeaknesses] = useState('');

  const { job, error, isStuck, retryJob, startJob, cancelJob } = useJobManager<ObjectionHandlingJob>({
    onProgress: () => setStep('analysing'),
    onComplete: (data) => {
      setStep('results');
      setDisplayedJob(data);
      setHistoryCount((n) => n + 1);
    },
    onError: () => setStep('error'),
  });

  useEffect(() => {
    setHistoryCount(loadHistory().length);
  }, []);

  const canSubmit = !!(
    yourCompany.trim() && competitorName.trim() &&
    targetAccount.trim() && targetIndustry.trim()
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const priorities = strategicPriorities.split('\n').map((p) => p.trim()).filter(Boolean);

    await startJob({
      endpoint: API_ENDPOINTS.objectionHandling,
      payload: {
        yourCompany:          yourCompany.trim(),
        competitorName:       competitorName.trim(),
        targetAccount:        targetAccount.trim(),
        targetIndustry:       targetIndustry.trim(),
        isIncumbent,
        ...(priorities.length > 0        && { strategicPriorities: priorities }),
        ...(solutionAreas.trim()         && { solutionAreas: solutionAreas.trim() }),
        ...(competitorWeaknesses.trim()  && { competitorWeaknesses: competitorWeaknesses.trim() }),
      },
      streamUrlFactory: (jobId) => API_ENDPOINTS.objectionHandlingStream(jobId),
      persist: { moduleType: 'objection-handling' as never, targetCompany: targetAccount.trim() },
    });
  }

  function handleReset() {
    cancelJob();
    setStep('input');
  }

  const progress = job?.progress ?? 0;

  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', color: '#1B2A3D', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Top nav */}
      <div style={{ background: `linear-gradient(135deg, ${BLUE}, #12516E)`, borderBottom: '1px solid #CCDFEA', padding: '16px 32px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/" style={{ color: '#94b8c8', fontSize: 13, textDecoration: 'none' }}>← Dashboard</Link>
          <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.15)' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, color: ACCENT, marginBottom: 3 }}>REFRACTONE</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ModuleIcon id="objection-handling" size={20} />
              <span style={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF' }}>Objection Handling</span>
            </div>
          </div>
          {historyCount > 0 && (
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{historyCount} analyses</div>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 20px' }}>

        {/* ── INPUT ──────────────────────────────────────────────────────────── */}
        {step === 'input' && (
          <div>
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#1B2A3D' }}>Build an Objection Handling Playbook</h1>
              <p style={{ margin: '8px 0 0', fontSize: 13.5, color: '#374B5C', lineHeight: 1.6, maxWidth: 640 }}>
                Generate detailed objection rebuttals, proof points, and verbatim talk tracks. Mark the competitor as an <strong>incumbent</strong> for a full displacement playbook with phased tactics.
              </p>
            </div>

            {error && (
              <div style={{ background: 'rgba(230,57,70,0.08)', border: '1px solid rgba(230,57,70,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: ACCENT }}>
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

              {/* Incumbent toggle */}
              <div style={{ marginBottom: 20 }}>
                <button
                  type="button"
                  onClick={() => setIsIncumbent((v) => !v)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 16px', borderRadius: 10, cursor: 'pointer',
                    background: isIncumbent ? '#FEF3C718' : '#F3F8FA',
                    border: isIncumbent ? '1.5px solid #F59E0B88' : '1.5px solid #CCDFEA',
                    width: '100%', textAlign: 'left',
                    transition: 'all 0.2s',
                  }}
                >
                  {/* toggle pill */}
                  <div style={{
                    width: 40, height: 22, borderRadius: 11, flexShrink: 0,
                    background: isIncumbent ? '#F59E0B' : '#D1D5DB',
                    position: 'relative', transition: 'background 0.2s',
                  }}>
                    <div style={{
                      position: 'absolute', top: 3,
                      left: isIncumbent ? 21 : 3,
                      width: 16, height: 16, borderRadius: '50%',
                      background: '#FFFFFF',
                      transition: 'left 0.2s',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: isIncumbent ? '#B45309' : '#374B5C' }}>
                      {isIncumbent ? '⚠ Incumbent — Displacement Sale' : 'Competitor is Incumbent (already deployed)'}
                    </div>
                    <div style={{ fontSize: 11.5, color: '#6B7280', marginTop: 2 }}>
                      {isIncumbent
                        ? `${competitorName || 'Competitor'} is already deployed at ${targetAccount || 'this account'} — AI will generate extra switching-cost objections + full displacement playbook`
                        : 'Toggle on if the competitor is already running at this account — unlocks 12 objections + phased displacement tactics'}
                    </div>
                  </div>
                </button>
              </div>

              {/* Optional fields */}
              <div style={{ borderTop: '1px solid #E0ECF1', paddingTop: 16, marginBottom: 20 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 14, marginTop: 0 }}>
                  Optional — sharpen the playbook
                </p>
                <div style={{ marginBottom: 12 }}>
                  <label style={labelStyle}>
                    Target Account&apos;s Strategic Priorities
                    <span style={{ color: '#9CA3AF', textTransform: 'none', fontWeight: 400, letterSpacing: 0, marginLeft: 6 }}>(one per line · AI discovers if blank)</span>
                  </label>
                  <textarea
                    style={textareaStyle}
                    placeholder={`Digital transformation\nCost reduction\nSupply chain resilience`}
                    value={strategicPriorities}
                    onChange={(e) => setStrategicPriorities(e.target.value)}
                  />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={labelStyle}>
                    Your Key Solution Areas
                    <span style={{ color: '#9CA3AF', textTransform: 'none', fontWeight: 400, letterSpacing: 0, marginLeft: 6 }}>(AI discovers if blank)</span>
                  </label>
                  <textarea
                    style={{ ...textareaStyle, minHeight: 60 }}
                    placeholder="e.g. AI-driven ERP, Cloud migration, Intelligent Automation"
                    value={solutionAreas}
                    onChange={(e) => setSolutionAreas(e.target.value)}
                  />
                </div>
                <div>
                  <label style={labelStyle}>
                    Known Competitor Weaknesses
                    <span style={{ color: '#9CA3AF', textTransform: 'none', fontWeight: 400, letterSpacing: 0, marginLeft: 6 }}>(AI also researches this)</span>
                  </label>
                  <textarea
                    style={{ ...textareaStyle, minHeight: 60 }}
                    placeholder="e.g. High implementation costs, poor post-sale support, limited AI roadmap"
                    value={competitorWeaknesses}
                    onChange={(e) => setCompetitorWeaknesses(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit" disabled={!canSubmit}
                style={{
                  background: canSubmit ? ACCENT : 'rgba(230,57,70,0.25)',
                  border: 'none', borderRadius: 8, padding: '12px 28px',
                  fontSize: 13.5, fontWeight: 700,
                  color: canSubmit ? '#fff' : '#7a4550',
                  cursor: canSubmit ? 'pointer' : 'not-allowed',
                }}
              >
                {isIncumbent ? 'Generate Displacement Playbook →' : 'Generate Objection Playbook →'}
              </button>
            </form>
          </div>
        )}

        {/* ── ANALYSING ─────────────────────────────────────────────────────── */}
        {step === 'analysing' && (
          <div style={{ textAlign: 'center', padding: '70px 20px' }}>
            <div style={{ marginBottom: 20 }}><ModuleIcon id="objection-handling" size={48} /></div>
            <h2 style={{ margin: '0 0 8px', fontSize: 19, fontWeight: 700, color: '#1B2A3D' }}>
              Building your {isIncumbent ? 'Displacement' : 'Objection'} Playbook…
            </h2>
            <p style={{ margin: '0 0 32px', fontSize: 13, color: '#6B7280' }}>{job?.currentStep || 'Initialising…'}</p>
            <div style={{ width: '100%', maxWidth: 440, margin: '0 auto 12px', height: 6, background: '#CCDFEA', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 3, background: `linear-gradient(90deg, ${ACCENT}, #ff6b74)`, width: `${progress}%`, transition: 'width 0.6s ease' }} />
            </div>
            <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 32 }}>{progress}% complete</div>
            <div style={{ fontSize: 12, color: '#3a6a80', maxWidth: 420, margin: '0 auto' }}>
              Researching competitive intelligence on {competitorName} at {targetAccount}, then synthesising {isIncumbent ? '12 objections + displacement tactics' : '8 objections'} — typically 60–120 seconds.
            </div>
            {isStuck && <StuckJobBanner onRetry={retryJob} />}
            <KillSwitchButton onCancel={() => { cancelJob(); setStep('input'); }} />
          </div>
        )}

        {/* ── ERROR ─────────────────────────────────────────────────────────── */}
        {(step === 'error' || (step === 'analysing' && job?.status === 'error')) && (
          <div style={{ textAlign: 'center', padding: '70px 20px' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>⚠</div>
            <h2 style={{ margin: '0 0 8px', fontSize: 19, fontWeight: 700, color: ACCENT }}>Generation failed</h2>
            <p style={{ margin: '0 0 32px', fontSize: 13, color: '#6B7280', maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' }}>
              {error || (job as { error?: string })?.error || 'An unexpected error occurred. Please try again.'}
            </p>
            <button onClick={handleReset} style={{ background: ACCENT, border: 'none', borderRadius: 8, padding: '10px 24px', fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>
              Try Again
            </button>
          </div>
        )}

        {/* ── RESULTS ───────────────────────────────────────────────────────── */}
        {step === 'results' && (displayedJob || job) && ((displayedJob || job) as ObjectionHandlingJob).status === 'complete' && (
          <ResultsView job={(displayedJob || job) as ObjectionHandlingJob} onReset={handleReset} />
        )}
      </div>
    </div>
  );
}
