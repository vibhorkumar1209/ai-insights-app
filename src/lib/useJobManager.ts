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
 * Generic job manager hook for handling async API jobs with streaming progress
 * @template TJob - The job state type
 * @param callbacks - Progress, completion, and error callbacks
 * @returns Job state and control functions
 */
export function useJobManager<TJob extends { jobId: string; status: string }>(
  callbacks?: JobManagerCallbacks<TJob>
) {
  const [job, setJob] = useState<TJob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const abortRef = useRef(false);

  /**
   * Start a new job and subscribe to progress updates
   */
  const startJob = useCallback(
    async (options: StartJobOptions<unknown>) => {
      try {
        setError(null);
        abortRef.current = false;

        // Step 1: Initial API call
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

        // Initialize job state immediately with pending status
        // This ensures isLoading becomes true before EventSource events arrive
        const initialJob = {
          jobId,
          status: 'pending',
          progress: 0,
          createdAt: new Date().toISOString(),
        } as TJob;
        setJob(initialJob);

        // Call onProgress callback immediately to notify caller that job has started
        callbacks?.onProgress?.(initialJob);

        // Step 2: Subscribe to progress stream
        const streamUrl = options.streamUrlFactory(jobId);
        const es = new EventSource(streamUrl);
        eventSourceRef.current = es;

        // Progress listener
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

        // Result listener
        es.addEventListener('result', (e) => {
          if (abortRef.current) return;
          try {
            const data = JSON.parse(e.data) as TJob;
            setJob(data);
            callbacks?.onComplete?.(data);
          } catch (err) {
            console.error('[JobManager] Result parse error:', err);
            setError('Failed to parse result - please refresh');
          }
          es.close();
        });

        // Error listener
        es.addEventListener('error', (e) => {
          if (abortRef.current) return;
          try {
            const data = JSON.parse((e as MessageEvent).data || '{}') as { error?: string };
            const errMsg = data.error || 'Connection lost - benchmark may have failed';
            setError(errMsg);
            callbacks?.onError?.(errMsg);
          } catch {
            setError('Connection error - please refresh');
          }
          es.close();
        });
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Failed to start job';
        setError(errMsg);
        callbacks?.onError?.(errMsg);
      }
    },
    [callbacks]
  );

  /**
   * Cancel the current job and cleanup
   */
  const cancelJob = useCallback(() => {
    abortRef.current = true;
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setJob(null);
    setError(null);
  }, []);

  /**
   * Reset job state (for starting fresh)
   */
  const reset = useCallback(() => {
    cancelJob();
  }, [cancelJob]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

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
