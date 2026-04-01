export interface Competitor {
  name: string;
  description: string;
  headquarters?: string;
  estimatedRevenue?: string;
  employees?: string;
  relevanceScore: number;
}

export interface BenchmarkDimension {
  dimension: string;
  targetCompany: { value: string; notes?: string };
  peers: Record<string, { value: string; notes?: string }>;
}

export type GapLevel = 'RED' | 'AMBER' | 'GREEN';

export interface GapAnalysisRow {
  dimension: string;
  peersBestPractice: string;
  gapLevel: GapLevel;
  solutionFit: string;
}

export interface BenchmarkJob {
  jobId: string;
  status: 'pending' | 'researching' | 'synthesizing' | 'complete' | 'error';
  progress: number;
  currentStep?: string;
  benchmarkingTable?: BenchmarkDimension[];
  gapAnalysis?: GapAnalysisRow[];
  selectedPeers?: string[];
  error?: string;
  createdAt: string;
  completedAt?: string;
}

export interface BenchmarkFormData {
  userOrganization: string;
  targetCompany: string;
  industryContext: string;
  focusAreas: string;
  solutionPortfolio: string;
  additionalContext: string;
}

// ── Financial Analysis ────────────────────────────────────────────────────────

export interface CompanyInfo {
  name?: string;
  exchange?: string;
  previousClose?: string;
  dayRange?: string;
  yearRange?: string;
  marketCap?: string;
  avgVolume?: string;
  peRatio?: string;
  dividendYield?: string;
  ceo?: string;
  founded?: string;
  headquarters?: string;
  website?: string;
  employees?: string;
  about?: string;
}

export interface QuarterlyDataPoint {
  period: string;
  revenue?: number;
  revenueFormatted?: string;
  operatingExpense?: number;
  netIncome?: number;
  netProfitMargin?: number;
  earningsPerShare?: string;
  effectiveTaxRate?: string;
}

export interface RevenueDataPoint {
  year: string;
  revenue: number;
  revenueFormatted: string;
  yoyGrowth?: number;
}

export interface MarginDataPoint {
  year: string;
  netMargin: number;
  operatingMargin: number;
}

export interface FinancialSegmentRow {
  segment: string;
  revenue: string;
  percentage: number;
  yoyGrowth?: string;
}

export interface GeoRow {
  region: string;
  revenue: string;
  percentage: number;
  yoyGrowth?: string;
}

export interface KeyHighlightsStructured {
  overallPerformance: string;
  overallPerformanceTagline?: string;
  factorsDrivingGrowth: string;
  factorsDrivingGrowthTagline?: string;
  factorsInhibitingGrowth: string;
  factorsInhibitingGrowthTagline?: string;
  futureStrategy: string;
  futureStrategyTagline?: string;
  growthOutlook: string;
  growthOutlookTagline?: string;
}

export interface FinancialStatementRow {
  label: string;
  value: string;
  previousValue?: string;
  yoy?: string;
  isSection?: boolean;
  isBold?: boolean;
}

export interface FinancialAnalysisJob {
  jobId: string;
  status: 'pending' | 'detecting' | 'fetching' | 'researching' | 'synthesizing' | 'complete' | 'error';
  progress: number;
  currentStep?: string;
  companyName?: string;
  ticker?: string;
  exchange?: string;
  isPublic?: boolean;
  // Public — company metadata & structured financials
  companyInfo?: CompanyInfo;
  currency?: string;
  revenueHistory?: RevenueDataPoint[];
  marginHistory?: MarginDataPoint[];
  quarterlyHistory?: QuarterlyDataPoint[];
  segmentRevenue?: FinancialSegmentRow[];
  geoRevenue?: GeoRow[];
  plStatement?: FinancialStatementRow[];
  balanceSheet?: FinancialStatementRow[];
  cashFlow?: FinancialStatementRow[];
  revenueInsight?: string;
  marginInsight?: string;
  segmentInsight?: string;
  geoInsight?: string;
  plInsight?: string;
  bsInsight?: string;
  cfInsight?: string;
  keyHighlights?: KeyHighlightsStructured;
  chartInsights?: string[];
  geoSegmentInsights?: string[];
  // Private
  estimatedRevenue?: string;
  profitabilityMargin?: string;
  estimatedYoyGrowth?: string;
  fundingInfo?: string;
  lastValuation?: string;
  privateInsights?: string[];
  privateKeyHighlights?: KeyHighlightsStructured;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

// ── Challenges & Growth ───────────────────────────────────────────────────────

export interface ChallengesGrowthRow {
  dimension: string;
  challenge: string;
  growthProspect: string;
}

export interface ChallengesGrowthJob {
  jobId: string;
  status: 'pending' | 'researching' | 'synthesizing' | 'complete' | 'error';
  progress: number;
  currentStep?: string;
  rows?: ChallengesGrowthRow[];
  companyName?: string;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

// ── Themes Analysis ───────────────────────────────────────────────────────────

export type ThemeType = 'business' | 'technology' | 'sustainability';

export interface ThemeRow {
  theme: string;
  description: string;
  examples: string;
  strategicImpact: string;
}

export interface ThemesJob {
  jobId: string;
  status: 'pending' | 'researching' | 'synthesizing' | 'complete' | 'error';
  progress: number;
  currentStep?: string;
  rows?: ThemeRow[];
  themeType?: ThemeType;
  companyName?: string;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

export type ModuleCategory = 'industry' | 'company' | 'persona' | 'survey-analytics';

export interface ModuleDef {
  id: string;
  label: string;
  icon: string;
  available: boolean;
  category: ModuleCategory;
}

export const MODULE_CATEGORIES: { key: ModuleCategory; label: string; accent: string }[] = [
  { key: 'industry', label: 'Industry', accent: '#059669' },
  { key: 'company', label: 'Company', accent: '#3491E8' },
  { key: 'persona', label: 'Persona', accent: '#8B5CF6' },
  { key: 'survey-analytics', label: 'Survey Analytics', accent: '#F59E0B' },
];

export const MODULES: ModuleDef[] = [
  // ── Industry ──
  { id: 'industry-report', label: 'Industry Report', icon: '📑', available: true, category: 'industry' },
  { id: 'industry-trends', label: 'Industry Trends', icon: '🔭', available: true, category: 'industry' },

  // ── Company ──
  { id: 'business-description', label: 'Business Description', icon: '🏢', available: true, category: 'company' },
  { id: 'peers', label: 'Peers', icon: '🔗', available: true, category: 'company' },
  { id: 'business-themes', label: 'Business Themes', icon: '💼', available: true, category: 'company' },
  { id: 'technology-themes', label: 'Technology Themes', icon: '⚙️', available: true, category: 'company' },
  { id: 'sustainability', label: 'Sustainability Themes', icon: '🌱', available: true, category: 'company' },
  { id: 'challenges-growth', label: 'Challenges & Growth', icon: '📈', available: true, category: 'company' },
  { id: 'financial-analysis', label: 'Financial Analysis', icon: '📊', available: true, category: 'company' },
  { id: 'social-insights', label: 'Social Insights', icon: '📣', available: false, category: 'company' },
  { id: 'key-buyers', label: 'Key Prospective Buyers', icon: '🤝', available: true, category: 'company' },
  { id: 'peer-benchmarking', label: 'Peer Benchmarking', icon: '🎯', available: true, category: 'company' },
  { id: 'sales-play', label: 'Sales Play & Opportunity', icon: '🎯', available: true, category: 'company' },
  { id: 'account-plan', label: 'Account Plan', icon: '📋', available: false, category: 'company' },

  // ── Persona ──
  { id: 'tailored-sales-pitch', label: 'Tailored Sales Pitch', icon: '🎤', available: false, category: 'persona' },
  { id: 'marketing-channels', label: 'Recommended Marketing Channels', icon: '📡', available: false, category: 'persona' },
  { id: 'content-themes', label: 'Engaging Content Themes', icon: '✍️', available: false, category: 'persona' },
  { id: 'gifting-suggestions', label: 'Personalized Gifting Suggestions', icon: '🎁', available: false, category: 'persona' },
  { id: 'networking-events', label: 'Relevant Networking Events', icon: '🤝', available: false, category: 'persona' },
  { id: 'conversation-starters', label: 'Intelligent Conversation Starters', icon: '💬', available: false, category: 'persona' },
  { id: 'outreach-message', label: 'Outreach Message', icon: '✉️', available: false, category: 'persona' },

  // ── Survey Analytics ──
  { id: 'cross-tabs', label: 'Cross Tabs', icon: '📊', available: false, category: 'survey-analytics' },
  { id: 'conjoint-analysis', label: 'Conjoint Analysis', icon: '🔬', available: false, category: 'survey-analytics' },
  { id: 'kano-analysis', label: 'KANO Analysis', icon: '📐', available: false, category: 'survey-analytics' },
];

// ── Sales Play & Opportunity ──────────────────────────────────────────────────

export interface SalesPlayPriorityRow {
  priority: string;
  companySolution: string;
  proofPoints: string;
  whyNotCompetitor: string;
}

export interface SalesPlayIndustrySolution {
  name: string;
  problemSolved: string;
  description: string;
}

export interface SalesPlayPartner {
  name: string;
  capability: string;
}

export interface SalesPlayCaseStudy {
  client: string;
  challenge: string;
  solution: string;
  outcome: string;
  testimonial?: string;
}

export interface SalesPlayPriorityMapping {
  priority: string;
  solution: string;
  expectedOutcome: string;
  timeToValue: string;
}

export interface SalesPlayObjectionRebuttal {
  objection: string;
  rebuttal: string;
}

export interface SalesPlayJob {
  jobId: string;
  status: 'pending' | 'researching' | 'synthesizing' | 'complete' | 'error';
  progress: number;
  currentStep?: string;
  yourCompany?: string;
  competitorName?: string;
  targetAccount?: string;
  targetIndustry?: string;
  // Section 1
  priorityTable?: SalesPlayPriorityRow[];
  // Section 2
  industrySolutions?: SalesPlayIndustrySolution[];
  techSummary?: string;
  technologyPartners?: SalesPlayPartner[];
  siPartners?: SalesPlayPartner[];
  caseStudies?: SalesPlayCaseStudy[];
  // Section 3
  priorityMapping?: SalesPlayPriorityMapping[];
  competitiveStatement?: string;
  objectionRebuttals?: SalesPlayObjectionRebuttal[];
  callToAction?: string;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

// ── Key Prospective Buyers ──────────────────────────────────────────────────

export interface KeyBuyerRow {
  theme: string;
  reference: string;
  excerpt: string;
  keyExecutive: string;
}

export interface KeyBuyersJob {
  jobId: string;
  status: 'pending' | 'researching' | 'synthesizing' | 'complete' | 'error';
  progress: number;
  currentStep?: string;
  rows?: KeyBuyerRow[];
  companyName?: string;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

// ── Industry Trends ─────────────────────────────────────────────────────────

export interface IndustryTrendRow {
  trend: string;
  impact: string;
  description: string;  // bulleted
  examples: string;     // bulleted with regional labels
}

export interface IndustryTrendsJob {
  jobId: string;
  status: 'pending' | 'researching' | 'synthesizing' | 'complete' | 'error';
  progress: number;
  currentStep?: string;
  industrySegment?: string;
  geography?: string;
  businessTrends?: IndustryTrendRow[];
  techTrends?: IndustryTrendRow[];
  error?: string;
  createdAt: string;
  completedAt?: string;
}

// ── Industry Report ─────────────────────────────────────────────────────────

export interface IndustryReportScope {
  industry: string;
  geography: string;
  productScope: string;
  timeHorizon: string;
  searchQueries: string[];
  subIndustry?: string;
  focusAreas?: string[];
  excludeRegion?: string;
  selectedSections?: string[];
  selectedSegments?: MarketSegmentOption[];
  selectedPlayers?: KeyPlayerOption[];
  allPlayers?: KeyPlayerOption[];
}

export interface MarketSizingData {
  currentMarketSize: string;
  projectedMarketSize: string;
  cagr: string;
  currentVolume?: string;
  projectedVolume?: string;
  methodology: string;
  dataPoints: { metric: string; value: string; source: string }[];
}

export interface ReportSection {
  id: string;
  title: string;
  bodyParagraphs: string[];
  keyTable?: ReportTable;
  tables?: ReportTable[];
  chartSpec?: ReportChartSpec;
  charts?: ReportChartSpec[];
  subsections?: ReportSubsection[];
  citations?: string[];
  swotData?: SWOTData;
  portersData?: PortersForcesData;
  teiData?: TEIData;
  macroTeiData?: MacroTEIData;
  bcgMatrixData?: BCGMatrixItem[];
  competitorProfiles?: CompetitorProfile[];
}

export interface ReportTable {
  title: string;
  headers: string[];
  rows: string[][];
}

export interface ChartDataPoint {
  label: string;
  value: number;
  category?: string;
  [key: string]: string | number | undefined;
}

export interface ChartSeriesConfig {
  key: string;
  name: string;
  type?: 'bar' | 'line';
  yAxisId?: 'left' | 'right';
  stack?: string;
  color?: string;
}

export interface ReportChartSpec {
  type: 'bar' | 'line' | 'pie' | 'stacked_bar' | 'combo' | 'area' | 'horizontal_bar' | 'scatter';
  title: string;
  xLabel?: string;
  yLabel?: string;
  yRightLabel?: string;
  data: ChartDataPoint[];
  series?: ChartSeriesConfig[];
}

export interface ReportSubsection {
  title: string;
  content: string;
  keyTable?: ReportTable;
  tables?: ReportTable[];
  chartSpec?: ReportChartSpec;
  charts?: ReportChartSpec[];
}

export interface ExecutiveSummaryTickerBox {
  label: string;
  value: string;
  secondaryValue?: string;
  trend?: 'up' | 'down' | 'flat';
}

export interface ReportExecutiveSummary {
  headline: string;
  tickerBoxes?: ExecutiveSummaryTickerBox[];
  kpis: { label: string; value: string; trend?: 'up' | 'down' | 'flat' }[];
  paragraphs: string[];
  scenarios: { name: string; description: string; marketSize: string }[];
  marketSizeChartSpec?: ReportChartSpec;
  concentrationInsights?: string;
  keyPlayersInsights?: string;
  topTrends?: string[];
  recentMaJvInsights?: string;
}

export interface IndustryReportJob {
  jobId: string;
  status: 'pending' | 'scoping' | 'researching' | 'sizing' | 'drafting' | 'summarizing' | 'complete' | 'error';
  progress: number;
  currentStep?: string;
  query?: string;
  scope?: IndustryReportScope;
  marketSizing?: MarketSizingData;
  sections?: ReportSection[];
  executiveSummary?: ReportExecutiveSummary;
  wizardData?: ScopeWizardResult;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

// ── Industry Report Wizard Types ─────────────────────────────────────────────

export interface MarketSegmentOption {
  id: string;
  label: string;
  type: string;
  selected: boolean;
  subSegments?: string[];
}

export interface KeyPlayerOption {
  name: string;
  description: string;
  marketShare?: string;
  headquarters?: string;
  revenue?: string;
  selected: boolean;
}

export interface ScopeWizardResult {
  scope: IndustryReportScope;
  suggestedSegments: MarketSegmentOption[];
  suggestedPlayers: KeyPlayerOption[];
  tocPreview: string[];
}

// ── SWOT, Porter's, TEI ──────────────────────────────────────────────────────

export interface SWOTItem {
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
}

export interface SWOTData {
  strengths: SWOTItem[];
  weaknesses: SWOTItem[];
  opportunities: SWOTItem[];
  threats: SWOTItem[];
}

export interface ForceAnalysis {
  rating: 'high' | 'medium' | 'low';
  factors: string[];
  description: string;
}

export interface PortersForcesData {
  competitiveRivalry: ForceAnalysis;
  supplierPower: ForceAnalysis;
  buyerPower: ForceAnalysis;
  threatOfSubstitution: ForceAnalysis;
  threatOfNewEntry: ForceAnalysis;
}

export interface TEIItem {
  category: string;
  year1: string;
  year2: string;
  year3: string;
  description: string;
}

export interface TEIData {
  benefits: TEIItem[];
  costs: TEIItem[];
  risks: TEIItem[];
  netPresentValue: string;
  roi: string;
  paybackPeriod: string;
}

// ── Macroeconomic Impact (replaces TEI for industry reports) ─────────────────

export interface MacroTEIItem {
  trigger: string;
  impactLevel: 'high' | 'medium' | 'low';
  description: string;
  examples: string;
  marketSizeImpact: string;
}

export interface MacroTEIData {
  items: MacroTEIItem[];
}

// ── BCG Matrix ───────────────────────────────────────────────────────────────

export interface BCGMatrixItem {
  name: string;
  marketSize: number;
  growth: number;
  quadrant: 'star' | 'cash_cow' | 'question_mark' | 'dog';
}

// ── Enhanced Competitor Profiles ─────────────────────────────────────────────

export interface CompetitorProfile {
  name: string;
  parentCompany?: string;
  hqLocation: string;
  keyProducts: string;
  overallRevenue?: string;
  categoryRevenue?: string;
  marketShare?: string;
  manufacturingLocation?: string;
  recentNews?: string;
  jvMaPartnerships?: string;
  otherInsights?: string;
}
