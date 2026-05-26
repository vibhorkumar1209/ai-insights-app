'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import ModuleIcon from '@/components/shared/ModuleIcon';
import HistoryDrawer from '@/components/shared/HistoryDrawer';
import type { HistoryEntry } from '@/lib/history';
import StuckJobBanner from '@/components/shared/StuckJobBanner';
import KillSwitchButton from '@/components/shared/KillSwitchButton';
import { SalesPlay2Job } from '@/lib/types';
import { saveToHistory, loadEntryById, popPendingRestore } from '@/lib/history';
import { API_ENDPOINTS } from '@/lib/config';
import { useJobManager } from '@/lib/useJobManager';

// ── Style constants ────────────────────────────────────────────────────────────

const ACCENT = '#3491E8';
const BG = '#FFFFFF';
const CARD_BG = 'linear-gradient(160deg, #0e2535, #0c1e2e)';
const CARD_BORDER = '1px solid #CCDFEA';

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 700,
  color: '#4A6274', letterSpacing: '0.5px',
  textTransform: 'uppercase', marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px',
  background: 'rgba(8,15,22,0.8)', border: '1px solid #CCDFEA',
  borderRadius: 8, color: '#1B2A3D', fontSize: 13,
  outline: 'none', boxSizing: 'border-box',
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle, resize: 'vertical', minHeight: 90, lineHeight: 1.55,
};

// ── Card ──────────────────────────────────────────────────────────────────────

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: CARD_BG,
      border: CARD_BORDER, borderRadius: 10, padding: '20px 22px',
      ...style,
    }}>
      {children}
    </div>
  );
}

// ── Section header ────────────────────────────────────────────────────────────

function SectionHeader({ icon, title }: { icon: string; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1B2A3D' }}>{title}</h3>
    </div>
  );
}

// ── Shared table styles ───────────────────────────────────────────────────────

const tableStyle: React.CSSProperties = {
  width: '100%', borderCollapse: 'collapse', fontSize: 12.5,
};

const thBase: React.CSSProperties = {
  padding: '9px 13px', textAlign: 'left', fontWeight: 700,
  fontSize: 11, letterSpacing: '0.4px', color: '#4A6274',
  textTransform: 'uppercase', background: '#0a1e2e',
  borderBottom: `2px solid ${ACCENT}44`,
};

const tdBase: React.CSSProperties = {
  padding: '10px 13px', verticalAlign: 'top',
  lineHeight: 1.6, borderBottom: '1px solid #1e3a52', color: '#1B2A3D',
};

// ── Win Themes Table ──────────────────────────────────────────────────────────

function WinThemesTable({ winThemes }: { winThemes: NonNullable<SalesPlay2Job['winThemes']> }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={{ ...thBase, width: '40%' }}>Win Theme</th>
            <th style={thBase}>Trigger</th>
          </tr>
        </thead>
        <tbody>
          {winThemes.map((wt, i) => (
            <tr key={i}>
              <td style={{ ...tdBase, fontWeight: 600, color: '#1B2A3D' }}>{wt.theme}</td>
              <td style={{ ...tdBase, color: '#a0bad0' }}>{wt.trigger}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Opportunity Mapping Table ─────────────────────────────────────────────────

function OpportunityTable({ opportunities }: { opportunities: NonNullable<SalesPlay2Job['opportunities']> }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={{ ...thBase, width: '16%' }}>Opportunity Area</th>
            <th style={{ ...thBase, width: '18%' }}>Specific Use Cases</th>
            <th style={{ ...thBase, width: '22%' }}>Problem → Solution</th>
            <th style={{ ...thBase, width: '22%' }}>Value Proposition</th>
            <th style={{ ...thBase, width: '12%' }}>Est. Deal Size</th>
          </tr>
        </thead>
        <tbody>
          {opportunities.map((opp, i) => (
            <tr key={i}>
              <td style={{ ...tdBase, fontWeight: 600, color: '#1B2A3D' }}>{opp.opportunityArea}</td>
              <td style={tdBase}>{opp.specificUseCases}</td>
              <td style={tdBase}>{opp.problemSolutionMapping}</td>
              <td style={{ ...tdBase, fontWeight: 600 }}>{opp.valueProposition}</td>
              <td style={{ ...tdBase, color: ACCENT, fontWeight: 700, textAlign: 'right', whiteSpace: 'nowrap' }}>{opp.estimatedDealSize}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Competitive Positioning ───────────────────────────────────────────────────

function CompetitivePositioning({ competitors, yourCompany }: {
  competitors: NonNullable<SalesPlay2Job['competitors']>;
  yourCompany: string;
}) {
  const [activeIdx, setActiveIdx] = useState(0);

  if (!competitors.length) return null;

  const active = competitors[activeIdx] || competitors[0];

  return (
    <div>
      {/* Table for active competitor */}
      <div style={{ overflowX: 'auto', marginBottom: 16 }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={{ ...thBase, width: '15%' }}>Competitor</th>
              <th style={{ ...thBase, width: '25%' }}>Strengths</th>
              <th style={{ ...thBase, width: '25%' }}>Weaknesses</th>
              <th style={thBase}>Differentiation Strategy</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ ...tdBase, fontWeight: 700, color: '#1B2A3D' }}>{active.name}</td>
              <td style={{ ...tdBase, color: '#2DD4BF' }}>{active.strengths}</td>
              <td style={{ ...tdBase, color: '#E63946' }}>{active.weaknesses}</td>
              <td style={tdBase}>{active.differentiationStrategy}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Tab switcher */}
      {competitors.length > 1 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', borderTop: '1px solid #1e3a52', paddingTop: 12 }}>
          <span style={{ fontSize: 11, color: '#4A6274', fontWeight: 600, alignSelf: 'center', marginRight: 4 }}>
            Our: {yourCompany}
          </span>
          {competitors.map((c, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              style={{
                padding: '5px 14px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                cursor: 'pointer', border: '1px solid',
                borderColor: activeIdx === i ? ACCENT : '#CCDFEA',
                background: activeIdx === i ? `${ACCENT}22` : 'transparent',
                color: activeIdx === i ? ACCENT : '#4A6274',
                transition: 'all 0.15s',
              }}
            >
              vs {c.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Progress Bar ──────────────────────────────────────────────────────────────

function ProgressBar({ progress, step }: { progress: number; step?: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: '#4A6274' }}>{step || 'Processing…'}</span>
        <span style={{ fontSize: 12, color: ACCENT, fontWeight: 700 }}>{progress}%</span>
      </div>
      <div style={{ height: 6, background: '#1e3a52', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 3,
          background: `linear-gradient(90deg, ${ACCENT}, #5DB8FF)`,
          width: `${progress}%`, transition: 'width 0.4s ease',
        }} />
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SalesPlay2Page() {
  const [showHistory, setShowHistory] = useState(false);
  const [yourCompany, setYourCompany] = useState('');
  const [targetAccount, setTargetAccount] = useState('');
  const [targetIndustry, setTargetIndustry] = useState('');
  const [competitorName, setCompetitorName] = useState('');
  const [strategicPrioritiesText, setStrategicPrioritiesText] = useState('');
  const [solutionAreas, setSolutionAreas] = useState('');
  const [competitorWeaknesses, setCompetitorWeaknesses] = useState('');
  const [step, setStep] = useState<'input' | 'analysing' | 'results' | 'error'>('input');
  const [errorMsg, setErrorMsg] = useState('');
  const [restoredData, setRestoredData] = useState<SalesPlay2Job | null>(null);

  const { job, isStuck, startJob, cancelJob, retryJob } = useJobManager<SalesPlay2Job>({
    onProgress: (j) => {
      if (j.status !== 'complete' && j.status !== 'error') setStep('analysing');
    },
    onComplete: (j) => {
      setStep('results');
      if (j.completedAt) {
        saveToHistory({
          moduleType: 'sales-play-2',
          targetCompany: j.targetAccount || targetAccount,
          completedAt: j.completedAt,
          salesPlay2Data: j,
        });
      }
    },
    onError: (msg) => {
      setErrorMsg(msg);
      setStep('error');
    },
  });

  // Restore from history
  useEffect(() => {
    const id = popPendingRestore();
    if (!id) return;
    const entry = loadEntryById(id);
    if (entry?.moduleType === 'sales-play-2' && entry.salesPlay2Data) {
      const d = entry.salesPlay2Data;
      setYourCompany(d.yourCompany || '');
      setTargetAccount(d.targetAccount || '');
      setTargetIndustry(d.targetIndustry || '');
      setCompetitorName(d.competitorName || '');
      setRestoredData(d);
      setStep('results');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!yourCompany.trim() || !targetAccount.trim() || !targetIndustry.trim() || !competitorName.trim()) return;
    setStep('analysing');
    setErrorMsg('');

    const strategicPriorities = strategicPrioritiesText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    await startJob({
      endpoint: API_ENDPOINTS.salesPlay2,
      streamUrlFactory: (jobId) => API_ENDPOINTS.salesPlay2Stream(jobId),
      payload: {
        yourCompany: yourCompany.trim(),
        competitorName: competitorName.trim(),
        targetAccount: targetAccount.trim(),
        targetIndustry: targetIndustry.trim(),
        strategicPriorities: strategicPriorities.length ? strategicPriorities : undefined,
        solutionAreas: solutionAreas.trim() || undefined,
        competitorWeaknesses: competitorWeaknesses.trim() || undefined,
      },
      persist: { moduleType: 'sales-play-2', targetCompany: targetAccount.trim() },
    });
  };

  const handleReset = () => {
    cancelJob();
    setRestoredData(null);
    setStep('input');
    setErrorMsg('');
  };

  const displayData = job ?? restoredData;

  const restoreEntry = useCallback((entry: HistoryEntry) => {
    if (entry.moduleType === 'sales-play-2' && entry.salesPlay2Data) {
      const d = entry.salesPlay2Data;
      setYourCompany(d.yourCompany || '');
      setTargetAccount(d.targetAccount || '');
      setTargetIndustry(d.targetIndustry || '');
      setCompetitorName(d.competitorName || '');
      setRestoredData(d);
      setStep('results');
      setShowHistory(false);
    }
  }, []);

  const canSubmit = yourCompany.trim() && targetAccount.trim() && targetIndustry.trim() && competitorName.trim();

  return (
    <div style={{ minHeight: '100vh', background: BG, color: '#1B2A3D', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid #1e3a52', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/" style={{ color: 'rgba(255,255,255,0.65)', textDecoration: 'none', fontSize: 13 }}>← Home</Link>
          <span style={{ color: '#CCDFEA' }}>|</span>
          <ModuleIcon id="sales-play-2" size={22} />
          <span style={{ fontWeight: 700, fontSize: 15 }}>Sales Play II</span>
        </div>
        <button
          onClick={() => setShowHistory(true)}
          style={{ background: 'transparent', border: '1px solid #CCDFEA', borderRadius: 8, padding: '6px 14px', color: '#4A6274', fontSize: 12, cursor: 'pointer' }}
        >
          History
        </button>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
        {/* ── INPUT FORM ─────────────────────────────────────────────────────── */}
        {step === 'input' && (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 800, color: '#1B2A3D' }}>Sales Play II</h2>
              <p style={{ margin: 0, fontSize: 13, color: '#4A6274' }}>Win themes, opportunity mapping & competitive positioning</p>
            </div>

            <Card style={{ marginBottom: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {/* Your Company */}
                <div>
                  <label style={labelStyle}>Your Company *</label>
                  <input
                    style={inputStyle}
                    value={yourCompany}
                    onChange={(e) => setYourCompany(e.target.value)}
                    placeholder="e.g. Accenture"
                    required
                  />
                </div>

                {/* Target Account */}
                <div>
                  <label style={labelStyle}>Target Account *</label>
                  <input
                    style={inputStyle}
                    value={targetAccount}
                    onChange={(e) => setTargetAccount(e.target.value)}
                    placeholder="e.g. JPMorgan Chase"
                    required
                  />
                </div>

                {/* Target Industry */}
                <div>
                  <label style={labelStyle}>Target Industry *</label>
                  <input
                    style={inputStyle}
                    value={targetIndustry}
                    onChange={(e) => setTargetIndustry(e.target.value)}
                    placeholder="e.g. Financial Services"
                    required
                  />
                </div>

                {/* Competitor to Displace */}
                <div>
                  <label style={labelStyle}>Competitor to Displace *</label>
                  <input
                    style={inputStyle}
                    value={competitorName}
                    onChange={(e) => setCompetitorName(e.target.value)}
                    placeholder="e.g. Infosys, Wipro"
                    required
                  />
                </div>
              </div>

              {/* Optional fields */}
              <div style={{ marginTop: 16 }}>
                <label style={labelStyle}>Strategic Priorities <span style={{ fontWeight: 400, textTransform: 'none', color: '#5a7a8a' }}>(optional — one per line)</span></label>
                <textarea
                  style={textareaStyle}
                  value={strategicPrioritiesText}
                  onChange={(e) => setStrategicPrioritiesText(e.target.value)}
                  placeholder="One per line — or leave blank for AI discovery"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
                <div>
                  <label style={labelStyle}>Solution Areas <span style={{ fontWeight: 400, textTransform: 'none', color: '#5a7a8a' }}>(optional)</span></label>
                  <input
                    style={inputStyle}
                    value={solutionAreas}
                    onChange={(e) => setSolutionAreas(e.target.value)}
                    placeholder="e.g. Cloud, AI/ML, Cybersecurity"
                  />
                </div>
                <div>
                  <label style={labelStyle}>Competitor Weaknesses <span style={{ fontWeight: 400, textTransform: 'none', color: '#5a7a8a' }}>(optional)</span></label>
                  <input
                    style={inputStyle}
                    value={competitorWeaknesses}
                    onChange={(e) => setCompetitorWeaknesses(e.target.value)}
                    placeholder="e.g. slow delivery, limited AI capability"
                  />
                </div>
              </div>
            </Card>

            <button
              type="submit"
              disabled={!canSubmit}
              style={{
                padding: '12px 32px', borderRadius: 8, fontWeight: 700,
                fontSize: 14, cursor: canSubmit ? 'pointer' : 'not-allowed',
                background: canSubmit ? `linear-gradient(135deg, ${ACCENT}, #1a5fa8)` : '#1e3a52',
                color: canSubmit ? '#fff' : '#5a7a8a', border: 'none',
                transition: 'all 0.2s',
              }}
            >
              Generate Sales Play II →
            </button>
          </form>
        )}

        {/* ── LOADING ───────────────────────────────────────────────────────── */}
        {step === 'analysing' && (
          <div style={{ maxWidth: 560, margin: '80px auto', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>⚔️</div>
            <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700 }}>Generating Sales Play II…</h3>
            <p style={{ margin: '0 0 28px', fontSize: 13, color: '#4A6274' }}>
              Researching {targetAccount} and building win themes, opportunities & competitive positioning.
            </p>
            <ProgressBar progress={job?.progress || 0} step={job?.currentStep} />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20 }}>
              <KillSwitchButton onCancel={handleReset} />
            </div>
            {isStuck && <StuckJobBanner onRetry={retryJob} />}
          </div>
        )}

        {/* ── ERROR ─────────────────────────────────────────────────────────── */}
        {step === 'error' && (
          <div style={{ maxWidth: 500, margin: '80px auto', textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
            <h3 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 700, color: '#E63946' }}>Analysis failed</h3>
            <p style={{ margin: '0 0 24px', fontSize: 13, color: '#4A6274' }}>{errorMsg}</p>
            <button
              onClick={handleReset}
              style={{
                padding: '10px 24px', borderRadius: 8, fontWeight: 600, fontSize: 13,
                cursor: 'pointer', background: ACCENT, color: '#fff', border: 'none',
              }}
            >
              Try again
            </button>
          </div>
        )}

        {/* ── HISTORY DRAWER ────────────────────────────────────────────────── */}
        {showHistory && (
          <HistoryDrawer
            currentModule="sales-play-2"
            onSelectSameModule={restoreEntry}
            onClose={() => setShowHistory(false)}
          />
        )}

        {/* ── RESULTS ───────────────────────────────────────────────────────── */}
        {step === 'results' && displayData && (
          <div>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
              <div>
                <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 800 }}>Sales Play II</h2>
                <p style={{ margin: 0, fontSize: 13, color: '#4A6274' }}>
                  {displayData.yourCompany} → {displayData.targetAccount} · displacing {displayData.competitorName}
                </p>
              </div>
              <button
                onClick={handleReset}
                style={{
                  padding: '8px 18px', borderRadius: 8, fontWeight: 600, fontSize: 12,
                  cursor: 'pointer', background: 'transparent', color: '#4A6274',
                  border: '1px solid #CCDFEA',
                }}
              >
                New Analysis
              </button>
            </div>

            {/* Section 1: Win Themes */}
            {displayData.winThemes && displayData.winThemes.length > 0 && (
              <Card style={{ marginBottom: 18 }}>
                <SectionHeader icon="🎯" title="Win Themes (with Triggers)" />
                <WinThemesTable winThemes={displayData.winThemes} />
              </Card>
            )}

            {/* Section 2: Opportunity Mapping */}
            {displayData.opportunities && displayData.opportunities.length > 0 && (
              <Card style={{ marginBottom: 18 }}>
                <SectionHeader icon="📈" title="Opportunity Mapping" />
                <OpportunityTable opportunities={displayData.opportunities} />
              </Card>
            )}

            {/* Section 3: Competitive Positioning */}
            {displayData.competitors && displayData.competitors.length > 0 && (
              <Card style={{ marginBottom: 18 }}>
                <SectionHeader icon="⚔️" title="Competitive Positioning" />
                <CompetitivePositioning
                  competitors={displayData.competitors}
                  yourCompany={displayData.yourCompany || yourCompany}
                />
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
