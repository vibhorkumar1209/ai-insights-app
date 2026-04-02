'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { TargetIndustryJob, TargetIndustryRow, TargetSubSegmentRow } from '@/lib/types';
import {
  loadHistory,
  saveToHistory,
  loadEntryById,
  popPendingRestore,
  HistoryEntry,
} from '@/lib/history';
import HistoryDrawer from '@/components/shared/HistoryDrawer';
import ModuleIcon from '@/components/shared/ModuleIcon';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const ACCENT = '#059669';

const CATEGORY_COLORS: Record<string, string> = {
  'High Volume': '#3491E8',
  'High Growth': '#22C55E',
  'High Growth–Low Volume': '#F59E0B',
  'High Volume–Low Growth': '#8B5CF6',
};

const ALIGNMENT_COLORS: Record<string, string> = {
  High: '#22C55E',
  Medium: '#F59E0B',
  Low: '#EF4444',
};

export default function TargetIndustryPage() {
  const [step, setStep] = useState<'input' | 'analysing' | 'results'>('input');
  const [productDescription, setProductDescription] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');
  const [fileName, setFileName] = useState('');
  const [job, setJob] = useState<TargetIndustryJob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [historyCount, setHistoryCount] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [activeTab, setActiveTab] = useState<'industries' | 'subsegments'>('industries');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const eventSourceRef = useRef<EventSource | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setHistoryCount(loadHistory().length);
    const pendingId = popPendingRestore();
    if (pendingId) {
      const entry = loadEntryById(pendingId);
      if (entry && entry.moduleType === 'target-industries') restoreEntry(entry);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => { eventSourceRef.current?.close(); };
  }, []);

  const restoreEntry = useCallback((entry: HistoryEntry) => {
    if (!entry.targetIndustries) return;
    setProductDescription(entry.productDescription || entry.targetCompany);
    setJob({
      jobId: entry.id,
      status: 'complete',
      progress: 100,
      industries: entry.targetIndustries,
      subSegments: entry.targetSubSegments,
      createdAt: entry.completedAt,
      completedAt: entry.completedAt,
    });
    setStep('results');
  }, []);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const text = await file.text();
    setAdditionalContext((prev) => (prev ? prev + '\n\n' : '') + text.slice(0, 10000));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!productDescription.trim()) return;
    setError(null);
    setStep('analysing');

    try {
      const res = await fetch(`${API_BASE}/api/target-industries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productDescription: productDescription.trim(),
          websiteUrl: websiteUrl.trim() || undefined,
          additionalContext: additionalContext.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error || `Server error ${res.status}`);
      }

      const { jobId } = (await res.json()) as { jobId: string };
      const es = new EventSource(`${API_BASE}/api/target-industries/${jobId}/stream`);
      eventSourceRef.current = es;

      es.addEventListener('progress', (e) => {
        const data = JSON.parse(e.data) as Partial<TargetIndustryJob>;
        setJob((prev) => ({ ...(prev ?? {} as TargetIndustryJob), ...data }));
      });

      es.addEventListener('result', (e) => {
        const data = JSON.parse(e.data) as TargetIndustryJob;
        setJob(data);
        setStep('results');
        es.close();
        saveToHistory({
          moduleType: 'target-industries',
          targetCompany: productDescription.trim(),
          completedAt: data.completedAt || new Date().toISOString(),
          productDescription: productDescription.trim(),
          targetIndustries: data.industries,
          targetSubSegments: data.subSegments,
        });
        setHistoryCount(loadHistory().length);
      });

      es.addEventListener('error', (e) => {
        let msg = 'Analysis failed';
        try {
          const data = JSON.parse((e as MessageEvent).data) as { error?: string };
          if (data.error) msg = data.error;
        } catch { /* ignore */ }
        setError(msg);
        setStep('input');
        es.close();
      });

      es.onerror = () => { setError('Connection lost'); setStep('input'); es.close(); };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setStep('input');
    }
  }

  function handleReset() {
    eventSourceRef.current?.close();
    setStep('input');
    setJob(null);
    setError(null);
    setActiveTab('industries');
    setFilterCategory('All');
  }

  const categories = ['All', 'High Volume', 'High Growth', 'High Growth–Low Volume', 'High Volume–Low Growth'];

  function filterRows<T extends { category: string }>(rows: T[]): T[] {
    if (filterCategory === 'All') return rows;
    return rows.filter((r) => r.category === filterCategory);
  }

  return (
    <div style={{ minHeight: '100vh', background: '#080f16', display: 'flex', flexDirection: 'column' }}>
      {showHistory && (
        <HistoryDrawer
          currentModule="target-industries"
          onSelectSameModule={restoreEntry}
          onClose={() => setShowHistory(false)}
        />
      )}

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0c3649 0%, #0a2233 100%)',
        borderBottom: '1px solid #1e4a68',
        padding: '16px 32px',
        flexShrink: 0,
      }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 16 }}>
          <a href="/" style={{ color: '#7eaabf', textDecoration: 'none', fontSize: 13 }}>← Home</a>
          <div style={{ width: 1, height: 16, background: '#1e4a68' }} />
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: ACCENT, letterSpacing: 2, marginBottom: 3 }}>REFRACTONE</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ModuleIcon id="target-industries" size={20} />
              <span style={{ fontSize: 18, fontWeight: 800, color: '#E8EDF5' }}>Target Industries</span>
            </div>
          </div>
          <button
            onClick={() => setShowHistory(true)}
            style={{
              marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(5,150,105,0.1)', border: '1px solid rgba(5,150,105,0.25)',
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
          <div style={{ maxWidth: 640, margin: '48px auto 0' }}>
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
                Discover Target Industries
              </h2>
              <p style={{ color: '#7eaabf', fontSize: 13, marginBottom: 24 }}>
                Describe your product, service, platform, or solution. We will identify high-potential
                industries and sub-segments classified by volume and growth.
              </p>
              <form onSubmit={handleSubmit}>
                <label style={{ display: 'block', marginBottom: 16 }}>
                  <span style={{ color: '#a0c4d8', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                    Product / Service / Solution Description *
                  </span>
                  <textarea
                    value={productDescription}
                    onChange={(e) => setProductDescription(e.target.value)}
                    rows={5}
                    placeholder="Describe what your product does, who it serves, key features, and the problems it solves..."
                    style={{
                      width: '100%', background: '#0a1929', border: '1px solid #1e4a68', borderRadius: 8,
                      color: '#E8EDF5', padding: '12px', fontSize: 14, resize: 'vertical',
                      outline: 'none', fontFamily: 'inherit',
                    }}
                  />
                </label>

                <label style={{ display: 'block', marginBottom: 16 }}>
                  <span style={{ color: '#a0c4d8', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                    Product Website (optional)
                  </span>
                  <input
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://your-product.com"
                    style={{
                      width: '100%', background: '#0a1929', border: '1px solid #1e4a68', borderRadius: 8,
                      color: '#E8EDF5', padding: '12px', fontSize: 14, outline: 'none',
                    }}
                  />
                </label>

                <div style={{ marginBottom: 16 }}>
                  <span style={{ color: '#a0c4d8', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                    Upload Literature (optional)
                  </span>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        background: 'rgba(5,150,105,0.1)', border: '1px solid rgba(5,150,105,0.25)',
                        color: ACCENT, borderRadius: 8, padding: '8px 16px',
                        fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      }}
                    >
                      Choose File
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".txt,.md,.csv,.docx,.doc"
                      onChange={handleFileUpload}
                      style={{ display: 'none' }}
                    />
                    {fileName && <span style={{ color: '#7eaabf', fontSize: 12 }}>{fileName}</span>}
                  </div>
                </div>

                <label style={{ display: 'block', marginBottom: 24 }}>
                  <span style={{ color: '#a0c4d8', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                    Additional Context (optional)
                  </span>
                  <textarea
                    value={additionalContext}
                    onChange={(e) => setAdditionalContext(e.target.value)}
                    rows={3}
                    placeholder="Paste product brochure text, competitive differentiators, or target customer details..."
                    style={{
                      width: '100%', background: '#0a1929', border: '1px solid #1e4a68', borderRadius: 8,
                      color: '#E8EDF5', padding: '12px', fontSize: 14, resize: 'vertical',
                      outline: 'none', fontFamily: 'inherit',
                    }}
                  />
                </label>

                <button
                  type="submit"
                  disabled={!productDescription.trim()}
                  style={{
                    width: '100%', padding: '13px',
                    background: productDescription.trim()
                      ? `linear-gradient(135deg, ${ACCENT}, #047857)`
                      : '#1e4a68',
                    border: 'none', borderRadius: 8,
                    color: '#fff', fontSize: 14, fontWeight: 700,
                    cursor: productDescription.trim() ? 'pointer' : 'not-allowed',
                    opacity: productDescription.trim() ? 1 : 0.5,
                  }}
                >
                  Discover Target Industries →
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
                Analyzing Target Industries
              </div>
              {job?.currentStep && (
                <div style={{ color: '#7eaabf', fontSize: 13, marginBottom: 16 }}>{job.currentStep}</div>
              )}
              {job?.progress != null && (
                <div style={{ background: '#0a1929', borderRadius: 6, height: 6, overflow: 'hidden' }}>
                  <div style={{
                    width: `${job.progress}%`, height: '100%',
                    background: `linear-gradient(90deg, ${ACCENT}, #22C55E)`,
                    transition: 'width 0.5s ease',
                  }} />
                </div>
              )}

              {/* Show partial industries if available during drilling phase */}
              {job?.industries && job.industries.length > 0 && job.status !== 'complete' && (
                <div style={{ marginTop: 24, textAlign: 'left' }}>
                  <div style={{ color: '#a0c4d8', fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
                    Industries discovered: {job.industries.length}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {job.industries.map((ind, i) => (
                      <span key={i} style={{
                        background: 'rgba(5,150,105,0.15)', border: '1px solid rgba(5,150,105,0.3)',
                        borderRadius: 6, padding: '4px 10px', fontSize: 12, color: '#E8EDF5',
                      }}>
                        {ind.industry}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── RESULTS STEP ── */}
        {step === 'results' && job && (
          <div>
            {/* Results header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div>
                <h2 style={{ color: '#E8EDF5', fontSize: 22, fontWeight: 700, margin: 0 }}>
                  Target Industry Analysis
                </h2>
                <p style={{ color: '#7eaabf', fontSize: 13, margin: '4px 0 0' }}>
                  {productDescription.slice(0, 80)}{productDescription.length > 80 ? '...' : ''}
                </p>
              </div>
              <button onClick={handleReset} style={{
                padding: '10px 22px', borderRadius: 8,
                border: `1px solid ${ACCENT}`, background: 'transparent',
                color: ACCENT, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}>
                New Analysis
              </button>
            </div>

            {/* Tab switcher */}
            <div style={{ display: 'flex', gap: 0, marginBottom: 20 }}>
              {(['industries', 'subsegments'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '10px 24px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    border: '1px solid #1e4a68', borderBottom: activeTab === tab ? 'none' : '1px solid #1e4a68',
                    background: activeTab === tab ? '#0c3649' : 'transparent',
                    color: activeTab === tab ? '#E8EDF5' : '#7eaabf',
                    borderRadius: tab === 'industries' ? '8px 0 0 0' : '0 8px 0 0',
                  }}
                >
                  {tab === 'industries' ? `Industries (${job.industries?.length || 0})` : `Sub-Segments (${job.subSegments?.length || 0})`}
                </button>
              ))}
            </div>

            {/* Category filter pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  style={{
                    padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', border: '1px solid',
                    borderColor: filterCategory === cat ? (CATEGORY_COLORS[cat] || ACCENT) : '#1e4a68',
                    background: filterCategory === cat ? `${CATEGORY_COLORS[cat] || ACCENT}22` : 'transparent',
                    color: filterCategory === cat ? (CATEGORY_COLORS[cat] || ACCENT) : '#7eaabf',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Industries Table */}
            {activeTab === 'industries' && job.industries && (
              <IndustryTable rows={filterRows(job.industries)} type="industry" />
            )}

            {/* Sub-Segments Table */}
            {activeTab === 'subsegments' && job.subSegments && (
              <SubSegmentTable rows={filterRows(job.subSegments)} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Industry Table Component ─────────────────────────────────────────────────

function IndustryTable({ rows }: { rows: TargetIndustryRow[]; type: string }) {
  if (!rows.length) return <div style={{ color: '#7eaabf', textAlign: 'center', padding: 32 }}>No industries match the selected filter.</div>;

  // Column widths: Industry 14%, Category 13%, Market Size 10%, Growth 9%, Alignment 8%, Rationale 46%
  const colWidths = ['14%', '13%', '10%', '9%', '8%', '46%'];
  const headers = ['Industry', 'Category', 'Est. Market Size', 'Est. Growth', 'Alignment', 'Rationale'];

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, tableLayout: 'fixed' }}>
        <colgroup>
          {colWidths.map((w, i) => <col key={i} style={{ width: w }} />)}
        </colgroup>
        <thead>
          <tr style={{ borderBottom: '2px solid #1e4a68' }}>
            {headers.map((h) => (
              <th key={h} style={{
                textAlign: 'left', padding: '12px 14px', color: '#a0c4d8',
                fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #142d3e' }}>
              <td style={{ padding: '14px', color: '#E8EDF5', fontWeight: 600, wordWrap: 'break-word' }}>{row.industry}</td>
              <td style={{ padding: '14px' }}>
                <span style={{
                  padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                  background: `${CATEGORY_COLORS[row.category] || '#666'}22`,
                  color: CATEGORY_COLORS[row.category] || '#999',
                  border: `1px solid ${CATEGORY_COLORS[row.category] || '#666'}44`,
                  whiteSpace: 'nowrap',
                }}>
                  {row.category}
                </span>
              </td>
              <td style={{ padding: '14px', color: '#E8EDF5', fontWeight: 600, whiteSpace: 'nowrap' }}>{row.estimatedMarketSize}</td>
              <td style={{ padding: '14px', color: '#22C55E', fontWeight: 600, whiteSpace: 'nowrap' }}>{row.estimatedGrowthCAGR}</td>
              <td style={{ padding: '14px' }}>
                <span style={{
                  padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700,
                  background: `${ALIGNMENT_COLORS[row.alignmentScore]}22`,
                  color: ALIGNMENT_COLORS[row.alignmentScore],
                }}>
                  {row.alignmentScore}
                </span>
              </td>
              <td style={{ padding: '14px', color: '#7eaabf', fontSize: 12, lineHeight: 1.5, wordWrap: 'break-word' }}>{row.alignmentRationale}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SubSegmentTable({ rows }: { rows: TargetSubSegmentRow[] }) {
  if (!rows.length) return <div style={{ color: '#7eaabf', textAlign: 'center', padding: 32 }}>No sub-segments match the selected filter.</div>;

  // Column widths: Parent 11%, Sub-Segment 12%, Category 12%, Market Size 9%, Growth 8%, Alignment 7%, Rationale 41%
  const colWidths = ['11%', '12%', '12%', '9%', '8%', '7%', '41%'];
  const headers = ['Parent Industry', 'Sub-Segment', 'Category', 'Est. Market Size', 'Est. Growth', 'Alignment', 'Rationale'];

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, tableLayout: 'fixed' }}>
        <colgroup>
          {colWidths.map((w, i) => <col key={i} style={{ width: w }} />)}
        </colgroup>
        <thead>
          <tr style={{ borderBottom: '2px solid #1e4a68' }}>
            {headers.map((h) => (
              <th key={h} style={{
                textAlign: 'left', padding: '12px 14px', color: '#a0c4d8',
                fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #142d3e' }}>
              <td style={{ padding: '14px', color: '#a0c4d8', fontSize: 12, wordWrap: 'break-word' }}>{row.parentIndustry}</td>
              <td style={{ padding: '14px', color: '#E8EDF5', fontWeight: 600, wordWrap: 'break-word' }}>{row.subSegment}</td>
              <td style={{ padding: '14px' }}>
                <span style={{
                  padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                  background: `${CATEGORY_COLORS[row.category] || '#666'}22`,
                  color: CATEGORY_COLORS[row.category] || '#999',
                  border: `1px solid ${CATEGORY_COLORS[row.category] || '#666'}44`,
                  whiteSpace: 'nowrap',
                }}>
                  {row.category}
                </span>
              </td>
              <td style={{ padding: '14px', color: '#E8EDF5', fontWeight: 600, whiteSpace: 'nowrap' }}>{row.estimatedMarketSize}</td>
              <td style={{ padding: '14px', color: '#22C55E', fontWeight: 600, whiteSpace: 'nowrap' }}>{row.estimatedGrowthCAGR}</td>
              <td style={{ padding: '14px' }}>
                <span style={{
                  padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700,
                  background: `${ALIGNMENT_COLORS[row.alignmentScore]}22`,
                  color: ALIGNMENT_COLORS[row.alignmentScore],
                }}>
                  {row.alignmentScore}
                </span>
              </td>
              <td style={{ padding: '14px', color: '#7eaabf', fontSize: 12, lineHeight: 1.5, wordWrap: 'break-word' }}>{row.alignmentRationale}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
