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
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ACCENT = '#7C3AED';
const BG = '#080f16';
const NAVY = '#0c3649';
const BLUE = '#3491E8';

const GEOGRAPHY_OPTIONS = [
  'Global', 'North America', 'Europe', 'India', 'ASEAN', 'Middle East',
  'Latin America', 'US + UK + Germany',
];

const FIRM_GROUPS: { category: string; firms: string[] }[] = [
  {
    category: 'Strategy & Management',
    firms: ['McKinsey & Company', 'Boston Consulting Group (BCG)', 'Bain & Company', 'Kearney', 'Roland Berger', 'Oliver Wyman', 'LEK Consulting'],
  },
  {
    category: 'Big Four Advisory',
    firms: ['PwC', 'Deloitte', 'EY', 'KPMG', 'Strategy&', 'EY-Parthenon', 'Monitor Deloitte'],
  },
  {
    category: 'Technology & IT Advisory',
    firms: ['Gartner', 'Forrester', 'IDC', 'Everest Group', 'ISG', 'HFS Research', 'NelsonHall'],
  },
  {
    category: 'Technology Consulting',
    firms: ['IBM Consulting', 'Accenture', 'Capgemini', 'Cognizant', 'Infosys Consulting', 'TCS Consulting'],
  },
  {
    category: 'Market Intelligence',
    firms: ['CB Insights', 'PitchBook', 'Oxford Economics', 'EIU', 'S&P Global', "Moody's Analytics"],
  },
  {
    category: 'Think Tanks / Research',
    firms: ['World Economic Forum', 'RAND', 'Brookings', 'HBR', 'MIT Sloan Management Review'],
  },
];

const URGENCY_COLORS: Record<string, string> = { high: '#EF4444', medium: '#F59E0B', low: '#22C55E' };
const IMPACT_COLORS: Record<string, string> = { high: '#7C3AED', medium: '#3491E8', low: '#6B7280' };
const CONFIDENCE_COLORS: Record<string, string> = { high: '#22C55E', medium: '#F59E0B', low: '#EF4444' };

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 4,
      fontSize: 11, fontWeight: 700, background: color + '22', color, border: `1px solid ${color}44`,
    }}>
      {label}
    </span>
  );
}

export default function ConsultingIntelligencePage() {
  const [step, setStep] = useState<'input' | 'analysing' | 'results'>('input');
  const [topic, setTopic] = useState('');
  const [geography, setGeography] = useState('Global');
  const [selectedFirms, setSelectedFirms] = useState<string[]>([]);
  const [historyCount, setHistoryCount] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [displayedJob, setDisplayedJob] = useState<ConsultingIntelligenceJob | null>(null);
  const [expandedFirms, setExpandedFirms] = useState<Set<number>>(new Set());
  const [showSources, setShowSources] = useState(false);

  const { job, error, isStuck, retryJob, startJob, cancelJob } = useJobManager<ConsultingIntelligenceJob>({
    onProgress: () => setStep('analysing'),
    onComplete: (data) => {
      setStep('results');
      setDisplayedJob(data);
      saveToHistory({
        moduleType: 'consulting-intelligence',
        targetCompany: topic.trim(),
        completedAt: data.completedAt || new Date().toISOString(),
        consultingTopic: topic.trim(),
        consultingFirms: selectedFirms,
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
    setSelectedFirms(entry.consultingFirms || []);
    setDisplayedJob(entry.consultingResult);
    setStep('results');
  }, []);

  function toggleFirm(firm: string) {
    setSelectedFirms((prev) => {
      if (prev.includes(firm)) return prev.filter((f) => f !== firm);
      if (prev.length >= 5) return prev;
      return [...prev, firm];
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim() || selectedFirms.length === 0) return;
    setStep('analysing');
    await startJob({
      payload: { topic: topic.trim(), geography, selectedFirms },
      endpoint: API_ENDPOINTS.consultingIntelligence,
      streamUrlFactory: API_ENDPOINTS.consultingIntelligenceStream,
      persist: { moduleType: 'consulting-intelligence', targetCompany: topic.trim() },
    });
  }

  const currentJob = displayedJob || job;

  // ── Input ───────────────────────────────────────────────────────────────────

  if (step === 'input') {
    return (
      <div style={{ minHeight: '100vh', background: BG, color: '#E8EDF5', padding: '32px 24px' }}>
        <div style={{ maxWidth: 780, margin: '0 auto' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <ModuleIcon id="consulting-intelligence" size={28} />
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#E8EDF5' }}>Consulting Intelligence</div>
                <div style={{ fontSize: 13, color: '#6B8FA8', marginTop: 2 }}>Synthesise thought leadership from top consulting and analyst firms</div>
              </div>
            </div>
            <button
              onClick={() => setShowHistory(true)}
              style={{ background: NAVY, border: `1px solid #1e4a5e`, color: '#B0C4D8', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13 }}
            >
              History {historyCount > 0 && `(${historyCount})`}
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Research Topic */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#B0C4D8', marginBottom: 8 }}>
                Research Topic <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Generative AI in Financial Services, Supply Chain Resilience, Digital Health Transformation"
                required
                style={{
                  width: '100%', background: NAVY, border: `1px solid #1e4a5e`, borderRadius: 8,
                  color: '#E8EDF5', padding: '12px 16px', fontSize: 15, outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Geography */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#B0C4D8', marginBottom: 8 }}>
                Geographic Scope
              </label>
              <select
                value={geography}
                onChange={(e) => setGeography(e.target.value)}
                style={{
                  background: NAVY, border: `1px solid #1e4a5e`, borderRadius: 8,
                  color: '#E8EDF5', padding: '10px 14px', fontSize: 14, outline: 'none', minWidth: 240,
                }}
              >
                {GEOGRAPHY_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            {/* Firms */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#B0C4D8' }}>
                  Selected Firms <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <span style={{
                  fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                  background: selectedFirms.length >= 5 ? '#7C3AED22' : '#1e4a5e',
                  color: selectedFirms.length >= 5 ? ACCENT : '#6B8FA8',
                  border: `1px solid ${selectedFirms.length >= 5 ? ACCENT + '44' : '#1e4a5e'}`,
                }}>
                  {selectedFirms.length}/5 selected
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {FIRM_GROUPS.map((group) => (
                  <div key={group.category} style={{ background: NAVY, border: `1px solid #1e4a5e`, borderRadius: 10, padding: '14px 16px' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: ACCENT, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                      {group.category}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {group.firms.map((firm) => {
                        const checked = selectedFirms.includes(firm);
                        const disabled = !checked && selectedFirms.length >= 5;
                        return (
                          <label
                            key={firm}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 6, cursor: disabled ? 'not-allowed' : 'pointer',
                              padding: '5px 10px', borderRadius: 6,
                              background: checked ? ACCENT + '22' : '#0a1a24',
                              border: `1px solid ${checked ? ACCENT : '#1e4a5e'}`,
                              opacity: disabled ? 0.4 : 1,
                              fontSize: 13, color: checked ? '#E8EDF5' : '#8FAFC4',
                              transition: 'all 0.15s',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={disabled}
                              onChange={() => toggleFirm(firm)}
                              style={{ accentColor: ACCENT, width: 13, height: 13 }}
                            />
                            {firm}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={!topic.trim() || selectedFirms.length === 0}
              style={{
                background: topic.trim() && selectedFirms.length > 0 ? ACCENT : '#1e4a5e',
                color: '#fff', border: 'none', borderRadius: 8, padding: '13px 32px',
                fontSize: 15, fontWeight: 700, cursor: topic.trim() && selectedFirms.length > 0 ? 'pointer' : 'not-allowed',
                transition: 'background 0.15s',
              }}
            >
              Research →
            </button>
          </form>
        </div>

        {showHistory && (
          <HistoryDrawer
            currentModule="consulting-intelligence"
            onSelectSameModule={restoreEntry}
            onClose={() => setShowHistory(false)}
          />
        )}
      </div>
    );
  }

  // ── Analysing ────────────────────────────────────────────────────────────────

  if (step === 'analysing') {
    const progress = job?.progress ?? 0;
    const currentStep = job?.currentStep ?? 'Initialising…';
    return (
      <div style={{ minHeight: '100vh', background: BG, color: '#E8EDF5', padding: '32px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ maxWidth: 520, width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🔭</div>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Researching {selectedFirms.length} Firms</div>
          <div style={{ fontSize: 14, color: '#6B8FA8', marginBottom: 24 }}>{currentStep}</div>
          <div style={{ background: '#1e2d3a', borderRadius: 8, height: 8, overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ background: ACCENT, height: '100%', width: `${progress}%`, transition: 'width 0.5s ease', borderRadius: 8 }} />
          </div>
          <div style={{ fontSize: 12, color: '#6B8FA8', marginBottom: 24 }}>{progress}% complete</div>

          {isStuck && (
            <button onClick={retryJob} style={{ background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', cursor: 'pointer', marginRight: 12 }}>
              Retry
            </button>
          )}
          {error && <div style={{ color: '#EF4444', fontSize: 13 }}>{error}</div>}
          <button onClick={() => { cancelJob(); setStep('input'); }} style={{ background: 'transparent', color: '#6B8FA8', border: `1px solid #1e4a5e`, borderRadius: 8, padding: '8px 20px', cursor: 'pointer', fontSize: 13 }}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // ── Results ─────────────────────────────────────────────────────────────────

  if (!currentJob) return null;

  return (
    <div style={{ minHeight: '100vh', background: BG, color: '#E8EDF5', padding: '24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <ModuleIcon id="consulting-intelligence" size={24} />
              <div style={{ fontSize: 20, fontWeight: 800, color: '#E8EDF5' }}>{currentJob.topic}</div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              <span style={{ background: '#1e4a5e', color: '#B0C4D8', fontSize: 12, padding: '3px 10px', borderRadius: 20, border: '1px solid #2a5a72' }}>
                {currentJob.geography}
              </span>
              {currentJob.selectedFirms.map((f) => (
                <span key={f} style={{ background: ACCENT + '22', color: ACCENT, fontSize: 12, padding: '3px 10px', borderRadius: 20, border: `1px solid ${ACCENT}44` }}>
                  {f}
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={() => { setStep('input'); setDisplayedJob(null); }}
            style={{ background: NAVY, border: `1px solid #1e4a5e`, color: '#B0C4D8', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13, flexShrink: 0 }}
          >
            New Research
          </button>
        </div>

        {/* 1. Executive Summary */}
        {currentJob.executiveSummary && (
          <Section title="Executive Summary">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              {currentJob.executiveSummary.topInsights?.length > 0 && (
                <Card title="Top Insights" accent={BLUE}>
                  <ol style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
                    {currentJob.executiveSummary.topInsights.map((ins, i) => <li key={i} style={{ fontSize: 13, color: '#B0C4D8', marginBottom: 4 }}>{ins}</li>)}
                  </ol>
                </Card>
              )}
              {currentJob.executiveSummary.emergingTrends?.length > 0 && (
                <Card title="Emerging Trends" accent={ACCENT}>
                  <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
                    {currentJob.executiveSummary.emergingTrends.map((t, i) => <li key={i} style={{ fontSize: 13, color: '#B0C4D8', marginBottom: 4 }}>{t}</li>)}
                  </ul>
                </Card>
              )}
              {currentJob.executiveSummary.futureOutlook && (
                <Card title="Future Outlook" accent="#059669">
                  <p style={{ margin: 0, fontSize: 13, color: '#B0C4D8', lineHeight: 1.7 }}>{currentJob.executiveSummary.futureOutlook}</p>
                </Card>
              )}
            </div>
          </Section>
        )}

        {/* 2. Consensus & Contrarian */}
        {(currentJob.executiveSummary?.consensusViewpoints?.length || currentJob.executiveSummary?.contrarianOpinions?.length) ? (
          <Section title="Consensus & Contrarian Views">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {currentJob.executiveSummary?.consensusViewpoints?.length ? (
                <Card title="Consensus Viewpoints" accent={BLUE}>
                  <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
                    {currentJob.executiveSummary.consensusViewpoints.map((v, i) => <li key={i} style={{ fontSize: 13, color: '#B0C4D8', marginBottom: 4 }}>{v}</li>)}
                  </ul>
                </Card>
              ) : null}
              {currentJob.executiveSummary?.contrarianOpinions?.length ? (
                <Card title="Contrarian Opinions" accent="#F59E0B">
                  <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
                    {currentJob.executiveSummary.contrarianOpinions.map((v, i) => <li key={i} style={{ fontSize: 13, color: '#B0C4D8', marginBottom: 4 }}>{v}</li>)}
                  </ul>
                </Card>
              ) : null}
            </div>
          </Section>
        ) : null}

        {/* 3. Firm-by-Firm Analysis */}
        {currentJob.firmAnalyses && currentJob.firmAnalyses.length > 0 && (
          <Section title="Firm-by-Firm Analysis">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {currentJob.firmAnalyses.map((firm: TLFirmInsight, i: number) => {
                const open = expandedFirms.has(i);
                return (
                  <div key={i} style={{ background: NAVY, border: `1px solid #1e4a5e`, borderRadius: 10, overflow: 'hidden' }}>
                    <button
                      onClick={() => setExpandedFirms((prev) => { const next = new Set(prev); open ? next.delete(i) : next.add(i); return next; })}
                      style={{ width: '100%', background: 'transparent', border: 'none', padding: '14px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                    >
                      <span style={{ fontSize: 15, fontWeight: 700, color: '#E8EDF5' }}>{firm.firmName}</span>
                      <span style={{ color: '#6B8FA8', fontSize: 14 }}>{open ? '▲' : '▼'}</span>
                    </button>
                    {open && (
                      <div style={{ padding: '0 18px 18px' }}>
                        {firm.keyThemes?.length > 0 && (
                          <div style={{ marginBottom: 12 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: ACCENT, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Themes</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                              {firm.keyThemes.map((t, j) => <span key={j} style={{ background: ACCENT + '22', color: ACCENT, fontSize: 12, padding: '3px 8px', borderRadius: 4 }}>{t}</span>)}
                            </div>
                          </div>
                        )}
                        {firm.keyInsights?.length > 0 && (
                          <div style={{ marginBottom: 12 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: BLUE, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Key Insights</div>
                            <ul style={{ margin: 0, paddingLeft: 18 }}>
                              {firm.keyInsights.map((ins, j) => <li key={j} style={{ fontSize: 13, color: '#B0C4D8', marginBottom: 3 }}>{ins}</li>)}
                            </ul>
                          </div>
                        )}
                        {firm.keyStatistics?.length > 0 && (
                          <div style={{ marginBottom: 12 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Key Statistics</div>
                            <ul style={{ margin: 0, paddingLeft: 18 }}>
                              {firm.keyStatistics.map((s, j) => <li key={j} style={{ fontSize: 13, color: '#B0C4D8', marginBottom: 3 }}>{s}</li>)}
                            </ul>
                          </div>
                        )}
                        {firm.risks?.length > 0 && (
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#EF4444', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Risks</div>
                            <ul style={{ margin: 0, paddingLeft: 18 }}>
                              {firm.risks.map((r, j) => <li key={j} style={{ fontSize: 13, color: '#B0C4D8', marginBottom: 3 }}>{r}</li>)}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        {/* 4. Comparative Matrix */}
        {currentJob.comparativeMatrix && currentJob.comparativeMatrix.length > 0 && (
          <Section title="Comparative Matrix">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>
                    {Object.keys(currentJob.comparativeMatrix[0]).map((col) => (
                      <th key={col} style={{ padding: '10px 14px', textAlign: 'left', background: '#0a1a24', color: '#B0C4D8', fontWeight: 700, fontSize: 12, borderBottom: `2px solid #1e4a5e`, whiteSpace: 'nowrap' }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currentJob.comparativeMatrix.map((row, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? NAVY : '#0a1a24' }}>
                      {Object.values(row).map((val, j) => (
                        <td key={j} style={{ padding: '9px 14px', color: '#E8EDF5', borderBottom: `1px solid #1e4a5e` }}>{String(val)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        )}

        {/* 5. Emerging Themes */}
        {currentJob.emergingThemes && currentJob.emergingThemes.length > 0 && (
          <Section title="Emerging Themes">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>
                    {['Theme', 'Frequency', 'Strategic Urgency', 'Business Impact', 'Description'].map((col) => (
                      <th key={col} style={{ padding: '10px 14px', textAlign: 'left', background: '#0a1a24', color: '#B0C4D8', fontWeight: 700, fontSize: 12, borderBottom: `2px solid #1e4a5e` }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currentJob.emergingThemes.map((theme: TLTheme, i: number) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? NAVY : '#0a1a24' }}>
                      <td style={{ padding: '9px 14px', color: '#E8EDF5', fontWeight: 600, borderBottom: `1px solid #1e4a5e` }}>{theme.theme}</td>
                      <td style={{ padding: '9px 14px', color: '#B0C4D8', borderBottom: `1px solid #1e4a5e`, textAlign: 'center' }}>{theme.frequency}</td>
                      <td style={{ padding: '9px 14px', borderBottom: `1px solid #1e4a5e` }}><Badge label={theme.strategicUrgency} color={URGENCY_COLORS[theme.strategicUrgency] || '#6B7280'} /></td>
                      <td style={{ padding: '9px 14px', borderBottom: `1px solid #1e4a5e` }}><Badge label={theme.businessImpact} color={IMPACT_COLORS[theme.businessImpact] || '#6B7280'} /></td>
                      <td style={{ padding: '9px 14px', color: '#B0C4D8', borderBottom: `1px solid #1e4a5e`, maxWidth: 300 }}>{theme.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        )}

        {/* 6. Quantitative Evidence */}
        {currentJob.quantitativeEvidence && currentJob.quantitativeEvidence.length > 0 && (
          <Section title="Quantitative Evidence">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>
                    {['Metric', 'Value', 'Source Firm', 'Geography', 'Year'].map((col) => (
                      <th key={col} style={{ padding: '10px 14px', textAlign: 'left', background: '#0a1a24', color: '#B0C4D8', fontWeight: 700, fontSize: 12, borderBottom: `2px solid #1e4a5e` }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currentJob.quantitativeEvidence.map((m: TLMetric, i: number) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? NAVY : '#0a1a24' }}>
                      <td style={{ padding: '9px 14px', color: '#E8EDF5', borderBottom: `1px solid #1e4a5e` }}>{m.metric}</td>
                      <td style={{ padding: '9px 14px', color: '#22C55E', fontWeight: 700, borderBottom: `1px solid #1e4a5e` }}>{m.value}</td>
                      <td style={{ padding: '9px 14px', color: '#B0C4D8', borderBottom: `1px solid #1e4a5e` }}>{m.sourceFirm}</td>
                      <td style={{ padding: '9px 14px', color: '#B0C4D8', borderBottom: `1px solid #1e4a5e` }}>{m.geography}</td>
                      <td style={{ padding: '9px 14px', color: '#B0C4D8', borderBottom: `1px solid #1e4a5e` }}>{m.year}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        )}

        {/* 7. Charts */}
        {currentJob.charts && currentJob.charts.length > 0 && (
          <Section title="Charts">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 16 }}>
              {currentJob.charts.map((chart: TLChartSpec, i: number) => (
                <div key={i} style={{ background: NAVY, border: `1px solid #1e4a5e`, borderRadius: 10, padding: '16px' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{chart.title}</div>
                  {chart.description && <div style={{ fontSize: 12, color: '#6B8FA8', marginBottom: 12 }}>{chart.description}</div>}
                  {chart.dataQuality === 'insufficient' ? (
                    <div style={{ color: '#6B8FA8', fontSize: 13, fontStyle: 'italic', padding: '20px 0' }}>
                      Insufficient structured evidence available for reliable visualization
                    </div>
                  ) : chart.type === 'bar' ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={chart.data} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e4a5e" />
                        <XAxis dataKey={chart.xKey || 'label'} tick={{ fill: '#6B8FA8', fontSize: 11 }} />
                        <YAxis tick={{ fill: '#6B8FA8', fontSize: 11 }} />
                        <Tooltip contentStyle={{ background: '#0c3649', border: '1px solid #1e4a5e', color: '#E8EDF5' }} />
                        <Bar dataKey={chart.yKey || 'value'} fill={ACCENT} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : chart.type === 'line' ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={chart.data} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e4a5e" />
                        <XAxis dataKey={chart.xKey || 'label'} tick={{ fill: '#6B8FA8', fontSize: 11 }} />
                        <YAxis tick={{ fill: '#6B8FA8', fontSize: 11 }} />
                        <Tooltip contentStyle={{ background: '#0c3649', border: '1px solid #1e4a5e', color: '#E8EDF5' }} />
                        <Line type="monotone" dataKey={chart.yKey || 'value'} stroke={ACCENT} strokeWidth={2} dot={{ fill: ACCENT }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : null}
                  {chart.sourceFirms?.length > 0 && (
                    <div style={{ fontSize: 11, color: '#6B8FA8', marginTop: 8 }}>Sources: {chart.sourceFirms.join(', ')}</div>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* 8. Strategic Recommendations */}
        {currentJob.strategicRecommendations && currentJob.strategicRecommendations.length > 0 && (
          <Section title="Strategic Recommendations">
            <ol style={{ margin: 0, paddingLeft: 0, listStyle: 'none' }}>
              {currentJob.strategicRecommendations.map((rec, i) => (
                <li key={i} style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                  <span style={{ flexShrink: 0, width: 26, height: 26, borderRadius: '50%', background: ACCENT + '22', border: `1px solid ${ACCENT}44`, color: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>{i + 1}</span>
                  <p style={{ margin: 0, fontSize: 14, color: '#B0C4D8', lineHeight: 1.7 }}>{rec}</p>
                </li>
              ))}
            </ol>
          </Section>
        )}

        {/* 9. Source Attribution */}
        {currentJob.sourceAttribution && currentJob.sourceAttribution.length > 0 && (
          <Section title="Source Attribution">
            <button
              onClick={() => setShowSources((v) => !v)}
              style={{ background: NAVY, border: `1px solid #1e4a5e`, color: '#B0C4D8', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13, marginBottom: 12 }}
            >
              {showSources ? 'Hide Sources' : `Show ${currentJob.sourceAttribution.length} Sources`}
            </button>
            {showSources && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr>
                      {['Insight', 'Firm', 'Report', 'Date', 'Confidence'].map((col) => (
                        <th key={col} style={{ padding: '10px 14px', textAlign: 'left', background: '#0a1a24', color: '#B0C4D8', fontWeight: 700, fontSize: 12, borderBottom: `2px solid #1e4a5e` }}>
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {currentJob.sourceAttribution.map((src: TLInsight, i: number) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? NAVY : '#0a1a24' }}>
                        <td style={{ padding: '9px 14px', color: '#E8EDF5', borderBottom: `1px solid #1e4a5e`, maxWidth: 320 }}>{src.insight}</td>
                        <td style={{ padding: '9px 14px', color: '#B0C4D8', borderBottom: `1px solid #1e4a5e`, whiteSpace: 'nowrap' }}>{src.sourceFirm}</td>
                        <td style={{ padding: '9px 14px', color: '#B0C4D8', borderBottom: `1px solid #1e4a5e` }}>
                          {src.url ? <a href={src.url} target="_blank" rel="noopener noreferrer" style={{ color: BLUE }}>{src.report}</a> : src.report}
                        </td>
                        <td style={{ padding: '9px 14px', color: '#6B8FA8', borderBottom: `1px solid #1e4a5e`, whiteSpace: 'nowrap' }}>{src.publishedDate}</td>
                        <td style={{ padding: '9px 14px', borderBottom: `1px solid #1e4a5e` }}><Badge label={src.confidence} color={CONFIDENCE_COLORS[src.confidence] || '#6B7280'} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: '#6B8FA8', marginBottom: 14, paddingBottom: 8, borderBottom: '1px solid #1e4a5e' }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Card({ title, accent, children }: { title: string; accent: string; children: React.ReactNode }) {
  return (
    <div style={{ background: NAVY, border: `1px solid ${accent}44`, borderRadius: 10, padding: '16px' }}>
      <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: accent, marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  );
}
