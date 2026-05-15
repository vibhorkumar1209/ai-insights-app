/**
 * Generic hook for managing API job lifecycle with streaming progress updates
 * Reduces boilerplate across all module pages (~450-520 LOC saved)
 *
 * Handles:
 * - Initial API call to start job
 * - EventSource subscription for progress/result/error
 * - State updates during each phase
 * - Automatic cleanup on unmount
 * - Error handling and recovery
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { savePendingJob, removePendingJob } from './pendingJobs';
import type { ModuleType } from './history';

export interface JobState<T> {
  status: 'idle' | 'pending' | 'in_progress' | 'complete' | 'error';
  progress: number;
  currentStep?: string;
  error?: string;
  data?: T;
}

interface StartJobOptions<TStartPayload> {
  payload: TStartPayload;
  endpoint: string;
  streamUrlFactory: (jobId: string) => string;
  persist?: { moduleType: ModuleType; targetCompany: string };
}

interface JobManagerCallbacks<TJob> {
  onProgress?: (job: Partial<TJob>) => void;
  onComplete?: (job: TJob) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
}

/**
 * Generic job manager hook for handling async API jobs with streaming progress.
 * Falls back to polling the snapshot endpoint every 10s if SSE goes silent,
 * so long-running jobs (e.g. Sales Play ~3 min) still surface their result.
 */
export function useJobManager<TJob extends { jobId: string; status: string }>(
  callbacks?: JobManagerCallbacks<TJob>
) {
  const [job, setJob] = useState<TJob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStuck, setIsStuck] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stuckTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef(false);
  const jobIdRef = useRef<string | null>(null);
  const endpointRef = useRef<string | null>(null);
  const completedRef = useRef(false);
  const lastOptionsRef = useRef<StartJobOptions<unknown> | null>(null);

  const clearStuckTimer = useCallback(() => {
    if (stuckTimerRef.current) { clearTimeout(stuckTimerRef.current); stuckTimerRef.current = null; }
  }, []);

  const resetStuckTimer = useCallback(() => {
    clearStuckTimer();
    setIsStuck(false);
    stuckTimerRef.current = setTimeout(() => setIsStuck(true), 45000);
  }, [clearStuckTimer]);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const handleComplete = useCallback((data: TJob) => {
    if (completedRef.current) return;
    completedRef.current = true;
    stopPolling();
    clearStuckTimer();
    setIsStuck(false);
    setJob(data);
    if (jobIdRef.current) removePendingJob(jobIdRef.current);
    callbacks?.onComplete?.(data);
  }, [callbacks, stopPolling, clearStuckTimer]);

  const startPolling = useCallback((jobId: string, snapshotUrl: string) => {
    stopPolling();
    pollTimerRef.current = setInterval(async () => {
      if (abortRef.current || completedRef.current) { stopPolling(); return; }
      try {
        const res = await fetch(`${snapshotUrl}/${jobId}`);
        if (!res.ok) return;
        const data = await res.json() as TJob;
        setJob(data);
        callbacks?.onProgress?.(data);
        if (data.status === 'complete') {
          handleComplete(data);
          eventSourceRef.current?.close();
        } else if (data.status === 'error') {
          stopPolling();
          const errMsg = (data as unknown as { error?: string }).error || 'Job failed';
          setError(errMsg);
          callbacks?.onError?.(errMsg);
          eventSourceRef.current?.close();
        }
      } catch { /* network hiccup — keep polling */ }
    }, 10_000);
  }, [callbacks, handleComplete, stopPolling]);

  const startJob = useCallback(
    async (options: StartJobOptions<unknown>) => {
      try {
        lastOptionsRef.current = options;
        setError(null);
        setIsStuck(false);
        abortRef.current = false;
        completedRef.current = false;
        stopPolling();
        resetStuckTimer();

        const startRes = await fetch(options.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(options.payload),
        });

        if (!startRes.ok) {
          const body = await startRes.json().catch(() => ({}));
          throw new Error((body as { error?: string }).error || `HTTP ${startRes.status}`);
        }

        const { jobId } = (await startRes.json()) as { jobId: string };
        jobIdRef.current = jobId;
        endpointRef.current = options.endpoint;

        if (options.persist) {
          savePendingJob({ jobId, endpoint: options.endpoint, moduleType: options.persist.moduleType, targetCompany: options.persist.targetCompany, startedAt: new Date().toISOString() });
        }

        const initialJob = {
          jobId,
          status: 'pending',
          progress: 0,
          createdAt: new Date().toISOString(),
        } as TJob;
        setJob(initialJob);
        callbacks?.onProgress?.(initialJob);

        // Start polling as a fallback (SSE is primary, poll catches dropped connections)
        startPolling(jobId, options.endpoint);

        const streamUrl = options.streamUrlFactory(jobId);
        const es = new EventSource(streamUrl);
        eventSourceRef.current = es;

        es.addEventListener('progress', (e) => {
          if (abortRef.current) return;
          try {
            const data = JSON.parse(e.data) as Partial<TJob>;
            setJob((prev) => ({ ...(prev ?? ({} as TJob)), ...data }));
            callbacks?.onProgress?.(data);
            resetStuckTimer(); // any progress resets the stuck clock
          } catch (err) {
            console.error('[JobManager] Progress parse error:', err);
          }
        });

        es.addEventListener('result', (e) => {
          if (abortRef.current) return;
          try {
            const data = JSON.parse(e.data) as TJob;
            handleComplete(data);
          } catch (err) {
            console.error('[JobManager] Result parse error:', err);
            setError('Failed to parse result - please refresh');
          }
          es.close();
        });

        es.addEventListener('error', (e) => {
          if (abortRef.current || completedRef.current) return;
          console.warn('[JobManager] SSE error/disconnect — polling fallback active');
          try {
            const data = JSON.parse((e as MessageEvent).data || '{}') as { error?: string };
            if (data.error) {
              stopPolling();
              clearStuckTimer();
              setError(data.error);
              callbacks?.onError?.(data.error);
              es.close();
            }
          } catch { /* no data — keep polling */ }
        });
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Failed to start job';
        clearStuckTimer();
        setError(errMsg);
        callbacks?.onError?.(errMsg);
      }
    },
    [callbacks, startPolling, handleComplete, stopPolling, resetStuckTimer, clearStuckTimer]
  );

  const cancelJob = useCallback(() => {
    abortRef.current = true;
    completedRef.current = false;
    stopPolling();
    clearStuckTimer();
    setIsStuck(false);
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (jobIdRef.current) removePendingJob(jobIdRef.current);
    callbacks?.onCancel?.();
    setJob(null);
    setError(null);
  }, [stopPolling, clearStuckTimer, callbacks]);

  const reset = useCallback(() => {
    cancelJob();
  }, [cancelJob]);

  // Retry the last job from scratch using the same options
  const retryJob = useCallback(async () => {
    if (!lastOptionsRef.current) return;
    const opts = lastOptionsRef.current;
    cancelJob();
    // Small delay so state clears before re-starting
    await new Promise((r) => setTimeout(r, 100));
    await startJob(opts);
  }, [cancelJob, startJob]);

  useEffect(() => {
    return () => {
      stopPolling();
      clearStuckTimer();
      if (eventSourceRef.current) eventSourceRef.current.close();
    };
  }, [stopPolling, clearStuckTimer]);

  return {
    job,
    error,
    isStuck,
    startJob,
    cancelJob,
    retryJob,
    reset,
    isLoading: job?.status === 'pending' || job?.status === 'in_progress',
    isComplete: job?.status === 'complete',
  };
}
