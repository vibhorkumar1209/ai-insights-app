import { BenchmarkJob, Competitor } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function discoverCompetitors(
  targetCompany: string,
  industryContext: string
): Promise<Competitor[]> {
  const res = await fetch(`${API_URL}/api/competitors`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetCompany, industryContext }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  const data = await res.json();
  return data.competitors as Competitor[];
}

export async function startBenchmark(payload: {
  userOrganization: string;
  targetCompany: string;
  industryContext: string;
  focusAreas?: string;
  solutionPortfolio?: string;
  additionalContext?: string;
  selectedCompetitors: string[];
}): Promise<string> {
  const res = await fetch(`${API_URL}/api/benchmark`, {
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

export async function getJobStatus(jobId: string): Promise<BenchmarkJob> {
  const res = await fetch(`${API_URL}/api/benchmark/${jobId}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export function streamBenchmarkProgress(
  jobId: string,
  onProgress: (job: Partial<BenchmarkJob>) => void,
  onComplete: (job: BenchmarkJob) => void,
  onError: (err: string) => void
): () => void {
  const es = new EventSource(`${API_URL}/api/benchmark/${jobId}/stream`);

  es.addEventListener('progress', (e) => {
    try {
      const data = JSON.parse(e.data);
      onProgress(data);
    } catch {}
  });

  es.addEventListener('result', (e) => {
    try {
      const data = JSON.parse(e.data);
      onComplete(data);
    } catch {}
    es.close();
  });

  es.addEventListener('error', (e) => {
    try {
      const data = JSON.parse((e as MessageEvent).data || '{}');
      onError(data.error || 'Stream error');
    } catch {
      onError('Connection error');
    }
    es.close();
  });

  return () => es.close();
}
