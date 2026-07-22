'use client';
import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { OutsourcingReportResult } from '@ai-insights/types';
import { API_ENDPOINTS } from '@/lib/config';
import ModuleIcon from '@/components/shared/ModuleIcon';
import HistoryDrawer from '@/components/shared/HistoryDrawer';
import { loadHistory, saveToHistory, loadEntryById, popPendingRestore, HistoryEntry } from '@/lib/history';

const ACCENT = '#3491E8';
const DS_RED = '#E63946';

interface FormState {
  vendorName: string;
  targetIndustry: string;
  geoFocus: string;
  focusTech: string;
  focusSegment: string;
}

const EMPTY_FORM: FormState = { vendorName: '', targetIndustry: '', geoFocus: '', focusTech: '', focusSegment: '' };

const FIELD_DEFS: { key: keyof FormState; label: string; placeholder: string; required: boolean }[] = [
  { key: 'vendorName', label: 'Vendor Name', placeholder: 'e.g. NEC Corporation', required: true },
  { key: 'targetIndustry', label: 'Target Industry', placeholder: 'e.g. Semiconductor Industry', required: true },
  { key: 'geoFocus', label: 'Geo Focus', placeholder: 'e.g. Global with special focus on Japan/APAC', required: true },
  { key: 'focusTech', label: 'Focus Tech', placeholder: 'Optional — e.g. Sovereign Cloud, Zero-Trust OT Security, dotData AI (auto-determined if left blank)', required: false },
  { key: 'focusSegment', label: 'Focus Segment', placeholder: 'Optional — e.g. Greenfield Foundries, Automotive IDMs, Advanced OSATs (auto-determined if left blank)', required: false },
];

export default function OutsourcingReportPage() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [job, setJob] = useState<OutsourcingReportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [historyCount, setHistoryCount] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => () => { esRef.current?.close(); }, []);

  useEffect(() => {
    setHistoryCount(loadHistory().length);
    const pendingId = popPendingRestore();
    if (pendingId) {
      const entry = loadEntryById(pendingId);
      if (entry?.moduleType === 'industry-outsourcing-report' && entry.outsourcingReportData) {
        restoreEntry(entry);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function restoreEntry(entry: HistoryEntry) {
    if (entry.moduleType !== 'industry-outsourcing-report' || !entry.outsourcingReportData) return;
    const d = entry.outsourcingReportData;
    setForm({
      vendorName: d.vendorName,
      targetIndustry: d.targetIndustry,
      geoFocus: d.geoFocus,
      focusTech: d.focusTech,
      focusSegment: d.focusSegment,
    });
    setJob(d);
    setError(null);
  }

  function updateField(key: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const allFieldsFilled = FIELD_DEFS.filter((f) => f.required).every((f) => form[f.key].trim().length > 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!allFieldsFilled) return;
    setError(null);
    setJob(null);
    esRef.current?.close();

    try {
      const res = await fetch(API_ENDPOINTS.industryOutsourcingReport, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error || `Server error ${res.status}`);
      }
      const { jobId } = await res.json() as { jobId: string };

      const es = new EventSource(API_ENDPOINTS.industryOutsourcingReportStream(jobId));
      esRef.current = es;

      es.addEventListener('progress', (ev) => {
        const data = JSON.parse((ev as MessageEvent).data) as Partial<OutsourcingReportResult>;
        setJob((prev) => ({ ...(prev ?? {} as OutsourcingReportResult), ...data }));
      });
      es.addEventListener('result', (ev) => {
        const data = JSON.parse((ev as MessageEvent).data) as OutsourcingReportResult;
        setJob(data);
        es.close();
        if (data.status === 'complete') {
          saveToHistory({
            moduleType: 'industry-outsourcing-report',
            targetCompany: form.vendorName,
            completedAt: new Date().toISOString(),
            outsourcingReportData: data,
          });
          setHistoryCount(loadHistory().length);
        }
      });
      es.addEventListener('error', (ev) => {
        const me = ev as MessageEvent;
        if (me.data) {
          try {
            const d = JSON.parse(me.data) as { error?: string };
            setError(d.error || 'Generation failed');
            es.close();
          } catch { /* ignore */ }
        }
      });
      es.onerror = () => { es.close(); };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }

  function handleReset() {
    esRef.current?.close();
    setJob(null);
    setError(null);
    setForm(EMPTY_FORM);
  }

  const isRunning = job && job.status !== 'complete' && job.status !== 'error';
  const isDone = job?.status === 'complete' && !!job.content;

  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', display: 'flex', flexDirection: 'column' }}>
      {showHistory && (
        <HistoryDrawer
          currentModule="industry-outsourcing-report"
          onSelectSameModule={restoreEntry}
          onClose={() => setShowHistory(false)}
        />
      )}

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0c3649, #12516E)', borderBottom: '1px solid #CCDFEA', padding: '16px 32px', flexShrink: 0 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 16 }}>
          <a href="/" style={{ color: 'rgba(255,255,255,0.65)', textDecoration: 'none', fontSize: 13 }}>← Home</a>
          <div style={{ width: 1, height: 16, background: '#CCDFEA' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, color: ACCENT, marginBottom: 3 }}>REFRACTONE</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ModuleIcon id="industry-outsourcing-report" size={20} />
              <span style={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF' }}>Industry Outsourcing Report</span>
            </div>
          </div>
          <button
            onClick={() => { setHistoryCount(loadHistory().length); setShowHistory(true); }}
            style={{
              background: 'rgba(52,145,232,0.1)', border: '1px solid rgba(52,145,232,0.3)',
              color: ACCENT, borderRadius: 8, padding: '7px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            History {historyCount > 0 && `(${historyCount})`}
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, maxWidth: isDone ? 1100 : 700, margin: '0 auto', width: '100%', padding: '40px 24px' }}>

        {/* Input form */}
        {!isDone && (
          <div style={{ background: 'linear-gradient(135deg, #0c3649, #12516E)', border: '1px solid #CCDFEA', borderRadius: 12, padding: 32 }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: ACCENT, textTransform: 'uppercase', marginBottom: 6 }}>Strategic GTM Blueprint</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#FFFFFF', marginBottom: 8 }}>Sales Playbook Generator</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', maxWidth: 520, margin: '0 auto' }}>
                Enter the vendor, target industry, and focus areas to generate an 8-step outsourcing GTM blueprint: 4W1H framework, ecosystem map, competitive benchmarking, workload analysis, capability heat map, customer anchors, and transactional intelligence.
              </div>
            </div>

            {error && (
              <div style={{ background: 'rgba(230,57,70,0.1)', border: '1px solid rgba(230,57,70,0.3)', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: DS_RED }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {FIELD_DEFS.map((f) => (
                <div key={f.key}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.65)', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>
                    {f.label.toUpperCase()}{f.required ? ' *' : ''}
                  </label>
                  <input
                    value={form[f.key]}
                    onChange={(e) => updateField(f.key, e.target.value)}
                    placeholder={f.placeholder}
                    disabled={!!isRunning}
                    required={f.required}
                    style={{ width: '100%', padding: '12px 14px', background: '#FFFFFF', border: '1px solid #CCDFEA', borderRadius: 8, color: '#1B2A3D', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              ))}

              {/* Progress */}
              {isRunning && job && (
                <div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginBottom: 6 }}>{job.currentStep}</div>
                  <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: ACCENT, width: `${job.progress}%`, transition: 'width 0.4s ease', borderRadius: 4 }} />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={!allFieldsFilled || !!isRunning}
                style={{
                  padding: '14px', borderRadius: 8, border: 'none',
                  background: allFieldsFilled && !isRunning ? `linear-gradient(135deg, ${ACCENT}, #2563EB)` : 'rgba(52,145,232,0.3)',
                  color: '#fff', fontSize: 14, fontWeight: 700,
                  cursor: allFieldsFilled && !isRunning ? 'pointer' : 'not-allowed',
                  letterSpacing: 0.5,
                }}
              >
                {isRunning ? 'Generating blueprint (this takes 3–5 minutes)…' : 'Generate Blueprint →'}
              </button>
            </form>
          </div>
        )}

        {/* Result — rendered markdown */}
        {isDone && job && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#1B2A3D' }}>{job.vendorName} → {job.targetIndustry}</div>
                <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
                  {job.geoFocus} · {job.focusTech} · {job.focusSegment}
                </div>
              </div>
              <button
                onClick={handleReset}
                style={{ padding: '10px 20px', borderRadius: 8, border: `1px solid ${ACCENT}`, background: 'transparent', color: ACCENT, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                ← New Blueprint
              </button>
            </div>

            <div className="outsourcing-markdown" style={{ background: '#F3F8FA', border: '1px solid #CCDFEA', borderRadius: 14, padding: '32px' }}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{job.content}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .outsourcing-markdown h2 { font-size: 20px; font-weight: 700; color: #1B2A3D; margin: 28px 0 12px; padding-bottom: 8px; border-bottom: 2px solid rgba(52,145,232,0.25); }
        .outsourcing-markdown h2:first-child { margin-top: 0; }
        .outsourcing-markdown h3 { font-size: 16px; font-weight: 700; color: #3491E8; margin: 22px 0 10px; }
        .outsourcing-markdown h4 { font-size: 14px; font-weight: 700; color: #1B2A3D; margin: 16px 0 8px; }
        .outsourcing-markdown p { font-size: 13.5px; line-height: 1.7; color: #374B5C; margin: 0 0 12px; }
        .outsourcing-markdown ul, .outsourcing-markdown ol { margin: 0 0 12px; padding-left: 22px; }
        .outsourcing-markdown li { font-size: 13.5px; line-height: 1.7; color: #374B5C; margin-bottom: 4px; }
        .outsourcing-markdown strong { color: #1B2A3D; }
        .outsourcing-markdown table { width: 100%; border-collapse: collapse; margin: 12px 0 20px; font-size: 12px; background: #EDF4F8; border-radius: 10px; overflow: hidden; }
        .outsourcing-markdown th { text-align: left; padding: 10px 12px; background: rgba(52,145,232,0.08); color: #3491E8; font-weight: 700; font-size: 11px; letter-spacing: 0.3px; border-bottom: 1px solid rgba(30,74,104,0.35); white-space: nowrap; }
        .outsourcing-markdown td { padding: 9px 12px; color: #374B5C; border-bottom: 1px solid rgba(30,74,104,0.15); vertical-align: top; }
        .outsourcing-markdown tr:nth-child(even) td { background: #F0F7FB; }
        .outsourcing-markdown table td:first-child { font-weight: 600; color: #1B2A3D; }
        .outsourcing-markdown hr { border: none; border-top: 1px solid rgba(30,74,104,0.2); margin: 24px 0; }
        .outsourcing-markdown blockquote { border-left: 3px solid #3491E8; padding-left: 14px; margin: 12px 0; color: #5A6E7A; font-style: italic; }
        .outsourcing-markdown code { background: rgba(52,145,232,0.08); padding: 1px 5px; border-radius: 4px; font-size: 12px; }
      `}</style>
    </div>
  );
}
