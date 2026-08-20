'use client';
import React, { useState, useRef, useEffect } from 'react';
import { JobDescriptionParserResult, JobPostingInput } from '@ai-insights/types';
import { API_ENDPOINTS } from '@/lib/config';
import ModuleIcon from '@/components/shared/ModuleIcon';
import { startJobDescriptionParser } from '@/lib/api';

const ACCENT = '#3491E8';
const DS_RED = '#E63946';
const NAVY_GRADIENT = 'linear-gradient(135deg, #0c3649, #12516E)';

const PLACEHOLDER = `[
  {
    "jobTitle": "Lead Frontend Developer",
    "jobDescription": "Role: ...",
    "postedDate": "29 days ago",
    "jobPostingUrl": "https://www.linkedin.com/jobs/view/..."
  }
]`;

function parsePostingsInput(text: string): { postings: JobPostingInput[] } | { error: string } {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { error: 'Not valid JSON — paste an array of job postings.' };
  }
  if (!Array.isArray(data)) return { error: 'Input must be a JSON array of job postings.' };
  if (data.length === 0) return { error: 'The array is empty.' };
  if (data.length > 50) return { error: `Maximum 50 postings per run (got ${data.length}).` };

  const postings: JobPostingInput[] = [];
  for (let i = 0; i < data.length; i++) {
    const p = data[i] as Record<string, unknown>;
    if (!p || typeof p.jobTitle !== 'string' || !p.jobTitle.trim()) return { error: `postings[${i}].jobTitle is required.` };
    if (typeof p.jobDescription !== 'string' || !p.jobDescription.trim()) return { error: `postings[${i}].jobDescription is required.` };
    postings.push({
      jobTitle: p.jobTitle,
      jobDescription: p.jobDescription,
      postedDate: typeof p.postedDate === 'string' ? p.postedDate : undefined,
      jobPostingUrl: typeof p.jobPostingUrl === 'string' ? p.jobPostingUrl : undefined,
    });
  }
  return { postings };
}

export default function JobDescriptionParserPage() {
  const [inputText, setInputText] = useState('');
  const [job, setJob] = useState<JobDescriptionParserResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => () => { esRef.current?.close(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setJob(null);
    esRef.current?.close();

    const result = parsePostingsInput(inputText);
    if ('error' in result) {
      setError(result.error);
      return;
    }

    try {
      const jobId = await startJobDescriptionParser(result.postings);

      const es = new EventSource(API_ENDPOINTS.jobDescriptionParserStream(jobId));
      esRef.current = es;

      es.addEventListener('progress', (ev) => {
        const data = JSON.parse((ev as MessageEvent).data) as Partial<JobDescriptionParserResult>;
        setJob((prev) => ({ ...(prev ?? {} as JobDescriptionParserResult), ...data }));
      });
      es.addEventListener('result', (ev) => {
        const data = JSON.parse((ev as MessageEvent).data) as JobDescriptionParserResult;
        setJob(data);
        es.close();
      });
      es.addEventListener('error', (ev) => {
        const me = ev as MessageEvent;
        if (me.data) {
          try {
            const d = JSON.parse(me.data) as { error?: string };
            setError(d.error || 'Parsing failed');
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
    setInputText('');
  }

  function outputJson(): string {
    if (!job?.parsed) return '[]';
    return JSON.stringify(
      job.parsed.map((p) => ({
        domain: p.domain,
        job_title: p.job_title,
        summary: p.summary,
        posted_date: p.posted_date,
        required_skills: p.required_skills,
        job_posting_url: p.job_posting_url,
      })),
      null,
      2
    );
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(outputJson());
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function handleDownload() {
    const blob = new Blob([outputJson()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'parsed_job_postings.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  const isRunning = job && job.status !== 'complete' && job.status !== 'error';
  const isDone = job?.status === 'complete';
  const failedCount = job?.parsed?.filter((p) => p.parseError).length || 0;

  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: NAVY_GRADIENT, borderBottom: '1px solid #CCDFEA', padding: '16px 32px', flexShrink: 0 }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 16 }}>
          <a href="/" style={{ color: 'rgba(255,255,255,0.65)', textDecoration: 'none', fontSize: 13 }}>← Home</a>
          <div style={{ width: 1, height: 16, background: '#CCDFEA' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, color: ACCENT, marginBottom: 3 }}>REFRACTONE</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ModuleIcon id="job-description-parser" size={20} fallback="📋" />
              <span style={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF' }}>Job Description Parser</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, maxWidth: 1000, margin: '0 auto', width: '100%', padding: '40px 24px' }}>

        {!job && (
          <div style={{ background: NAVY_GRADIENT, border: '1px solid #CCDFEA', borderRadius: 12, padding: 32 }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: ACCENT, textTransform: 'uppercase', marginBottom: 6 }}>Batch Job Posting Extraction</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#FFFFFF', marginBottom: 8 }}>Paste Postings → Structured JSON</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', maxWidth: 560, margin: '0 auto' }}>
                Paste a JSON array of raw job postings (jobTitle, jobDescription, postedDate, jobPostingUrl). Each one is normalized into domain, summary, posted date, categorized required skills, and the source URL.
              </div>
            </div>

            {error && (
              <div style={{ background: 'rgba(230,57,70,0.1)', border: '1px solid rgba(230,57,70,0.3)', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: DS_RED }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.65)', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>JOB POSTINGS (JSON ARRAY) *</label>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={PLACEHOLDER}
                  rows={14}
                  disabled={!!isRunning}
                  style={{
                    width: '100%', padding: '12px 14px', background: '#FFFFFF', border: '1px solid #CCDFEA', borderRadius: 8,
                    color: '#1B2A3D', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace', resize: 'vertical',
                  }}
                />
              </div>

              {isRunning && job && (
                <div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginBottom: 6 }}>{job.currentStep}</div>
                  <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: ACCENT, width: `${job.progress || 0}%`, transition: 'width 0.4s ease', borderRadius: 4 }} />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={!inputText.trim() || !!isRunning}
                style={{
                  padding: '14px', borderRadius: 8, border: 'none',
                  background: inputText.trim() && !isRunning ? `linear-gradient(135deg, ${ACCENT}, #2563EB)` : 'rgba(52,145,232,0.3)',
                  color: '#fff', fontSize: 14, fontWeight: 700,
                  cursor: inputText.trim() && !isRunning ? 'pointer' : 'not-allowed', letterSpacing: 0.5,
                }}
              >
                {isRunning ? 'Parsing…' : 'Parse Job Postings →'}
              </button>
            </form>
          </div>
        )}

        {job?.status === 'error' && (
          <div style={{ background: 'rgba(230,57,70,0.1)', border: '1px solid rgba(230,57,70,0.3)', borderRadius: 8, padding: '16px 20px', fontSize: 14, color: DS_RED }}>
            {job.error || 'Parsing failed.'}
            <div style={{ marginTop: 12 }}>
              <button onClick={handleReset} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid rgba(230,57,70,0.4)', background: 'transparent', color: DS_RED, cursor: 'pointer', fontSize: 13 }}>← Try again</button>
            </div>
          </div>
        )}

        {isDone && job && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ background: NAVY_GRADIENT, border: '1px solid #CCDFEA', borderRadius: 16, padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#FFFFFF' }}>{job.parsed.length} postings parsed</div>
                {failedCount > 0 && (
                  <div style={{ fontSize: 13, color: '#F59E0B', marginTop: 4 }}>⚠ {failedCount} posting{failedCount > 1 ? 's' : ''} failed to extract — see flagged rows below</div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={handleCopy} style={{ padding: '10px 18px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.3)', background: 'transparent', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  {copied ? '✓ Copied' : 'Copy JSON'}
                </button>
                <button onClick={handleDownload} style={{ padding: '10px 18px', borderRadius: 8, border: 'none', background: `linear-gradient(135deg, ${ACCENT}, #2563EB)`, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  ⬇ Download JSON
                </button>
              </div>
            </div>

            {job.parsed.map((p, i) => (
              <div key={i} style={{ background: p.parseError ? 'rgba(230,57,70,0.05)' : '#FFFFFF', border: `1px solid ${p.parseError ? 'rgba(230,57,70,0.3)' : '#CCDFEA'}`, borderRadius: 12, padding: '20px 24px' }}>
                {p.parseError ? (
                  <div style={{ fontSize: 13, color: DS_RED }}>⚠ {p.parseError}</div>
                ) : (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#0c3649' }}>{p.job_title}</div>
                        <div style={{ fontSize: 12, color: '#5A6E7A', marginTop: 2 }}>{p.domain} · {p.posted_date}</div>
                      </div>
                      {p.job_posting_url && (
                        <a href={p.job_posting_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: ACCENT, textDecoration: 'none', fontWeight: 600 }}>
                          View posting →
                        </a>
                      )}
                    </div>
                    <p style={{ fontSize: 13, color: '#333333', lineHeight: 1.6, marginBottom: 10 }}>{p.summary}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {p.required_skills.map((cat, ci) => (
                        <div key={ci} style={{ fontSize: 12 }}>
                          <span style={{ fontWeight: 700, color: '#5A6E7A' }}>{cat.category}: </span>
                          <span style={{ color: '#333333' }}>{cat.skills.join(', ')}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}

            {/* Raw JSON preview */}
            <details style={{ background: '#0c3649', borderRadius: 12, padding: '16px 20px' }}>
              <summary style={{ color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Raw output JSON</summary>
              <pre style={{ color: '#CCDFEA', fontSize: 12, overflowX: 'auto', marginTop: 12, whiteSpace: 'pre-wrap' }}>{outputJson()}</pre>
            </details>

            <button onClick={handleReset} style={{ padding: '12px', borderRadius: 8, border: '1px solid #CCDFEA', background: 'transparent', color: '#5A6E7A', fontSize: 14, cursor: 'pointer' }}>
              ← Parse More Postings
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
