import type { BenchmarkDimension, GapAnalysisRow, ThemeRow, ThemeType, ChallengesGrowthRow, KeyBuyerRow, IndustryTrendRow, IndustryReportScope, MarketSizingData, ReportSection, ExecutiveSummary, NicheTopicRow, StrategyDimensionRow, StrategyFramework, BusinessSegment, TimelineBlock, StrategicEvolutionBullet, TechHeatMapRow, SalesPlay2Result, ConsultingIntelligenceJob, VucaAnalysisJob, FirmographicResult, OutsourcingReportResult, GccSalesPlayResult, SpendResult } from '@ai-insights/types';
import type { FinancialAnalysisJob, SalesPlayJob, BusinessSegmentsJob, BusinessTimelinesJob } from './types';

export type ModuleType =
  | 'peer-benchmarking'
  | 'business-themes'
  | 'technology-themes'
  | 'sustainability'
  | 'challenges-growth'
  | 'financial-analysis'
  | 'sales-play'
  | 'sales-play-2'
  | 'key-buyers'
  | 'industry-trends'
  | 'industry-report'
  | 'business-description'
  | 'peers'
  | 'niche-industries'
  | 'marketing-strategy'
  | 'business-segments'
  | 'business-timelines'
  | 'industry-blog'
  | 'industry-thought-leadership'
  | 'technology-heat-map'
  | 'consulting-intelligence'
  | 'vuca-analysis'
  | 'firmographic'
  | 'spend'
  | 'industry-outsourcing-report'
  | 'gcc-sales-play';

// v2 key — avoids collision with old benchmark-only store
const HISTORY_KEY = 'ai_insights_history_v2';
const MAX_ENTRIES = 30;

export interface HistoryEntry {
  id: string;
  moduleType: ModuleType;
  targetCompany: string;    // company name across all modules
  completedAt: string;

  // ── Peer Benchmarking ────────────────────────────────────────────
  userOrganization?: string;
  industryContext?: string;
  selectedPeers?: string[];
  benchmarkingTable?: BenchmarkDimension[];
  gapAnalysis?: GapAnalysisRow[];

  // ── Themes (business / technology / sustainability) ───────────────
  themeType?: ThemeType;
  themeRows?: ThemeRow[];

  // ── Challenges & Growth ───────────────────────────────────────────
  challengesGrowthRows?: ChallengesGrowthRow[];

  // ── Financial Analysis ────────────────────────────────────────────
  financialData?: FinancialAnalysisJob;

  // ── Sales Play & Opportunity ──────────────────────────────────────
  salesPlayData?: SalesPlayJob;

  // ── Key Opinion Leaders ──────────────────────────────────────
  keyBuyerRows?: KeyBuyerRow[];

  // ── Industry Trends ─────────────────────────────────────────────
  industryBusinessTrends?: IndustryTrendRow[];
  industryTechTrends?: IndustryTrendRow[];
  industryGeography?: string;

  // ── Business Description ─────────────────────────────────────────────
  businessDescription?: string;
  companyDomain?: string;

  // ── Firmographic ──────────────────────────────────────────────────────
  firmographicData?: FirmographicResult;

  // ── Spend ─────────────────────────────────────────────────────────────
  spendData?: SpendResult;

  // ── Industry Outsourcing Report ──────────────────────────────────────
  outsourcingReportData?: OutsourcingReportResult;

  // ── GCC Sales Play ─────────────────────────────────────────────────────
  gccSalesPlayData?: GccSalesPlayResult;

  // ── Peers ───────────────────────────────────────────────────────────
  peerCompanies?: { name: string; description: string; estimatedRevenue?: string; employees?: string }[];

  // ── Industry Report ───────────────────────────────────────────────────
  industryReportQuery?: string;
  industryReportScope?: IndustryReportScope;
  industryReportSections?: ReportSection[];
  industryReportMarketSizing?: MarketSizingData;
  industryReportExecutiveSummary?: ExecutiveSummary;

  // ── High Growth Niche Industries ──────────────────────────────────────
  nicheTopics?: NicheTopicRow[];
  nicheIndustryVertical?: string;

  // ── Marketing Strategy ───────────────────────────────────────────────
  strategyFramework?: StrategyFramework;
  strategyIndustry?: string;
  strategyDimensions?: StrategyDimensionRow[];
  strategySummary?: string;
  strategyRecommendations?: string[];

  // ── Business Segments ────────────────────────────────────────────────
  businessSegments?: BusinessSegment[];
  businessSegmentsData?: BusinessSegmentsJob;

  // ── Business Timelines ────────────────────────────────────────────────
  timelineBlocks?: TimelineBlock[];
  businessTimelinesData?: BusinessTimelinesJob;

  // ── Strategic Evolution (shared) ─────────────────────────────────────
  strategicEvolution?: StrategicEvolutionBullet[];

  // ── Industry Blog ─────────────────────────────────────────────────────────
  blogContent?: string;
  blogHashtags?: string[];
  blogTitle?: string;

  // ── Industry Thought Leadership ───────────────────────────────────────────
  thoughtLeadershipContent?: string;
  thoughtLeadershipTitle?: string;

  // ── Technology Heat Map ───────────────────────────────────────────────────────
  techHeatMapRows?: TechHeatMapRow[];
  techHeatMapHeadline?: string;
  techHeatMapGeography?: string;

  // ── Sales Play II ─────────────────────────────────────────────────────────────
  salesPlay2Data?: SalesPlay2Result;

  // ── Consulting Intelligence ───────────────────────────────────────────────────
  consultingTopic?: string;
  consultingFirms?: string[];
  consultingResult?: ConsultingIntelligenceJob;

  // ── VUCA × 4W1H Analysis ─────────────────────────────────────────────────────
  vucaIndustry?: string;
  vucaGeography?: string;
  vucaResult?: VucaAnalysisJob;
}

// ── Read ──────────────────────────────────────────────────────────────────────

export function loadHistory(): HistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const entries: HistoryEntry[] = raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
    // Always return newest-first
    return entries.sort(
      (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    );
  } catch (err) {
    console.error('[History] Failed to load history from localStorage:', err instanceof Error ? err.message : String(err));
    // Attempt to clear corrupted data
    try {
      localStorage.removeItem(HISTORY_KEY);
      console.warn('[History] Cleared corrupted history data');
    } catch {
      console.error('[History] Could not clear corrupted data');
    }
    return [];
  }
}

export function loadEntryById(id: string): HistoryEntry | undefined {
  return loadHistory().find((e) => e.id === id);
}

// ── Write ─────────────────────────────────────────────────────────────────────

export function saveToHistory(entry: Omit<HistoryEntry, 'id'>): { success: boolean; error?: string } {
  if (typeof window === 'undefined') return { success: true }; // SSR context
  try {
    const current = loadHistory();
    // Deduplicate: same company + same module + same timestamp
    const filtered = current.filter(
      (e) =>
        !(
          e.targetCompany === entry.targetCompany &&
          e.moduleType === entry.moduleType &&
          e.completedAt === entry.completedAt
        )
    );
    const newEntry: HistoryEntry = { id: Date.now().toString(), ...entry };
    const updated = [newEntry, ...filtered].slice(0, MAX_ENTRIES);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    return { success: true };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[History] Failed to save to history:', errorMsg);

    // Check if it's a quota exceeded error
    if (errorMsg.includes('QuotaExceededError') || errorMsg.includes('quota')) {
      console.warn('[History] Storage quota exceeded - attempting to clear old entries');
      try {
        const current = loadHistory();
        if (current.length > 5) {
          const trimmed = current.slice(0, 5);
          localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
          // Try saving again
          const newEntry: HistoryEntry = { id: Date.now().toString(), ...entry };
          const updated = [newEntry, ...trimmed].slice(0, MAX_ENTRIES);
          localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
          return { success: true };
        }
      } catch (retryErr) {
        console.error('[History] Retry failed:', retryErr);
      }
      return { success: false, error: 'Storage full - please clear browser data' };
    }

    return { success: false, error: 'Failed to save analysis to history' };
  }
}

/** Remove a single entry by id */
export function deleteHistoryEntry(id: string): { success: boolean; error?: string } {
  if (typeof window === 'undefined') return { success: true };
  try {
    const current = loadHistory();
    const found = current.find((e) => e.id === id);
    if (!found) {
      console.warn(`[History] Entry ${id} not found`);
      return { success: false, error: 'Entry not found' };
    }
    const updated = current.filter((e) => e.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    return { success: true };
  } catch (err) {
    console.error('[History] Failed to delete entry:', err instanceof Error ? err.message : String(err));
    return { success: false, error: 'Failed to delete entry' };
  }
}

export function seedHistory(entry: HistoryEntry): void {
  if (typeof window === 'undefined') return;
  try {
    const current = loadHistory();
    // Replace existing entry with same id (upsert), or append
    const filtered = current.filter((e) => e.id !== entry.id);
    const updated = [...filtered, entry].slice(0, MAX_ENTRIES);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch {}
}

// ── Auto-seed from MarketIntel reports ─────────────────────────────────────────

const SEED_FLAG = 'ai_insights_seed_v7';

export async function seedMarketIntelReports(): Promise<{ success: boolean; count: number; error?: string }> {
  if (typeof window === 'undefined') return { success: true, count: 0 };
  try {
    if (localStorage.getItem(SEED_FLAG)) {
      // Already seeded
      return { success: true, count: 0 };
    }

    const res = await fetch('/seed-reports.json');
    if (!res.ok) {
      console.warn(`[History] Seed file not found (${res.status}) - skipping demo data load`);
      return { success: false, count: 0, error: `Seed file not available (${res.status})` };
    }

    const entries: HistoryEntry[] = await res.json();
    if (!Array.isArray(entries)) {
      console.error('[History] Seed data is not an array:', entries);
      return { success: false, count: 0, error: 'Invalid seed data format' };
    }

    let count = 0;
    let failedCount = 0;
    for (const entry of entries) {
      try {
        seedHistory(entry);
        count++;
      } catch (entryErr) {
        console.error('[History] Failed to seed entry:', entryErr);
        failedCount++;
      }
    }

    try {
      localStorage.setItem(SEED_FLAG, Date.now().toString());
    } catch (flagErr) {
      console.error('[History] Failed to mark seed as complete:', flagErr);
    }

    if (failedCount > 0) {
      console.warn(`[History] Seeded ${count}/${entries.length} entries (${failedCount} failed)`);
    } else {
      console.log(`[History] Successfully seeded ${count} demo reports`);
    }

    return { success: count > 0, count, error: failedCount > 0 ? `${failedCount} entries failed to load` : undefined };
  } catch (err) {
    console.error('[History] Seed operation failed:', err instanceof Error ? err.message : String(err));
    return { success: false, count: 0, error: 'Failed to load demo data' };
  }
}

// ── Cross-page restore helpers ────────────────────────────────────────────────

const RESTORE_KEY = 'ai_insights_pending_restore';

export function setPendingRestore(entryId: string): void {
  try { sessionStorage.setItem(RESTORE_KEY, entryId); } catch {}
}

export function popPendingRestore(): string | null {
  try {
    const id = sessionStorage.getItem(RESTORE_KEY);
    if (id) sessionStorage.removeItem(RESTORE_KEY);
    return id;
  } catch {
    return null;
  }
}
