'use client';

import { useState, useEffect, useCallback } from 'react';
import { ConsultingIntelligenceJob, TLFirmInsight, TLTheme, TLMetric, TLInsight, TLChartSpec } from '@/lib/types';
import {
  loadHistory,
  saveToHistory,
  loadEntryById,
  popPendingRestore,
  HistoryEntry,
} from '@/lib/history';
import { API_ENDPOINTS } from '@/lib/config';
import { useJobManager } from '@/lib/useJobManager';
import HistoryDrawer from '@/components/shared/HistoryDrawer';
import ModuleIcon from '@/components/shared/ModuleIcon';
import StuckJobBanner from '@/components/shared/StuckJobBanner';
import KillSwitchButton from '@/components/shared/KillSwitchButton';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ACCENT = '#E63946';
const BG = '#FFFFFF';
const NAVY = '#0c3649';

const GEOGRAPHY_OPTIONS = [
  'Global',
  'North America',
  'Europe',
  'Asia Pacific',
  'India',
  'China',
  'ASEAN',
  'Middle East',
  'Latin America',
  'Africa',
  'US + UK + Germany',
  'Specific Country…',
];

const URGENCY_COLORS: Record<string, string> = { high: '#EF4444', medium: '#F59E0B', low: '#22C55E' };
const CONFIDENCE_COLORS: Record<string, string> = { high: '#22C55E', medium: '#F59E0B', low: '#EF4444' };

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 4,
      fontSize: 11, fontWeight: 700, background: color + '22', color, border: `1px solid ${color}44`,
      textTransform: 'capitalize',
    }}>
      {label}
    </span>
  );
}

function SectionCard({ title, children, accent = ACCENT }: { title: string; children: React.ReactNode; accent?: string }) {
  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #CCDFEA', borderRadius: 12, marginBottom: 24, overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #CCDFEA', background: `${accent}15` }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: 1 }}>{title}</span>
      </div>
      <div style={{ padding: '20px' }}>{children}</div>
    </div>
  );
}

export default function ConsultingIntelligencePage() {
  const [step, setStep] = useState<'input' | 'analysing' | 'results'>('input');
  const [topic, setTopic] = useState('');
  const [geography, setGeography] = useState('Global');
  const [customGeo, setCustomGeo] = useState('');
  const [historyCount, setHistoryCount] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [displayedJob, setDisplayedJob] = useState<ConsultingIntelligenceJob | null>(null);
  const [showSources, setShowSources] = useState(false);

  const { job, error, isStuck, retryJob, startJob, cancelJob } = useJobManager<ConsultingIntelligenceJob>({
    stuckThresholdMs: 120000, // 4 Parallel.AI calls can take up to 90s each
    onProgress: () => setStep('analysing'),
    onComplete: (data) => {
      setStep('results');
      setDisplayedJob(data);
      saveToHistory({
        moduleType: 'consulting-intelligence',
        targetCompany: topic.trim(),
        completedAt: data.completedAt || new Date().toISOString(),
        consultingTopic: topic.trim(),
        consultingFirms: data.discoveredFirms || [],
        consultingResult: data,
      });
      setHistoryCount(loadHistory().length);
    },
  });

  useEffect(() => {
    setHistoryCount(loadHistory().length);
    const pendingId = popPendingRestore();
    if (pendingId) {
      const entry = loadEntryById(pendingId);
      if (entry && entry.moduleType === 'consulting-intelligence') restoreEntry(entry);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const restoreEntry = useCallback((entry: HistoryEntry) => {
    if (!entry.consultingResult) return;
    setTopic(entry.consultingTopic || entry.targetCompany);
    setDisplayedJob(entry.consultingResult);
    setStep('results');
  }, []);

  const finalGeo = geography === 'Specific Country…' ? customGeo.trim() : geography;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim() || !finalGeo) return;
    setStep('analysing');
    await startJob({
      payload: { topic: topic.trim(), geography: finalGeo },
      endpoint: API_ENDPOINTS.consultingIntelligence,
      streamUrlFactory: API_ENDPOINTS.consultingIntelligenceStream,
      persist: { moduleType: 'consulting-intelligence', targetCompany: topic.trim() },
    });
  }

  const currentJob = displayedJob || job;

  // ── INPUT ───────────────────────────────────────────────────────────────────
  if (step === 'input') {
    return (
      <div style={{ minHeight: '100vh', background: BG, color: '#1B2A3D' }}>
        {showHistory && (
          <HistoryDrawer currentModule="consulting-intelligence" onSelectSameModule={restoreEntry} onClose={() => setShowHistory(false)} />
        )}
        <div style={{ background: 'linear-gradient(135deg, #0c3649, #12516E)', borderBottom: '1px solid #CCDFEA', padding: '16px 32px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 16 }}>
            <a href="/" style={{ color: 'rgba(255,255,255,0.65)', textDecoration: 'none', fontSize: 13 }}>← Home</a>
            <div style={{ width: 1, height: 16, background: '#CCDFEA' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <ModuleIcon id="consulting-intelligence" size={22} />
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: ACCENT, letterSpacing: 2 }}>REFRACTONE</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF' }}>Consulting Intelligence</div>
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
          <div style={{ background: '#F3F8FA', border: '1px solid #CCDFEA', borderRadius: 14, padding: '36px 32px' }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1B2A3D', margin: '0 0 6px' }}>Thought Leadership Research</h2>
            <p style={{ color: '#1B2A3D', fontSize: 13, margin: '0 0 28px', lineHeight: 1.6 }}>
              Enter a topic and geography. The research agent will scan the thought leadership landscape, identify the top 10 firms with published content, conduct deep per-firm research, and synthesise findings into an analyst-grade report.
            </p>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#6B7280', letterSpacing: 0.5, marginBottom: 8 }}>
                  RESEARCH TOPIC <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Generative AI in Financial Services, GCC Transformation in India, Supply Chain Resilience"
                  required
                  style={{ width: '100%', background: '#F3F8FA', border: '1px solid #CCDFEA', borderRadius: 8, color: '#1B2A3D', padding: '12px 14px', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: 28 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#6B7280', letterSpacing: 0.5, marginBottom: 8 }}>GEOGRAPHIC SCOPE</label>
                <select
                  value={geography}
                  onChange={(e) => setGeography(e.target.value)}
                  style={{ background: '#F3F8FA', border: '1px solid #CCDFEA', borderRadius: 8, color: '#1B2A3D', padding: '10px 14px', fontSize: 14, outline: 'none', minWidth: 260, appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%237eaabf' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: 32 }}
                >
                  {GEOGRAPHY_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
                {geography === 'Specific Country…' && (
                  <input
                    value={customGeo}
                    onChange={(e) => setCustomGeo(e.target.value)}
                    placeholder="e.g. Japan, Brazil, Saudi Arabia, Australia…"
                    required
                    style={{ marginTop: 10, width: '100%', background: '#F3F8FA', border: '1px solid #CCDFEA', borderRadius: 8, color: '#1B2A3D', padding: '10px 14px', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                  />
                )}
              </div>

              <div style={{ background: `${ACCENT}12`, border: `1px solid ${ACCENT}33`, borderRadius: 8, padding: '10px 14px', marginBottom: 24, fontSize: 12, color: '#a0b4c8', lineHeight: 1.5 }}>
                🔍 The research agent auto-discovers which firms have published thought leadership on your topic — no manual selection needed.
              </div>

              <button
                type="submit"
                disabled={!topic.trim() || !finalGeo}
                style={{ width: '100%', padding: '13px', background: (topic.trim() && finalGeo) ? `linear-gradient(135deg, ${ACCENT}, #6D28D9)` : '#CCDFEA', border: 'none', borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 700, cursor: (topic.trim() && finalGeo) ? 'pointer' : 'not-allowed', opacity: (topic.trim() && finalGeo) ? 1 : 0.5 }}
              >
                Research →
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ── ANALYSING ────────────────────────────────────────────────────────────────
  if (step === 'analysing') {
    return (
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <div style={{ background: '#F3F8FA', border: '1px solid #CCDFEA', borderRadius: 14, padding: '40px 36px', maxWidth: 520, width: '100%', textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, border: `3px solid ${ACCENT}44`, borderTopColor: ACCENT, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 24px' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#1B2A3D', marginBottom: 8 }}>Researching Thought Leadership</div>
          <div style={{ color: '#374B5C', fontSize: 13, marginBottom: 20, minHeight: 20 }}>
            {job?.currentStep || 'Scanning landscape…'}
          </div>
          {job?.progress != null && (
            <div style={{ background: '#F3F8FA', borderRadius: 6, height: 6, overflow: 'hidden', marginBottom: 12 }}>
              <div style={{ width: `${job.progress}%`, height: '100%', background: `linear-gradient(90deg, ${ACCENT}, #9333EA)`, transition: 'width 0.5s ease' }} />
            </div>
          )}
          {job?.discoveredFirms && job.discoveredFirms.length > 0 && (
            <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
              {job.discoveredFirms.map((f) => (
                <span key={f} style={{ background: `${ACCENT}22`, border: `1px solid ${ACCENT}44`, color: '#c4a8f0', borderRadius: 6, padding: '3px 9px', fontSize: 11 }}>{f}</span>
              ))}
            </div>
          )}
        </div>
        {isStuck && (
          <div style={{ marginTop: 16, maxWidth: 440, margin: '16px auto 0', background: 'rgba(52,145,232,0.08)', border: '1px solid rgba(52,145,232,0.25)', borderRadius: 8, padding: '12px 16px', fontSize: 12, color: '#6B7280', textAlign: 'center' }}>
            Still working — deep research across consulting firms takes 3-5 minutes. Please wait.
          </div>
        )}
        <KillSwitchButton onCancel={() => { cancelJob(); setStep('input'); }} />
      </div>
    );
  }

  // ── RESULTS ──────────────────────────────────────────────────────────────────
  if (!currentJob) return null;

  const firms = currentJob.discoveredFirms || [];

  return (
    <div style={{ minHeight: '100vh', background: BG, color: '#1B2A3D' }}>
      {showHistory && (
        <HistoryDrawer currentModule="consulting-intelligence" onSelectSameModule={restoreEntry} onClose={() => setShowHistory(false)} />
      )}

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0c3649, #12516E)', borderBottom: '1px solid #CCDFEA', padding: '16px 32px', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 16 }}>
          <a href="/" style={{ color: 'rgba(255,255,255,0.65)', textDecoration: 'none', fontSize: 13 }}>← Home</a>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF' }}>{currentJob.topic}</div>
            <div style={{ fontSize: 12, color: '#6B7280' }}>{currentJob.geography} · {firms.length} firms researched</div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setShowHistory(true)} style={{ background: `${ACCENT}18`, border: `1px solid ${ACCENT}44`, color: ACCENT, borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
              History
            </button>
            <button onClick={() => { cancelJob(); setStep('input'); setDisplayedJob(null); }} style={{ background: 'transparent', border: '1px solid #CCDFEA', color: '#6B7280', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
              New Research
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>

        {/* Discovered firms chips */}
        {firms.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
            {firms.map((f) => (
              <span key={f} style={{ background: `${ACCENT}22`, border: `1px solid ${ACCENT}44`, color: '#c4a8f0', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600 }}>{f}</span>
            ))}
          </div>
        )}

        {/* Executive Summary */}
        {currentJob.executiveSummary && (
          <SectionCard title="Executive Summary">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
              {currentJob.executiveSummary.topInsights?.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#3491E8', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Top Insights</div>
                  <ol style={{ margin: 0, paddingLeft: 18 }}>
                    {currentJob.executiveSummary.topInsights.slice(0, 8).map((ins, i) => (
                      <li key={i} style={{ color: '#374B5C', fontSize: 13, lineHeight: 1.6, marginBottom: 6 }}>{ins}</li>
                    ))}
                  </ol>
                </div>
              )}
              {currentJob.executiveSummary.emergingTrends?.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#22C55E', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Emerging Trends</div>
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {currentJob.executiveSummary.emergingTrends.map((t, i) => (
                      <li key={i} style={{ color: '#374B5C', fontSize: 13, lineHeight: 1.6, marginBottom: 6 }}>{t}</li>
                    ))}
                  </ul>
                </div>
              )}
              {currentJob.executiveSummary.futureOutlook && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: ACCENT, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Future Outlook</div>
                  <p style={{ color: '#1B2A3D', fontSize: 13, lineHeight: 1.7, margin: 0 }}>{currentJob.executiveSummary.futureOutlook}</p>
                </div>
              )}
            </div>
          </SectionCard>
        )}

        {/* Consensus & Contrarian */}
        {(currentJob.executiveSummary?.consensusViewpoints?.length || currentJob.executiveSummary?.contrarianOpinions?.length) ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
            <div style={{ background: 'rgba(52,145,232,0.08)', border: '1px solid rgba(52,145,232,0.25)', borderRadius: 12, padding: '20px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#3491E8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Consensus Viewpoints</div>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {(currentJob.executiveSummary?.consensusViewpoints || []).map((v, i) => (
                  <li key={i} style={{ color: '#374B5C', fontSize: 13, lineHeight: 1.6, marginBottom: 6 }}>{v}</li>
                ))}
              </ul>
            </div>
            <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 12, padding: '20px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Contrarian Opinions</div>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {(currentJob.executiveSummary?.contrarianOpinions || []).map((v, i) => (
                  <li key={i} style={{ color: '#374B5C', fontSize: 13, lineHeight: 1.6, marginBottom: 6 }}>{v}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}

        {/* Firm-by-Firm Analysis */}
        {currentJob.firmAnalyses && currentJob.firmAnalyses.length > 0 && (
          <SectionCard title="Firm-by-Firm Analysis">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {currentJob.firmAnalyses.map((f: TLFirmInsight, i: number) => (
                <div key={i} style={{ background: '#F3F8FA', border: '1px solid #CCDFEA', borderRadius: 10, padding: '18px 20px' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1B2A3D', marginBottom: 10 }}>{f.firmName}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                    {f.keyThemes?.length > 0 && (
                      <div>
                        <div style={{ fontSize: 11, color: ACCENT, fontWeight: 700, marginBottom: 6 }}>KEY THEMES</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                          {f.keyThemes.map((t, j) => <span key={j} style={{ background: `${ACCENT}18`, border: `1px solid ${ACCENT}33`, color: '#c4a8f0', borderRadius: 4, padding: '2px 8px', fontSize: 11 }}>{t}</span>)}
                        </div>
                      </div>
                    )}
                    {f.keyInsights?.length > 0 && (
                      <div>
                        <div style={{ fontSize: 11, color: '#3491E8', fontWeight: 700, marginBottom: 6 }}>KEY INSIGHTS</div>
                        <ul style={{ margin: 0, paddingLeft: 16 }}>
                          {f.keyInsights.slice(0, 4).map((ins, j) => <li key={j} style={{ color: '#374B5C', fontSize: 13, lineHeight: 1.5, marginBottom: 4 }}>{ins}</li>)}
                        </ul>
                      </div>
                    )}
                    {f.keyStatistics?.length > 0 && (
                      <div>
                        <div style={{ fontSize: 11, color: '#22C55E', fontWeight: 700, marginBottom: 6 }}>STATISTICS</div>
                        <ul style={{ margin: 0, paddingLeft: 16 }}>
                          {f.keyStatistics.map((s, j) => <li key={j} style={{ color: '#374B5C', fontSize: 13, lineHeight: 1.5, marginBottom: 4 }}>{s}</li>)}
                        </ul>
                      </div>
                    )}
                    {f.marketOutlook && (
                      <div>
                        <div style={{ fontSize: 11, color: '#F59E0B', fontWeight: 700, marginBottom: 6 }}>MARKET OUTLOOK</div>
                        <p style={{ color: '#1B2A3D', fontSize: 13, lineHeight: 1.6, margin: 0 }}>{f.marketOutlook}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* Comparative Matrix */}
        {currentJob.comparativeMatrix && currentJob.comparativeMatrix.length > 0 && (
          <SectionCard title="Comparative Matrix">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>
                    {Object.keys(currentJob.comparativeMatrix[0]).map((k) => (
                      <th key={k} style={{ textAlign: 'left', padding: '10px 12px', color: '#6B7280', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '2px solid #1e4a5e' }}>{k}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currentJob.comparativeMatrix.map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #0f2d40' }}>
                      {Object.values(row).map((v, j) => (
                        <td key={j} style={{ padding: '10px 12px', color: '#6B7280', verticalAlign: 'top', lineHeight: 1.5 }}>{String(v)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        )}

        {/* Emerging Themes */}
        {currentJob.emergingThemes && currentJob.emergingThemes.length > 0 && (
          <SectionCard title="Emerging Themes & Trend Analysis">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>
                    {['Theme', 'Frequency', 'Strategic Urgency', 'Business Impact', 'Description'].map((h) => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 12px', color: '#6B7280', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '2px solid #1e4a5e' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currentJob.emergingThemes.map((t: TLTheme, i: number) => (
                    <tr key={i} style={{ borderBottom: '1px solid #0f2d40' }}>
                      <td style={{ padding: '10px 12px', color: '#1B2A3D', fontWeight: 600 }}>{t.theme}</td>
                      <td style={{ padding: '10px 12px', color: '#6B7280' }}>{t.frequency}</td>
                      <td style={{ padding: '10px 12px' }}><Badge label={t.strategicUrgency} color={URGENCY_COLORS[t.strategicUrgency] || '#888'} /></td>
                      <td style={{ padding: '10px 12px' }}><Badge label={t.businessImpact} color={URGENCY_COLORS[t.businessImpact] || '#888'} /></td>
                      <td style={{ padding: '10px 12px', color: '#9AB0C0', fontSize: 12, lineHeight: 1.5 }}>{t.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        )}

        {/* Quantitative Evidence */}
        {currentJob.quantitativeEvidence && currentJob.quantitativeEvidence.length > 0 && (
          <SectionCard title="Quantitative Evidence Repository" accent="#22C55E">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>
                    {['Metric', 'Value', 'Source Firm', 'Geography', 'Year'].map((h) => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 12px', color: '#6B7280', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '2px solid #1e4a5e' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currentJob.quantitativeEvidence.map((m: TLMetric, i: number) => (
                    <tr key={i} style={{ borderBottom: '1px solid #0f2d40' }}>
                      <td style={{ padding: '10px 12px', color: '#6B7280' }}>{m.metric}</td>
                      <td style={{ padding: '10px 12px', color: '#22C55E', fontWeight: 700 }}>{m.value}</td>
                      <td style={{ padding: '10px 12px', color: '#6B7280' }}>{m.sourceFirm}</td>
                      <td style={{ padding: '10px 12px', color: '#9AB0C0' }}>{m.geography}</td>
                      <td style={{ padding: '10px 12px', color: '#9AB0C0' }}>{m.year}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        )}

        {/* Charts */}
        {currentJob.charts && currentJob.charts.filter((c: TLChartSpec) => c.dataQuality !== 'insufficient').length > 0 && (
          <SectionCard title="Visualizations" accent="#3491E8">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 24 }}>
              {currentJob.charts.filter((c: TLChartSpec) => c.dataQuality !== 'insufficient').map((chart: TLChartSpec, i: number) => (
                <div key={i}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1B2A3D', marginBottom: 4 }}>{chart.title}</div>
                  <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 12 }}>{chart.description}</div>
                  <ResponsiveContainer width="100%" height={220}>
                    {chart.type === 'bar' ? (
                      <BarChart data={chart.data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e4a5e" />
                        <XAxis dataKey={chart.xKey || 'label'} tick={{ fill: '#4A6274', fontSize: 11 }} />
                        <YAxis tick={{ fill: '#4A6274', fontSize: 11 }} />
                        <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #CCDFEA', color: '#1B2A3D', fontSize: 12 }} />
                        <Bar dataKey={chart.yKey || 'value'} fill={ACCENT} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    ) : (
                      <LineChart data={chart.data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e4a5e" />
                        <XAxis dataKey={chart.xKey || 'label'} tick={{ fill: '#4A6274', fontSize: 11 }} />
                        <YAxis tick={{ fill: '#4A6274', fontSize: 11 }} />
                        <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #CCDFEA', color: '#1B2A3D', fontSize: 12 }} />
                        <Line type="monotone" dataKey={chart.yKey || 'value'} stroke={ACCENT} strokeWidth={2} dot={{ fill: ACCENT }} />
                      </LineChart>
                    )}
                  </ResponsiveContainer>
                  <div style={{ fontSize: 11, color: '#6B7280', marginTop: 6 }}>Sources: {chart.sourceFirms.join(', ')} · Data quality: {chart.dataQuality}</div>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* Strategic Recommendations */}
        {currentJob.strategicRecommendations && currentJob.strategicRecommendations.length > 0 && (
          <SectionCard title="Strategic Recommendations" accent={ACCENT}>
            <ol style={{ margin: 0, paddingLeft: 20 }}>
              {currentJob.strategicRecommendations.map((r, i) => (
                <li key={i} style={{ color: '#1B2A3D', fontSize: 13, lineHeight: 1.7, marginBottom: 10, paddingLeft: 4 }}>{r}</li>
              ))}
            </ol>
          </SectionCard>
        )}

        {/* Source Attribution */}
        {currentJob.sourceAttribution && currentJob.sourceAttribution.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <button
              onClick={() => setShowSources((s) => !s)}
              style={{ width: '100%', textAlign: 'left', background: '#F3F8FA', border: '1px solid #CCDFEA', borderRadius: 12, padding: '14px 20px', color: '#6B7280', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <span>📚 Source Attribution ({currentJob.sourceAttribution.length} sources)</span>
              <span style={{ fontSize: 10 }}>{showSources ? '▲' : '▼'}</span>
            </button>
            {showSources && (
              <div style={{ background: '#F3F8FA', border: '1px solid #CCDFEA', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '0 20px 20px', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginTop: 12 }}>
                  <thead>
                    <tr>
                      {['Insight', 'Firm', 'Report', 'Date', 'Confidence'].map((h) => (
                        <th key={h} style={{ textAlign: 'left', padding: '8px 10px', color: '#6B7280', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid #CCDFEA' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {currentJob.sourceAttribution.map((s: TLInsight, i: number) => (
                      <tr key={i} style={{ borderBottom: '1px solid #0f2d40' }}>
                        <td style={{ padding: '8px 10px', color: '#6B7280', maxWidth: 320, lineHeight: 1.4 }}>{s.insight}</td>
                        <td style={{ padding: '8px 10px', color: '#1B2A3D', fontWeight: 600, whiteSpace: 'nowrap' }}>{s.sourceFirm}</td>
                        <td style={{ padding: '8px 10px', color: '#9AB0C0' }}>{s.report}</td>
                        <td style={{ padding: '8px 10px', color: '#9AB0C0', whiteSpace: 'nowrap' }}>{s.publishedDate}</td>
                        <td style={{ padding: '8px 10px' }}><Badge label={s.confidence} color={CONFIDENCE_COLORS[s.confidence] || '#888'} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
