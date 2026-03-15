import { BenchmarkDimension, GapAnalysisRow, ThemeRow, ThemeType, ChallengesGrowthRow, FinancialAnalysisJob, SalesPlayJob, KeyBuyerRow, IndustryTrendRow } from './types';

export type ModuleType =
  | 'peer-benchmarking'
  | 'business-themes'
  | 'technology-themes'
  | 'sustainability'
  | 'challenges-growth'
  | 'financial-analysis'
  | 'sales-play'
  | 'key-buyers'
  | 'industry-trends';

// v2 key — avoids collision with old benchmark-only store
const HISTORY_KEY = 'ai_insights_history_v2';
const MAX_ENTRIES = 20;

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

  // ── Key Prospective Buyers ──────────────────────────────────────
  keyBuyerRows?: KeyBuyerRow[];

  // ── Industry Trends ─────────────────────────────────────────────
  industryBusinessTrends?: IndustryTrendRow[];
  industryTechTrends?: IndustryTrendRow[];
  industryGeography?: string;
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
  } catch {
    return [];
  }
}

export function loadEntryById(id: string): HistoryEntry | undefined {
  return loadHistory().find((e) => e.id === id);
}

// ── Write ─────────────────────────────────────────────────────────────────────

export function saveToHistory(entry: Omit<HistoryEntry, 'id'>): void {
  if (typeof window === 'undefined') return;
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
  } catch {
    // quota exceeded or SSR
  }
}

/** Remove a single entry by id */
export function deleteHistoryEntry(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const updated = loadHistory().filter((e) => e.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch {}
}

export function seedHistory(entry: HistoryEntry): void {
  if (typeof window === 'undefined') return;
  try {
    const current = loadHistory();
    if (current.some((e) => e.id === entry.id)) return; // already seeded
    const updated = [...current, entry].slice(0, MAX_ENTRIES);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch {}
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
