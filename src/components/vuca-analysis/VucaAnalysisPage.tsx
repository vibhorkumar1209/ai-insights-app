'use client';

import { useState, useEffect, useCallback, Component } from 'react';
import type { ReactNode } from 'react';
import { VucaAnalysisJob, VucaDriverEffectRow, VucaRow, GeoStressRow, ClientITImpactRow } from '@/lib/types';
import { loadHistory, saveToHistory, loadEntryById, popPendingRestore, HistoryEntry } from '@/lib/history';
import { API_ENDPOINTS } from '@/lib/config';
import { useJobManager } from '@/lib/useJobManager';
import HistoryDrawer from '@/components/shared/HistoryDrawer';
import ModuleIcon from '@/components/shared/ModuleIcon';
import KillSwitchButton from '@/components/shared/KillSwitchButton';

const ACCENT = '#E63946';
const BG = '#FFFFFF';
const NAVY = '#0c3649';
const BLUE = '#3491E8';

const GEOGRAPHY_OPTIONS = [
  'Global', 'North America', 'Europe', 'Asia Pacific', 'India', 'China',
  'ASEAN', 'Middle East', 'Latin America', 'Africa', 'US + UK + Germany',
  'Specific Country / Region…',
];

const VUCA_COLORS: Record<string, string> = {
  VOLATILE: '#EF4444', UNCERTAIN: '#F59E0B', COMPLEX: '#3B82F6', AMBIGUOUS: '#E63946',
};
const STATUS_COLORS: Record<string, string> = {
  Active: '#EF4444', Escalating: '#F59E0B', Monitoring: '#3B82F6', Resolved: '#22C55E',
};
const SEVERITY_COLORS: Record<string, string> = { High: '#EF4444', Medium: '#F59E0B', Low: '#22C55E' };
const DIRECTION_COLORS: Record<string, string> = {
  '▲ EXPAND': '#22C55E', '▼ COMPRESS': '#EF4444', '► REALLOCATE': '#F59E0B',
};
const IMPACT_COLORS: Record<string, string> = { H: '#EF4444', M: '#F59E0B', L: '#22C55E' };

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 4,
      fontSize: 11, fontWeight: 700, background: color + '22', color,
      border: `1px solid ${color}44`, whiteSpace: 'nowrap',
    }}>{label}</span>
  );
}

/** Normalise any value the model might return to a string[] of bullet lines */
function toLines(value: unknown): string[] {
  if (!value) return [];
  // Model returned an array directly
  if (Array.isArray(value)) return value.map(v => String(v).replace(/^[•\-]\s*/, '').trim()).filter(Boolean);
  const s = String(value);
  return s.split('\n').map(l => l.replace(/^[•\-]\s*/, '').trim()).filter(Boolean);
}
/** Safely coerce any value to a displayable string */
function safeStr(value: unknown): string {
  if (value == null) return '';
  if (Array.isArray(value)) return value.map(v => String(v)).join(', ');
  if (typeof value === 'object') {
    // Handle 3-phase timeline object from Claude: {acute, structural, recovery}
    const obj = value as Record<string, unknown>;
    const phases: string[] = [];
    if (obj.acute)      phases.push(`▸ Acute: ${obj.acute}`);
    if (obj.structural) phases.push(`▸ Structural Reset: ${obj.structural}`);
    if (obj.structuralReset) phases.push(`▸ Structural Reset: ${obj.structuralReset}`);
    if (obj.recovery)   phases.push(`▸ Recovery: ${obj.recovery}`);
    if (phases.length > 0) return phases.join('\n');
    // Generic object fallback — join key: value pairs
    return Object.entries(obj).map(([k, v]) => `${k}: ${v}`).join(' | ');
  }
  return String(value);
}

/** Renders "• line1\n• line2" (or string[]) as a <ul> of styled bullet items */
function BulletText({ text, color = '#6B7280' }: { text: unknown; color?: string }) {
  const lines = toLines(text);
  if (lines.length === 0) return null;
  if (lines.length === 1) return <span style={{ color, fontSize: 12 }}>{lines[0]}</span>;
  return (
    <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
      {lines.map((line, i) => (
        <li key={i} style={{ color, fontSize: 12, lineHeight: 1.55, marginBottom: 3, display: 'flex', gap: 6 }}>
          <span style={{ color: '#3491E8', flexShrink: 0 }}>•</span>
          <span>{line}</span>
        </li>
      ))}
    </ul>
  );
}

/** Renders IT Budget Signal with ▲▼► colour coding */
function BudgetSignal({ text }: { text: unknown }) {
  const lines = toLines(text);
  if (lines.length === 0) return null;
  const colorize = (line: string) => {
    if (line.includes('▲')) return '#22C55E';
    if (line.includes('▼')) return '#EF4444';
    if (line.includes('►')) return '#F59E0B';
    return '#6B7280';
  };
  if (lines.length === 1) return <span style={{ color: colorize(lines[0]), fontSize: 12, fontWeight: 600 }}>{lines[0]}</span>;
  return (
    <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
      {lines.map((line, i) => (
        <li key={i} style={{ fontSize: 12, lineHeight: 1.55, marginBottom: 4, color: colorize(line), fontWeight: 600, display: 'flex', gap: 6 }}>
          <span style={{ color: '#4a7a94', flexShrink: 0 }}>•</span>
          <span>{line}</span>
        </li>
      ))}
    </ul>
  );
}

// ── Error Boundary ────────────────────────────────────────────────────────────

interface EBState { error: Error | null }
class VucaErrorBoundary extends Component<{ children: ReactNode }, EBState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error): EBState { return { error }; }
  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('[VucaAnalysis] Render crash:', error.message);
    console.error('[VucaAnalysis] Stack:', error.stack);
    console.error('[VucaAnalysis] Component stack:', info.componentStack);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ background: 'rgba(230,57,70,0.08)', border: '1px solid rgba(230,57,70,0.3)', borderRadius: 10, padding: '24px 28px', margin: '32px 0', color: '#ff6b75' }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>⚠ Render error — check browser console (F12) for details</div>
          <pre style={{ fontSize: 11, color: '#6B7280', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{this.state.error.message}</pre>
          <button onClick={() => this.setState({ error: null })} style={{ marginTop: 12, background: 'rgba(230,57,70,0.15)', border: '1px solid rgba(230,57,70,0.4)', color: '#ff6b75', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontSize: 12 }}>
            Dismiss & retry render
          </button>
        </div>
      );
    }
    return this.props.children;
  }
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
  <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '2px solid #1e4a5e', whiteSpace: 'nowrap', background: '#071420' }}>
    {children}
  </th>
);
const TD = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <td style={{ padding: '12px 14px', color: '#6B7280', fontSize: 12, lineHeight: 1.55, verticalAlign: 'top', borderBottom: '1px solid #0f2d40', ...style }}>
    {children}
  </td>
);

export default function VucaAnalysisPage() {
  const [step, setStep] = useState<'input' | 'analysing' | 'results'>('input');
  const [industry, setIndustry] = useState('');
  const [geography, setGeography] = useState('Global');
  const [customGeo, setCustomGeo] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyDomain, setCompanyDomain] = useState('');
  const [historyCount, setHistoryCount] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [displayedJob, setDisplayedJob] = useState<VucaAnalysisJob | null>(null);

  const { job, error, isStuck, startJob, cancelJob } = useJobManager<VucaAnalysisJob>({
    stuckThresholdMs: 300000,
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
    // Diagnostic — log data shapes to console for debugging
    try {
      const r = entry.vucaResult;
      console.log('[VucaRestore] vuca4w1hMatrix rows:', r.vuca4w1hMatrix?.length, 'first row:', JSON.stringify(r.vuca4w1hMatrix?.[0]));
      console.log('[VucaRestore] clientITImpact rows:', r.clientITImpact?.length, 'first row:', JSON.stringify(r.clientITImpact?.[0]));
      console.log('[VucaRestore] geopoliticalStress rows:', r.geopoliticalStress?.length, 'first row:', JSON.stringify(r.geopoliticalStress?.[0]));
      console.log('[VucaRestore] vucaDriverEffects rows:', r.vucaDriverEffects?.length, 'first row:', JSON.stringify(r.vucaDriverEffects?.[0]));
    } catch (e) { console.warn('[VucaRestore] diagnostic log failed', e); }
    setIndustry(entry.vucaIndustry || entry.targetCompany);
    setDisplayedJob(entry.vucaResult);
    setStep('results');
  }, []);

  const finalGeo = geography === 'Specific Country / Region…' ? customGeo.trim() : geography;
  const clientMode = !!(companyName.trim() && companyDomain.trim());

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!industry.trim() || !finalGeo) return;
    setStep('analysing');
    await startJob({
      payload: {
        industry: industry.trim(),
        geography: finalGeo,
        companyName: companyName.trim() || undefined,
        companyDomain: companyDomain.trim() || undefined,
      },
      endpoint: API_ENDPOINTS.vucaAnalysis,
      streamUrlFactory: API_ENDPOINTS.vucaAnalysisStream,
      persist: { moduleType: 'vuca-analysis', targetCompany: industry.trim() },
    });
  }

  const currentJob = displayedJob || job;

  // ── INPUT ─────────────────────────────────────────────────────────────────────
  if (step === 'input') {
    return (
      <div style={{ minHeight: '100vh', background: BG, color: '#1B2A3D' }}>
        {showHistory && (
          <HistoryDrawer currentModule="vuca-analysis" onSelectSameModule={restoreEntry} onClose={() => setShowHistory(false)} />
        )}
        <div style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #0a2233 100%)`, borderBottom: '1px solid #1e4a5e', padding: '16px 32px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 16 }}>
            <a href="/" style={{ color: 'rgba(255,255,255,0.65)', textDecoration: 'none', fontSize: 13 }}>← Home</a>
            <div style={{ width: 1, height: 16, background: '#1e4a5e' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <ModuleIcon id="vuca-analysis" size={22} />
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: ACCENT, letterSpacing: 2 }}>REFRACTONE</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF' }}>VUCA × 4W1H Analysis</div>
              </div>
            </div>
            <button onClick={() => setShowHistory(true)} style={{ marginLeft: 'auto', background: `${ACCENT}18`, border: `1px solid ${ACCENT}44`, color: ACCENT, borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              History {historyCount > 0 && `(${historyCount})`}
            </button>
          </div>
        </div>

        <div style={{ maxWidth: 700, margin: '48px auto 0', padding: '0 24px' }}>
          {error && (
            <div style={{ background: 'rgba(230,57,70,0.1)', border: '1px solid rgba(230,57,70,0.3)', borderRadius: 8, padding: '12px 16px', marginBottom: 24, fontSize: 13, color: '#ff6b75' }}>{error}</div>
          )}
          <div style={{ background: `linear-gradient(135deg, ${NAVY}, #0a2233)`, border: '1px solid #1e4a5e', borderRadius: 14, padding: '36px 32px' }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1B2A3D', margin: '0 0 6px' }}>VUCA × 4W1H + IT Spend Impact</h2>
            <p style={{ color: '#6B8FA8', fontSize: 13, margin: '0 0 28px', lineHeight: 1.6 }}>
              Produces 3 intelligence tables: VUCA matrix, IT Spend Impact, and Geopolitical Stress Overlay.
              Add your company to get a client-specific IT opportunity analysis tailored to what you sell.
            </p>

            <form onSubmit={handleSubmit}>
              {/* Industry */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#6B7280', letterSpacing: 0.5, marginBottom: 8 }}>
                  INDUSTRY <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  value={industry} onChange={(e) => setIndustry(e.target.value)}
                  placeholder="e.g. Pharmaceutical, Automotive, Banking & Financial Services, Energy"
                  required
                  style={{ width: '100%', background: '#F3F8FA', border: '1px solid #1e4a5e', borderRadius: 8, color: '#1B2A3D', padding: '12px 14px', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              {/* Geography */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#6B7280', letterSpacing: 0.5, marginBottom: 8 }}>GEOGRAPHIC SCOPE</label>
                <select
                  value={geography} onChange={(e) => setGeography(e.target.value)}
                  style={{ background: '#F3F8FA', border: '1px solid #1e4a5e', borderRadius: 8, color: '#1B2A3D', padding: '10px 14px', fontSize: 14, outline: 'none', minWidth: 260, appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%237eaabf' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: 32 }}
                >
                  {GEOGRAPHY_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
                {geography === 'Specific Country / Region…' && (
                  <input
                    value={customGeo} onChange={(e) => setCustomGeo(e.target.value)}
                    placeholder="e.g. India, Southeast Asia, GCC, Brazil…" required
                    style={{ marginTop: 10, width: '100%', background: '#F3F8FA', border: '1px solid #1e4a5e', borderRadius: 8, color: '#1B2A3D', padding: '10px 14px', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                  />
                )}
              </div>

              {/* Divider */}
              <div style={{ borderTop: '1px solid #1e4a5e', margin: '22px 0 20px', position: 'relative' }}>
                <span style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: '#0c3649', padding: '0 12px', fontSize: 11, color: '#4a7a94', fontWeight: 600, letterSpacing: 1 }}>
                  OPTIONAL — CLIENT CONTEXT
                </span>
              </div>

              <div style={{ background: `${BLUE}08`, border: `1px solid ${BLUE}25`, borderRadius: 8, padding: '12px 14px', marginBottom: 18, fontSize: 12, color: '#4A6274', lineHeight: 1.5 }}>
                🎯 Add your company name and website to get Table 2 tailored to <strong>your specific IT products/solutions</strong> — showing which VUCA events create opportunities for what you sell.
              </div>

              {/* Company Name */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#6B7280', letterSpacing: 0.5, marginBottom: 8 }}>
                  YOUR COMPANY NAME <span style={{ color: '#4a7a94', fontWeight: 400 }}>(optional)</span>
                </label>
                <input
                  value={companyName} onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. SAP, Cisco, Palo Alto Networks, Infosys…"
                  style={{ width: '100%', background: '#F3F8FA', border: `1px solid ${companyName.trim() ? BLUE + '66' : '#1e4a5e'}`, borderRadius: 8, color: '#1B2A3D', padding: '11px 14px', fontSize: 14, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                />
              </div>

              {/* Company Domain */}
              <div style={{ marginBottom: 28 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#6B7280', letterSpacing: 0.5, marginBottom: 8 }}>
                  COMPANY WEBSITE / DOMAIN <span style={{ color: '#4a7a94', fontWeight: 400 }}>(optional)</span>
                </label>
                <input
                  value={companyDomain} onChange={(e) => setCompanyDomain(e.target.value)}
                  placeholder="e.g. sap.com, cisco.com, infosys.com…"
                  style={{ width: '100%', background: '#F3F8FA', border: `1px solid ${companyDomain.trim() ? BLUE + '66' : '#1e4a5e'}`, borderRadius: 8, color: '#1B2A3D', padding: '11px 14px', fontSize: 14, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                />
                {companyName.trim() && !companyDomain.trim() && (
                  <div style={{ marginTop: 6, fontSize: 11, color: '#F59E0B' }}>⚠ Add domain to enable client-specific analysis</div>
                )}
              </div>

              {clientMode && (
                <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 12, color: '#22C55E' }}>
                  ✓ Client mode active — Table 2 will be tailored to {companyName}&apos;s product portfolio
                </div>
              )}

              <div style={{ background: `${ACCENT}10`, border: `1px solid ${ACCENT}30`, borderRadius: 8, padding: '10px 14px', marginBottom: 24, fontSize: 12, color: '#a0b4c8', lineHeight: 1.5 }}>
                ⚡ Generates 3 intelligence tables. {clientMode ? 'Client-specific mode: ~4–5 min.' : '~2–3 min.'}
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
          <div style={{ fontSize: 16, fontWeight: 700, color: '#1B2A3D', marginBottom: 4 }}>
            Analysing {industry}
            {job?.companyName && <span style={{ color: BLUE, fontSize: 13, fontWeight: 400, marginLeft: 8 }}>· {job.companyName}</span>}
          </div>
          <div style={{ color: '#6B8FA8', fontSize: 13, marginBottom: 20, minHeight: 20 }}>
            {job?.currentStep || 'Searching for intelligence…'}
          </div>
          {job?.progress != null && (
            <div style={{ background: '#F3F8FA', borderRadius: 6, height: 6, overflow: 'hidden', marginBottom: 16 }}>
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
          <div style={{ marginTop: 16, maxWidth: 440, background: 'rgba(52,145,232,0.08)', border: '1px solid rgba(52,145,232,0.25)', borderRadius: 8, padding: '12px 16px', fontSize: 12, color: '#4A6274', textAlign: 'center' }}>
            Still working — web research + synthesis takes 3–5 min. Please wait.
          </div>
        )}
        <KillSwitchButton onCancel={() => { cancelJob(); setStep('input'); }} />
      </div>
    );
  }

  // ── RESULTS ───────────────────────────────────────────────────────────────────
  if (!currentJob) return null;

  const analysisDate = currentJob.analysisDate || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const isClientMode = currentJob.clientMode;

  return (
    <div style={{ minHeight: '100vh', background: BG, color: '#1B2A3D' }}>
      {showHistory && (
        <HistoryDrawer currentModule="vuca-analysis" onSelectSameModule={restoreEntry} onClose={() => setShowHistory(false)} />
      )}

      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #0a2233 100%)`, borderBottom: '1px solid #1e4a5e', padding: '16px 32px', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 16 }}>
          <a href="/" style={{ color: 'rgba(255,255,255,0.65)', textDecoration: 'none', fontSize: 13 }}>← Home</a>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1B2A3D' }}>
              VUCA × 4W1H — {currentJob.industry}
              {currentJob.companyName && <span style={{ color: BLUE, fontWeight: 400, fontSize: 13, marginLeft: 8 }}>· {currentJob.companyName}</span>}
            </div>
            <div style={{ fontSize: 12, color: '#6B8FA8' }}>{currentJob.geography} · {analysisDate}{isClientMode ? ' · Client-Specific Mode' : ''}</div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setShowHistory(true)} style={{ background: `${ACCENT}18`, border: `1px solid ${ACCENT}44`, color: ACCENT, borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>History</button>
            <button onClick={() => { cancelJob(); setStep('input'); setDisplayedJob(null); }} style={{ background: 'transparent', border: '1px solid #1e4a5e', color: '#4A6274', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>New Analysis</button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 24px' }}>
      <VucaErrorBoundary>

        {/* ── VUCA: DRIVER, EFFECTS & DEMAND ──────────────────────────────── */}
        {currentJob.vucaDriverEffects && currentJob.vucaDriverEffects.length > 0 && (
          <TableCard title={`VUCA: DRIVER, EFFECTS & DEMAND — ${currentJob.industry} | ${currentJob.geography}`} accent="#E63946">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr><TH>VUCA Dimension</TH><TH>Primary Driver</TH><TH>Key Effects on Industry</TH><TH>IT / Technology Demand Created</TH></tr>
              </thead>
              <tbody>
                {currentJob.vucaDriverEffects.map((row: VucaDriverEffectRow, i: number) => (
                  <tr key={i}>
                    <TD style={{ whiteSpace: 'nowrap', verticalAlign: 'top' }}>
                      <Badge label={safeStr(row.vucaDimension)} color={VUCA_COLORS[safeStr(row.vucaDimension)] || '#888'} />
                    </TD>
                    <TD style={{ fontWeight: 600, color: '#1B2A3D', minWidth: 200, verticalAlign: 'top' }}>{safeStr(row.driver)}</TD>
                    <TD style={{ minWidth: 260, verticalAlign: 'top' }}><BulletText text={row.effects} /></TD>
                    <TD style={{ minWidth: 260, verticalAlign: 'top', background: 'rgba(230,57,70,0.04)', borderLeft: '2px solid rgba(230,57,70,0.3)' }}>
                      <BulletText text={row.demand} color="#c4b5fd" />
                    </TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableCard>
        )}

        {/* ── TABLE 1: VUCA × 4W1H ────────────────────────────────────────── */}
        {currentJob.vuca4w1hMatrix && currentJob.vuca4w1hMatrix.length > 0 && (
          <TableCard title={`TABLE 1: VUCA × 4W1H MATRIX — ${currentJob.industry} | ${currentJob.geography} | ${analysisDate}`} accent={ACCENT}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr><TH>VUCA</TH><TH>Lens</TH><TH>WHAT — Situation</TH><TH>WHY — Root Cause</TH><TH>WHERE</TH><TH>WHEN — Timeline</TH><TH>HOW — Recommendation</TH></tr>
              </thead>
              <tbody>
                {currentJob.vuca4w1hMatrix.map((row: VucaRow, i: number) => (
                  <tr key={i}>
                    <TD style={{ whiteSpace: 'nowrap' }}><Badge label={safeStr(row.vucaDimension)} color={VUCA_COLORS[safeStr(row.vucaDimension)] || '#888'} /></TD>
                    <TD style={{ fontWeight: 600, color: '#1B2A3D', minWidth: 120 }}>{safeStr(row.lens)}</TD>
                    <TD style={{ minWidth: 220 }}>{safeStr(row.what)}</TD>
                    <TD style={{ minWidth: 200 }}>{safeStr(row.why)}</TD>
                    <TD style={{ minWidth: 150 }}>{safeStr(row.where)}</TD>
                    <TD style={{ minWidth: 180, verticalAlign: 'top' }}>
                      {safeStr(row.when).split(/\||\n/).map((line, li, arr) => {
                        const t = line.trim(); if (!t) return null;
                        return <div key={li} style={{ marginBottom: li < arr.length - 1 ? 6 : 0, fontSize: 11 }}>{t}</div>;
                      })}
                    </TD>
                    <TD style={{ minWidth: 220, background: 'rgba(230,57,70,0.04)', borderLeft: `2px solid ${ACCENT}44`, verticalAlign: 'top' }}>
                      <div style={{ fontWeight: 700, color: ACCENT, fontSize: 10, marginBottom: 4 }}>** HOW — ADAPT **</div>
                      <BulletText text={row.how} color="#CBD5E1" />
                    </TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableCard>
        )}

        {/* ── TABLE 2: IT Spend Impact (unified schema — client-specific or general) ── */}
        {currentJob.clientITImpact && currentJob.clientITImpact.length > 0 && (
          <TableCard
            title={isClientMode
              ? `TABLE 2: CLIENT IT OPPORTUNITY ANALYSIS — ${currentJob.companyName?.toUpperCase()} | ${currentJob.industry}`
              : `TABLE 2: IT SPEND IMPACT BY VUCA DRIVER — ${currentJob.industry} | ${currentJob.geography}`}
            accent={BLUE}
          >
            {isClientMode && (
              <div style={{ padding: '10px 20px 0', display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: '#4a7a94' }}>Client-specific analysis based on</span>
                <a href={`https://${currentJob.companyDomain}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: BLUE, textDecoration: 'none', fontWeight: 600 }}>{currentJob.companyDomain} ↗</a>
                <span style={{ fontSize: 11, color: '#4a7a94' }}>portfolio research</span>
              </div>
            )}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginTop: isClientMode ? 12 : 0 }}>
              <thead>
                <tr>
                  <TH>Stress Event</TH>
                  <TH>VUCA Driver</TH>
                  <TH>Est. Impact on Tech Spending</TH>
                  <TH>Impact</TH>
                  <TH>Impacted Tech Spend Category</TH>
                  <TH>Role in Organisation</TH>
                  <TH>{isClientMode ? `Recommendation for ${currentJob.companyName}` : 'Strategic Recommendation'}</TH>
                </tr>
              </thead>
              <tbody>
                {currentJob.clientITImpact.map((row: ClientITImpactRow, i: number) => (
                  <tr key={i}>
                    <TD style={{ fontWeight: 600, color: '#1B2A3D', minWidth: 180 }}>{safeStr(row.stressEvent)}</TD>
                    <TD style={{ whiteSpace: 'nowrap' }}><Badge label={safeStr(row.vucaDriver)} color={VUCA_COLORS[safeStr(row.vucaDriver)] || '#888'} /></TD>
                    <TD style={{ fontFamily: 'monospace', color: '#6B7280', minWidth: 160 }}>{safeStr(row.estImpactOnTechSpending)}</TD>
                    <TD style={{ whiteSpace: 'nowrap', textAlign: 'center' }}>
                      <Badge label={safeStr(row.impact)} color={IMPACT_COLORS[safeStr(row.impact)] || '#888'} />
                    </TD>
                    <TD style={{ minWidth: 220, verticalAlign: 'top' }}>
                      <BulletText text={row.impactedTechSpendCategory} color="#1B2A3D" />
                    </TD>
                    <TD style={{ minWidth: 160, verticalAlign: 'top' }}>
                      <span style={{ fontWeight: 700, color: '#6B7280', fontSize: 12 }}>{safeStr(row.roleInOrganization)}</span>
                    </TD>
                    <TD style={{ minWidth: 260, background: `${BLUE}06`, borderLeft: `2px solid ${BLUE}44`, verticalAlign: 'top' }}>
                      <div style={{ fontWeight: 700, color: BLUE, fontSize: 10, marginBottom: 4 }}>
                        {isClientMode ? 'RECOMMENDATION' : 'STRATEGIC RECOMMENDATION'}
                      </div>
                      <BulletText text={row.recommendation} color="#CBD5E1" />
                    </TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableCard>
        )}

        {/* ── TABLE 3: Geopolitical Stress Overlay ─────────────────────────── */}
        {currentJob.geopoliticalStress && currentJob.geopoliticalStress.length > 0 && (
          <TableCard title="TABLE 3: GEOPOLITICAL STRESS OVERLAY" accent="#F59E0B">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr><TH>Stress Event</TH><TH>Status</TH><TH>Industry Transmission Mechanism</TH><TH>Severity</TH><TH>IT Budget Signal</TH></tr>
              </thead>
              <tbody>
                {currentJob.geopoliticalStress.map((row: GeoStressRow, i: number) => (
                  <tr key={i}>
                    <TD style={{ fontWeight: 600, color: '#1B2A3D', minWidth: 200 }}>{safeStr(row.stressEvent)}</TD>
                    <TD><Badge label={safeStr(row.status)} color={STATUS_COLORS[safeStr(row.status)] || '#888'} /></TD>
                    <TD style={{ minWidth: 260 }}>{safeStr(row.transmissionMechanism)}</TD>
                    <TD>
                      <Badge label={safeStr(row.severity)} color={SEVERITY_COLORS[safeStr(row.severity)] || '#888'} />
                      {row.severityRationale && <div style={{ marginTop: 4, fontSize: 11, color: '#4A6274' }}>{safeStr(row.severityRationale)}</div>}
                    </TD>
                    <TD style={{ minWidth: 220, verticalAlign: 'top' }}><BudgetSignal text={row.itBudgetSignal} /></TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableCard>
        )}

        {/* Empty state */}
        {(!currentJob.vucaDriverEffects?.length) && (!currentJob.vuca4w1hMatrix?.length) && (!currentJob.clientITImpact?.length) && (!currentJob.geopoliticalStress?.length) && (
          <div style={{ textAlign: 'center', padding: '60px 24px', color: '#6B8FA8' }}>
            <div style={{ fontSize: 32, marginBottom: 16 }}>⚡</div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: '#6B7280' }}>No table data returned</div>
            <div style={{ fontSize: 13 }}>Try a more specific industry or retry.</div>
            <button onClick={() => { setStep('input'); setDisplayedJob(null); }} style={{ marginTop: 20, background: `${ACCENT}18`, border: `1px solid ${ACCENT}44`, color: ACCENT, borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Try Again</button>
          </div>
        )}
      </VucaErrorBoundary>
      </div>
    </div>
  );
}
