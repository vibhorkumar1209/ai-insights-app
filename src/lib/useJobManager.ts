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
}

interface JobManagerCallbacks<TJob> {
  onProgress?: (job: Partial<TJob>) => void;
  onComplete?: (job: TJob) => void;
  onError?: (error: string) => void;
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
  const eventSourceRef = useRef<EventSource | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = useRef(false);
  const jobIdRef = useRef<string | null>(null);
  const endpointRef = useRef<string | null>(null);
  const completedRef = useRef(false);

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
    setJob(data);
    callbacks?.onComplete?.(data);
  }, [callbacks, stopPolling]);

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
        setError(null);
        abortRef.current = false;
        completedRef.current = false;
        stopPolling();

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
          // SSE connection dropped — polling fallback will catch the result
          console.warn('[JobManager] SSE error/disconnect — polling fallback active');
          try {
            const data = JSON.parse((e as MessageEvent).data || '{}') as { error?: string };
            if (data.error) {
              stopPolling();
              setError(data.error);
              callbacks?.onError?.(data.error);
              es.close();
            }
          } catch { /* no data — keep polling */ }
        });
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Failed to start job';
        setError(errMsg);
        callbacks?.onError?.(errMsg);
      }
    },
    [callbacks, startPolling, handleComplete, stopPolling]
  );

  const cancelJob = useCallback(() => {
    abortRef.current = true;
    completedRef.current = false;
    stopPolling();
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setJob(null);
    setError(null);
  }, [stopPolling]);

  const reset = useCallback(() => {
    cancelJob();
  }, [cancelJob]);

  useEffect(() => {
    return () => {
      stopPolling();
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [stopPolling]);

  return {
    job,
    error,
    startJob,
    cancelJob,
    reset,
    isLoading: job?.status === 'pending' || job?.status === 'in_progress',
    isComplete: job?.status === 'complete',
  };
}
