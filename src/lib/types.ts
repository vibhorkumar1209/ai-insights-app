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
  researchBrief?: string;
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

export const MODULES = [
  { id: 'financial-analysis', label: 'Financial Analysis', icon: '📊', available: false },
  { id: 'peer-benchmarking', label: 'Peer Benchmarking', icon: '🎯', available: true },
  { id: 'business-themes', label: 'Business Themes', icon: '💼', available: false },
  { id: 'technology-themes', label: 'Technology Themes', icon: '⚙️', available: false },
  { id: 'sustainability', label: 'Sustainability Themes', icon: '🌱', available: false },
  { id: 'key-buyers', label: 'Key Prospective Buyers', icon: '🤝', available: false },
  { id: 'social-insights', label: 'Social Insights', icon: '📣', available: false },
  { id: 'challenges-growth', label: 'Challenges & Growth', icon: '📈', available: false },
  { id: 'industry-trends', label: 'Industry Trends', icon: '🔭', available: false },
  { id: 'sales-play', label: 'Sales Play & Opportunity', icon: '🎪', available: false },
  { id: 'account-plan', label: 'Account Plan', icon: '📋', available: false },
] as const;
