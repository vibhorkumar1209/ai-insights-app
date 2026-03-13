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
  capability: string;
  peersBestPractice: string;
  targetStatus: string;
  gapLevel: GapLevel;
  gapDetail: string;
  solutionFit: string;
  proofPoint: string;
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
}

export interface FinancialStatementRow {
  label: string;
  value: string;
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
  keyHighlights?: string[];
  // Private
  estimatedRevenue?: string;
  profitabilityMargin?: string;
  estimatedYoyGrowth?: string;
  fundingInfo?: string;
  lastValuation?: string;
  privateInsights?: string[];
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

export const MODULES = [
  { id: 'financial-analysis', label: 'Financial Analysis', icon: '📊', available: true },
  { id: 'peer-benchmarking', label: 'Peer Benchmarking', icon: '🎯', available: true },
  { id: 'business-themes', label: 'Business Themes', icon: '💼', available: true },
  { id: 'technology-themes', label: 'Technology Themes', icon: '⚙️', available: true },
  { id: 'sustainability', label: 'Sustainability Themes', icon: '🌱', available: true },
  { id: 'key-buyers', label: 'Key Prospective Buyers', icon: '🤝', available: false },
  { id: 'social-insights', label: 'Social Insights', icon: '📣', available: false },
  { id: 'challenges-growth', label: 'Challenges & Growth', icon: '📈', available: true },
  { id: 'industry-trends', label: 'Industry Trends', icon: '🔭', available: false },
  { id: 'sales-play', label: 'Sales Play & Opportunity', icon: '🎯', available: true },
  { id: 'account-plan', label: 'Account Plan', icon: '📋', available: false },
] as const;

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
