import { BenchmarkDimension, GapAnalysisRow } from './types';

const HISTORY_KEY = 'ai_insights_benchmark_history';
const MAX_ENTRIES = 8;

export interface HistoryEntry {
  id: string;
  targetCompany: string;
  userOrganization: string;
  industryContext: string;
  completedAt: string;
  selectedPeers: string[];
  benchmarkingTable: BenchmarkDimension[];
  gapAnalysis: GapAnalysisRow[];
}

export function loadHistory(): HistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

export function saveToHistory(entry: Omit<HistoryEntry, 'id'>): void {
  if (typeof window === 'undefined') return;
  try {
    const current = loadHistory();
    // Deduplicate by targetCompany + completedAt
    const filtered = current.filter(
      (e) => !(e.targetCompany === entry.targetCompany && e.completedAt === entry.completedAt)
    );
    const newEntry: HistoryEntry = { id: Date.now().toString(), ...entry };
    const updated = [newEntry, ...filtered].slice(0, MAX_ENTRIES);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch {
    // localStorage unavailable (SSR, private browsing quota exceeded)
  }
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
