'use client';

import { useState, useEffect, useCallback } from 'react';
import { VucaAnalysisJob, VucaRow, ITSpendRow, GeoStressRow } from '@/lib/types';
import { loadHistory, saveToHistory, loadEntryById, popPendingRestore, HistoryEntry } from '@/lib/history';
import { API_ENDPOINTS } from '@/lib/config';
import { useJobManager } from '@/lib/useJobManager';
import HistoryDrawer from '@/components/shared/HistoryDrawer';
import ModuleIcon from '@/components/shared/ModuleIcon';
import KillSwitchButton from '@/components/shared/KillSwitchButton';

const ACCENT = '#E63946';
const BG = '#080f16';
const NAVY = '#0c3649';

const GEOGRAPHY_OPTIONS = [
  'Global', 'North America', 'Europe', 'Asia Pacific', 'India', 'China',
  'ASEAN', 'Middle East', 'Latin America', 'Africa', 'US + UK + Germany',
  'Specific Country / Region…',
];

const VUCA_COLORS: Record<string, string> = {
  VOLATILE: '#EF4444',
  UNCERTAIN: '#F59E0B',
  COMPLEX: '#3B82F6',
  AMBIGUOUS: '#8B5CF6',
};

const STATUS_COLORS: Record<string, string> = {
  Active: '#EF4444',
  Escalating: '#F59E0B',
  Monitoring: '#3B82F6',
  Resolved: '#22C55E',
};

const SEVERITY_COLORS: Record<string, string> = {
  High: '#EF4444',
  Medium: '#F59E0B',
  Low: '#22C55E',
};

const DIRECTION_COLORS: Record<string, string> = {
  '▲ EXPAND': '#22C55E',
  '▼ COMPRESS': '#EF4444',
  '► REALLOCATE': '#F59E0B',
};

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 4,
      fontSize: 11, fontWeight: 700, background: color + '22', color,
      border: `1px solid ${color}44`, whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  );
}

function TableCard({ title, accent = ACCENT, children }: { title: string; accent?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: NAVY, border: `1px solid #1e4a5e`, borderRadius: 12, marginBottom: 32, overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #1e4a5e', background: `${accent}18` }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: 1 }}>{title}</span>
      </div>
      <div style={{ overflowX: 'auto' }}>{children}</div>
    </div>
  );
}

const TH = ({ children }: { children: React.ReactNode }) => (
  <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#a0c4d8', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '2px solid #1e4a5e', whiteSpace: 'nowrap', background: '#071420' }}>
    {children}
  </th>
);
const TD = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <td style={{ padding: '12px 14px', color: '#CBD5E1', fontSize: 12, lineHeight: 1.55, verticalAlign: 'top', borderBottom: '1px solid #0f2d40', ...style }}>
    {children}
  </td>
);

export default function VucaAnalysisPage() {
  const [step, setStep] = useState<'input' | 'analysing' | 'results'>('input');
  const [industry, setIndustry] = useState('');
  const [geography, setGeography] = useState('Global');
  const [customGeo, setCustomGeo] = useState('');
  const [historyCount, setHistoryCount] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [displayedJob, setDisplayedJob] = useState<VucaAnalysisJob | null>(null);

  const { job, error, isStuck, startJob, cancelJob } = useJobManager<VucaAnalysisJob>({
    stuckThresholdMs: 180000,
    onProgress: () => setStep('analysing'),
    onComplete: (data) => {
      setStep('results');
      setDisplayedJob(data);
      saveToHistory({
        moduleType: 'vuca-analysis',
        targetCompany: industry.trim(),
        completedAt: data.completedAt || new Date().toISOString(),
        vucaIndustry: industry.trim(),
        vucaGeography: data.geography,
        vucaResult: data,
      });
      setHistoryCount(loadHistory().length);
    },
  });

  useEffect(() => {
    setHistoryCount(loadHistory().length);
    const pendingId = popPendingRestore();
    if (pendingId) {
      const entry = loadEntryById(pendingId);
      if (entry && entry.moduleType === 'vuca-analysis') restoreEntry(entry);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const restoreEntry = useCallback((entry: HistoryEntry) => {
    if (!entry.vucaResult) return;
    setIndustry(entry.vucaIndustry || entry.targetCompany);
    setDisplayedJob(entry.vucaResult);
    setStep('results');
  }, []);

  const finalGeo = geography === 'Specific Country / Region…' ? customGeo.trim() : geography;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!industry.trim() || !finalGeo) return;
    setStep('analysing');
    await startJob({
      payload: { industry: industry.trim(), geography: finalGeo },
      endpoint: API_ENDPOINTS.vucaAnalysis,
      streamUrlFactory: API_ENDPOINTS.vucaAnalysisStream,
      persist: { moduleType: 'vuca-analysis', targetCompany: industry.trim() },
    });
  }

  const currentJob = displayedJob || job;

  // ── INPUT ─────────────────────────────────────────────────────────────────────
  if (step === 'input') {
    return (
      <div style={{ minHeight: '100vh', background: BG, color: '#E8EDF5' }}>
        {showHistory && (
          <HistoryDrawer currentModule="vuca-analysis" onSelectSameModule={restoreEntry} onClose={() => setShowHistory(false)} />
        )}
        <div style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #0a2233 100%)`, borderBottom: '1px solid #1e4a5e', padding: '16px 32px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 16 }}>
            <a href="/" style={{ color: '#7eaabf', textDecoration: 'none', fontSize: 13 }}>← Home</a>
            <div style={{ width: 1, height: 16, background: '#1e4a5e' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <ModuleIcon id="vuca-analysis" size={22} />
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: ACCENT, letterSpacing: 2 }}>REFRACTONE</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#E8EDF5' }}>VUCA × 4W1H Analysis</div>
              </div>
            </div>
            <button onClick={() => setShowHistory(true)} style={{ marginLeft: 'auto', background: `${ACCENT}18`, border: `1px solid ${ACCENT}44`, color: ACCENT, borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              History {historyCount > 0 && `(${historyCount})`}
            </button>
          </div>
        </div>

        <div style={{ maxWidth: 680, margin: '56px auto 0', padding: '0 24px' }}>
          {error && (
            <div style={{ background: 'rgba(230,57,70,0.1)', border: '1px solid rgba(230,57,70,0.3)', borderRadius: 8, padding: '12px 16px', marginBottom: 24, fontSize: 13, color: '#ff6b75' }}>{error}</div>
          )}
          <div style={{ background: `linear-gradient(135deg, ${NAVY}, #0a2233)`, border: '1px solid #1e4a5e', borderRadius: 14, padding: '36px 32px' }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#E8EDF5', margin: '0 0 6px' }}>VUCA × 4W1H + IT Spend Impact</h2>
            <p style={{ color: '#6B8FA8', fontSize: 13, margin: '0 0 28px', lineHeight: 1.6 }}>
              Produces three intelligence tables: (1) VUCA × 4W1H matrix with operational HOW recommendations,
              (2) IT spend impact by VUCA driver with dollar ranges, and (3) Geopolitical stress overlay.
            </p>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#a0c4d8', letterSpacing: 0.5, marginBottom: 8 }}>
                  INDUSTRY <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="e.g. Pharmaceutical, Automotive, Banking & Financial Services, Energy, Retail"
                  required
                  style={{ width: '100%', background: '#0a1929', border: '1px solid #1e4a5e', borderRadius: 8, color: '#E8EDF5', padding: '12px 14px', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: 28 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#a0c4d8', letterSpacing: 0.5, marginBottom: 8 }}>GEOGRAPHIC SCOPE</label>
                <select
                  value={geography}
                  onChange={(e) => setGeography(e.target.value)}
                  style={{ background: '#0a1929', border: '1px solid #1e4a5e', borderRadius: 8, color: '#E8EDF5', padding: '10px 14px', fontSize: 14, outline: 'none', minWidth: 260, appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%237eaabf' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: 32 }}
                >
                  {GEOGRAPHY_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
                {geography === 'Specific Country / Region…' && (
                  <input
                    value={customGeo}
                    onChange={(e) => setCustomGeo(e.target.value)}
                    placeholder="e.g. India, Southeast Asia, GCC, Brazil…"
                    required
                    style={{ marginTop: 10, width: '100%', background: '#0a1929', border: '1px solid #1e4a5e', borderRadius: 8, color: '#E8EDF5', padding: '10px 14px', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                  />
                )}
              </div>

              <div style={{ background: `${ACCENT}10`, border: `1px solid ${ACCENT}30`, borderRadius: 8, padding: '10px 14px', marginBottom: 24, fontSize: 12, color: '#a0b4c8', lineHeight: 1.5 }}>
                ⚡ Generates 3 intelligence tables: VUCA × 4W1H matrix, IT Spend Impact (TEI), and Geopolitical Stress Overlay — takes ~3–5 minutes.
              </div>

              <button
                type="submit"
                disabled={!industry.trim() || !finalGeo}
                style={{ width: '100%', padding: '13px', background: (industry.trim() && finalGeo) ? `linear-gradient(135deg, ${ACCENT}, #b91c2c)` : '#1e4a5e', border: 'none', borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 700, cursor: (industry.trim() && finalGeo) ? 'pointer' : 'not-allowed', opacity: (industry.trim() && finalGeo) ? 1 : 0.5 }}
              >
                Run Analysis →
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ── ANALYSING ─────────────────────────────────────────────────────────────────
  if (step === 'analysing') {
    return (
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <div style={{ background: `linear-gradient(135deg, ${NAVY}, #0a2233)`, border: '1px solid #1e4a5e', borderRadius: 14, padding: '40px 36px', maxWidth: 520, width: '100%', textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, border: `3px solid ${ACCENT}44`, borderTopColor: ACCENT, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 24px' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#E8EDF5', marginBottom: 8 }}>Analysing {industry}</div>
          <div style={{ color: '#6B8FA8', fontSize: 13, marginBottom: 20, minHeight: 20 }}>
            {job?.currentStep || 'Researching market intelligence…'}
          </div>
          {job?.progress != null && (
            <div style={{ background: '#0a1929', borderRadius: 6, height: 6, overflow: 'hidden', marginBottom: 16 }}>
              <div style={{ width: `${job.progress}%`, height: '100%', background: `linear-gradient(90deg, ${ACCENT}, #b91c2c)`, transition: 'width 0.5s ease' }} />
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginTop: 12 }}>
            {['VOLATILE', 'UNCERTAIN', 'COMPLEX', 'AMBIGUOUS'].map((d) => (
              <span key={d} style={{ background: `${VUCA_COLORS[d]}18`, border: `1px solid ${VUCA_COLORS[d]}44`, color: VUCA_COLORS[d], borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>{d}</span>
            ))}
          </div>
        </div>
        {isStuck && (
          <div style={{ marginTop: 16, maxWidth: 440, background: 'rgba(52,145,232,0.08)', border: '1px solid rgba(52,145,232,0.25)', borderRadius: 8, padding: '12px 16px', fontSize: 12, color: '#7eaabf', textAlign: 'center' }}>
            Still working — VUCA synthesis with geopolitical data takes 3–5 minutes. Please wait.
          </div>
        )}
        <KillSwitchButton onCancel={() => { cancelJob(); setStep('input'); }} />
      </div>
    );
  }

  // ── RESULTS ───────────────────────────────────────────────────────────────────
  if (!currentJob) return null;

  const analysisDate = currentJob.analysisDate || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div style={{ minHeight: '100vh', background: BG, color: '#E8EDF5' }}>
      {showHistory && (
        <HistoryDrawer currentModule="vuca-analysis" onSelectSameModule={restoreEntry} onClose={() => setShowHistory(false)} />
      )}

      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #0a2233 100%)`, borderBottom: '1px solid #1e4a5e', padding: '16px 32px', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 16 }}>
          <a href="/" style={{ color: '#7eaabf', textDecoration: 'none', fontSize: 13 }}>← Home</a>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#E8EDF5' }}>VUCA × 4W1H — {currentJob.industry}</div>
            <div style={{ fontSize: 12, color: '#6B8FA8' }}>{currentJob.geography} · {analysisDate}</div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setShowHistory(true)} style={{ background: `${ACCENT}18`, border: `1px solid ${ACCENT}44`, color: ACCENT, borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>History</button>
            <button onClick={() => { cancelJob(); setStep('input'); setDisplayedJob(null); }} style={{ background: 'transparent', border: '1px solid #1e4a5e', color: '#7eaabf', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>New Analysis</button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 24px' }}>

        {/* ── TABLE 1: VUCA × 4W1H Matrix ──────────────────────────────────── */}
        {currentJob.vuca4w1hMatrix && currentJob.vuca4w1hMatrix.length > 0 && (
          <TableCard title={`TABLE 1: VUCA × 4W1H MATRIX — ${currentJob.industry} | ${currentJob.geography} | ${analysisDate}`} accent={ACCENT}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>
                  <TH>VUCA Dimension</TH>
                  <TH>Lens</TH>
                  <TH>WHAT — The Situation</TH>
                  <TH>WHY — Root Cause</TH>
                  <TH>WHERE — Geography</TH>
                  <TH>WHEN — Timeline</TH>
                  <TH>HOW — Recommendation</TH>
                </tr>
              </thead>
              <tbody>
                {currentJob.vuca4w1hMatrix.map((row: VucaRow, i: number) => (
                  <tr key={i}>
                    <TD style={{ whiteSpace: 'nowrap' }}>
                      <Badge label={row.vucaDimension} color={VUCA_COLORS[row.vucaDimension] || '#888'} />
                    </TD>
                    <TD style={{ fontWeight: 600, color: '#E8EDF5', minWidth: 120 }}>{row.lens}</TD>
                    <TD style={{ minWidth: 220 }}>{row.what}</TD>
                    <TD style={{ minWidth: 200 }}>{row.why}</TD>
                    <TD style={{ minWidth: 160 }}>{row.where}</TD>
                    <TD style={{ minWidth: 180 }}>{row.when}</TD>
                    <TD style={{ minWidth: 220, background: 'rgba(230,57,70,0.04)', borderLeft: `2px solid ${ACCENT}44` }}>
                      <div style={{ fontWeight: 600, color: '#E8EDF5', marginBottom: 4 }}>** HOW **</div>
                      {row.how}
                    </TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableCard>
        )}

        {/* ── TABLE 2: IT Spend Impact ──────────────────────────────────────── */}
        {currentJob.itSpendImpact && currentJob.itSpendImpact.length > 0 && (
          <TableCard title="TABLE 2: IT SPEND IMPACT ANALYSIS — TEI FRAMEWORK" accent="#3491E8">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>
                  <TH>VUCA Driver</TH>
                  <TH>IT Spend Category</TH>
                  <TH>Baseline Spend</TH>
                  <TH>Impact Mechanism</TH>
                  <TH>Quantified Impact</TH>
                  <TH>Net Δ ($)</TH>
                  <TH>Direction</TH>
                </tr>
              </thead>
              <tbody>
                {currentJob.itSpendImpact.map((row: ITSpendRow, i: number) => (
                  <tr key={i}>
                    <TD style={{ whiteSpace: 'nowrap' }}>
                      <Badge label={row.vucaDriver} color={VUCA_COLORS[row.vucaDriver] || '#888'} />
                    </TD>
                    <TD style={{ fontWeight: 600, color: '#E8EDF5', minWidth: 200 }}>{row.itSpendCategory}</TD>
                    <TD style={{ minWidth: 160, color: '#9AB0C0' }}>{row.baselineSpend}</TD>
                    <TD style={{ minWidth: 220 }}>{row.impactMechanism}</TD>
                    <TD style={{ minWidth: 160, fontFamily: 'monospace', color: '#a0c4d8' }}>{row.quantifiedImpact}</TD>
                    <TD style={{ fontWeight: 700, fontFamily: 'monospace', color: row.netDelta.startsWith('+') ? '#22C55E' : row.netDelta.startsWith('–') || row.netDelta.startsWith('-') ? '#EF4444' : '#F59E0B' }}>
                      {row.netDelta}
                    </TD>
                    <TD style={{ whiteSpace: 'nowrap' }}>
                      <Badge label={row.direction} color={DIRECTION_COLORS[row.direction] || '#888'} />
                    </TD>
                  </tr>
                ))}
                {/* Summary Totals row */}
                {currentJob.itSpendSummaryTotal && (
                  <tr style={{ background: '#071420', borderTop: '2px solid #1e4a5e' }}>
                    <td colSpan={2} style={{ padding: '12px 14px', fontWeight: 700, color: '#E8EDF5', fontSize: 12 }}>TOTAL — All categories</td>
                    <td style={{ padding: '12px 14px', color: '#6B8FA8', fontSize: 12 }}>—</td>
                    <td style={{ padding: '12px 14px', color: '#6B8FA8', fontSize: 12 }}>—</td>
                    <td style={{ padding: '12px 14px', color: '#a0c4d8', fontSize: 12 }}>Net industry IT budget impact</td>
                    <td style={{ padding: '12px 14px', fontWeight: 700, fontFamily: 'monospace', fontSize: 13, color: '#22C55E' }}>{currentJob.itSpendSummaryTotal.netDelta}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <Badge label={currentJob.itSpendSummaryTotal.dominantDirection} color={DIRECTION_COLORS[currentJob.itSpendSummaryTotal.dominantDirection] || '#888'} />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </TableCard>
        )}

        {/* ── TABLE 3: Geopolitical Stress Overlay ─────────────────────────── */}
        {currentJob.geopoliticalStress && currentJob.geopoliticalStress.length > 0 && (
          <TableCard title="TABLE 3: GEOPOLITICAL STRESS OVERLAY" accent="#F59E0B">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>
                  <TH>Stress Event</TH>
                  <TH>Status</TH>
                  <TH>Industry Transmission Mechanism</TH>
                  <TH>Severity</TH>
                  <TH>IT Budget Signal</TH>
                </tr>
              </thead>
              <tbody>
                {currentJob.geopoliticalStress.map((row: GeoStressRow, i: number) => (
                  <tr key={i}>
                    <TD style={{ fontWeight: 600, color: '#E8EDF5', minWidth: 200 }}>{row.stressEvent}</TD>
                    <TD style={{ whiteSpace: 'nowrap' }}>
                      <Badge label={row.status} color={STATUS_COLORS[row.status] || '#888'} />
                    </TD>
                    <TD style={{ minWidth: 260 }}>{row.transmissionMechanism}</TD>
                    <TD>
                      <Badge label={row.severity} color={SEVERITY_COLORS[row.severity] || '#888'} />
                      <div style={{ marginTop: 4, fontSize: 11, color: '#7eaabf' }}>{row.severityRationale}</div>
                    </TD>
                    <TD style={{ fontWeight: 600, color: '#a0c4d8', minWidth: 200 }}>{row.itBudgetSignal}</TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableCard>
        )}

        {/* Empty state */}
        {(!currentJob.vuca4w1hMatrix || currentJob.vuca4w1hMatrix.length === 0) &&
         (!currentJob.itSpendImpact || currentJob.itSpendImpact.length === 0) &&
         (!currentJob.geopoliticalStress || currentJob.geopoliticalStress.length === 0) && (
          <div style={{ textAlign: 'center', padding: '60px 24px', color: '#6B8FA8' }}>
            <div style={{ fontSize: 32, marginBottom: 16 }}>⚡</div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: '#a0c4d8' }}>Analysis complete</div>
            <div style={{ fontSize: 13 }}>No table data was returned. Try a more specific industry or retry.</div>
            <button onClick={() => { setStep('input'); setDisplayedJob(null); }} style={{ marginTop: 20, background: `${ACCENT}18`, border: `1px solid ${ACCENT}44`, color: ACCENT, borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Try Again</button>
          </div>
        )}
      </div>
    </div>
  );
}
