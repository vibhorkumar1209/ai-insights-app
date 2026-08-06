'use client';
import React, { useState, useRef, useEffect } from 'react';
import { ItJobResult } from '@ai-insights/types';
import { API_ENDPOINTS } from '@/lib/config';
import ModuleIcon from '@/components/shared/ModuleIcon';
import HistoryDrawer from '@/components/shared/HistoryDrawer';
import { loadHistory, saveToHistory, loadEntryById, popPendingRestore, HistoryEntry } from '@/lib/history';

const ACCENT = '#3491E8';
const DS_RED = '#E63946';
const GREEN = '#10B981';

export default function ItJobsPage() {
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [job, setJob] = useState<ItJobResult | null>(null);
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
      if (entry?.moduleType === 'it-jobs' && entry.itJobData) {
        restoreEntry(entry);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function restoreEntry(entry: HistoryEntry) {
    if (entry.moduleType !== 'it-jobs' || !entry.itJobData) return;
    setJobTitle(entry.itJobData.jobTitleInput);
    setJobDescription(entry.itJobData.jobDescriptionInput);
    setJob(entry.itJobData);
    setError(null);
  }

  const isFormValid = !!jobTitle.trim() && !!jobDescription.trim();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isFormValid) return;
    setError(null);
    setJob(null);
    esRef.current?.close();

    try {
      const res = await fetch(API_ENDPOINTS.itJobs, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobTitle: jobTitle.trim(), jobDescription: jobDescription.trim() }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error || `Server error ${res.status}`);
      }
      const { jobId } = await res.json() as { jobId: string };

      const es = new EventSource(API_ENDPOINTS.itJobsStream(jobId));
      esRef.current = es;

      es.addEventListener('progress', (ev) => {
        const data = JSON.parse((ev as MessageEvent).data) as Partial<ItJobResult>;
        setJob((prev) => ({ ...(prev ?? {} as ItJobResult), ...data }));
      });
      es.addEventListener('result', (ev) => {
        const data = JSON.parse((ev as MessageEvent).data) as ItJobResult;
        setJob(data);
        es.close();
        if (data.status === 'complete') {
          saveToHistory({
            moduleType: 'it-jobs',
            targetCompany: data.extraction?.job_title || jobTitle.trim(),
            completedAt: new Date().toISOString(),
            itJobData: data,
          });
          setHistoryCount(loadHistory().length);
        }
      });
      es.addEventListener('error', (ev) => {
        const me = ev as MessageEvent;
        if (me.data) {
          try {
            const d = JSON.parse(me.data) as { error?: string };
            setError(d.error || 'Extraction failed');
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
    setJobTitle('');
    setJobDescription('');
  }

  const isRunning = job && job.status !== 'complete' && job.status !== 'error';
  const isDone = job?.status === 'complete' && !!job.extraction;

  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', display: 'flex', flexDirection: 'column' }}>
      {showHistory && (
        <HistoryDrawer
          currentModule="it-jobs"
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
              <ModuleIcon id="it-jobs" size={20} />
              <span style={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF' }}>IT Jobs</span>
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
      <div style={{ flex: 1, maxWidth: 700, margin: '0 auto', width: '100%', padding: '40px 24px' }}>

        {/* Input form */}
        {!isDone && (
          <div style={{ background: 'linear-gradient(135deg, #0c3649, #12516E)', border: '1px solid #CCDFEA', borderRadius: 12, padding: 32 }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: GREEN, textTransform: 'uppercase', marginBottom: 6 }}>Job Posting Extraction</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#FFFFFF', marginBottom: 8 }}>IT Jobs</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', maxWidth: 480, margin: '0 auto' }}>
                Paste a job title and full job description to extract a concise summary, posting date, and required skills as structured data.
              </div>
            </div>

            {error && (
              <div style={{ background: 'rgba(230,57,70,0.1)', border: '1px solid rgba(230,57,70,0.3)', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: DS_RED }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.65)', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>JOB TITLE *</label>
                <input
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Senior Cloud Infrastructure Engineer"
                  disabled={!!isRunning}
                  style={{ width: '100%', padding: '12px 14px', background: '#FFFFFF', border: '1px solid #CCDFEA', borderRadius: 8, color: '#1B2A3D', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.65)', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>JOB DESCRIPTION *</label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the full job description here…"
                  disabled={!!isRunning}
                  rows={10}
                  style={{ width: '100%', padding: '12px 14px', background: '#FFFFFF', border: '1px solid #CCDFEA', borderRadius: 8, color: '#1B2A3D', fontSize: 14, outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }}
                />
              </div>

              {/* Progress */}
              {isRunning && job && (
                <div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginBottom: 6 }}>{job.currentStep}</div>
                  <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: GREEN, width: `${job.progress}%`, transition: 'width 0.4s ease', borderRadius: 4 }} />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={!isFormValid || !!isRunning}
                style={{
                  padding: '14px', borderRadius: 8, border: 'none',
                  background: isFormValid && !isRunning ? `linear-gradient(135deg, ${GREEN}, #059669)` : 'rgba(16,185,129,0.3)',
                  color: '#fff', fontSize: 14, fontWeight: 700,
                  cursor: isFormValid && !isRunning ? 'pointer' : 'not-allowed',
                  letterSpacing: 0.5,
                }}
              >
                {isRunning ? 'Extracting…' : 'Extract Job Details →'}
              </button>
            </form>
          </div>
        )}

        {/* Result card */}
        {isDone && job?.extraction && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ background: 'linear-gradient(135deg, #0c3649, #12516E)', border: '1px solid #CCDFEA', borderRadius: 16, padding: '32px 28px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: GREEN, textTransform: 'uppercase', marginBottom: 8 }}>Job Title</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#FFFFFF', marginBottom: 20 }}>{job.extraction.job_title}</div>

              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6 }}>Summary</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, marginBottom: 20 }}>{job.extraction.summary}</div>

              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 6 }}>Date Posted</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', marginBottom: 20 }}>{job.extraction.date || 'Not found'}</div>

              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 10 }}>Required Skills</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {job.extraction.required_skill.length > 0 ? job.extraction.required_skill.map((skill, i) => (
                  <span key={i} style={{
                    fontSize: 13, fontWeight: 600, color: '#FFFFFF',
                    background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.4)',
                    borderRadius: 20, padding: '5px 14px',
                  }}>{skill}</span>
                )) : (
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>None extracted</span>
                )}
              </div>
            </div>

            {/* Raw JSON */}
            <div style={{ background: '#F3F8FA', border: '1px solid #CCDFEA', borderRadius: 12, padding: '20px 24px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: '#5A6E7A', textTransform: 'uppercase', marginBottom: 10 }}>Raw JSON Output</div>
              <pre style={{
                fontSize: 12.5, color: '#1B2A3D', background: '#FFFFFF', border: '1px solid #CCDFEA',
                borderRadius: 8, padding: 16, overflowX: 'auto', margin: 0, fontFamily: 'ui-monospace, monospace',
              }}>
                {JSON.stringify(job.extraction, null, 2)}
              </pre>
            </div>

            <button
              onClick={handleReset}
              style={{ padding: '12px', borderRadius: 8, border: '1px solid #CCDFEA', background: 'transparent', color: '#5A6E7A', fontSize: 14, cursor: 'pointer' }}
            >
              ← New Extraction
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
