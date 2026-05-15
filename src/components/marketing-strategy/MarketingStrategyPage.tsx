'use client';
import StuckJobBanner from '@/components/shared/StuckJobBanner';
import KillSwitchButton from '@/components/shared/KillSwitchButton';

import { useState, useEffect, useCallback } from 'react';
import { MarketingStrategyJob, StrategyFramework, StrategyDimensionRow } from '@/lib/types';
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
const ACCENT = '#8B5CF6';

const FRAMEWORKS: { value: StrategyFramework; label: string; description: string }[] = [
  { value: 'BCG Matrix', label: 'BCG Matrix', description: 'Growth-Share Matrix — classify products/segments as Stars, Cash Cows, Question Marks, or Dogs' },
  { value: 'SWOT', label: 'SWOT Analysis', description: 'Internal Strengths & Weaknesses, External Opportunities & Threats' },
  { value: 'Porters Five Forces', label: "Porter's Five Forces", description: 'Competitive Rivalry, New Entrants, Substitutes, Buyer & Supplier Power' },
  { value: 'Ansoff Matrix', label: 'Ansoff Matrix', description: 'Market Penetration, Market Development, Product Development, Diversification' },
  { value: '4P/7P Marketing Mix', label: '4P/7P Marketing Mix', description: 'Product, Price, Place, Promotion, People, Process, Physical Evidence' },
  { value: 'AIDA', label: 'AIDA Model', description: 'Attention, Interest, Desire, Action — buyer journey framework' },
  { value: 'PESTEL', label: 'PESTEL Analysis', description: 'Political, Economic, Social, Technological, Environmental, Legal factors' },
  { value: 'North Star', label: 'North Star Framework', description: 'Identify the one metric that best captures the core value delivered' },
  { value: 'Flywheel Model', label: 'Flywheel Model', description: 'Self-reinforcing growth loop — acquisition, activation, retention, revenue, referral' },
  { value: 'Blue Ocean', label: 'Blue Ocean Strategy', description: 'Eliminate, Reduce, Raise, Create — find uncontested market space' },
  { value: '7S Framework', label: 'McKinsey 7S', description: 'Strategy, Structure, Systems, Shared Values, Style, Staff, Skills' },
  { value: 'GE-McKinsey Matrix', label: 'GE-McKinsey Matrix', description: 'Industry Attractiveness vs Competitive Strength — Invest, Hold, or Harvest' },
  { value: 'Eisenhower Matrix', label: 'Eisenhower Matrix', description: 'Urgent/Important priority grid for strategic initiative triage' },
];

const PRIORITY_COLORS: Record<string, string> = {
  High: '#EF4444',
  Medium: '#F59E0B',
  Low: '#22C55E',
};

export default function MarketingStrategyPage() {
  const [step, setStep] = useState<'input' | 'analysing' | 'results'>('input');
  const [industryOrSegment, setIndustryOrSegment] = useState('');
  const [selectedFramework, setSelectedFramework] = useState<StrategyFramework | ''>('');
  const [productContext, setProductContext] = useState('');
  const [historyCount, setHistoryCount] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [expandedDim, setExpandedDim] = useState<string | null>(null);
  const [displayedJob, setDisplayedJob] = useState<MarketingStrategyJob | null>(null);

  const { job, error, isStuck, retryJob, startJob, cancelJob } = useJobManager<MarketingStrategyJob>({
    onProgress: () => setStep('analysing'),
    onComplete: (data) => {
      setStep('results');
      setDisplayedJob(data);
      saveToHistory({
        moduleType: 'marketing-strategy',
        targetCompany: industryOrSegment.trim(),
        completedAt: data.completedAt || new Date().toISOString(),
        strategyIndustry: data.industryOrSegment,
        strategyFramework: data.framework,
        strategySummary: data.frameworkSummary,
        strategyDimensions: data.dimensions,
        strategyRecommendations: data.strategicRecommendations,
      });
      setHistoryCount(loadHistory().length);
    },
  });

  useEffect(() => {
    setHistoryCount(loadHistory().length);
    const pendingId = popPendingRestore();
    if (pendingId) {
      const entry = loadEntryById(pendingId);
      if (entry && entry.moduleType === 'marketing-strategy') restoreEntry(entry);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const restoreEntry = useCallback((entry: HistoryEntry) => {
    if (!entry.strategyDimensions) return;
    setIndustryOrSegment(entry.strategyIndustry || entry.targetCompany);
    setSelectedFramework(entry.strategyFramework || '');
    setDisplayedJob({
      jobId: entry.id,
      status: 'complete',
      progress: 100,
      industryOrSegment: entry.strategyIndustry,
      framework: entry.strategyFramework,
      frameworkSummary: entry.strategySummary,
      dimensions: entry.strategyDimensions,
      strategicRecommendations: entry.strategyRecommendations,
      createdAt: entry.completedAt,
      completedAt: entry.completedAt,
    });
    setStep('results');
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!industryOrSegment.trim() || !selectedFramework) return;

    await startJob({
      endpoint: API_ENDPOINTS.marketingStrategy,
      payload: {
        industryOrSegment: industryOrSegment.trim(),
        framework: selectedFramework,
        productContext: productContext.trim() || undefined,
      },
      streamUrlFactory: (jobId) => API_ENDPOINTS.marketingStrategyStream(jobId),
      persist: { moduleType: 'marketing-strategy', targetCompany: industryOrSegment.trim() },
    });
  }

  function handleReset() {
    cancelJob();
    setStep('input');
    setExpandedDim(null);
  }

  // Group dimensions by dimension name
  const groupedDimensions: Record<string, StrategyDimensionRow[]> = {};
  if ((displayedJob || job)?.dimensions) {
    for (const row of (displayedJob || job)!.dimensions) {
      if (!groupedDimensions[row.dimension]) groupedDimensions[row.dimension] = [];
      groupedDimensions[row.dimension].push(row);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#080f16', display: 'flex', flexDirection: 'column' }}>
      {showHistory && (
        <HistoryDrawer
          currentModule="marketing-strategy"
          onSelectSameModule={restoreEntry}
          onClose={() => setShowHistory(false)}
        />
      )}

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0c3649 0%, #0a2233 100%)',
        borderBottom: '1px solid #1e4a68', padding: '16px 32px', flexShrink: 0,
      }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 16 }}>
          <a href="/" style={{ color: '#7eaabf', textDecoration: 'none', fontSize: 13 }}>← Home</a>
          <div style={{ width: 1, height: 16, background: '#1e4a68' }} />
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: ACCENT, letterSpacing: 2, marginBottom: 3 }}>REFRACTONE</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ModuleIcon id="marketing-strategy" size={20} />
              <span style={{ fontSize: 18, fontWeight: 800, color: '#E8EDF5' }}>Marketing Strategy Framework</span>
            </div>
          </div>
          <button
            onClick={() => setShowHistory(true)}
            style={{
              marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8,
              background: `rgba(139,92,246,0.1)`, border: '1px solid rgba(139,92,246,0.25)',
              color: ACCENT, borderRadius: 8, padding: '8px 16px',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            History {historyCount > 0 && `(${historyCount})`}
          </button>
        </div>
      </div>

      <div style={{ flex: 1, maxWidth: 1400, margin: '0 auto', width: '100%', padding: '32px' }}>
        {/* ── INPUT STEP ── */}
        {step === 'input' && (
          <div style={{ maxWidth: 700, margin: '48px auto 0' }}>
            {error && (
              <div style={{
                background: 'rgba(230,57,70,0.1)', border: '1px solid rgba(230,57,70,0.3)',
                borderRadius: 8, padding: '12px 16px', marginBottom: 24, fontSize: 13, color: '#ff6b75',
              }}>{error}</div>
            )}
            <div style={{
              background: 'linear-gradient(135deg, #0c3649, #0a2233)',
              border: '1px solid #1e4a68', borderRadius: 12, padding: '32px',
            }}>
              <h2 style={{ color: '#E8EDF5', fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
                Marketing Strategy Framework
              </h2>
              <p style={{ color: '#7eaabf', fontSize: 13, marginBottom: 24 }}>
                Select an industry and a strategic framework. Our AI will conduct McKinsey-grade analysis
                with specific data, company examples, and actionable recommendations.
              </p>
              <form onSubmit={handleSubmit}>
                <label style={{ display: 'block', marginBottom: 16 }}>
                  <span style={{ color: '#a0c4d8', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                    Industry / Segment *
                  </span>
                  <input
                    value={industryOrSegment}
                    onChange={(e) => setIndustryOrSegment(e.target.value)}
                    placeholder="e.g., Cloud Computing, Healthcare SaaS, Electric Vehicles..."
                    style={{
                      width: '100%', background: '#0a1929', border: '1px solid #1e4a68', borderRadius: 8,
                      color: '#E8EDF5', padding: '12px', fontSize: 14, outline: 'none',
                    }}
                  />
                </label>

                <div style={{ marginBottom: 16 }}>
                  <span style={{ color: '#a0c4d8', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 10 }}>
                    Strategy Framework *
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
                    {FRAMEWORKS.map((fw) => (
                      <button
                        key={fw.value}
                        type="button"
                        onClick={() => setSelectedFramework(fw.value)}
                        style={{
                          textAlign: 'left', padding: '12px 14px', borderRadius: 8, cursor: 'pointer',
                          border: selectedFramework === fw.value
                            ? `2px solid ${ACCENT}`
                            : '1px solid #1e4a68',
                          background: selectedFramework === fw.value
                            ? `rgba(139,92,246,0.12)`
                            : '#0a1929',
                          transition: 'all 0.15s',
                        }}
                      >
                        <div style={{
                          fontSize: 13, fontWeight: 700,
                          color: selectedFramework === fw.value ? ACCENT : '#E8EDF5',
                          marginBottom: 3,
                        }}>
                          {fw.label}
                        </div>
                        <div style={{ fontSize: 11, color: '#7eaabf', lineHeight: 1.4 }}>
                          {fw.description}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <label style={{ display: 'block', marginBottom: 24 }}>
                  <span style={{ color: '#a0c4d8', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                    Product / Service Context (optional)
                  </span>
                  <textarea
                    value={productContext}
                    onChange={(e) => setProductContext(e.target.value)}
                    rows={3}
                    placeholder="Describe your product/service to tailor the analysis to your specific context..."
                    style={{
                      width: '100%', background: '#0a1929', border: '1px solid #1e4a68', borderRadius: 8,
                      color: '#E8EDF5', padding: '12px', fontSize: 14, resize: 'vertical',
                      outline: 'none', fontFamily: 'inherit',
                    }}
                  />
                </label>

                <button
                  type="submit"
                  disabled={!industryOrSegment.trim() || !selectedFramework}
                  style={{
                    width: '100%', padding: '13px',
                    background: (industryOrSegment.trim() && selectedFramework)
                      ? `linear-gradient(135deg, ${ACCENT}, #6D28D9)`
                      : '#1e4a68',
                    border: 'none', borderRadius: 8,
                    color: '#fff', fontSize: 14, fontWeight: 700,
                    cursor: (industryOrSegment.trim() && selectedFramework) ? 'pointer' : 'not-allowed',
                    opacity: (industryOrSegment.trim() && selectedFramework) ? 1 : 0.5,
                  }}
                >
                  Run {selectedFramework || 'Framework'} Analysis →
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ── ANALYSING STEP ── */}
        {step === 'analysing' && (
          <div style={{ maxWidth: 580, margin: '48px auto 0' }}>
            <div style={{
              background: 'linear-gradient(135deg, #0c3649, #0a2233)',
              border: '1px solid #1e4a68', borderRadius: 12, padding: '36px 32px', textAlign: 'center',
            }}>
              <div style={{
                width: 48, height: 48,
                border: '3px solid rgba(30,74,104,0.4)', borderTopColor: ACCENT,
                borderRadius: '50%', animation: 'spin 0.8s linear infinite',
                margin: '0 auto 24px',
              }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#E8EDF5', marginBottom: 8 }}>
                Running {selectedFramework} Analysis
              </div>
              {job?.currentStep && (
                <div style={{ color: '#7eaabf', fontSize: 13, marginBottom: 16 }}>{job.currentStep}</div>
              )}
              {job?.progress != null && (
                <div style={{ background: '#0a1929', borderRadius: 6, height: 6, overflow: 'hidden' }}>
                  <div style={{
                    width: `${job.progress}%`, height: '100%',
                    background: `linear-gradient(90deg, ${ACCENT}, #A78BFA)`,
                    transition: 'width 0.5s ease',
                  }} />
                </div>
              )}
            </div>
            {isStuck && <StuckJobBanner onRetry={retryJob} />}
            <KillSwitchButton onCancel={() => { cancelJob(); setStep('input'); }} />
          </div>
        )}

        {/* ── RESULTS STEP ── */}
        {step === 'results' && job && (
          <div>
            {/* Results header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <h2 style={{ color: '#E8EDF5', fontSize: 22, fontWeight: 700, margin: 0 }}>
                  {job.framework} — {job.industryOrSegment}
                </h2>
              </div>
              <button onClick={handleReset} style={{
                padding: '10px 22px', borderRadius: 8, flexShrink: 0,
                border: `1px solid ${ACCENT}`, background: 'transparent',
                color: ACCENT, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}>
                New Analysis
              </button>
            </div>

            {/* Executive Summary */}
            {job.frameworkSummary && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(109,40,217,0.05))',
                border: '1px solid rgba(139,92,246,0.25)', borderRadius: 12,
                padding: '20px 24px', marginBottom: 28,
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: 1, marginBottom: 8 }}>
                  EXECUTIVE SUMMARY
                </div>
                <p style={{ color: '#E8EDF5', fontSize: 14, lineHeight: 1.7, margin: 0 }}>
                  {job.frameworkSummary}
                </p>
              </div>
            )}

            {/* Dimension cards */}
            {Object.entries(groupedDimensions).map(([dimName, rows]) => (
              <div key={dimName} style={{ marginBottom: 20 }}>
                <button
                  onClick={() => setExpandedDim(expandedDim === dimName ? null : dimName)}
                  style={{
                    width: '100%', textAlign: 'left', padding: '14px 20px',
                    background: 'linear-gradient(135deg, #0c3649, #0a2233)',
                    border: '1px solid #1e4a68', borderRadius: expandedDim === dimName ? '12px 12px 0 0' : 12,
                    cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: `${ACCENT}22`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, fontWeight: 700, color: ACCENT,
                    }}>
                      {rows.length}
                    </span>
                    <span style={{ color: '#E8EDF5', fontSize: 15, fontWeight: 700 }}>{dimName}</span>
                  </div>
                  <span style={{ color: '#7eaabf', fontSize: 18, transform: expandedDim === dimName ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                    ▾
                  </span>
                </button>

                {expandedDim === dimName && (
                  <div style={{
                    border: '1px solid #1e4a68', borderTop: 'none',
                    borderRadius: '0 0 12px 12px', overflow: 'hidden',
                  }}>
                    {/* Column widths: Element 14%, Analysis 42%, Strategic Implication 36%, Priority 8% */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, tableLayout: 'fixed' }}>
                      <colgroup>
                        {['14%', '42%', '36%', '8%'].map((w, ci) => <col key={ci} style={{ width: w }} />)}
                      </colgroup>
                      <thead>
                        <tr style={{ background: '#0a1929' }}>
                          {['Element', 'Analysis', 'Strategic Implication', 'Priority'].map((h) => (
                            <th key={h} style={{
                              padding: '10px 14px', color: '#a0c4d8',
                              fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
                              textAlign: 'left', overflowWrap: 'break-word', wordBreak: 'break-word',
                              whiteSpace: 'normal', verticalAlign: 'top',
                            }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row, i) => {
                          const cellBase: React.CSSProperties = {
                            padding: '14px', overflowWrap: 'break-word', wordBreak: 'break-word',
                            whiteSpace: 'normal', verticalAlign: 'top', lineHeight: 1.6,
                          };
                          return (
                            <tr key={i} style={{ borderBottom: '1px solid #142d3e' }}>
                              <td style={{ ...cellBase, color: '#E8EDF5', fontWeight: 600 }}>
                                {row.element}
                              </td>
                              <td style={{ ...cellBase, color: '#c8dce8', fontSize: 13 }}>
                                {row.analysis}
                              </td>
                              <td style={{ ...cellBase, color: '#a0c4d8', fontSize: 12 }}>
                                {row.strategicImplication}
                              </td>
                              <td style={{ ...cellBase }}>
                                <span style={{
                                  padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700,
                                  background: `${PRIORITY_COLORS[row.priority] || '#666'}22`,
                                  color: PRIORITY_COLORS[row.priority] || '#999',
                                }}>
                                  {row.priority}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}

            {/* Auto-expand all on first render */}
            {expandedDim === null && Object.keys(groupedDimensions).length > 0 && (
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <button
                  onClick={() => setExpandedDim(Object.keys(groupedDimensions)[0])}
                  style={{
                    padding: '8px 20px', borderRadius: 8,
                    border: '1px solid #1e4a68', background: 'transparent',
                    color: '#7eaabf', fontSize: 12, cursor: 'pointer',
                  }}
                >
                  Click any dimension above to expand details
                </button>
              </div>
            )}

            {/* Strategic Recommendations */}
            {job.strategicRecommendations && job.strategicRecommendations.length > 0 && (
              <div style={{
                background: 'linear-gradient(135deg, #0c3649, #0a2233)',
                border: '1px solid #1e4a68', borderRadius: 12, padding: '24px', marginTop: 28,
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: 1, marginBottom: 14 }}>
                  STRATEGIC RECOMMENDATIONS
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {job.strategicRecommendations.map((rec, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <span style={{
                        minWidth: 24, height: 24, borderRadius: 6,
                        background: `${ACCENT}22`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 700, color: ACCENT,
                      }}>
                        {i + 1}
                      </span>
                      <p style={{ color: '#E8EDF5', fontSize: 14, lineHeight: 1.6, margin: 0 }}>{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
