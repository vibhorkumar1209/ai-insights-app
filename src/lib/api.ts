import { BenchmarkJob, Competitor, CompetitionBenchmarkingInput, CompetitionBenchmarkingResult, JobPostingInput, JobDescriptionParserResult } from './types';
import { API_ENDPOINTS } from './config';

export async function discoverCompetitors(
  targetCompany: string,
  industryContext?: string,
  companyDomain?: string
): Promise<Competitor[]> {
  const body: Record<string, string> = { targetCompany };
  if (industryContext) body.industryContext = industryContext;
  if (companyDomain) body.companyDomain = companyDomain;

  const res = await fetch(API_ENDPOINTS.competitors, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  const data = await res.json();

  // Validate response structure
  if (!Array.isArray(data.competitors)) {
    console.error('[API] Invalid competitors response structure:', data);
    throw new Error('Invalid competitors response: missing or invalid competitors array');
  }

  return data.competitors as Competitor[];
}

export async function startBenchmark(payload: {
  userOrganization: string;
  targetCompany: string;
  industryContext?: string;
  focusAreas?: string;
  solutionPortfolio?: string;
  additionalContext?: string;
  selectedCompetitors: string[];
}): Promise<string> {
  const res = await fetch(API_ENDPOINTS.benchmark, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  const data = await res.json();
  return data.jobId as string;
}

export function streamBenchmarkProgress(
  jobId: string,
  onProgress: (job: Partial<BenchmarkJob>) => void,
  onComplete: (job: BenchmarkJob) => void,
  onError: (err: string) => void
): () => void {
  const es = new EventSource(API_ENDPOINTS.benchmarkStream(jobId));

  es.addEventListener('progress', (e) => {
    try {
      const data = JSON.parse(e.data);
      // Validate required fields for progress updates
      if (!data.jobId || data.status === undefined) {
        console.warn('[Stream] Progress update missing required fields:', { data });
        return;
      }
      onProgress(data);
    } catch (err) {
      console.error('[Stream] Progress parse error:', err, 'raw data:', e.data?.substring(0, 200));
      onError('Failed to parse progress update - please refresh');
    }
  });

  es.addEventListener('result', (e) => {
    try {
      const data = JSON.parse(e.data);
      // Validate result has required fields
      if (!data.jobId || !data.status) {
        console.error('[Stream] Result missing required fields:', { data });
        onError('Invalid result data received from server');
        es.close();
        return;
      }
      onComplete(data);
    } catch (err) {
      console.error('[Stream] Result parse error:', err, 'raw data:', e.data?.substring(0, 200));
      onError('Failed to parse result - please refresh page');
    }
    es.close();
  });

  es.addEventListener('error', (e) => {
    try {
      const rawData = (e as MessageEvent).data || '{}';
      const data = JSON.parse(rawData) as { error?: string };
      // Provide specific error message if available, otherwise report connection issue
      if (data.error) {
        onError(`Server error: ${data.error}`);
      } else {
        console.error('[Stream] Server error event without error message:', rawData);
        onError('Connection lost - benchmark may have failed');
      }
    } catch (parseErr) {
      console.error('[Stream] Error handler parse failure:', parseErr);
      onError('Connection error - please check your internet and refresh');
    }
    es.close();
  });

  return () => es.close();
}

export async function startCompetitionBenchmarking(payload: CompetitionBenchmarkingInput): Promise<string> {
  const res = await fetch(API_ENDPOINTS.competitionBenchmarking, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  const data = await res.json();
  return data.jobId as string;
}

export async function startJobDescriptionParser(postings: JobPostingInput[]): Promise<string> {
  const res = await fetch(API_ENDPOINTS.jobDescriptionParser, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ postings }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  const data = await res.json();
  return data.jobId as string;
}

export function streamJobDescriptionParserProgress(
  jobId: string,
  onProgress: (job: Partial<JobDescriptionParserResult>) => void,
  onComplete: (job: JobDescriptionParserResult) => void,
  onError: (err: string) => void
): () => void {
  const es = new EventSource(API_ENDPOINTS.jobDescriptionParserStream(jobId));

  es.addEventListener('progress', (e) => {
    try {
      const data = JSON.parse(e.data);
      if (!data.jobId || data.status === undefined) {
        console.warn('[Stream] Progress update missing required fields:', { data });
        return;
      }
      onProgress(data);
    } catch (err) {
      console.error('[Stream] Progress parse error:', err, 'raw data:', e.data?.substring(0, 200));
      onError('Failed to parse progress update - please refresh');
    }
  });

  es.addEventListener('result', (e) => {
    try {
      const data = JSON.parse(e.data);
      if (!data.jobId || !data.status) {
        console.error('[Stream] Result missing required fields:', { data });
        onError('Invalid result data received from server');
        es.close();
        return;
      }
      onComplete(data);
    } catch (err) {
      console.error('[Stream] Result parse error:', err, 'raw data:', e.data?.substring(0, 200));
      onError('Failed to parse result - please refresh page');
    }
    es.close();
  });

  es.addEventListener('error', (e) => {
    try {
      const rawData = (e as MessageEvent).data || '{}';
      const data = JSON.parse(rawData) as { error?: string };
      if (data.error) {
        onError(`Server error: ${data.error}`);
      } else {
        console.error('[Stream] Server error event without error message:', rawData);
        onError('Connection lost - parsing may have failed');
      }
    } catch (parseErr) {
      console.error('[Stream] Error handler parse failure:', parseErr);
      onError('Connection error - please check your internet and refresh');
    }
    es.close();
  });

  return () => es.close();
}

export function streamCompetitionBenchmarkingProgress(
  jobId: string,
  onProgress: (job: Partial<CompetitionBenchmarkingResult>) => void,
  onComplete: (job: CompetitionBenchmarkingResult) => void,
  onError: (err: string) => void
): () => void {
  const es = new EventSource(API_ENDPOINTS.competitionBenchmarkingStream(jobId));

  es.addEventListener('progress', (e) => {
    try {
      const data = JSON.parse(e.data);
      if (!data.jobId || data.status === undefined) {
        console.warn('[Stream] Progress update missing required fields:', { data });
        return;
      }
      onProgress(data);
    } catch (err) {
      console.error('[Stream] Progress parse error:', err, 'raw data:', e.data?.substring(0, 200));
      onError('Failed to parse progress update - please refresh');
    }
  });

  es.addEventListener('result', (e) => {
    try {
      const data = JSON.parse(e.data);
      if (!data.jobId || !data.status) {
        console.error('[Stream] Result missing required fields:', { data });
        onError('Invalid result data received from server');
        es.close();
        return;
      }
      onComplete(data);
    } catch (err) {
      console.error('[Stream] Result parse error:', err, 'raw data:', e.data?.substring(0, 200));
      onError('Failed to parse result - please refresh page');
    }
    es.close();
  });

  es.addEventListener('error', (e) => {
    try {
      const rawData = (e as MessageEvent).data || '{}';
      const data = JSON.parse(rawData) as { error?: string };
      if (data.error) {
        onError(`Server error: ${data.error}`);
      } else {
        console.error('[Stream] Server error event without error message:', rawData);
        onError('Connection lost - report generation may have failed');
      }
    } catch (parseErr) {
      console.error('[Stream] Error handler parse failure:', parseErr);
      onError('Connection error - please check your internet and refresh');
    }
    es.close();
  });

  return () => es.close();
}
