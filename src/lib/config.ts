/**
 * Centralized configuration for API URLs and environment variables
 * Eliminates duplication across the codebase
 */

export const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').trim();

// API Endpoints
export const API_ENDPOINTS = {
  // Peer Benchmarking
  competitors: `${API_URL}/api/competitors`,
  benchmark: `${API_URL}/api/benchmark`,
  benchmarkStream: (jobId: string) => `${API_URL}/api/benchmark/${jobId}/stream`,

  // Themes (generic - type specified in request)
  themes: `${API_URL}/api/themes`,
  themesStream: (jobId: string) => `${API_URL}/api/themes/${jobId}/stream`,

  // Business Themes (direct)
  businessThemes: `${API_URL}/api/business-themes`,
  businessThemesStream: (jobId: string) => `${API_URL}/api/business-themes/${jobId}/stream`,

  // Technology Themes (direct)
  technologyThemes: `${API_URL}/api/technology-themes`,
  technologyThemesStream: (jobId: string) => `${API_URL}/api/technology-themes/${jobId}/stream`,

  // Sustainability (direct)
  sustainability: `${API_URL}/api/sustainability`,
  sustainabilityStream: (jobId: string) => `${API_URL}/api/sustainability/${jobId}/stream`,

  // Challenges & Growth
  challengesGrowth: `${API_URL}/api/challenges-growth`,
  challengesGrowthStream: (jobId: string) => `${API_URL}/api/challenges-growth/${jobId}/stream`,

  // Financial Analysis
  financialAnalysis: `${API_URL}/api/financial-analysis`,
  financialAnalysisStream: (jobId: string) => `${API_URL}/api/financial-analysis/${jobId}/stream`,
  detectCompany: `${API_URL}/api/financial-analysis/detect-company`,
  companyFinancials: (ticker: string) => `${API_URL}/api/financial-analysis/ticker/${ticker}`,

  // Sales Play
  salesPlay: `${API_URL}/api/sales-play`,
  salesPlayStream: (jobId: string) => `${API_URL}/api/sales-play/${jobId}/stream`,

  // Key Buyers
  keyBuyers: `${API_URL}/api/key-buyers`,
  keyBuyersStream: (jobId: string) => `${API_URL}/api/key-buyers/${jobId}/stream`,

  // Industry Trends
  industryTrends: `${API_URL}/api/industry-trends`,
  industryTrendsStream: (jobId: string) => `${API_URL}/api/industry-trends/${jobId}/stream`,

  // Industry Report
  industryReport: `${API_URL}/api/industry-report`,
  industryReportStream: (jobId: string) => `${API_URL}/api/industry-report/${jobId}/stream`,
  industryReportScopeWizard: `${API_URL}/api/industry-report/scope-wizard`,

  // Business Description
  businessDescription: `${API_URL}/api/business-description`,
  businessDescriptionStream: (jobId: string) => `${API_URL}/api/business-description/${jobId}/stream`,

  // Peers
  peers: `${API_URL}/api/peers`,
  peersStream: (jobId: string) => `${API_URL}/api/peers/${jobId}/stream`,

  // Niche Industries
  nicheIndustries: `${API_URL}/api/niche-industries`,
  nicheIndustriesStream: (jobId: string) => `${API_URL}/api/niche-industries/${jobId}/stream`,

  // Marketing Strategy
  marketingStrategy: `${API_URL}/api/marketing-strategy`,
  marketingStrategyStream: (jobId: string) => `${API_URL}/api/marketing-strategy/${jobId}/stream`,
} as const;
