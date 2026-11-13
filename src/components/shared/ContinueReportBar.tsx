'use client';

import { useEffect, useRef, useState } from 'react';

// Shown under a report that stopped part-way (most often because AI credits
// ran out). The API keeps every part already written; Continue asks it to
// write only the rest, and the API also continues on its own once credits are
// back. While this bar is up it checks the job every 30s so an automatic
// continuation shows up here without a reload.

interface ResumableJob {
  jobId?: string;
  status?: string;
  canContinue?: boolean;
  incompleteReason?: string;
  error?: string;
}

interface Props<T extends ResumableJob> {
  job: T | null;
  /** Module base URL, e.g. API_ENDPOINTS.industryReport */
  endpoint: string;
  onUpdate: (job: T) => void;
  /** Called once with the finished report; save it to history here. */
  onComplete: (job: T) => void;
}

const RUNNING_POLL_MS = 4000;
const IDLE_POLL_MS = 30000;

export default function ContinueReportBar<T extends ResumableJob>({ job, endpoint, onUpdate, onComplete }: Props<T>) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const jobId = job?.jobId;
  const show = !!jobId && !!job?.canContinue && (job.status === 'complete' || job.status === 'error');

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  useEffect(() => {
    if (!show && !busy) return;
    let stopped = false;
    async function poll(): Promise<void> {
      let next: T | null = null;
      try {
        const res = await fetch(`${endpoint}/${jobId}`);
        if (res.ok) next = await res.json() as T;
      } catch { /* network blip: try again later */ }
      if (stopped) return;
      if (!next) { timer.current = setTimeout(poll, IDLE_POLL_MS); return; }

      if (next.status === 'error' && /not found|expired|lost/i.test(next.error || '')) {
        setBusy(false);
        setMessage('This report is no longer on the server, so it cannot be continued. Start a new one.');
        return;
      }
      const running = next.status !== 'complete' && next.status !== 'error';
      setBusy(running);
      onUpdate(next);
      if (running) { timer.current = setTimeout(poll, RUNNING_POLL_MS); return; }
      // Only ever polling a report that was incomplete, so reaching a
      // finished, complete state means the continuation succeeded.
      if (next.status === 'complete' && !next.canContinue) { onComplete(next); return; }
      setMessage(next.incompleteReason || null);
      timer.current = setTimeout(poll, IDLE_POLL_MS);
    }
    timer.current = setTimeout(poll, busy ? RUNNING_POLL_MS : IDLE_POLL_MS);
    return () => { stopped = true; if (timer.current) clearTimeout(timer.current); };
  }, [show, busy, jobId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleContinue() {
    if (!jobId) return;
    setMessage(null);
    setBusy(true);
    try {
      const res = await fetch(`${endpoint}/${jobId}/continue`, { method: 'POST' });
      const body = await res.json().catch(() => ({})) as { error?: string };
      if (!res.ok) {
        setBusy(false);
        setMessage(res.status === 404
          ? 'This report is no longer on the server, so it cannot be continued. Start a new one.'
          : body.error || `Could not continue (error ${res.status}).`);
      }
    } catch {
      setBusy(false);
      setMessage('Could not reach the server. Try again.');
    }
  }

  if (!show && !busy) return null;

  return (
    <div style={{
      margin: '16px 0', padding: '14px 16px', borderRadius: 10,
      border: '1px solid #F5C26B', background: '#FFF8EB', color: '#7A4B00',
      display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
    }}>
      <div style={{ flex: '1 1 280px', fontSize: 14, lineHeight: 1.5 }}>
        <strong style={{ display: 'block', marginBottom: 2 }}>
          {busy ? 'Continuing the report…' : 'This report is incomplete'}
        </strong>
        {busy
          ? 'Writing only the missing parts. Everything already written is kept.'
          : message || job?.incompleteReason || 'It stopped before it finished.'}
        {!busy && /credit/i.test(message || job?.incompleteReason || '') && (
          <span style={{ display: 'block', marginTop: 4 }}>It will continue on its own once credits are added.</span>
        )}
      </div>
      <button
        type="button"
        onClick={handleContinue}
        disabled={busy}
        style={{
          padding: '9px 18px', borderRadius: 8, border: 'none', cursor: busy ? 'default' : 'pointer',
          background: busy ? '#D9B36B' : '#B86E00', color: '#FFFFFF', fontWeight: 600, fontSize: 14,
        }}
      >
        {busy ? 'Continuing…' : 'Continue report'}
      </button>
    </div>
  );
}
