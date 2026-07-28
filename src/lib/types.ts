// Re-export all types from the shared @ai-insights/types package
export * from '@ai-insights/types';
import type { TechnologyHeatMapResult, TechHeatMapResult, ContentGenerationResult, SalesPlay2Result, RevenueDataPoint, MarginDataPoint, QuarterlyDataPoint, FinancialSegmentRow, GeoRow, FinancialStatementRow, CompanyInfo } from '@ai-insights/types';

// Type aliases for convenience
export type TechnologyHeatMapJob = TechnologyHeatMapResult;
export type TechHeatMapJob = TechHeatMapResult;
export type ContentGenerationJob = ContentGenerationResult;
export type SalesPlay2Job = SalesPlay2Result;

// ── Frontend-specific UI Types (not in shared package) ────────────────────────

// Benchmark
export interface BenchmarkFormData {
  userOrganization: string;
  targetCompany: string;
  industryContext: string;
  focusAreas: string;
  solutionPortfolio: string;
  additionalContext: string;
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

// Themes
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

// Challenges & Growth
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

// Industry Trends
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

// Financial Analysis
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

// Sales Play
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

// Objection Handling
export interface ObjectionHandlingItem {
  category: string;
  objection: string;
  rebuttal: string;
  proofPoint?: string;
  talkTrack?: string;
}

export interface IncumbentDisplacementTactic {
  phase: string;
  tactic: string;
  rationale: string;
}

export interface ObjectionHandlingJob {
  jobId: string;
  status: 'pending' | 'researching' | 'synthesizing' | 'complete' | 'error';
  progress: number;
  currentStep?: string;
  yourCompany?: string;
  competitorName?: string;
  targetAccount?: string;
  targetIndustry?: string;
  isIncumbent?: boolean;
  execSummary?: string;
  objections?: ObjectionHandlingItem[];
  incumbentDisplacementTactics?: IncumbentDisplacementTactic[];
  battleCard?: string;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

// Key Buyers
export interface KeyBuyerRow {
  theme: string;
  reference: string;
  excerpt: string;
  keyExecutive: string;
  source?: string;
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

// Business Segments & Timelines
export interface BusinessSegmentsJob {
  jobId: string;
  status: 'pending' | 'researching' | 'synthesizing' | 'complete' | 'error';
  progress: number;
  currentStep?: string;
  companyName?: string;
  segments?: BusinessSegment[];
  strategicEvolution?: StrategicEvolutionBullet[];
  error?: string;
  createdAt: string;
  completedAt?: string;
}

export interface BusinessTimelinesJob {
  jobId: string;
  status: 'pending' | 'researching' | 'synthesizing' | 'complete' | 'error';
  progress: number;
  currentStep?: string;
  companyName?: string;
  timelineBlocks?: TimelineBlock[];
  strategicEvolution?: StrategicEvolutionBullet[];
  error?: string;
  createdAt: string;
  completedAt?: string;
}

// Niche Industries
export type NicheOutputMode = 'white_space' | 'bestseller' | 'both';
export type NicheSegmentationDepth = 'standard' | 'deep';

export interface NicheTopicRow {
  topic_title: string;
  type: 'white_space' | 'bestseller';
  estimated_cagr: string;
  base_market_size: string;
  white_space_score: number;
  competition_level: 'none' | 'low' | 'moderate' | 'high';
  primary_growth_driver: string;
  segmentation_axes: string[];
  verdict: 'strong buy' | 'pursue' | 'monitor';
  rationale: string;
}

export interface NicheIndustryJob {
  jobId: string;
  status: 'pending' | 'researching' | 'synthesizing' | 'complete' | 'error';
  progress: number;
  currentStep?: string;
  topics?: NicheTopicRow[];
  error?: string;
  createdAt: string;
  completedAt?: string;
}

// Industry Report
export interface IndustryReportJob {
  jobId: string;
  status: 'pending' | 'scoping' | 'researching' | 'sizing' | 'drafting' | 'summarizing' | 'complete' | 'error';
  progress: number;
  currentStep?: string;
  query?: string;
  scope?: IndustryReportScope;
  marketSizing?: MarketSizingData;
  sections?: ReportSection[];
  executiveSummary?: ExecutiveSummary;
  wizardData?: ScopeWizardResult;
  error?: string;
  createdAt: string;
  completedAt?: string;
  // Sections selected at the TOC stage that failed to generate after all
  // retries (e.g. SWOT/Porter's/TEI hitting sustained API rate-limiting as
  // the last batches in a long report) — shown so it's clear why a
  // requested section is missing instead of it silently vanishing.
  failedSections?: { id: string; title: string; reason?: string }[];
}

// Marketing Strategy
export type StrategyFramework =
  | 'BCG Matrix'
  | 'SWOT'
  | 'Porters Five Forces'
  | 'Ansoff Matrix'
  | '4P/7P Marketing Mix'
  | 'AIDA'
  | 'PESTEL'
  | 'North Star'
  | 'Flywheel Model'
  | 'Blue Ocean'
  | '7S Framework'
  | 'GE-McKinsey Matrix'
  | 'Eisenhower Matrix'
  | 'VUCA × 4W1H';

export interface StrategyDimensionRow {
  dimension: string;
  element: string;
  analysis: string;
  strategicImplication: string;
  priority: 'High' | 'Medium' | 'Low';
}

export interface MarketingStrategyJob {
  jobId: string;
  status: 'pending' | 'researching' | 'synthesizing' | 'complete' | 'error';
  progress: number;
  currentStep?: string;
  industryOrSegment?: string;
  framework?: StrategyFramework;
  frameworkSummary?: string;
  dimensions?: StrategyDimensionRow[];
  strategicRecommendations?: string[];
  error?: string;
  createdAt: string;
  completedAt?: string;
}


// ── Module Definitions ────────────────────────────────────────────────────────

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
  { key: 'persona', label: 'Persona', accent: '#E63946' },
  { key: 'survey-analytics', label: 'Survey Analytics', accent: '#F59E0B' },
];

export const MODULES: ModuleDef[] = [
  // ── Industry ──
  { id: 'consulting-intelligence', label: 'Consulting Intelligence', icon: '🔭', available: true, category: 'industry' },
  { id: 'industry-report', label: 'Industry Report', icon: '📑', available: true, category: 'industry' },
  { id: 'industry-trends', label: 'Industry Trends', icon: '🔭', available: true, category: 'industry' },
  { id: 'niche-industries', label: 'High Growth Niche Industries', icon: '🔬', available: true, category: 'industry' },
  { id: 'marketing-strategy', label: 'Marketing Strategy', icon: '🧭', available: true, category: 'industry' },
  { id: 'technology-heat-map', label: 'Technology Heat Map', icon: '🔥', available: true, category: 'industry' },
  { id: 'industry-blog', label: 'Industry Blog', icon: '✍️', available: true, category: 'industry' },
  { id: 'industry-thought-leadership', label: 'Thought Leadership', icon: '💡', available: true, category: 'industry' },
  { id: 'industry-outsourcing-report', label: 'Industry Outsourcing Report', icon: '🏭', available: true, category: 'industry' },
  { id: 'gcc-sales-play', label: 'GCC Sales Play', icon: '🏙️', available: true, category: 'industry' },

  // ── Company ──
  { id: 'business-description', label: 'Business Description', icon: '🏢', available: true, category: 'company' },
  { id: 'peers', label: 'Peers', icon: '🔗', available: true, category: 'company' },
  { id: 'business-themes', label: 'Business Themes', icon: '💼', available: true, category: 'company' },
  { id: 'technology-themes', label: 'Technology Themes', icon: '⚙️', available: true, category: 'company' },
  { id: 'sustainability', label: 'Sustainability Themes', icon: '🌱', available: true, category: 'company' },
  { id: 'challenges-growth', label: 'Challenges & Growth', icon: '📈', available: true, category: 'company' },
  { id: 'financial-analysis', label: 'Financial Analysis', icon: '📊', available: true, category: 'company' },
  { id: 'social-insights', label: 'Social Insights', icon: '📣', available: false, category: 'company' },
  { id: 'key-buyers', label: 'Key Opinion Leaders', icon: '🤝', available: true, category: 'company' },
  { id: 'peer-benchmarking', label: 'Peer Benchmarking', icon: '🎯', available: true, category: 'company' },
  { id: 'sales-play', label: 'Sales Play & Opportunity', icon: '🎯', available: true, category: 'company' },
  { id: 'sales-play-2', label: 'Sales Play II', icon: '⚔️', available: true, category: 'company' },
  { id: 'objection-handling', label: 'Objection Handling', icon: '🛡️', available: true, category: 'company' },
  { id: 'firmographic', label: 'Firmographic', icon: '🏛️', available: true, category: 'company' },
  { id: 'spend', label: 'Spend', icon: '💰', available: true, category: 'company' },
  { id: 'business-segments', label: 'Business Segments', icon: '🏢', available: true, category: 'company' },
  { id: 'business-timelines', label: 'Business Timelines', icon: '📅', available: true, category: 'company' },
  { id: 'account-plan', label: 'Account Plan', icon: '📋', available: false, category: 'company' },

  // ── Persona ──
  { id: 'tailored-sales-pitch', label: 'Tailored Sales Pitch', icon: '🎤', available: true, category: 'persona' },
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
