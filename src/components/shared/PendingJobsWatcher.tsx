'use client';
import { useEffect } from 'react';
import { loadPendingJobs, removePendingJob, autoSaveToHistory } from '@/lib/pendingJobs';

export default function PendingJobsWatcher() {
  useEffect(() => {
    const poll = async () => {
      const pending = loadPendingJobs();
      if (pending.length === 0) return;
      for (const record of pending) {
        // Skip very recent jobs (< 30s) to avoid double-saving on the same page
        const age = Date.now() - new Date(record.startedAt).getTime();
        if (age < 30000) continue;
        try {
          const res = await fetch(`${record.endpoint}/${record.jobId}`);
          if (!res.ok) {
            // 404/500 = job gone (server restarted), discard
            if (res.status === 404 || res.status >= 500) removePendingJob(record.jobId);
            continue;
          }
          const data = await res.json();
          if (data.status === 'complete') {
            autoSaveToHistory(record, data);
            removePendingJob(record.jobId);
          } else if (data.status === 'error') {
            removePendingJob(record.jobId);
          }
        } catch { /* network error — keep polling */ }
      }
    };

    poll(); // immediate check on mount
    const interval = setInterval(poll, 20000); // then every 20s
    return () => clearInterval(interval);
  }, []);

  return null;
}
