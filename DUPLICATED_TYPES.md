# Duplicated Types - Future Consolidation

## Overview

This file documents TypeScript interfaces that are duplicated between the frontend (`src/lib/types.ts`) and backend (`ai-insights-api/src/types/index.ts`).

**Total Duplicates**: 50 interfaces
**Status**: Awaiting monorepo restructuring to consolidate

## List of All 50 Duplicated Types

### Market & Sizing Analysis
- `MarketSegmentOption` - Market segment selection
- `KeyPlayerOption` - Competitor player selection  
- `MarketSizingData` - TAM/SAM/SOM sizing data
- `MacroTEIData` - Total Economic Impact data
- `MacroTEIItem` - TEI calculation items

### Financial Data
- `QuarterlyDataPoint` - Q1/Q2/Q3/Q4 metrics
- `RevenueDataPoint` - Annual revenue tracking
- `MarginDataPoint` - Gross/operating/net margins
- `FinancialSegmentRow` - Business segment breakdowns
- `FinancialStatementRow` - Income statement items
- `GeoRow` - Geographic revenue distribution

### Competitor Analysis
- `Competitor` - Basic competitor metadata
- `CompetitorProfile` - Detailed profiling data
- `BenchmarkDimension` - Peer comparison dimensions
- `GapAnalysisRow` - Performance gaps vs peers
- `CompanyInfo` - Stock market information

### Report Structure
- `ReportChartSpec` - Chart configuration
- `ChartDataPoint` - Data point in chart
- `ChartSeriesConfig` - Series configuration
- `ReportSection` - Report main sections
- `ReportSubsection` - Report subsections
- `ExecutiveSummaryTickerBox` - Stock ticker widget

### Strategic Analysis
- `PortersForcesData` - Porter's Five Forces analysis
- `ForceAnalysis` - Individual force analysis
- `SWOTData` - SWOT analysis container
- `SWOTItem` - SWOT analysis items
- `BCGMatrixItem` - Growth-share matrix positions

### Industry & Market
- `ChallengesGrowthRow` - Industry challenges
- `IndustryTrendRow` - Market trend data
- `IndustryDynamicsRow` - Industry dynamics
- `IndustryDynamicsItem` - Dynamics line items
- `KeyBuyerRow` - Key buyer segments
- `NicheTopicRow` - Niche industry topics
- `NicheDataPoint` - Niche data points
- `IndustryReportScope` - Industry report configuration

### Business Strategy
- `SalesPlayPriorityRow` - Sales play priorities
- `SalesPlayIndustrySolution` - Industry solutions
- `SalesPlayPartner` - Partner information
- `SalesPlayCaseStudy` - Case study data
- `SalesPlayPriorityMapping` - Priority mappings
- `SalesPlayObjectionRebuttal` - Objection handling

### Themes & Classifications
- `ThemeRow` - Theme data
- `ThemeType` - Business/tech/sustainability theme
- `KeyHighlightsStructured` - Report highlights

### Job Types
- `BenchmarkJob` - Peer benchmarking job
- `BenchmarkFormData` - Benchmark form inputs
- `ChallengesGrowthJob` - Challenges job
- `ThemesJob` - Themes analysis job
- `FinancialAnalysisJob` - Financial analysis job

## Why This Happened

1. **Separate Codebases** - Frontend and backend are different NPM packages
2. **No Shared Package** - No `@ai-insights/types` package exists
3. **Development Speed** - Easier to duplicate than set up monorepo initially
4. **Independent Evolution** - Types grew organically in both repos

## Impact

- **Maintenance Burden**: Changes must be made in two places
- **Inconsistency Risk**: Definitions can drift between repos
- **Developer Friction**: Confusion about which is source of truth
- **Code Duplication**: Violates DRY principle

## Resolution Path

See `TECHNICAL_DEBT.md` in the backend repo for detailed solutions.

**Recommended**: Monorepo with workspaces
- Create `packages/types` folder
- Consolidate all types there
- Both frontend and backend import from shared package
- Estimated effort: 2-4 hours

**Quick Fix** (if monorepo not immediately feasible):
- Sync script that copies backend types → frontend
- Run before each commit via pre-commit hook
- Maintain backend as authoritative source

## Reference: Type Definitions Match

Spot-check confirms definitions are essentially identical:

```typescript
// Backend (source of truth)
export interface MarginDataPoint {
  year: string;
  netMargin: number;         // percentage, e.g. 22.5 = 22.5%
  operatingMargin: number;   // percentage
}

// Frontend (duplicate)
export interface MarginDataPoint {
  year: string;
  netMargin: number;
  operatingMargin: number;
}
```

Backend has slightly better documentation but structure is identical.

---

**Last Updated**: April 17, 2026
**Consolidation Status**: Awaiting monorepo setup (High Priority)
