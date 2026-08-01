// Backward-compatibility adapter for Spend module history entries saved
// before the 2026-07-29/30 output-format restructure (commits e649adc,
// 6b607dc in ai-insights-api). Those entries are static JSON snapshots in
// localStorage — they're never re-fetched from the API, so a report saved
// under the old flat schema (itBreakdown/erdBreakdown as flat arrays,
// itSpend/rdSpend/aiSpend as the disclosed-line SpendLineItem) would
// otherwise render blank forever once the page code moved to the new
// nested itSpend/erdSpend payload shape. This reshapes an old-format
// record into the current SpendResult shape client-side, using the exact
// same values already computed and saved — no numbers are recalculated,
// only regrouped/renamed to match the new field layout.

import { SpendResult, SpendLineItem, SpendBreakdownNode, ItSpendPayload, ErdSpendPayload } from '@ai-insights/types';

interface LegacyLevel3Row { level1: string; level2: string; level3: string; pctOfBudget: number; usdMillion: number }
interface LegacyErdCategoryRow { level1: string; level2: string; category: string; basePct: number; adjPct: number; finalPct: number; usdMillion: number }
interface LegacyEmergingTechRow { tech: string; pctOfIt: number; usdMillion: number }
interface LegacyTrendPoint { year: number; usdMillion: number }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LegacyOrCurrent = SpendResult & Record<string, any>;

const YEARS = [2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030];
function getBaseYear(): number {
  const month = new Date().getMonth() + 1;
  return month <= 9 ? new Date().getFullYear() - 1 : new Date().getFullYear();
}
function cagr(startValue: number, endValue: number, years: number): number {
  if (startValue <= 0 || years <= 0) return 0;
  return (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
}

function buildTreeFromFlatIt(rows: LegacyLevel3Row[]): SpendBreakdownNode[] {
  const l1Order: string[] = [];
  const l1Map = new Map<string, Map<string, LegacyLevel3Row[]>>();
  for (const row of rows) {
    if (!l1Map.has(row.level1)) { l1Map.set(row.level1, new Map()); l1Order.push(row.level1); }
    const l2Map = l1Map.get(row.level1)!;
    if (!l2Map.has(row.level2)) l2Map.set(row.level2, []);
    l2Map.get(row.level2)!.push(row);
  }
  return l1Order.map((l1Name) => {
    const l2Map = l1Map.get(l1Name)!;
    let l1Value = 0, l1Pct = 0;
    const l2Nodes: SpendBreakdownNode[] = Array.from(l2Map.entries()).map(([l2Name, itemRows]) => {
      const l3Nodes: SpendBreakdownNode[] = itemRows.map((r) => ({
        id: `L3-${l1Name}-${l2Name}-${r.level3}`, name: r.level3, level: 2, value: r.usdMillion, percentage: r.pctOfBudget * 100,
      }));
      const l2Value = itemRows.reduce((s, r) => s + r.usdMillion, 0);
      const l2Pct = itemRows.reduce((s, r) => s + r.pctOfBudget, 0) * 100;
      l1Value += l2Value; l1Pct += l2Pct;
      return { id: `L2-${l1Name}-${l2Name}`, name: l2Name, level: 1, value: l2Value, percentage: l2Pct, children: l3Nodes };
    });
    return { id: `L1-${l1Name}`, name: l1Name, level: 0, value: l1Value, percentage: l1Pct, children: l2Nodes };
  });
}

function buildTreeFromFlatErd(rows: LegacyErdCategoryRow[]): SpendBreakdownNode[] {
  const l1Order: string[] = [];
  const l1Map = new Map<string, Map<string, LegacyErdCategoryRow[]>>();
  for (const row of rows) {
    if (!l1Map.has(row.level1)) { l1Map.set(row.level1, new Map()); l1Order.push(row.level1); }
    const l2Map = l1Map.get(row.level1)!;
    if (!l2Map.has(row.level2)) l2Map.set(row.level2, []);
    l2Map.get(row.level2)!.push(row);
  }
  return l1Order.map((l1Name) => {
    const l2Map = l1Map.get(l1Name)!;
    let l1Value = 0, l1Pct = 0;
    const l2Nodes: SpendBreakdownNode[] = Array.from(l2Map.entries()).map(([l2Name, categoryRows]) => {
      const l3Nodes: SpendBreakdownNode[] = categoryRows.map((r) => ({
        id: `L3-${l1Name}-${l2Name}-${r.category}`, name: r.category, level: 2, value: r.usdMillion, percentage: r.finalPct * 100,
      }));
      const l2Value = categoryRows.reduce((s, r) => s + r.usdMillion, 0);
      const l2Pct = categoryRows.reduce((s, r) => s + r.finalPct, 0) * 100;
      l1Value += l2Value; l1Pct += l2Pct;
      return { id: `L2-${l1Name}-${l2Name}`, name: l2Name, level: 1, value: l2Value, percentage: l2Pct, children: l3Nodes };
    });
    return { id: `L1-${l1Name}`, name: l1Name, level: 0, value: l1Value, percentage: l1Pct, children: l2Nodes };
  });
}

function buildTrends<T extends { year: number; usdMillion: number }>(
  points: T[],
  revenueUsdMillion: number | undefined,
  spendKey: string,
  yoyKey: string,
  pctKey: string
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): any[] {
  let prev: number | null = null;
  return points.map((p) => {
    const yoy = prev != null && prev !== 0 ? ((p.usdMillion - prev) / Math.abs(prev)) * 100 : 0;
    prev = p.usdMillion;
    const pct = revenueUsdMillion ? (p.usdMillion / revenueUsdMillion) * 100 : 0;
    return { year: p.year, [spendKey]: p.usdMillion, [yoyKey]: yoy, [pctKey]: pct };
  });
}

function cagrFromTrend(points: LegacyTrendPoint[]): { historical: number; forecast: number } {
  if (points.length === 0) return { historical: 0, forecast: 0 };
  const baseIdx = Math.max(0, YEARS.indexOf(getBaseYear()));
  const idx = Math.min(baseIdx, points.length - 1);
  const lastIdx = points.length - 1;
  return {
    historical: cagr(points[0].usdMillion, points[idx].usdMillion, idx),
    forecast: cagr(points[idx].usdMillion, points[lastIdx].usdMillion, lastIdx - idx),
  };
}

/** True if this record already has the current nested itSpend/erdSpend shape. */
function isCurrentFormat(raw: LegacyOrCurrent): boolean {
  return raw.itSpend == null || Array.isArray(raw.itSpend?.itBreakdown);
}

/**
 * Reshapes an old-format Spend job (flat itBreakdown/erdBreakdown, old
 * itSpend/rdSpend/aiSpend disclosed-line fields) into the current
 * SpendResult shape. No-op if the record is already current format.
 */
export function normalizeSpendResult(raw: LegacyOrCurrent): SpendResult {
  if (isCurrentFormat(raw)) return raw as SpendResult;

  const revenueUsdMillion = raw.revenueUsdMillion as number | undefined;

  let itSpend: ItSpendPayload | undefined;
  const legacyItBreakdown = raw.itBreakdown as LegacyLevel3Row[] | undefined;
  if (legacyItBreakdown && legacyItBreakdown.length > 0) {
    const legacyTrend = (raw.itSpendTrend as LegacyTrendPoint[] | undefined) ?? [];
    const cagrResult = cagrFromTrend(legacyTrend);
    const legacyEmergingTech = (raw.emergingTechBreakdown as LegacyEmergingTechRow[] | undefined) ?? [];
    itSpend = {
      region: raw.resolvedRegion || '',
      trends: buildTrends(legacyTrend, revenueUsdMillion, 'itSpend', 'itYoY', 'itPercent'),
      country: raw.geography || '',
      revenue: revenueUsdMillion ?? 0,
      industry: raw.resolvedIndustry || '',
      companyName: raw.companyName,
      itBreakdown: buildTreeFromFlatIt(legacyItBreakdown),
      currencyInfo: { currency: 'USD', revenueUSD: revenueUsdMillion ?? 0, exchangeRateToUSD: 1 },
      emergingTech: legacyEmergingTech.map((r) => ({ name: r.tech, value: r.usdMillion, adjTotal: r.pctOfIt * 100 })),
      itCAGR_Forecast: cagrResult.forecast,
      itCAGR_Historical: cagrResult.historical,
    };
  }

  let erdSpend: ErdSpendPayload | undefined;
  const legacyErdBreakdown = raw.erdBreakdown as LegacyErdCategoryRow[] | undefined;
  if (raw.erdApplicable && legacyErdBreakdown && legacyErdBreakdown.length > 0) {
    const legacyTrend = (raw.erdSpendTrend as LegacyTrendPoint[] | undefined) ?? [];
    const cagrResult = cagrFromTrend(legacyTrend);
    erdSpend = {
      region: raw.resolvedRegion || '',
      trends: buildTrends(legacyTrend, revenueUsdMillion, 'erdSpend', 'erdYoY', 'erdPercent'),
      country: raw.geography || '',
      revenue: revenueUsdMillion ?? 0,
      industry: raw.resolvedIndustry || '',
      companyName: raw.companyName,
      currencyInfo: { currency: 'USD', revenueUSD: revenueUsdMillion ?? 0, exchangeRateToUSD: 1 },
      erdBreakdown: buildTreeFromFlatErd(legacyErdBreakdown),
      erdCAGR_Forecast: cagrResult.forecast,
      erdCAGR_Historical: cagrResult.historical,
    };
  }

  return {
    ...raw,
    itSpendDisclosed: (raw as Record<string, unknown>).itSpend as SpendLineItem | undefined,
    rdSpendDisclosed: (raw as Record<string, unknown>).rdSpend as SpendLineItem | undefined,
    aiSpendDisclosed: (raw as Record<string, unknown>).aiSpend as SpendLineItem | undefined,
    itSpend,
    erdSpend,
  };
}
