// Computes real per-report token usage and $ cost for the Report History /
// Reports Library view — retroactively, from the usage logs already
// captured by the backend's usageLogger.ts (see ai-insights-api commits
// 9d4e07f / ec8fa6c). No backend changes needed: every Claude/Parallel.AI/
// Gemini call is already logged with a timestamp; a report's cost is just
// "sum everything logged within this report's generation window."
//
// Caveat surfaced in the UI rather than hidden: the usage log is in-memory
// on the backend and resets on every redeploy (same tradeoff as every job
// store in this app), so reports generated before the most recent deploy
// will show "usage data not available" rather than a fabricated number.

import { API_ENDPOINTS } from './config';
import type { HistoryEntry } from './history';

// ── Pricing — see the cost-analysis conversation this feature grew out of.
// Rates are looked up, not measured; token/call COUNTS below are real. ──────
const CLAUDE_SONNET_INPUT_PER_MTOK = 3;
const CLAUDE_SONNET_OUTPUT_PER_MTOK = 15;
const CLAUDE_HAIKU_INPUT_PER_MTOK = 1;
const CLAUDE_HAIKU_OUTPUT_PER_MTOK = 5;
const PARALLEL_COST_PER_CALL = 0.01;       // Parallel.AI Task API, base processor
const GOOGLE_CSE_COST_PER_CALL = 0.005;    // Google Custom Search JSON API
const GEMINI_INPUT_PER_MTOK = 0.30;
const GEMINI_OUTPUT_PER_MTOK = 2.50;       // also covers the non-prompt (thinking/tool-use) token gap — see the Gemini usage-logging conversation
const GEMINI_GROUNDING_COST_PER_CALL = 0.035;

export interface ReportUsageCost {
  claudeCalls: number;
  claudeInputTokens: number;
  claudeOutputTokens: number;
  claudeCostUsd: number;
  parallelCalls: number;
  parallelCostUsd: number;
  googleCseCalls: number;
  googleCseCostUsd: number;
  geminiCalls: number;
  geminiTokens: number;
  geminiCostUsd: number;
  totalCostUsd: number;
  windowApproximate: boolean; // true when no exact createdAt was available and a fallback lookback window was used
}

interface ClaudeUsageEntry { timestamp: string; source: string; model: string; inputTokens: number; outputTokens: number; }
interface ParallelUsageEntry { timestamp: string; source: string; processor: string; success: boolean; }
interface GeminiUsageEntry { timestamp: string; source: string; model: string; promptTokenCount: number; candidatesTokenCount: number; totalTokenCount: number; groundingUsed: boolean; }

export interface UsageLogs {
  claude: ClaudeUsageEntry[];
  parallel: ParallelUsageEntry[];
  gemini: GeminiUsageEntry[];
}

async function fetchRawEntries<T>(url: string): Promise<T[]> {
  try {
    const res = await fetch(`${url}?limit=5000`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.entries || []) as T[];
  } catch {
    return [];
  }
}

// Fetch all three usage logs ONCE per Reports Library page load — every
// row's cost is then derived from these same three arrays client-side,
// rather than each row firing its own 3 network calls.
export async function fetchAllUsageLogs(): Promise<UsageLogs> {
  const [claude, parallel, gemini] = await Promise.all([
    fetchRawEntries<ClaudeUsageEntry>(API_ENDPOINTS.usageClaudeRaw),
    fetchRawEntries<ParallelUsageEntry>(API_ENDPOINTS.usageParallelRaw),
    fetchRawEntries<GeminiUsageEntry>(API_ENDPOINTS.usageGeminiRaw),
  ]);
  return { claude, parallel, gemini };
}

// Nested job-data fields (per moduleType) known to carry `createdAt` — used
// to derive an EXACT usage window. Modules not listed here (ones that only
// store flat arrays on HistoryEntry, not a nested job object) fall back to
// an approximate lookback window from `completedAt` — flagged via
// `windowApproximate` rather than presented as exact.
const CREATED_AT_FIELD: Partial<Record<HistoryEntry['moduleType'], keyof HistoryEntry>> = {
  'financial-analysis': 'financialData',
  'sales-play': 'salesPlayData',
  'sales-play-2': 'salesPlay2Data',
  'firmographic': 'firmographicData',
  'spend': 'spendData',
  'industry-outsourcing-report': 'outsourcingReportData',
  'gcc-sales-play': 'gccSalesPlayData',
  'it-jobs': 'itJobData',
  'business-segments': 'businessSegmentsData',
  'business-timelines': 'businessTimelinesData',
  'consulting-intelligence': 'consultingResult',
  'vuca-analysis': 'vucaResult',
};

const FALLBACK_LOOKBACK_MS = 20 * 60 * 1000; // 20 min — generous for the slowest modules (Industry Report, region-chunked ones)

function getReportWindow(entry: HistoryEntry): { startMs: number; endMs: number; approximate: boolean } | null {
  const endMs = new Date(entry.completedAt).getTime();
  if (isNaN(endMs)) return null;

  const fieldName = CREATED_AT_FIELD[entry.moduleType];
  if (fieldName) {
    const nested = (entry as unknown as Record<string, { createdAt?: string } | undefined>)[fieldName as string];
    const startMs = nested?.createdAt ? new Date(nested.createdAt).getTime() : NaN;
    if (!isNaN(startMs)) return { startMs, endMs, approximate: false };
  }

  return { startMs: endMs - FALLBACK_LOOKBACK_MS, endMs, approximate: true };
}

export function computeReportUsageCost(entry: HistoryEntry, logs: UsageLogs): ReportUsageCost | null {
  const window = getReportWindow(entry);
  if (!window) return null;
  const { startMs, endMs, approximate } = window;
  const inWindow = (ts: string) => {
    const t = new Date(ts).getTime();
    return t >= startMs && t <= endMs;
  };

  const claude = logs.claude.filter((e) => inWindow(e.timestamp));
  const parallelAll = logs.parallel.filter((e) => inWindow(e.timestamp) && e.success);
  const gemini = logs.gemini.filter((e) => inWindow(e.timestamp));

  // Nothing logged in this window — most likely the report predates the
  // logging feature, or a redeploy since then wiped the in-memory log.
  // Returning null (not a zero-cost result) lets the UI say "not available"
  // instead of implying the report genuinely cost $0.
  if (claude.length === 0 && parallelAll.length === 0 && gemini.length === 0) return null;

  let claudeInputTokens = 0, claudeOutputTokens = 0, claudeCostUsd = 0;
  for (const c of claude) {
    claudeInputTokens += c.inputTokens;
    claudeOutputTokens += c.outputTokens;
    const isHaiku = c.model.includes('haiku');
    const inRate = isHaiku ? CLAUDE_HAIKU_INPUT_PER_MTOK : CLAUDE_SONNET_INPUT_PER_MTOK;
    const outRate = isHaiku ? CLAUDE_HAIKU_OUTPUT_PER_MTOK : CLAUDE_SONNET_OUTPUT_PER_MTOK;
    claudeCostUsd += (c.inputTokens / 1e6) * inRate + (c.outputTokens / 1e6) * outRate;
  }

  const parallelCalls = parallelAll.filter((p) => !p.source.startsWith('googleCSE:')).length;
  const googleCseCalls = parallelAll.filter((p) => p.source.startsWith('googleCSE:')).length;
  const parallelCostUsd = parallelCalls * PARALLEL_COST_PER_CALL;
  const googleCseCostUsd = googleCseCalls * GOOGLE_CSE_COST_PER_CALL;

  let geminiTokens = 0, geminiCostUsd = 0;
  for (const g of gemini) {
    geminiTokens += g.totalTokenCount;
    const nonPrompt = Math.max(g.totalTokenCount - g.promptTokenCount, 0);
    geminiCostUsd += (g.promptTokenCount / 1e6) * GEMINI_INPUT_PER_MTOK + (nonPrompt / 1e6) * GEMINI_OUTPUT_PER_MTOK;
    if (g.groundingUsed) geminiCostUsd += GEMINI_GROUNDING_COST_PER_CALL;
  }

  return {
    claudeCalls: claude.length,
    claudeInputTokens, claudeOutputTokens, claudeCostUsd,
    parallelCalls, parallelCostUsd,
    googleCseCalls, googleCseCostUsd,
    geminiCalls: gemini.length, geminiTokens, geminiCostUsd,
    totalCostUsd: claudeCostUsd + parallelCostUsd + googleCseCostUsd + geminiCostUsd,
    windowApproximate: approximate,
  };
}
