import { saveToHistory, type ModuleType } from './history';

const PENDING_KEY = 'ai_insights_pending_jobs';

export interface PendingJobRecord {
  jobId: string;
  endpoint: string;       // base endpoint, polling uses GET ${endpoint}/${jobId}
  moduleType: ModuleType;
  targetCompany: string;
  startedAt: string;
}

export function savePendingJob(record: PendingJobRecord): void {
  if (typeof window === 'undefined') return;
  try {
    const current = loadPendingJobs();
    // Replace if same jobId exists
    const filtered = current.filter((j) => j.jobId !== record.jobId);
    localStorage.setItem(PENDING_KEY, JSON.stringify([...filtered, record]));
  } catch {}
}

export function removePendingJob(jobId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const current = loadPendingJobs().filter((j) => j.jobId !== jobId);
    localStorage.setItem(PENDING_KEY, JSON.stringify(current));
  } catch {}
}

export function loadPendingJobs(): PendingJobRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function autoSaveToHistory(record: PendingJobRecord, job: any): void {
  const completedAt = job.completedAt || new Date().toISOString();
  const base = { moduleType: record.moduleType, targetCompany: record.targetCompany, completedAt };

  switch (record.moduleType) {
    case 'industry-blog':
      saveToHistory({ ...base, blogTitle: job.title, blogContent: job.content, blogHashtags: job.hashtags });
      break;
    case 'industry-thought-leadership':
      saveToHistory({ ...base, thoughtLeadershipTitle: job.title, thoughtLeadershipContent: job.content });
      break;
    case 'technology-heat-map':
      saveToHistory({ ...base, techHeatMapRows: job.rows, techHeatMapHeadline: job.headline, techHeatMapGeography: job.geography });
      break;
    case 'challenges-growth':
      saveToHistory({ ...base, challengesGrowthRows: job.rows });
      break;
    case 'key-buyers':
      saveToHistory({ ...base, keyBuyerRows: job.rows });
      break;
    case 'business-themes':
    case 'technology-themes':
    case 'sustainability':
      saveToHistory({ ...base, themeRows: job.rows, themeType: job.themeType });
      break;
    case 'niche-industries':
      saveToHistory({ ...base, nicheTopics: job.topics, nicheIndustryVertical: job.industry });
      break;
    case 'business-segments':
      saveToHistory({ ...base, businessSegmentsData: job });
      break;
    case 'business-timelines':
      saveToHistory({ ...base, businessTimelinesData: job });
      break;
    case 'financial-analysis':
      saveToHistory({ ...base, financialData: job });
      break;
    case 'sales-play':
      saveToHistory({ ...base, salesPlayData: job });
      break;
    case 'marketing-strategy':
      saveToHistory({ ...base, strategyFramework: job.framework, strategyDimensions: job.dimensions, strategySummary: job.summary, strategyRecommendations: job.recommendations, strategyIndustry: job.industry });
      break;
    case 'industry-trends':
      saveToHistory({ ...base, industryBusinessTrends: job.businessTrends, industryTechTrends: job.techTrends, industryGeography: job.geography });
      break;
    default:
      // For other modules, save minimal entry so it appears in history
      saveToHistory(base);
  }
}
