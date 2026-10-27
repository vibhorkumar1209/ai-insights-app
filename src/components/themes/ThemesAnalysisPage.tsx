'use client';
import StuckJobBanner from '@/components/shared/StuckJobBanner';
import KillSwitchButton from '@/components/shared/KillSwitchButton';

import { useState, useEffect } from 'react';
import { ThemeType } from '@ai-insights/types';
import { ThemesJob } from '@/lib/types';
import {
  loadHistory,
  saveToHistory,
  loadEntryById,
  popPendingRestore,
  HistoryEntry,
  ModuleType,
} from '@/lib/history';
import { API_ENDPOINTS } from '@/lib/config';
import { useJobManager } from '@/lib/useJobManager';
import ThemeTable from './ThemeTable';
import HistoryDrawer from '@/components/shared/HistoryDrawer';
import ModuleIcon from '@/components/shared/ModuleIcon';

// Map ThemeType → ModuleType for history
const THEME_TO_MODULE: Record<ThemeType, ModuleType> = {
  business: 'business-themes',
  technology: 'technology-themes',
  sustainability: 'sustainability',
};

const TYPE_CONFIG: Record<ThemeType, {
  label: string;
  moduleId: string;
  accent: string;
  inputPlaceholder: string;
  description: string;
}> = {
  business: {
    label: 'Business Themes',
    moduleId: 'business-themes',
    accent: '#3491E8',
    inputPlaceholder: 'e.g. Siemens, Unilever, Caterpillar',
    description: 'Strategic priorities, growth initiatives and corporate direction',
  },
  technology: {
    label: 'Technology Themes',
    moduleId: 'technology-themes',
    accent: '#E63946',
    inputPlaceholder: 'e.g. Volkswagen, HSBC, Johnson Controls',
    description: 'Digital transformation, AI adoption and technology investment priorities',
  },
  sustainability: {
    label: 'Sustainability Themes',
    moduleId: 'sustainability',
    accent: '#10B981',
    inputPlaceholder: 'e.g. Shell, Nestlé, Schneider Electric',
    description: 'ESG commitments, carbon targets and sustainability strategy',
  },
};

// Optional inputs per theme type. When given, the API writes them into the
// research query and the analysis prompt, so they change what is searched for.
type OptionalKey = 'userOrganization' | 'userDomain' | 'industry' | 'solutionPortfolio' | 'keyTriggers' | 'focusTechnologies';
const OPTIONAL_FIELDS: Record<ThemeType, { key: OptionalKey; label: string; placeholder: string; multiline?: boolean }[]> = {
  business: [
    { key: 'userOrganization', label: 'Your Company Name', placeholder: 'e.g. Snowflake' },
    { key: 'userDomain', label: 'Your Company Domain', placeholder: 'e.g. snowflake.com' },
    { key: 'industry', label: 'Industry', placeholder: 'e.g. Foodservice distribution' },
    { key: 'solutionPortfolio', label: 'Your Company Offerings (products / services)', placeholder: 'e.g. Data cloud, AI data platform, data sharing', multiline: true },
    { key: 'keyTriggers', label: 'Key Triggers', placeholder: 'e.g. new CEO, acquisition, cost-cutting programme, entering EU', multiline: true },
  ],
  technology: [
    { key: 'userOrganization', label: 'Your Company', placeholder: 'e.g. Snowflake' },
    { key: 'userDomain', label: 'Your Company Domain', placeholder: 'e.g. snowflake.com' },
    { key: 'solutionPortfolio', label: 'Your Company Offering', placeholder: 'e.g. Data cloud, AI data platform', multiline: true },
    { key: 'focusTechnologies', label: 'Focus Technologies', placeholder: 'e.g. GenAI, data lakehouse, SAP S/4HANA migration', multiline: true },
  ],
  sustainability: [
    { key: 'userOrganization', label: 'Your Company', placeholder: 'e.g. Schneider Electric' },
    { key: 'userDomain', label: 'Your Company Domain', placeholder: 'e.g. se.com' },
    { key: 'solutionPortfolio', label: 'Your Company Offering', placeholder: 'e.g. Energy management software, carbon accounting', multiline: true },
  ],
};

const fieldStyle = {
  display: 'block', width: '100%', marginTop: 8, padding: '12px 14px', background: '#FFFFFF',
  border: '1px solid #CCDFEA', borderRadius: 8, color: '#1B2A3D', fontSize: 14, outline: 'none',
  boxSizing: 'border-box' as const, fontFamily: 'inherit',
};

interface ThemesAnalysisPageProps {
  themeType: ThemeType;
}

export default function ThemesAnalysisPage({ themeType }: ThemesAnalysisPageProps) {
  const cfg = TYPE_CONFIG[themeType];
  const moduleType = THEME_TO_MODULE[themeType];

  const [step, setStep] = useState<'input' | 'analysing' | 'results'>('input');
  const [companyName, setCompanyName] = useState('');
  const [companyDomain, setCompanyDomain] = useState('');
  const [historyCount, setHistoryCount] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [displayedJob, setDisplayedJob] = useState<ThemesJob | null>(null);
  const [extras, setExtras] = useState<Partial<Record<OptionalKey, string>>>({});
  const [showExtras, setShowExtras] = useState(false);
  const filledExtras = () => Object.fromEntries(
    OPTIONAL_FIELDS[themeType].map((f) => [f.key, (extras[f.key] || '').trim()]).filter(([, v]) => v)
  ) as Record<string, string>;

  const { job, error, isStuck, retryJob, startJob, cancelJob } = useJobManager<ThemesJob>({
    onProgress: () => setStep('analysing'),
    onComplete: (data) => {
      setStep('results');
      setDisplayedJob(data);
      if (data.rows && data.rows.length > 0) {
        saveToHistory({
          moduleType,
          targetCompany: companyName.trim(),
          completedAt: data.completedAt || new Date().toISOString(),
          themeType,
          themeRows: data.rows,
          themeInputs: Object.keys(filledExtras()).length ? filledExtras() : undefined,
        });
        setHistoryCount(loadHistory().length);
      }
    },
  });

  // On mount: load history count + check cross-page pending restore
  useEffect(() => {
    setHistoryCount(loadHistory().length);

    const pendingId = popPendingRestore();
    if (pendingId) {
      const entry = loadEntryById(pendingId);
      if (entry && entry.moduleType === moduleType) {
        restoreEntry(entry);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function restoreEntry(entry: HistoryEntry) {
    if (!entry.themeRows) return;
    setCompanyName(entry.targetCompany);
    setExtras(entry.themeInputs || {});
    setDisplayedJob({
      jobId: entry.id,
      status: 'complete',
      progress: 100,
      rows: entry.themeRows,
      themeType: entry.themeType as ThemeType,
      companyName: entry.targetCompany,
      createdAt: entry.completedAt,
      completedAt: entry.completedAt,
    });
    setStep('results');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!companyName.trim()) return;

    await startJob({
      endpoint: API_ENDPOINTS.themes,
      payload: {
        companyName: companyName.trim(),
        themeType,
        companyDomain: companyDomain.trim() || undefined,
        ...filledExtras(),
      },
      streamUrlFactory: (jobId) => API_ENDPOINTS.themesStream(jobId),
      persist: { moduleType: moduleType, targetCompany: companyName.trim() },
    });
  }

  function handleReset() {
    cancelJob();
    setStep('input');
    setCompanyName('');
    setCompanyDomain('');
    setExtras({});
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', display: 'flex', flexDirection: 'column' }}>

      {/* History Drawer */}
      {showHistory && (
        <HistoryDrawer
          currentModule={moduleType}
          onSelectSameModule={restoreEntry}
          onClose={() => setShowHistory(false)}
        />
      )}

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0c3649, #12516E)',
        borderBottom: '1px solid #CCDFEA',
        padding: '16px 32px',
        flexShrink: 0,
      }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto',
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <a
            href="/"
            style={{
              color: 'rgba(255,255,255,0.65)', textDecoration: 'none', fontSize: 13,
              display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
            }}
          >
            ← Home
          </a>
          <div style={{ width: 1, height: 16, background: '#CCDFEA', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, color: cfg.accent, marginBottom: 3 }}>
              REFRACTONE
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ModuleIcon id={cfg.moduleId} size={20} />
              <span style={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF' }}>{cfg.label}</span>
            </div>
          </div>

          {/* Report History button */}
          <button
            onClick={() => setShowHistory(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(52,145,232,0.1)',
              border: '1px solid rgba(52,145,232,0.25)',
              color: '#6ab8ff',
              borderRadius: 8, padding: '8px 16px',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="12" height="12" rx="2" stroke="#6ab8ff" strokeWidth="1.4" />
              <path d="M3.5 4.5h7M3.5 7h7M3.5 9.5h4" stroke="#6ab8ff" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            Report History
            {historyCount > 0 && (
              <span style={{
                background: '#3491E8', color: '#fff',
                borderRadius: '50%', width: 18, height: 18,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 700,
              }}>
                {historyCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, maxWidth: 1200, margin: '0 auto', width: '100%', padding: '32px' }}>

        {/* ── INPUT ─────────────────────────────────────────────────────────── */}
        {step === 'input' && (
          <div style={{ maxWidth: 580, margin: '48px auto 0' }}>
            {error && (
              <div style={{
                background: 'rgba(230,57,70,0.1)',
                border: '1px solid rgba(230,57,70,0.3)',
                borderRadius: 8, padding: '12px 16px',
                marginBottom: 24, fontSize: 13, color: '#ff6b75',
              }}>
                {error}
              </div>
            )}

            <div style={{
              background: '#F3F8FA',
              border: '1px solid #CCDFEA',
              borderRadius: 12, padding: '32px',
            }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#1B2A3D', marginBottom: 6 }}>
                Company Analysis
              </div>
              <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 28 }}>
                Enter a company name to generate its key {cfg.label.toLowerCase()}.
              </div>

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', letterSpacing: 0.5 }}>
                    COMPANY NAME
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder={cfg.inputPlaceholder}
                    required
                    autoFocus
                    style={{
                      display: 'block', width: '100%',
                      marginTop: 8, padding: '12px 14px',
                      background: '#FFFFFF',
                      border: '1px solid #CCDFEA',
                      borderRadius: 8, color: '#1B2A3D',
                      fontSize: 14, outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', letterSpacing: 0.5 }}>
                    COMPANY DOMAIN <span style={{ color: '#6B7280', fontWeight: 400 }}>(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={companyDomain}
                    onChange={(e) => setCompanyDomain(e.target.value)}
                    placeholder="e.g. cvs.com, tesla.com"
                    style={{
                      display: 'block', width: '100%',
                      marginTop: 8, padding: '12px 14px',
                      background: '#FFFFFF',
                      border: '1px solid #CCDFEA',
                      borderRadius: 8, color: '#1B2A3D',
                      fontSize: 14, outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{ marginBottom: 24, borderTop: '1px solid #CCDFEA', paddingTop: 16 }}>
                  <button
                    type="button"
                    onClick={() => setShowExtras((v) => !v)}
                    aria-expanded={showExtras}
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: cfg.accent, fontSize: 13, fontWeight: 700 }}
                  >
                    {showExtras ? '▾' : '▸'} Sharpen the analysis with your context (optional)
                    {!showExtras && Object.keys(filledExtras()).length > 0 && ` · ${Object.keys(filledExtras()).length} added`}
                  </button>
                  {showExtras && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 12 }}>
                        Anything you add here is included in the research and shapes the themes.
                      </div>
                      {OPTIONAL_FIELDS[themeType].map((f) => (
                        <div key={f.key} style={{ marginBottom: 16 }}>
                          <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                            {f.label}
                          </label>
                          {f.multiline ? (
                            <textarea rows={2} value={extras[f.key] || ''} onChange={(e) => setExtras({ ...extras, [f.key]: e.target.value })} placeholder={f.placeholder} style={{ ...fieldStyle, resize: 'vertical' }} />
                          ) : (
                            <input type="text" value={extras[f.key] || ''} onChange={(e) => setExtras({ ...extras, [f.key]: e.target.value })} placeholder={f.placeholder} style={fieldStyle} />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!companyName.trim()}
                  style={{
                    width: '100%', padding: '13px',
                    background: companyName.trim()
                      ? `linear-gradient(135deg, ${cfg.accent}, ${darken(cfg.accent)})`
                      : '#EDF4F8',
                    border: 'none', borderRadius: 8,
                    color: companyName.trim() ? '#fff' : '#4a7a96',
                    fontSize: 14, fontWeight: 700,
                    cursor: companyName.trim() ? 'pointer' : 'not-allowed',
                    letterSpacing: 0.5,
                  }}
                >
                  Analyse {cfg.label} →
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ── ANALYSING ─────────────────────────────────────────────────────── */}
        {step === 'analysing' && (
          <div style={{ maxWidth: 580, margin: '48px auto 0' }}>
            <div style={{
              background: '#F3F8FA',
              border: '1px solid #CCDFEA',
              borderRadius: 12, padding: '36px 32px', textAlign: 'center',
            }}>
              <div style={{
                width: 48, height: 48,
                border: '3px solid #E8F4F8',
                borderTopColor: cfg.accent,
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                margin: '0 auto 24px',
              }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#1B2A3D', marginBottom: 8 }}>
                Analysing {companyName}
              </div>
              <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 24 }}>
                {job?.currentStep || 'Gathering intelligence and synthesizing themes — this takes 1–2 minutes.'}
              </div>
              <div style={{ height: 4, background: '#E8F4F8', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${job?.progress ?? 10}%`,
                  background: `linear-gradient(90deg, ${cfg.accent}, ${lighten(cfg.accent)})`,
                  borderRadius: 2,
                  transition: 'width 0.5s ease',
                }} />
              </div>
              <div style={{ fontSize: 11, color: '#6B7280', marginTop: 8 }}>
                {job?.progress ?? 10}% complete
            {isStuck && <StuckJobBanner onRetry={retryJob} />}
              </div>
              <KillSwitchButton onCancel={handleReset} />
            </div>
          </div>
        )}

        {/* ── RESULTS ───────────────────────────────────────────────────────── */}
        {step === 'results' && (displayedJob || job)?.rows && (
          <ThemeTable
            rows={(displayedJob || job)!.rows}
            companyName={(displayedJob || job)?.companyName ?? companyName}
            themeType={themeType}
            onReset={handleReset}
            completedAt={(displayedJob || job)?.completedAt}
          />
        )}
      </div>
    </div>
  );
}

function darken(hex: string): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, ((n >> 16) & 0xff) - 30);
  const g = Math.max(0, ((n >> 8) & 0xff) - 30);
  const b = Math.max(0, (n & 0xff) - 30);
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

function lighten(hex: string): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, ((n >> 16) & 0xff) + 40);
  const g = Math.min(255, ((n >> 8) & 0xff) + 40);
  const b = Math.min(255, (n & 0xff) + 40);
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}
