export interface BenchmarkInput {
    userOrganization: string;
    targetCompany: string;
    industryContext?: string;
    focusAreas?: string;
    solutionPortfolio?: string;
    additionalContext?: string;
    selectedCompetitors: string[];
}
export interface Competitor {
    name: string;
    description: string;
    headquarters?: string;
    estimatedRevenue?: string;
    employees?: string;
    relevanceScore: number;
}
export interface CompetitorDiscoveryResult {
    targetCompany: string;
    industry: string;
    competitors: Competitor[];
}
export interface BenchmarkDimension {
    dimension: string;
    targetCompany: {
        value: string;
        notes?: string;
    };
    peers: Record<string, {
        value: string;
        notes?: string;
    }>;
}
export type GapLevel = 'RED' | 'AMBER' | 'GREEN';
export interface GapAnalysisRow {
    dimension: string;
    peersBestPractice: string;
    gapLevel: GapLevel;
    solutionFit: string;
}
export interface BenchmarkResult {
    jobId: string;
    status: 'pending' | 'researching' | 'synthesizing' | 'complete' | 'error';
    progress: number;
    currentStep?: string;
    benchmarkingTable?: BenchmarkDimension[];
    gapAnalysis?: GapAnalysisRow[];
    selectedPeers?: string[];
    sources?: string[];
    error?: string;
    createdAt: string;
    completedAt?: string;
}
export interface SSEEvent {
    type: 'progress' | 'result' | 'error';
    data: Partial<BenchmarkResult>;
}
export type ThemeType = 'business' | 'technology' | 'sustainability';
export interface ThemeInput {
    companyName: string;
    themeType: ThemeType;
    userOrganization?: string;
    solutionPortfolio?: string;
    companyDomain?: string;
}
export interface ThemeRow {
    theme: string;
    description: string;
    examples: string;
    strategicImpact: string;
    source?: string;
}
export interface ThemeResult {
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
export interface ChallengesGrowthInput {
    companyName: string;
    userOrganization?: string;
    solutionPortfolio?: string;
    companyDomain?: string;
}
export interface ChallengesGrowthRow {
    dimension: string;
    challenge: string;
    growthProspect: string;
    source?: string;
}
export interface ChallengesGrowthResult {
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
export interface IndustryTrendsInput {
    industrySegment: string;
    geography?: string;
}
export interface IndustryTrendRow {
    trend: string;
    impact: string;
    description: string;
    examples: string;
}
export interface IndustryTrendsResult {
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
export interface FinancialAnalysisInput {
    companyName: string;
    companyDomain?: string;
    isPublic?: boolean;
}
export interface SalesPlayInput {
    yourCompany: string;
    competitorName: string;
    targetAccount: string;
    targetIndustry: string;
    strategicPriorities?: string[];
    solutionAreas?: string;
    competitorWeaknesses?: string;
}
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
export interface SalesPlayResult {
    jobId: string;
    status: 'pending' | 'researching' | 'synthesizing' | 'complete' | 'error';
    progress: number;
    currentStep?: string;
    yourCompany?: string;
    competitorName?: string;
    targetAccount?: string;
    targetIndustry?: string;
    priorityTable?: SalesPlayPriorityRow[];
    industrySolutions?: SalesPlayIndustrySolution[];
    techSummary?: string;
    technologyPartners?: SalesPlayPartner[];
    siPartners?: SalesPlayPartner[];
    caseStudies?: SalesPlayCaseStudy[];
    priorityMapping?: SalesPlayPriorityMapping[];
    competitiveStatement?: string;
    objectionRebuttals?: SalesPlayObjectionRebuttal[];
    callToAction?: string;
    error?: string;
    createdAt: string;
    completedAt?: string;
}
export interface ObjectionHandlingInput {
    yourCompany: string;
    competitorName: string;
    targetAccount: string;
    targetIndustry: string;
    isIncumbent: boolean;
    strategicPriorities?: string[];
    solutionAreas?: string;
    competitorWeaknesses?: string;
}
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
export interface ObjectionHandlingResult {
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
export interface KeyBuyersInput {
    companyName: string;
    companyDomain?: string;
}
export interface KeyBuyerRow {
    theme: string;
    reference: string;
    excerpt: string;
    keyExecutive: string;
    source?: string;
}
export interface KeyBuyersResult {
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
export interface BusinessSegment {
    name: string;
    description: string;
    source?: string;
}
export interface TimelineBlock {
    period: string;
    narrative: string;
    source?: string;
}
export interface StrategicEvolutionBullet {
    point: string;
}
export interface BusinessSegmentsResult {
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
export interface BusinessTimelinesResult {
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
export interface IndustryReportInput {
    query: string;
    industry?: string;
    subIndustry?: string;
    focusAreas?: string[];
    geography?: string;
    excludeRegion?: string;
    selectedSections?: string[];
}
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
    dataPoints: MarketDataPoint[];
}
export interface MarketDataPoint {
    metric: string;
    value: string;
    source: string;
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
export interface ExecutiveSummary {
    headline: string;
    tickerBoxes?: ExecutiveSummaryTickerBox[];
    kpis: {
        label: string;
        value: string;
        trend?: 'up' | 'down' | 'flat';
    }[];
    paragraphs: string[];
    scenarios: {
        name: string;
        description: string;
        marketSize: string;
    }[];
    marketSizeChartSpec?: ReportChartSpec;
    concentrationInsights?: string;
    keyPlayersInsights?: string;
    topTrends?: string[];
    recentMaJvInsights?: string;
}
export interface IndustryReportResult {
    jobId: string;
    status: 'pending' | 'scoping' | 'researching' | 'sizing' | 'drafting' | 'summarizing' | 'complete' | 'error';
    progress: number;
    currentStep?: string;
    query?: string;
    scope?: IndustryReportScope;
    marketSizing?: MarketSizingData;
    sections?: ReportSection[];
    executiveSummary?: ExecutiveSummary;
    marketSizeValidation?: {
        isValid: boolean;
        discrepanciesCount?: number;
        note?: string;
    };
    wizardData?: ScopeWizardResult;
    error?: string;
    createdAt: string;
    completedAt?: string;
}
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
export interface BCGMatrixItem {
    name: string;
    marketSize: number;
    growth: number;
    quadrant: 'star' | 'cash_cow' | 'question_mark' | 'dog';
}
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
export interface FinancialAnalysisResult {
    jobId: string;
    status: 'pending' | 'detecting' | 'fetching' | 'researching' | 'synthesizing' | 'complete' | 'error';
    progress: number;
    currentStep?: string;
    companyName?: string;
    ticker?: string;
    exchange?: string;
    isPublic?: boolean;
    dataSource?: 'Yahoo Finance' | 'Google Finance' | 'Parallel.AI';
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
export type NicheOutputMode = 'white_space' | 'bestseller' | 'both';
export type NicheSegmentationDepth = 'standard' | 'deep';
export interface NicheIndustryInput {
    industryVertical: string;
    subSegmentOrTheme?: string;
    geography: string;
    minimumCAGR: string;
    outputMode: NicheOutputMode;
    additionalContext?: string;
    numberOfTopics: number;
    segmentationDepth: NicheSegmentationDepth;
}
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
export interface NicheIndustryResult {
    jobId: string;
    status: 'pending' | 'researching' | 'synthesizing' | 'complete' | 'error';
    progress: number;
    currentStep?: string;
    topics?: NicheTopicRow[];
    error?: string;
    createdAt: string;
    completedAt?: string;
}
export type StrategyFramework = 'BCG Matrix' | 'SWOT' | 'Porters Five Forces' | 'Ansoff Matrix' | '4P and 7P Marketing Mix' | 'AIDA' | 'PESTEL' | 'North Star' | 'Flywheel Model' | 'Blue Ocean' | '7S Framework' | 'GE-McKinsey Matrix' | 'Eisenhower Matrix';
export interface MarketingStrategyInput {
    industryOrSegment: string;
    framework: StrategyFramework;
    productContext?: string;
    additionalContext?: string;
    companyName?: string;
    companyDomain?: string;
    focusTech?: string;
    otherContext?: string;
}
export interface StrategyDimensionRow {
    dimension: string;
    element: string;
    analysis: string;
    strategicImplication: string;
    priority: 'High' | 'Medium' | 'Low';
}
export interface MarketingStrategyResult {
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
export interface TechHeatMapRow {
    technology: string;
    investmentLevel: 'very_high' | 'high' | 'medium';
    description: string;
}
export interface TechHeatMapInput {
    industry: string;
    geography: string;
    technologies: string[];
}
export interface TechHeatMapResult {
    jobId: string;
    status: 'pending' | 'researching' | 'synthesizing' | 'complete' | 'error';
    progress: number;
    currentStep?: string;
    createdAt: string;
    completedAt?: string;
    error?: string;
    industry?: string;
    geography?: string;
    headline?: string;
    rows?: TechHeatMapRow[];
}
export interface CompetitorOption {
    name: string;
    headquarters?: string;
    estimatedRevenue?: string;
    relevanceScore?: number;
}
export interface TechOption {
    name: string;
    category?: string;
    maturityLevel?: 'emerging' | 'growth' | 'mainstream';
}
export interface HeatMapInput {
    industry: string;
    selectedCompetitors: string[];
    manualCompetitors: string[];
    selectedTechs: string[];
    manualTechs: string[];
    industrySegments: string[];
    manualSegments: string[];
}
export interface HeatMapCell {
    competitor_or_segment: string;
    technology: string;
    adoptionStage: 1 | 2 | 3 | 4 | 5;
    adoptionPercentage: number;
    vendors?: string[];
    details?: string;
}
export interface HeatMapInsights {
    leaderCompetitors: string[];
    emergingTechs: string[];
    competitiveGaps: string[];
    industryTrends: string[];
    strategicRecommendations: string[];
}
export interface TechnologyHeatMapResult {
    jobId: string;
    status: 'pending' | 'researching' | 'synthesizing' | 'complete' | 'error';
    progress: number;
    currentStep?: string;
    industry?: string;
    competitionHeatMap?: HeatMapCell[][];
    industryHeatMap?: HeatMapCell[][];
    insights?: HeatMapInsights;
    error?: string;
    createdAt: string;
    completedAt?: string;
}
export interface ContentChartDataPoint {
    label: string;
    value: number;
}
export interface ContentChart {
    title: string;
    type: 'bar' | 'line';
    data: ContentChartDataPoint[];
    unit?: string;
}
export interface ContentGenerationInput {
    moduleType: 'industry-blog' | 'industry-thought-leadership';
    industryReportData?: {
        query: string;
        executiveSummary?: string;
        sections?: Array<{
            id: string;
            title: string;
            bodyParagraphs?: string[];
            keyTable?: Array<{
                label: string;
                value: string;
                previousValue?: string;
            }>;
        }>;
    };
    voice: 'first_person' | 'third_person';
    tone: 'professional' | 'smart_casual';
    perspective: 'practitioner' | 'analyst';
    wordCount: number;
}
export interface ContentGenerationResult {
    jobId: string;
    status: 'pending' | 'generating' | 'complete' | 'error';
    progress: number;
    currentStep?: string;
    createdAt: string;
    completedAt?: string;
    error?: string;
    content?: string;
    hashtags?: string[];
    title?: string;
    charts?: ContentChart[];
}
export interface SalesPlay2WinTheme {
    theme: string;
    focusArea: string;
    trigger: string;
}
export interface SalesPlay2Opportunity {
    opportunityArea: string;
    specificUseCases: string;
    problemSolutionMapping: string;
    valueProposition: string;
    estimatedDealSize: string;
}
export interface SalesPlay2Competitor {
    name: string;
    strengths: string;
    weaknesses: string;
    differentiationStrategy: string;
    /** Set when research confirms this competitor is an existing/incumbent vendor at the target account. */
    incumbencyNote?: string;
}
export interface SalesPlay2Input {
    yourCompany: string;
    competitorName: string;
    targetAccount: string;
    targetIndustry: string;
    strategicPriorities?: string[];
    solutionAreas?: string;
    competitorWeaknesses?: string;
}
export interface SalesPlay2Result {
    jobId: string;
    status: 'pending' | 'researching' | 'synthesizing' | 'complete' | 'error';
    progress: number;
    currentStep?: string;
    createdAt: string;
    completedAt?: string;
    error?: string;
    yourCompany?: string;
    competitorName?: string;
    targetAccount?: string;
    targetIndustry?: string;
    winThemes?: SalesPlay2WinTheme[];
    opportunities?: SalesPlay2Opportunity[];
    competitors?: SalesPlay2Competitor[];
}
export interface TLFirmInsight {
    firmName: string;
    keyThemes: string[];
    keyInsights: string[];
    strategicImplications: string[];
    marketOutlook: string;
    keyStatistics: string[];
    useCases: string[];
    risks: string[];
    sourceUrl?: string;
    reportTitle?: string;
    publicationDate?: string;
}
export interface TLMetric {
    metric: string;
    value: string;
    sourceFirm: string;
    geography: string;
    year: string;
    sourceUrl?: string;
}
export interface TLInsight {
    insight: string;
    sourceFirm: string;
    report: string;
    publishedDate: string;
    url?: string;
    confidence: 'high' | 'medium' | 'low';
}
export interface TLTheme {
    theme: string;
    frequency: number;
    strategicUrgency: 'high' | 'medium' | 'low';
    businessImpact: 'high' | 'medium' | 'low';
    description: string;
}
export interface TLChartSpec {
    type: 'bar' | 'line' | 'table';
    title: string;
    description: string;
    data: Array<Record<string, string | number>>;
    xKey?: string;
    yKey?: string;
    sourceFirms: string[];
    dataQuality: 'complete' | 'partial' | 'insufficient';
}
export interface ConsultingIntelligenceJob {
    jobId: string;
    status: 'pending' | 'researching' | 'synthesising' | 'complete' | 'error';
    progress?: number;
    currentStep?: string;
    topic: string;
    geography: string;
    discoveredFirms?: string[];
    executiveSummary?: {
        topInsights: string[];
        emergingTrends: string[];
        consensusViewpoints: string[];
        contrarianOpinions: string[];
        strategicImplications: string[];
        futureOutlook: string;
    };
    firmAnalyses?: TLFirmInsight[];
    comparativeMatrix?: Array<Record<string, string>>;
    emergingThemes?: TLTheme[];
    quantitativeEvidence?: TLMetric[];
    sourceAttribution?: TLInsight[];
    charts?: TLChartSpec[];
    strategicRecommendations?: string[];
    researchMethodology?: string;
    error?: string;
    createdAt?: string;
    completedAt?: string;
}
export interface VucaDriverEffectRow {
    vucaDimension: 'VOLATILE' | 'UNCERTAIN' | 'COMPLEX' | 'AMBIGUOUS';
    driver: string;
    effects: string;
    demand: string;
}
export interface VucaRow {
    vucaDimension: 'VOLATILE' | 'UNCERTAIN' | 'COMPLEX' | 'AMBIGUOUS';
    lens: string;
    what: string;
    why: string;
    where: string;
    when: string;
    how: string;
}
export interface ITSpendRow {
    vucaDriver: string;
    itSpendCategory: string;
    baselineSpend: string;
    impactMechanism: string;
    quantifiedImpact: string;
    netDelta: string;
    direction: '▲ EXPAND' | '▼ COMPRESS' | '► REALLOCATE';
}
export interface GeoStressRow {
    stressEvent: string;
    status: 'Active' | 'Resolved' | 'Escalating' | 'Monitoring';
    transmissionMechanism: string;
    severity: 'High' | 'Medium' | 'Low';
    severityRationale: string;
    itBudgetSignal: string;
}
export interface ClientITImpactRow {
    stressEvent: string;
    vucaDriver: 'VOLATILE' | 'UNCERTAIN' | 'COMPLEX' | 'AMBIGUOUS';
    estImpactOnTechSpending: string;
    impact: 'H' | 'M' | 'L';
    impactedTechSpendCategory: string;
    roleInOrganization: string;
    recommendation: string;
}
export interface VucaAnalysisJob {
    jobId: string;
    status: 'pending' | 'researching' | 'synthesising' | 'complete' | 'error';
    progress?: number;
    currentStep?: string;
    industry: string;
    geography: string;
    analysisDate?: string;
    companyName?: string;
    companyDomain?: string;
    companyProfile?: string;
    clientMode?: boolean;
    vucaDriverEffects?: VucaDriverEffectRow[];
    vuca4w1hMatrix?: VucaRow[];
    itSpendImpact?: ITSpendRow[];
    itSpendSummaryTotal?: {
        netDelta: string;
        dominantDirection: string;
    };
    clientITImpact?: ClientITImpactRow[];
    geopoliticalStress?: GeoStressRow[];
    error?: string;
    createdAt?: string;
    completedAt?: string;
}
export interface FirmographicInput {
    companyName: string;
    companyDomain?: string;
}
export interface FirmographicResult {
    jobId: string;
    status: 'pending' | 'detecting' | 'fetching' | 'enriching' | 'complete' | 'error';
    progress: number;
    currentStep?: string;
    companyName: string;
    ticker?: string;
    exchange?: string;
    isPublic?: boolean;
    latestRevenue?: string;
    latestRevenueRaw?: number;
    revenueYear?: string;
    currency?: string;
    yoyGrowth?: number;
    previousRevenue?: string;
    previousYear?: string;
    dataSource?: string;
    companyInfo?: CompanyInfo;
    foundedYear?: string;
    headquartersCity?: string;
    headquartersState?: string;
    headquartersCountry?: string;
    employeeRange?: string;
    website?: string;
    linkedinUrl?: string;
    firmographicSource?: string;
    error?: string;
    createdAt: string;
    completedAt?: string;
}
export interface SpendInput {
    companyName: string;
    companyDomain?: string;
    geography?: string;
    industry?: string;
}
export interface SpendLineItem {
    found: boolean;
    value?: string;
    valueRaw?: number;
    fiscalYear?: string;
    sourceType?: string;
    sourceContext?: string;
}
export interface SpendLevel3Row {
    level1: string;
    level2: string;
    level3: string;
    pctOfBudget: number;
    usdMillion: number;
}
export interface SpendErdCategoryRow {
    level1: string;
    level2: string;
    category: string;
    basePct: number;
    adjPct: number;
    finalPct: number;
    usdMillion: number;
}
export interface SpendEmergingTechRow {
    tech: string;
    pctOfIt: number;
    usdMillion: number;
}
export interface SpendTrendPoint {
    year: number;
    usdMillion: number;
}
export interface SpendResult {
    jobId: string;
    status: 'pending' | 'researching' | 'synthesizing' | 'complete' | 'error';
    progress: number;
    currentStep?: string;
    companyName: string;
    companyDomain?: string;
    geography?: string;
    itSpend?: SpendLineItem;
    rdSpend?: SpendLineItem;
    aiSpend?: SpendLineItem;
    resolvedIndustry?: string;
    resolvedRegion?: string;
    itBaseUsdMillion?: number;
    itBreakdown?: SpendLevel3Row[];
    itSpendTrend?: SpendTrendPoint[];
    erdApplicable?: boolean;
    erdBaseUsdMillion?: number;
    erdBreakdown?: SpendErdCategoryRow[];
    erdSpendTrend?: SpendTrendPoint[];
    emergingTechBreakdown?: SpendEmergingTechRow[];
    emergingTechTotalUsdMillion?: number;
    error?: string;
    createdAt: string;
    completedAt?: string;
}
export interface OutsourcingReportInput {
    vendorName: string;
    targetIndustry: string;
    geoFocus: string;
    focusTech: string;
    focusSegment: string;
}
export interface OutsourcingReportResult {
    jobId: string;
    status: 'pending' | 'drafting' | 'complete' | 'error';
    progress: number;
    currentStep?: string;
    vendorName: string;
    targetIndustry: string;
    geoFocus: string;
    focusTech: string;
    focusSegment: string;
    content?: string;
    error?: string;
    createdAt: string;
    completedAt?: string;
}
export interface GccSalesPlayInput {
    targetCompany: string;
    advisoryFirm: string;
    targetGeoRegion: string;
    coreIndustrySegment: string;
}
export interface GccSalesPlayResult {
    jobId: string;
    status: 'pending' | 'drafting' | 'complete' | 'error';
    progress: number;
    currentStep?: string;
    targetCompany: string;
    advisoryFirm: string;
    targetGeoRegion: string;
    coreIndustrySegment: string;
    content?: string;
    error?: string;
    createdAt: string;
    completedAt?: string;
}
//# sourceMappingURL=index.d.ts.map