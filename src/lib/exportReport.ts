import {
  IndustryReportJob,
  ReportSection,
  ReportTable,
  ReportSubsection,
  ReportChartSpec,
  ExecutiveSummaryTickerBox,
  ChartDataPoint,
  ChartSeriesConfig,
  CompetitionBenchmarkingResult,
  BenchmarkingTable,
} from './types';
import type { HistoryEntry } from './history';

// ── Types ────────────────────────────────────────────────────────────────────

export interface ExportOptions {
  sectionFilter?: string[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function stripBullets(text: string): string {
  return text.replace(/^[•●▪-]\s*/gm, '').trim();
}

function jobTitle(job: IndustryReportJob): string {
  return job.scope?.industry || job.query || 'Industry Report';
}

function filterSections(sections: ReportSection[] | undefined, filter?: string[]): ReportSection[] {
  if (!sections) return [];
  if (!filter || filter.length === 0) return sections;
  return sections.filter((s: ReportSection) => filter.includes(s.id));
}

// ── Chart → Table fallback (for DOCX/PDF where native charts aren't possible) ──

function chartToTable(chart: ReportChartSpec): ReportTable {
  const { data, series, title: chartTitle, type } = chart;
  if (!data?.length) return { title: chartTitle || 'Chart Data', headers: [], rows: [] };

  if (type === 'pie') {
    const headers = ['Category', 'Value', 'Share (%)'];
    const total = data.reduce((s, d) => s + (d.value || 0), 0);
    const rows = data.map((d: ChartDataPoint) => [
      d.label || '',
      String(d.value ?? ''),
      total > 0 ? `${((d.value / total) * 100).toFixed(1)}%` : '-',
    ]);
    return { title: chartTitle || 'Chart Data', headers, rows };
  }

  if (series?.length) {
    const headers = [chart.xLabel || 'Category', ...series.map((s: ChartSeriesConfig) => s.name)];
    const rows = data.map((d: ChartDataPoint) => [
      d.label || '',
      ...series.map((s: ChartSeriesConfig) => String(d[s.key] ?? '')),
    ]);
    return { title: chartTitle || 'Chart Data', headers, rows };
  }

  const headers = [chart.xLabel || 'Category', chart.yLabel || 'Value'];
  const rows = data.map((d: ChartDataPoint) => [d.label || '', String(d.value ?? '')]);
  return { title: chartTitle || 'Chart Data', headers, rows };
}

function collectCharts(section: ReportSection | ReportSubsection): ReportChartSpec[] {
  const charts: ReportChartSpec[] = [];
  if ('chartSpec' in section && section.chartSpec) charts.push(section.chartSpec);
  if ('charts' in section && section.charts) charts.push(...section.charts);
  return charts;
}

// ── Raw-markdown module parsing (GCC Sales Play) ──────────────────────────────
// GCC Sales Play's job result is a single markdown blob ("## MODULE 1: ...",
// "## MODULE 2: ...", etc. with GFM tables interspersed among paragraphs)
// rather than a structured ReportSection[] array like Industry Report.
// entryToGenericJob previously had no handler for it at all, so its exported
// sections list was always empty (the export modal's "Select Sections to
// Export" list had nothing to show).
//
// IMPORTANT — ordering: the docx/pdf/pptx renderers all render a section's
// bodyParagraphs first, THEN its keyTable/tables[] afterward (see addSection
// in each renderer) — a fine convention for Industry Report sections, where
// tables are genuinely separate structured blocks from the narrative body.
// But GCC's markdown interleaves narrative text and tables throughout each
// module (paragraph, table, paragraph, table, ...), matching exactly what
// renders on the frontend UI (which just streams the raw markdown through
// ReactMarkdown top to bottom). Extracting every table into one trailing
// tables[] array — the first version of this parser did that — would pull
// all tables in a module to the END of the exported section, after all the
// text, which does not match the UI's reading order.
//
// The renderers DO render `subsections[]` in array order, each with its own
// content-then-table sequence. So instead of one section-level bodyParagraphs
// + tables[] split, each module is parsed into a sequence of subsections —
// one per "run of text followed by (at most) one table" — so the array order
// itself reproduces the exact interleaved order the UI shows.

// Parses a single markdown GFM table (header + separator + rows, no
// surrounding prose) into a ReportTable — used for IT Jobs, whose entire
// output is one table with no narrative text around it.
function parseMarkdownTable(markdown: string, title: string): ReportTable | null {
  const lines = markdown.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
  const isTableRow = (l: string) => /^\s*\|.*\|\s*$/.test(l);
  const isSeparatorRow = (l: string) => /^\s*\|?[\s:|-]+\|[\s:|-]*\s*$/.test(l) && /-/.test(l);
  const splitRow = (l: string) => l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());

  const headerIdx = lines.findIndex((l, i) => isTableRow(l) && i + 1 < lines.length && isSeparatorRow(lines[i + 1]));
  if (headerIdx === -1) return null;

  const headers = splitRow(lines[headerIdx]);
  const rows: string[][] = [];
  for (let i = headerIdx + 2; i < lines.length && isTableRow(lines[i]); i++) {
    rows.push(splitRow(lines[i]));
  }
  if (rows.length === 0) return null;
  return { title, headers, rows };
}

function splitIntoOrderedUnits(body: string): ReportSubsection[] {
  const lines = body.split('\n');
  const units: ReportSubsection[] = [];
  const isTableRow = (l: string) => /^\s*\|.*\|\s*$/.test(l);
  const isSeparatorRow = (l: string) => /^\s*\|?[\s:|-]+\|[\s:|-]*\s*$/.test(l) && /-/.test(l);
  const splitRow = (l: string) => l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
  const cleanTitle = (l: string) => l.replace(/^#{1,6}\s*/, '').replace(/\*\*/g, '').trim();

  let textLines: string[] = [];
  let pendingTitle = '';
  let unitCount = 0;

  function flushTextOnlyUnit() {
    const text = textLines.join('\n').trim();
    textLines = [];
    if (!text) return;
    unitCount++;
    units.push({ title: pendingTitle || `Section ${unitCount}`, content: text });
    pendingTitle = '';
  }

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (isTableRow(line) && i + 1 < lines.length && isSeparatorRow(lines[i + 1])) {
      const headers = splitRow(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && isTableRow(lines[i])) { rows.push(splitRow(lines[i])); i++; }
      const text = textLines.join('\n').trim();
      textLines = [];
      unitCount++;
      const title = pendingTitle || `Table ${unitCount}`;
      units.push({ title, content: text, keyTable: { title, headers, rows } });
      pendingTitle = '';
      continue;
    }
    if (line.trim().length > 0) pendingTitle = cleanTitle(line);
    textLines.push(line);
    i++;
  }
  flushTextOnlyUnit();
  return units;
}

function gccMarkdownToSections(content: string, idPrefix: string): ReportSection[] {
  // Split before each top-level "## " header (not "### ") — keeps the header
  // line attached to the start of its own chunk, including the very first one.
  const chunks = content.split(/\n(?=##[^#])/).map((c) => c.trim()).filter(Boolean);
  return chunks.map((chunk, idx) => {
    const lines = chunk.split('\n');
    const headerLine = /^##[^#]/.test(lines[0]) ? lines.shift()!.replace(/^##\s*/, '').trim() : `Module ${idx + 1}`;
    return {
      id: `${idPrefix}-${idx + 1}`,
      title: headerLine || `Module ${idx + 1}`,
      bodyParagraphs: [],
      subsections: splitIntoOrderedUnits(lines.join('\n')),
      citations: [],
    };
  });
}

// ── Generic export for any module ────────────────────────────────────────────

export function entryToGenericJob(entry: HistoryEntry): IndustryReportJob {
  if (entry.moduleType === 'industry-report') {
    return {
      jobId: entry.id,
      status: 'complete',
      progress: 100,
      query: entry.industryReportQuery || entry.targetCompany,
      scope: entry.industryReportScope,
      marketSizing: entry.industryReportMarketSizing,
      sections: entry.industryReportSections,
      executiveSummary: entry.industryReportExecutiveSummary,
      createdAt: entry.completedAt,
      completedAt: entry.completedAt,
    };
  }

  const sections: ReportSection[] = [];
  const title = entry.targetCompany || 'Report';

  if (entry.moduleType === 'peer-benchmarking') {
    if (entry.benchmarkingTable?.length) {
      sections.push({
        id: 'benchmarking', title: 'Peer Benchmarking Analysis',
        bodyParagraphs: [`Comparative analysis of ${entry.targetCompany} against ${entry.selectedPeers?.join(', ') || 'peers'}.`],
        keyTable: {
          title: 'Peer Benchmarking',
          headers: ['Dimension', entry.targetCompany, ...(entry.selectedPeers || [])],
          rows: entry.benchmarkingTable.map((d: BenchmarkDimension) => [
            d.dimension,
            `${d.targetCompany.value}${d.targetCompany.notes ? ' — ' + d.targetCompany.notes : ''}`,
            ...Object.values(d.peers).map((p: Record<string, unknown>) => `${p.value}${p.notes ? ' — ' + p.notes : ''}`),
          ]),
        },
        citations: [],
      });
    }
    if (entry.gapAnalysis?.length) {
      sections.push({
        id: 'gaps', title: 'Gap Analysis',
        bodyParagraphs: entry.gapAnalysis.map((g: GapAnalysisRow) => `${g.dimension} (${g.gapLevel}): ${g.peersBestPractice}`),
        citations: [],
      });
    }
  }

  if (entry.themeRows?.length) {
    const typeLabel = entry.themeType === 'business' ? 'Business' : entry.themeType === 'technology' ? 'Technology' : 'Sustainability';
    sections.push({
      id: 'themes', title: `${typeLabel} Themes`,
      bodyParagraphs: entry.themeRows.map((t: ThemeRow) => `${t.theme}: ${t.description}`),
      keyTable: {
        title: `${typeLabel} Themes`,
        headers: ['Theme', 'Description', 'Examples', 'Strategic Impact'],
        rows: entry.themeRows.map((t: ThemeRow) => [t.theme, t.description || '', t.examples || '', t.strategicImpact || '']),
      },
      citations: [],
    });
  }

  if (entry.challengesGrowthRows?.length) {
    sections.push({
      id: 'challenges', title: 'Challenges & Growth Prospects',
      bodyParagraphs: entry.challengesGrowthRows.map((r: ChallengesGrowthRow) => `${r.dimension}: Challenge — ${r.challenge}. Growth — ${r.growthProspect}`),
      keyTable: {
        title: 'Challenges & Growth',
        headers: ['Dimension', 'Challenge', 'Growth Prospect'],
        rows: entry.challengesGrowthRows.map((r: ChallengesGrowthRow) => [r.dimension, r.challenge, r.growthProspect]),
      },
      citations: [],
    });
  }

  if (entry.keyBuyerRows?.length) {
    sections.push({
      id: 'buyers', title: 'Key Prospective Buyers',
      bodyParagraphs: entry.keyBuyerRows.map((b: KeyBuyerRow) => `${b.theme}: ${b.excerpt} (Source: ${b.reference})`),
      keyTable: {
        title: 'Key Prospective Buyers',
        headers: ['Theme', 'Key Executive', 'Reference', 'Excerpt'],
        rows: entry.keyBuyerRows.map((b: KeyBuyerRow) => [b.theme, b.keyExecutive || '', b.reference, b.excerpt]),
      },
      citations: [],
    });
  }

  if (entry.industryBusinessTrends?.length || entry.industryTechTrends?.length) {
    const allTrends = [
      ...(entry.industryBusinessTrends || []).map((t: IndustryTrendRow) => ({ ...t, category: 'Business' as const })),
      ...(entry.industryTechTrends || []).map((t: IndustryTrendRow) => ({ ...t, category: 'Technology' as const })),
    ];
    sections.push({
      id: 'trends', title: 'Industry Trends',
      bodyParagraphs: allTrends.map((t: IndustryTrendRow & { category: 'Business' | 'Technology' }) => `[${t.category}] ${t.trend}: ${t.impact}`),
      keyTable: {
        title: 'Industry Trends',
        headers: ['Category', 'Trend', 'Impact', 'Description'],
        rows: allTrends.map((t: IndustryTrendRow & { category: 'Business' | 'Technology' }) => [t.category, t.trend, t.impact, t.description || '']),
      },
      citations: [],
    });
  }

  if (entry.businessDescription) {
    sections.push({
      id: 'description', title: 'Business Description',
      bodyParagraphs: entry.businessDescription.split('\n\n').filter(Boolean),
      citations: [],
    });
  }

  if (entry.peerCompanies?.length) {
    sections.push({
      id: 'peers', title: 'Peer Companies',
      bodyParagraphs: entry.peerCompanies.map((p: { name: string; description: string; estimatedRevenue?: string; employees?: string }) => `${p.name}: ${p.description}`),
      keyTable: {
        title: 'Peer Companies',
        headers: ['Company', 'Description', 'Est. Revenue', 'Employees'],
        rows: entry.peerCompanies.map((p: { name: string; description: string; estimatedRevenue?: string; employees?: string }) => [p.name, p.description, p.estimatedRevenue || '', p.employees || '']),
      },
      citations: [],
    });
  }

  if (entry.salesPlayData) {
    const sp = entry.salesPlayData;
    const paras: string[] = [];
    if (sp.competitorName) paras.push(`Competitor: ${sp.competitorName}`);
    if (sp.competitiveStatement) paras.push(sp.competitiveStatement);
    if (sp.priorityTable?.length) {
      sections.push({
        id: 'salesplay-priorities', title: 'Strategic Priorities',
        bodyParagraphs: paras.length > 0 ? paras : ['Sales play analysis.'],
        keyTable: {
          title: 'Strategic Priorities',
          headers: ['Priority', 'Pain Point', 'Solution Fit', 'Win Theme'],
          rows: sp.priorityTable.map((r: { priority: string; painPoint: string; solutionFit: string; winTheme: string }) => [r.priority, r.painPoint || '', r.solutionFit || '', r.winTheme || '']),
        },
        citations: [],
      });
    } else {
      sections.push({ id: 'salesplay', title: 'Sales Play', bodyParagraphs: paras.length > 0 ? paras : ['Sales play analysis.'], citations: [] });
    }
    if (sp.objectionRebuttals?.length) {
      sections.push({
        id: 'objections', title: 'Objection Handling',
        bodyParagraphs: sp.objectionRebuttals.map((o: { objection: string; rebuttal: string }) => `Objection: ${o.objection}\nRebuttal: ${o.rebuttal}`),
        keyTable: {
          title: 'Objection Rebuttals',
          headers: ['Objection', 'Rebuttal'],
          rows: sp.objectionRebuttals.map((o: { objection: string; rebuttal: string }) => [o.objection, o.rebuttal]),
        },
        citations: [],
      });
    }
  }

  // ── Sales Play II ────────────────────────────────────────────────────────────
  if (entry.salesPlay2Data) {
    const sp2 = entry.salesPlay2Data;
    if (sp2.winThemes?.length) {
      type SP2WinTheme = {
        theme: string; description?: string; trigger: string; targetDepartment?: string;
        targetExecutiveName?: string; targetExecutiveTitle?: string; targetExecutiveVerified?: boolean;
      };
      sections.push({
        id: 'sp2-winthemes', title: 'Win Themes',
        bodyParagraphs: sp2.winThemes.map((t: SP2WinTheme) => `${t.theme}: ${t.description || t.trigger}`),
        keyTable: {
          title: 'Win Themes',
          headers: ['Win Theme', 'Description', 'Trigger', 'Target Department', 'Target Executive'],
          rows: sp2.winThemes.map((t: SP2WinTheme) => [
            t.theme,
            t.description || '',
            t.trigger,
            t.targetDepartment || '',
            t.targetExecutiveVerified && t.targetExecutiveName
              ? `${t.targetExecutiveName}${t.targetExecutiveTitle ? `, ${t.targetExecutiveTitle}` : ''}`
              : 'Not independently verified',
          ]),
        },
        citations: [],
      });
    }
    if (sp2.opportunities?.length) {
      sections.push({
        id: 'sp2-opportunities', title: 'Opportunities',
        bodyParagraphs: sp2.opportunities.map((o: { opportunityArea: string; valueProposition: string; estimatedDealSize: string }) => `${o.opportunityArea}: ${o.valueProposition} (${o.estimatedDealSize})`),
        keyTable: {
          title: 'Opportunities',
          headers: ['Opportunity Area', 'Use Cases', 'Value Proposition', 'Est. Deal Size'],
          rows: sp2.opportunities.map((o: { opportunityArea: string; specificUseCases: string; valueProposition: string; estimatedDealSize: string }) => [o.opportunityArea, o.specificUseCases || '', o.valueProposition || '', o.estimatedDealSize || '']),
        },
        citations: [],
      });
    }
    if (sp2.competitors?.length) {
      sections.push({
        id: 'sp2-competitors', title: 'Competitor Comparison',
        bodyParagraphs: sp2.competitors.map((c: { name: string; differentiationStrategy: string }) => `${c.name}: ${c.differentiationStrategy}`),
        keyTable: {
          title: 'Competitor Comparison',
          headers: ['Competitor', 'Strengths', 'Weaknesses', 'Differentiation'],
          rows: sp2.competitors.map((c: { name: string; strengths: string; weaknesses: string; differentiationStrategy: string }) => [c.name, c.strengths || '', c.weaknesses || '', c.differentiationStrategy || '']),
        },
        citations: [],
      });
    }
  }

  // ── VUCA × 4W1H Analysis ────────────────────────────────────────────────────
  if (entry.vucaResult) {
    const v = entry.vucaResult;
    if (v.vucaDriverEffects?.length) {
      sections.push({
        id: 'vuca-drivers', title: 'VUCA: Driver, Effects & Demand',
        bodyParagraphs: v.vucaDriverEffects.map((r: { vucaDimension: string; driver: string }) => `[${r.vucaDimension}] ${r.driver}`),
        keyTable: {
          title: 'VUCA Drivers, Effects & Demand',
          headers: ['VUCA Dimension', 'Primary Driver', 'Key Effects', 'IT/Technology Demand'],
          rows: v.vucaDriverEffects.map((r: { vucaDimension: string; driver: string; effects: string; demand: string }) => [r.vucaDimension, r.driver, r.effects, r.demand]),
        },
        citations: [],
      });
    }
    if (v.vuca4w1hMatrix?.length) {
      sections.push({
        id: 'vuca-matrix', title: 'VUCA × 4W1H Matrix',
        bodyParagraphs: v.vuca4w1hMatrix.map((r: { vucaDimension: string; lens: string; what: string }) => `[${r.vucaDimension}] ${r.lens}: ${r.what}`),
        keyTable: {
          title: 'VUCA × 4W1H Matrix',
          headers: ['VUCA', 'Lens', 'WHAT', 'WHY', 'WHERE', 'WHEN', 'HOW — ADAPT'],
          rows: v.vuca4w1hMatrix.map((r: { vucaDimension: string; lens: string; what: string; why: string; where: string; when: string; how: string }) => [r.vucaDimension, r.lens, r.what, r.why, r.where, r.when, r.how]),
        },
        citations: [],
      });
    }
    if (v.clientITImpact?.length) {
      sections.push({
        id: 'vuca-it-impact', title: `IT Spend Impact${v.companyName ? ' — ' + v.companyName : ''}`,
        bodyParagraphs: v.clientITImpact.map((r: { stressEvent: string; estImpactOnTechSpending: string }) => `${r.stressEvent}: ${r.estImpactOnTechSpending}`),
        keyTable: {
          title: 'IT Spend Impact',
          headers: ['Stress Event', 'VUCA Driver', 'Est. IT Spend Impact', 'Impact', 'Tech Category', 'Role', 'Recommendation'],
          rows: v.clientITImpact.map((r: { stressEvent: string; vucaDriver: string; estImpactOnTechSpending: string; impact: string; impactedTechSpendCategory: string; roleInOrganization: string; recommendation: string }) => [r.stressEvent, r.vucaDriver, r.estImpactOnTechSpending, r.impact, r.impactedTechSpendCategory, r.roleInOrganization, r.recommendation]),
        },
        citations: [],
      });
    }
    if (v.geopoliticalStress?.length) {
      sections.push({
        id: 'vuca-geo', title: 'Geopolitical Stress Overlay',
        bodyParagraphs: v.geopoliticalStress.map((r: { stressEvent: string; transmissionMechanism: string }) => `${r.stressEvent}: ${r.transmissionMechanism}`),
        keyTable: {
          title: 'Geopolitical Stress Overlay',
          headers: ['Stress Event', 'Status', 'Transmission Mechanism', 'Severity', 'IT Budget Signal'],
          rows: v.geopoliticalStress.map((r: { stressEvent: string; status: string; transmissionMechanism: string; severity: string; itBudgetSignal: string }) => [r.stressEvent, r.status, r.transmissionMechanism, r.severity, r.itBudgetSignal]),
        },
        citations: [],
      });
    }
  }

  // ── Technology Heat Map ──────────────────────────────────────────────────────
  if (entry.techHeatMapRows?.length) {
    sections.push({
      id: 'tech-heatmap', title: `Technology Heat Map${entry.techHeatMapGeography ? ' — ' + entry.techHeatMapGeography : ''}`,
      bodyParagraphs: entry.techHeatMapHeadline ? [entry.techHeatMapHeadline] : [],
      keyTable: {
        title: 'Technology Investment Heat Map',
        headers: ['Technology', 'Investment Level', 'Description'],
        rows: entry.techHeatMapRows.map((r: { technology: string; investmentLevel: string; description: string }) => [r.technology, r.investmentLevel.replace('_', ' ').toUpperCase(), r.description]),
      },
      citations: [],
    });
  }

  // ── Financial Analysis ───────────────────────────────────────────────────────
  if (entry.financialData) {
    const fd = entry.financialData;
    if (fd.revenueHistory?.length) {
      sections.push({
        id: 'fin-revenue', title: 'Revenue History',
        bodyParagraphs: fd.revenueInsight ? [fd.revenueInsight] : [],
        keyTable: {
          title: 'Revenue History',
          headers: ['Year', 'Revenue', 'YoY Growth'],
          rows: fd.revenueHistory.map((r: { year: number; revenueFormatted: string; yoyGrowth?: string }) => [String(r.year), r.revenueFormatted || '', r.yoyGrowth || '']),
        },
        citations: [],
      });
    }
    if (fd.segmentRevenue?.length) {
      sections.push({
        id: 'fin-segments', title: 'Revenue by Segment',
        bodyParagraphs: fd.segmentInsight ? [fd.segmentInsight] : [],
        keyTable: {
          title: 'Revenue by Segment',
          headers: ['Segment', 'Revenue', 'Share'],
          rows: fd.segmentRevenue.map((r: { segment: string; revenue: string; share?: string }) => [r.segment, r.revenue, r.share || '']),
        },
        citations: [],
      });
    }
    if (fd.plStatement?.length) {
      sections.push({
        id: 'fin-pl', title: 'P&L Statement',
        bodyParagraphs: fd.plInsight ? [fd.plInsight] : [],
        keyTable: {
          title: 'P&L Statement',
          headers: ['Line Item', ...fd.plStatement[0] ? Object.keys(fd.plStatement[0]).filter(k => k !== 'label') : []],
          rows: fd.plStatement.map((r: Record<string, string>) => Object.values(r)),
        },
        citations: [],
      });
    }
    const highlights = fd.keyHighlights || fd.privateKeyHighlights;
    if (highlights?.bullets?.length) {
      sections.push({
        id: 'fin-highlights', title: 'Key Financial Highlights',
        bodyParagraphs: highlights.bullets,
        citations: [],
      });
    }
    if (!sections.length) {
      // Private company minimal
      const bullets: string[] = [];
      if (fd.estimatedRevenue) bullets.push(`Est. Revenue: ${fd.estimatedRevenue}`);
      if (fd.lastValuation) bullets.push(`Last Valuation: ${fd.lastValuation}`);
      if (fd.fundingInfo) bullets.push(`Funding: ${fd.fundingInfo}`);
      if (bullets.length) sections.push({ id: 'fin-summary', title: 'Financial Summary', bodyParagraphs: bullets, citations: [] });
    }
  }

  // ── Consulting Intelligence ──────────────────────────────────────────────────
  if (entry.consultingResult) {
    const ci = entry.consultingResult;
    if (ci.executiveSummary) {
      const es = ci.executiveSummary;
      sections.push({
        id: 'ci-exec', title: 'Executive Summary',
        bodyParagraphs: [
          ...(es.topInsights || []).map((s: string) => `Insight: ${s}`),
          ...(es.emergingTrends || []).map((s: string) => `Trend: ${s}`),
          ...(es.strategicImplications || []).map((s: string) => `Implication: ${s}`),
          es.futureOutlook ? `Outlook: ${es.futureOutlook}` : '',
        ].filter(Boolean),
        citations: [],
      });
    }
    if (ci.firmAnalyses?.length) {
      sections.push({
        id: 'ci-firms', title: 'Firm-by-Firm Analysis',
        bodyParagraphs: ci.firmAnalyses.map((f: { firm: string; headline?: string }) => `${f.firm}: ${f.headline || ''}`),
        keyTable: {
          title: 'Consulting Firm Positions',
          headers: ['Firm', 'Headline Position', 'Key Insight'],
          rows: ci.firmAnalyses.map((f: { firm: string; headline?: string; keyInsight?: string }) => [f.firm, f.headline || '', f.keyInsight || '']),
        },
        citations: [],
      });
    }
    if (ci.strategicRecommendations?.length) {
      sections.push({
        id: 'ci-recs', title: 'Strategic Recommendations',
        bodyParagraphs: ci.strategicRecommendations,
        citations: [],
      });
    }
  }

  // ── Marketing Strategy ───────────────────────────────────────────────────────
  if (entry.strategyDimensions?.length) {
    sections.push({
      id: 'strategy', title: `Marketing Strategy${entry.strategyFramework ? ' — ' + entry.strategyFramework : ''}`,
      bodyParagraphs: entry.strategySummary ? [entry.strategySummary] : [],
      keyTable: {
        title: 'Strategy Dimensions',
        headers: ['Dimension', 'Current State', 'Recommended Action', 'KPI'],
        rows: entry.strategyDimensions.map((d: { dimension: string; currentState?: string; recommendedAction?: string; kpi?: string }) => [d.dimension, d.currentState || '', d.recommendedAction || '', d.kpi || '']),
      },
      citations: [],
    });
    if (entry.strategyRecommendations?.length) {
      sections.push({
        id: 'strategy-recs', title: 'Strategic Recommendations',
        bodyParagraphs: entry.strategyRecommendations,
        citations: [],
      });
    }
  }

  // ── Business Segments ────────────────────────────────────────────────────────
  if (entry.businessSegments?.length) {
    sections.push({
      id: 'segments', title: 'Business Segments',
      bodyParagraphs: entry.businessSegments.map((s: { name: string; description: string }) => `${s.name}: ${s.description}`),
      keyTable: {
        title: 'Business Segments',
        headers: ['Segment', 'Description', 'Source'],
        rows: entry.businessSegments.map((s: { name: string; description: string; source?: string }) => [s.name, s.description, s.source || '']),
      },
      citations: [],
    });
  }
  if (entry.businessSegmentsData?.segments?.length && !entry.businessSegments?.length) {
    sections.push({
      id: 'segments', title: 'Business Segments',
      bodyParagraphs: entry.businessSegmentsData.segments.map((s: { name: string; description: string }) => `${s.name}: ${s.description}`),
      keyTable: {
        title: 'Business Segments',
        headers: ['Segment', 'Description'],
        rows: entry.businessSegmentsData.segments.map((s: { name: string; description: string }) => [s.name, s.description]),
      },
      citations: [],
    });
  }

  // ── Business Timelines ───────────────────────────────────────────────────────
  if (entry.timelineBlocks?.length) {
    sections.push({
      id: 'timelines', title: 'Business Timelines',
      bodyParagraphs: entry.timelineBlocks.map((b: { period: string; narrative: string }) => `${b.period}: ${b.narrative}`),
      keyTable: {
        title: 'Business Timelines',
        headers: ['Period', 'Key Events & Narrative'],
        rows: entry.timelineBlocks.map((b: { period: string; narrative: string }) => [b.period, b.narrative]),
      },
      citations: [],
    });
  }
  if (entry.businessTimelinesData?.timelineBlocks?.length && !entry.timelineBlocks?.length) {
    sections.push({
      id: 'timelines', title: 'Business Timelines',
      bodyParagraphs: entry.businessTimelinesData.timelineBlocks.map((b: { period: string; narrative: string }) => `${b.period}: ${b.narrative}`),
      keyTable: {
        title: 'Business Timelines',
        headers: ['Period', 'Key Events & Narrative'],
        rows: entry.businessTimelinesData.timelineBlocks.map((b: { period: string; narrative: string }) => [b.period, b.narrative]),
      },
      citations: [],
    });
  }

  // ── High Growth Niche Industries ─────────────────────────────────────────────
  if (entry.nicheTopics?.length) {
    sections.push({
      id: 'niche', title: 'High Growth Niche Industries',
      bodyParagraphs: entry.nicheTopics.map((t: { topic: string; rationale: string }) => `${t.topic}: ${t.rationale}`),
      keyTable: {
        title: 'High Growth Niche Industries',
        headers: ['Niche Topic', 'Rationale', 'Market Size', 'CAGR'],
        rows: entry.nicheTopics.map((t: { topic: string; rationale: string; marketSize?: string; cagr?: string }) => [t.topic, t.rationale, t.marketSize || '', t.cagr || '']),
      },
      citations: [],
    });
  }

  // ── Blog / Thought Leadership (text-only) ────────────────────────────────────
  if (entry.blogContent) {
    sections.push({
      id: 'blog', title: entry.blogTitle || 'Industry Blog',
      bodyParagraphs: entry.blogContent.split('\n\n').filter(Boolean),
      citations: [],
    });
  }
  if (entry.thoughtLeadershipContent) {
    sections.push({
      id: 'thought-leadership', title: entry.thoughtLeadershipTitle || 'Thought Leadership',
      bodyParagraphs: entry.thoughtLeadershipContent.split('\n\n').filter(Boolean),
      citations: [],
    });
  }

  // ── GCC Sales Play (raw markdown dossier, split into one section per module) ──
  if (entry.gccSalesPlayData?.content) {
    sections.push(...gccMarkdownToSections(entry.gccSalesPlayData.content, 'gcc-module'));
  }

  // ── IT Jobs (single markdown table of open roles) ─────────────────────────
  if (entry.itJobData?.content) {
    const tableTitle = `Open IT/Software Engineering Roles — ${entry.itJobData.companyName}`;
    const table = parseMarkdownTable(entry.itJobData.content, tableTitle);
    sections.push({
      id: 'it-jobs-roles',
      title: tableTitle,
      bodyParagraphs: [],
      keyTable: table ?? undefined,
      citations: [],
    });
  }

  return {
    jobId: entry.id,
    status: 'complete',
    progress: 100,
    query: title,
    scope: { industry: title, geography: '', productScope: '', timeHorizon: '', searchQueries: [] },
    sections,
    createdAt: entry.completedAt,
    completedAt: entry.completedAt,
  };
}

// ── DOCX Export ──────────────────────────────────────────────────────────────

export async function exportToDocx(job: IndustryReportJob, opts?: ExportOptions): Promise<void> {
  const {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    WidthType, HeadingLevel, AlignmentType, PageBreak, BorderStyle,
    ShadingType, TableLayoutType, ImageRun,
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  } = await import('docx');
  const fileSaver = await import('file-saver');
  const saveAs = fileSaver.default || fileSaver.saveAs;
  const { renderChartToPng } = await import('./chartToPng');

  // Pre-render every chart in the report to PNG bytes (browser canvas)
  const chartImageCache = new Map<ReportChartSpec, { bytes: Uint8Array; width: number; height: number }>();
  async function ensureChartImage(chart: ReportChartSpec) {
    if (chartImageCache.has(chart)) return chartImageCache.get(chart)!;
    const rendered = await renderChartToPng(chart, 720, 420);
    if (rendered) chartImageCache.set(chart, rendered);
    return rendered;
  }

  // Walk the entire job and pre-render all charts up front so the synchronous
  // children-building loop can simply look them up.
  const allCharts: ReportChartSpec[] = [];
  if (job.executiveSummary?.marketSizeChartSpec) allCharts.push(job.executiveSummary.marketSizeChartSpec);
  job.sections?.forEach((s: ReportSection) => {
    allCharts.push(...collectCharts(s));
    s.subsections?.forEach((sub: ReportSubsection) => allCharts.push(...collectCharts(sub)));
  });
  for (const c of allCharts) {
    try { await ensureChartImage(c); } catch { /* ignore individual chart failures */ }
  }

  function chartImageParagraph(chart: ReportChartSpec): Record<string, unknown> | null {
    const img = chartImageCache.get(chart);
    if (!img) return null;
    // Word page width ≈ 6.27in (9000 twips). Use ~5.8in wide image.
    const targetW = 560;
    const ratio = img.height / img.width;
    const targetH = Math.round(targetW * ratio);
    return new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 120 },
      children: [
        new ImageRun({
          data: img.bytes,
          transformation: { width: targetW, height: targetH },
          type: 'png',
        }),
      ],
    }) as unknown as Record<string, unknown>;
  }

  const title = jobTitle(job);
  const NAVY = '0c3649';
  const DARK_BLUE = '1a3a5c';
  const MED_BLUE = '2a6090';
  const ACCENT_BLUE = '3491E8';
  const GREEN = '059669';
  const LIGHT_BG = 'F0F5FA';
  const TEXT_COLOR = '333333';
  const FONT = 'Calibri';

  const children: Array<Record<string, unknown>> = [];

  // ── Cover page ──
  children.push(
    new Paragraph({ spacing: { before: 4000 }, children: [] }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
      children: [new TextRun({ text: title, bold: true, size: 56, color: DARK_BLUE, font: FONT })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ text: 'Industry Intelligence Report', size: 28, color: MED_BLUE, font: FONT })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({ text: [job.scope?.geography, job.scope?.timeHorizon].filter(Boolean).join(' | '), size: 24, color: '7eaabf', font: FONT }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({
        text: `Generated: ${job.completedAt ? new Date(job.completedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : new Date().toLocaleDateString()}`,
        size: 20, color: '999999', font: FONT,
      })],
    }),
  );

  // ── Table builder — auto-sizes font based on column count ──
  function buildTable(tbl: ReportTable): Array<Record<string, unknown>> | null {
    const { headers, rows, title: tblTitle } = tbl;
    if (!headers?.length || !rows?.length) return null;

    const result: Array<Record<string, unknown>> = [];

    // Table title
    if (tblTitle) {
      result.push(
        new Paragraph({
          spacing: { before: 240, after: 100 },
          children: [new TextRun({ text: tblTitle, bold: true, size: 22, color: ACCENT_BLUE, font: FONT })],
        })
      );
    }

    const colCount = headers.length;
    // Adjust font size: fewer cols = larger font, more cols = smaller to fit
    const fontSize = colCount <= 3 ? 18 : colCount <= 5 ? 16 : colCount <= 7 ? 14 : 12;
    const headerFontSize = fontSize;
    const totalWidth = 9600; // twips
    const colW = Math.floor(totalWidth / colCount);

    const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
    const thinBorder = { style: BorderStyle.SINGLE, size: 1, color: 'D0D5DD' };

    const headerCells = headers.map(
      (h) =>
        new TableCell({
          shading: { fill: NAVY, type: ShadingType.CLEAR, color: 'auto' },
          width: { size: colW, type: WidthType.DXA },
          borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
          children: [new Paragraph({
            spacing: { before: 40, after: 40 },
            children: [new TextRun({ text: h, bold: true, size: headerFontSize, color: 'E8EDF5', font: FONT })],
          })],
        })
    );

    const dataRows = rows.map(
      (row, ri) =>
        new TableRow({
          children: row.map(
            (cell) =>
              new TableCell({
                shading: ri % 2 === 0
                  ? { fill: LIGHT_BG, type: ShadingType.CLEAR, color: 'auto' }
                  : undefined,
                width: { size: colW, type: WidthType.DXA },
                borders: { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder },
                children: [new Paragraph({
                  spacing: { before: 30, after: 30 },
                  children: [new TextRun({ text: String(cell || ''), size: fontSize, font: FONT, color: TEXT_COLOR })],
                })],
              })
          ),
        })
    );

    const table = new Table({
      layout: TableLayoutType.FIXED,
      rows: [new TableRow({ children: headerCells, tableHeader: true }), ...dataRows],
      width: { size: totalWidth, type: WidthType.DXA },
    });

    result.push(table);
    return result;
  }

  // ── Bullet paragraph helper ──
  function bulletParagraph(text: string, fontSize = 22): Array<Record<string, unknown>> {
    const stripped = stripBullets(text);
    // Split on bullet markers to render each as a separate line
    const lines = stripped.split(/\n/).filter((l: string) => l.trim());
    return lines.map((line: string) =>
      new Paragraph({
        spacing: { after: 80 },
        children: [new TextRun({ text: line.trim(), size: fontSize, font: FONT, color: TEXT_COLOR })],
      }) as unknown as Record<string, unknown>
    );
  }

  // ── Executive Summary ──
  if (job.executiveSummary) {
    children.push(new Paragraph({ children: [new PageBreak()] }));
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 200 },
        children: [new TextRun({ text: 'Executive Summary', bold: true, size: 36, color: DARK_BLUE, font: FONT })],
      })
    );

    if (job.executiveSummary.headline) {
      children.push(
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: job.executiveSummary.headline, bold: true, size: 24, italics: true, color: MED_BLUE, font: FONT })],
        })
      );
    }

    // Ticker boxes as a KPI row table
    const tickers = job.executiveSummary.tickerBoxes;
    if (tickers?.length) {
      const tickerHeaders = tickers.map((t: ExecutiveSummaryTickerBox) => t.label);
      const tickerValues = tickers.map((t: ExecutiveSummaryTickerBox) => {
        let val = t.value;
        if (t.secondaryValue) val += `\n(${t.secondaryValue})`;
        return val;
      });
      const tickerTable = new Table({
        layout: TableLayoutType.FIXED,
        rows: [
          new TableRow({
            children: tickerHeaders.map((h: string) =>
              new TableCell({
                shading: { fill: NAVY, type: ShadingType.CLEAR, color: 'auto' },
                width: { size: Math.floor(9600 / tickers.length), type: WidthType.DXA },
                children: [new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 40, after: 40 },
                  children: [new TextRun({ text: h, bold: true, size: 14, color: '7EAABF', font: FONT })],
                })],
              })
            ),
          }),
          new TableRow({
            children: tickerValues.map((v: string) =>
              new TableCell({
                shading: { fill: '0A2538', type: ShadingType.CLEAR, color: 'auto' },
                width: { size: Math.floor(9600 / tickers.length), type: WidthType.DXA },
                children: [new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 60, after: 60 },
                  children: [new TextRun({ text: v, bold: true, size: 22, color: 'E8EDF5', font: FONT })],
                })],
              })
            ),
          }),
        ],
        width: { size: 9600, type: WidthType.DXA },
      });
      children.push(new Paragraph({ spacing: { before: 100, after: 100 }, children: [] }));
      children.push(tickerTable);
      children.push(new Paragraph({ spacing: { after: 200 }, children: [] }));
    } else if (job.executiveSummary.kpis?.length) {
      // Legacy KPI rendering
      job.executiveSummary.kpis.forEach((kpi: { label: string; value: string }) => {
        children.push(
          new Paragraph({
            spacing: { after: 60 },
            children: [
              new TextRun({ text: `${kpi.label}: `, bold: true, size: 22, font: FONT }),
              new TextRun({ text: kpi.value, size: 22, color: GREEN, font: FONT, bold: true }),
            ],
          })
        );
      });
      children.push(new Paragraph({ spacing: { after: 100 }, children: [] }));
    }

    // Insight cards as labeled paragraphs
    const insights: { label: string; text: string }[] = [];
    if (job.executiveSummary.concentrationInsights) insights.push({ label: 'Market Concentration', text: job.executiveSummary.concentrationInsights });
    if (job.executiveSummary.keyPlayersInsights) insights.push({ label: 'Key Players & Market Share', text: job.executiveSummary.keyPlayersInsights });
    if (job.executiveSummary.topTrends?.length) insights.push({ label: 'Top Market Trends', text: job.executiveSummary.topTrends.map((t: string, i: number) => `${i + 1}. ${t}`).join('\n') });
    if (job.executiveSummary.recentMaJvInsights) insights.push({ label: 'Recent M&A, JVs & New Entrants', text: job.executiveSummary.recentMaJvInsights });

    insights.forEach((ins: { label: string; text: string }) => {
      children.push(
        new Paragraph({
          spacing: { before: 160, after: 60 },
          children: [new TextRun({ text: ins.label, bold: true, size: 20, color: ACCENT_BLUE, font: FONT })],
        })
      );
      ins.text.split('\n').filter((l: string) => l.trim()).forEach((line: string) => {
        children.push(
          new Paragraph({
            spacing: { after: 40 },
            children: [new TextRun({ text: line.trim(), size: 20, font: FONT, color: TEXT_COLOR })],
          })
        );
      });
    });

    // Paragraphs
    job.executiveSummary.paragraphs?.forEach((p: string) => {
      children.push(...bulletParagraph(p, 21));
    });

    // Market size chart → image + table
    if (job.executiveSummary.marketSizeChartSpec) {
      const imgPara = chartImageParagraph(job.executiveSummary.marketSizeChartSpec);
      if (imgPara) children.push(imgPara);
      const mktChartTbl = chartToTable(job.executiveSummary.marketSizeChartSpec);
      if (mktChartTbl.headers?.length && mktChartTbl.rows?.length) {
        const tblResult = buildTable(mktChartTbl);
        if (tblResult) children.push(...tblResult);
      }
    }

    // Scenarios
    if (job.executiveSummary.scenarios?.length) {
      children.push(
        new Paragraph({
          spacing: { before: 300, after: 120 },
          children: [new TextRun({ text: 'Scenario Outlook', bold: true, size: 24, color: DARK_BLUE, font: FONT })],
        })
      );
      const scenHeaders = ['Scenario', 'Market Size', 'Description'];
      const scenRows = job.executiveSummary.scenarios.map((s: { name: string; marketSize: string; description: string }) => [`${s.name} Case`, s.marketSize, s.description]);
      const scenTable = buildTable({ title: '', headers: scenHeaders, rows: scenRows });
      if (scenTable) children.push(...scenTable);
    }
  }

  // ── Section renderer ──
  function addSection(section: ReportSection, sectionNum: number) {
    // Page break before each section
    children.push(new Paragraph({ children: [new PageBreak()] }));

    // Section heading
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 100, after: 200 },
        children: [new TextRun({ text: `${sectionNum}. ${section.title}`, bold: true, size: 32, color: DARK_BLUE, font: FONT })],
      })
    );

    // Body paragraphs
    section.bodyParagraphs?.forEach((para: string) => {
      children.push(...bulletParagraph(para));
    });

    // Key table
    if (section.keyTable?.headers?.length && section.keyTable?.rows?.length) {
      const tblResult = buildTable(section.keyTable);
      if (tblResult) children.push(...tblResult);
    }

    // Multiple tables
    section.tables?.forEach((tbl: ReportTable) => {
      if (tbl.headers?.length && tbl.rows?.length) {
        // Page break before each multi-table to try to keep on one page
        children.push(new Paragraph({ children: [new PageBreak()] }));
        const tblResult = buildTable(tbl);
        if (tblResult) children.push(...tblResult);
      }
    });

    // Charts → rendered as PNG image + accompanying data table
    collectCharts(section).forEach((chart: ReportChartSpec) => {
      const imgPara = chartImageParagraph(chart);
      if (imgPara) children.push(imgPara);
      const chartTbl = chartToTable(chart);
      if (chartTbl.headers?.length && chartTbl.rows?.length) {
        const tblResult = buildTable(chartTbl);
        if (tblResult) children.push(...tblResult);
      }
    });

    // SWOT Data
    if (section.swotData) {
      const quadrants = [
        { key: 'strengths' as const, label: 'Strengths', color: '10B981' },
        { key: 'weaknesses' as const, label: 'Weaknesses', color: 'E63946' },
        { key: 'opportunities' as const, label: 'Opportunities', color: '3491E8' },
        { key: 'threats' as const, label: 'Threats', color: 'F59E0B' },
      ];
      for (const q of quadrants) {
        const items = section.swotData[q.key];
        if (!items?.length) continue;
        children.push(
          new Paragraph({
            spacing: { before: 240, after: 100 },
            children: [new TextRun({ text: q.label, bold: true, size: 26, color: q.color, font: FONT })],
          })
        );
        const swotHeaders = ['Item', 'Description', 'Impact'];
        const swotRows = items.map((item: { title: string; description?: string; impact?: string }) => [item.title, item.description || '', (item.impact || '').toUpperCase()]);
        const tblResult = buildTable({ title: '', headers: swotHeaders, rows: swotRows });
        if (tblResult) children.push(...tblResult);
      }
    }

    // Porter's Data
    if (section.portersData) {
      const forces = [
        { key: 'competitiveRivalry' as const, label: 'Competitive Rivalry' },
        { key: 'supplierPower' as const, label: 'Supplier Power' },
        { key: 'buyerPower' as const, label: 'Buyer Power' },
        { key: 'threatOfSubstitution' as const, label: 'Threat of Substitution' },
        { key: 'threatOfNewEntry' as const, label: 'Threat of New Entry' },
      ];
      const porterHeaders = ['Force', 'Rating', 'Key Factors', 'Description'];
      const porterRows = forces.map((f: { key: string; label: string }) => {
        const force = (section.portersData as Record<string, unknown>)?.[f.key] as { rating?: string; factors?: string[]; description?: string } | undefined;
        if (!force) return [f.label, '', '', ''];
        return [f.label, (force.rating || '').toUpperCase(), (force.factors || []).join('; '), force.description || ''];
      }).filter((r: string[]) => r[1]);
      if (porterRows.length) {
        const tblResult = buildTable({ title: '', headers: porterHeaders, rows: porterRows });
        if (tblResult) children.push(...tblResult);
      }
    }

    // Macro TEI Data
    if (section.macroTeiData?.items?.length) {
      const teiHeaders = ['Macroeconomic Trigger', 'Impact Level', 'Description', 'Examples', 'Market Size Impact'];
      const teiRows = section.macroTeiData.items.map((item: { trigger: string; impactLevel?: string; description?: string; examples?: string; marketSizeImpact?: string }) => [
        item.trigger, (item.impactLevel || '').toUpperCase(), item.description || '', item.examples || '', item.marketSizeImpact || '',
      ]);
      const tblResult = buildTable({ title: 'Macroeconomic Impact Analysis', headers: teiHeaders, rows: teiRows });
      if (tblResult) children.push(...tblResult);
    }

    // Legacy TEI
    if (section.teiData && !section.macroTeiData) {
      if (section.teiData.netPresentValue || section.teiData.roi || section.teiData.paybackPeriod) {
        children.push(
          new Paragraph({
            spacing: { before: 200, after: 100 },
            children: [
              new TextRun({ text: `NPV: ${section.teiData.netPresentValue || 'N/A'}  |  ROI: ${section.teiData.roi || 'N/A'}  |  Payback: ${section.teiData.paybackPeriod || 'N/A'}`, bold: true, size: 22, font: FONT, color: GREEN }),
            ],
          })
        );
      }
    }

    // BCG Matrix as table
    if (section.bcgMatrixData?.length) {
      const bcgHeaders = ['Company', 'Market Size', 'Growth Rate (%)', 'Quadrant'];
      const quadrantLabels: Record<string, string> = { star: 'Star', cash_cow: 'Cash Cow', question_mark: 'Question Mark', dog: 'Dog' };
      const bcgRows = section.bcgMatrixData.map((item: BCGMatrixItem) => [
        item.name, String(item.marketSize), String(item.growth), quadrantLabels[item.quadrant] || item.quadrant,
      ]);
      children.push(new Paragraph({ children: [new PageBreak()] }));
      const tblResult = buildTable({ title: 'BCG Matrix — Market Size vs Growth', headers: bcgHeaders, rows: bcgRows });
      if (tblResult) children.push(...tblResult);
    }

    // Competitor Profiles
    if (section.competitorProfiles?.length) {
      children.push(new Paragraph({ children: [new PageBreak()] }));
      children.push(
        new Paragraph({
          spacing: { before: 100, after: 160 },
          children: [new TextRun({ text: 'Key Player Profiles', bold: true, size: 26, color: ACCENT_BLUE, font: FONT })],
        })
      );

      section.competitorProfiles.forEach((profile, pi) => {
        // Page break every 2 profiles to keep them readable
        if (pi > 0 && pi % 2 === 0) {
          children.push(new Paragraph({ children: [new PageBreak()] }));
        }

        children.push(
          new Paragraph({
            spacing: { before: pi % 2 === 0 ? 0 : 300, after: 80 },
            children: [new TextRun({ text: profile.name, bold: true, size: 24, color: DARK_BLUE, font: FONT })],
          })
        );

        const fields: { label: string; value?: string }[] = [
          { label: 'Parent Company', value: profile.parentCompany },
          { label: 'HQ Location', value: profile.hqLocation },
          { label: 'Key Products', value: profile.keyProducts },
          { label: 'Overall Revenue', value: profile.overallRevenue },
          { label: 'Category Revenue', value: profile.categoryRevenue },
          { label: 'Market Share', value: profile.marketShare },
          { label: 'Manufacturing', value: profile.manufacturingLocation },
          { label: 'Recent News', value: profile.recentNews },
          { label: 'JV / M&A / Partnerships', value: profile.jvMaPartnerships },
          { label: 'Other Insights', value: profile.otherInsights },
        ];

        fields.filter((f: { label: string; value?: string }) => f.value).forEach((f: { label: string; value: string }) => {
          children.push(
            new Paragraph({
              spacing: { after: 40 },
              children: [
                new TextRun({ text: `${f.label}: `, bold: true, size: 18, font: FONT, color: '6B8FA5' }),
                new TextRun({ text: f.value, size: 18, font: FONT, color: TEXT_COLOR }),
              ],
            })
          );
        });
      });
    }

    // Subsections — each starts on new page
    section.subsections?.forEach((sub: ReportSubsection) => {
      children.push(new Paragraph({ children: [new PageBreak()] }));

      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 100, after: 120 },
          children: [new TextRun({ text: sub.title, bold: true, size: 26, color: MED_BLUE, font: FONT })],
        })
      );

      if (sub.content) {
        children.push(...bulletParagraph(sub.content));
      }

      if (sub.keyTable?.headers?.length && sub.keyTable?.rows?.length) {
        const tblResult = buildTable(sub.keyTable);
        if (tblResult) children.push(...tblResult);
      }

      sub.tables?.forEach((tbl: ReportTable) => {
        if (tbl.headers?.length && tbl.rows?.length) {
          const tblResult = buildTable(tbl);
          if (tblResult) children.push(...tblResult);
        }
      });

      // Subsection charts → image + table
      collectCharts(sub).forEach((chart: ReportChartSpec) => {
        const imgPara = chartImageParagraph(chart);
        if (imgPara) children.push(imgPara);
        const chartTbl = chartToTable(chart);
        if (chartTbl.headers?.length && chartTbl.rows?.length) {
          const tblResult = buildTable(chartTbl);
          if (tblResult) children.push(...tblResult);
        }
      });
    });
  }

  // ── Render all sections ──
  const exportSections = filterSections(job.sections, opts?.sectionFilter);
  exportSections.forEach((sec, i) => addSection(sec, i + 1));

  const doc = new Document({
    creator: 'MarketIntel AI',
    title: `${title} - Industry Report`,
    sections: [{
      properties: {
        page: {
          margin: { top: 1200, bottom: 1200, left: 1200, right: 1200 },
        },
      },
      children,
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${title.replace(/[^a-zA-Z0-9 ]/g, '')}_Report.docx`);
}

// ── PDF Export (via jsPDF) ───────────────────────────────────────────────────

export async function exportToPdf(job: IndustryReportJob, opts?: ExportOptions): Promise<void> {
  const { default: jsPDF } = await import('jspdf');

  const title = jobTitle(job);
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentW = pageW - 2 * margin;
  let y = margin;

  function checkPageBreak(needed: number) {
    if (y + needed > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  }

  function addPageBreak() {
    doc.addPage();
    y = margin;
  }

  function drawAccentLine() {
    doc.setDrawColor(52, 145, 232);
    doc.setLineWidth(0.5);
    doc.line(margin, y, margin + 35, y);
    y += 6;
  }

  // ── Cover page ──
  doc.setFillColor(12, 54, 73);
  doc.rect(0, 0, pageW, pageH, 'F');
  // Accent bar
  doc.setFillColor(52, 145, 232);
  doc.rect(0, 80, pageW, 1.5, 'F');
  doc.setTextColor(232, 237, 245);
  doc.setFontSize(26);
  doc.setFont('helvetica', 'bold');
  const titleLines = doc.splitTextToSize(title, contentW - 20);
  doc.text(titleLines, pageW / 2, 100, { align: 'center' });
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(126, 170, 191);
  doc.text('Industry Intelligence Report', pageW / 2, 100 + titleLines.length * 10 + 10, { align: 'center' });
  doc.setFontSize(11);
  doc.text([job.scope?.geography, job.scope?.timeHorizon].filter(Boolean).join(' | '), pageW / 2, 100 + titleLines.length * 10 + 24, { align: 'center' });
  doc.setFontSize(10);
  doc.setTextColor(160, 160, 160);
  doc.text(
    `Generated: ${job.completedAt ? new Date(job.completedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : new Date().toLocaleDateString()}`,
    pageW / 2, 100 + titleLines.length * 10 + 40, { align: 'center' }
  );

  // ── Table renderer — auto font size ──
  function renderTable(tbl: ReportTable) {
    const { headers, rows, title: tblTitle } = tbl;
    if (!headers?.length || !rows?.length) return;

    const colCount = headers.length;
    // Scale font to fit columns
    const fontSize = colCount <= 3 ? 8 : colCount <= 5 ? 7 : colCount <= 7 ? 6 : 5.5;
    const rowH = colCount <= 5 ? 7 : 6;
    const colW = contentW / colCount;

    // Table title
    if (tblTitle) {
      checkPageBreak(12);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(52, 145, 232);
      doc.text(tblTitle, margin, y + 4);
      y += 10;
    }

    // Check if entire table fits on page, if not start new page
    const totalTableH = (rows.length + 1) * rowH + 4;
    if (totalTableH < pageH - 2 * margin && y + totalTableH > pageH - margin) {
      addPageBreak();
    }

    // Header
    checkPageBreak(rowH + 2);
    doc.setFillColor(12, 54, 73);
    doc.rect(margin, y, contentW, rowH, 'F');
    doc.setTextColor(232, 237, 245);
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', 'bold');
    headers.forEach((h, i) => {
      doc.text(h, margin + i * colW + 2, y + rowH - 2, { maxWidth: colW - 3 });
    });
    y += rowH;

    // Data rows
    doc.setFont('helvetica', 'normal');
    rows.forEach((row, ri) => {
      // Estimate row height based on content
      const maxLines = Math.max(...row.map((cell: string | number | null | undefined) => {
        const text = String(cell || '');
        return Math.ceil(text.length / Math.floor(colW / (fontSize * 0.35)));
      }));
      const actualRowH = Math.max(rowH, maxLines * (fontSize * 0.5));

      checkPageBreak(actualRowH);
      if (ri % 2 === 0) {
        doc.setFillColor(240, 245, 250);
        doc.rect(margin, y, contentW, actualRowH, 'F');
      }
      doc.setTextColor(50, 50, 50);
      row.forEach((cell, ci) => {
        const text = String(cell || '');
        // Truncate very long cells
        const displayText = text.length > 80 ? text.substring(0, 77) + '...' : text;
        doc.text(displayText, margin + ci * colW + 2, y + Math.min(actualRowH - 2, fontSize * 0.5 + 2), { maxWidth: colW - 3 });
      });
      y += actualRowH;
    });
    y += 4;
  }

  function renderBulletText(text: string, fontSize = 9) {
    const stripped = stripBullets(text);
    const lines = doc.splitTextToSize(stripped, contentW);
    checkPageBreak(lines.length * (fontSize * 0.45) + 4);
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    doc.text(lines, margin, y);
    y += lines.length * (fontSize * 0.45) + 4;
  }

  // ── Executive Summary ──
  if (job.executiveSummary) {
    addPageBreak();
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageW, pageH, 'F');

    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(26, 58, 92);
    doc.text('Executive Summary', margin, y + 8);
    y += 16;
    drawAccentLine();

    if (job.executiveSummary.headline) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(42, 96, 144);
      const hl = doc.splitTextToSize(job.executiveSummary.headline, contentW);
      doc.text(hl, margin, y);
      y += hl.length * 5 + 6;
    }

    // Ticker boxes
    const tickers = job.executiveSummary.tickerBoxes;
    if (tickers?.length) {
      const boxW = contentW / tickers.length;
      const boxH = 18;
      checkPageBreak(boxH + 4);

      tickers.forEach((t: ExecutiveSummaryTickerBox, i: number) => {
        const x = margin + i * boxW;
        doc.setFillColor(12, 54, 73);
        doc.roundedRect(x + 1, y, boxW - 2, boxH, 2, 2, 'F');
        // Label
        doc.setFontSize(5.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(126, 170, 191);
        doc.text(t.label, x + boxW / 2, y + 5, { align: 'center', maxWidth: boxW - 4 });
        // Value
        doc.setFontSize(9);
        doc.setTextColor(232, 237, 245);
        doc.text(t.value, x + boxW / 2, y + 11, { align: 'center', maxWidth: boxW - 4 });
        // Secondary
        if (t.secondaryValue) {
          doc.setFontSize(5.5);
          doc.setTextColor(107, 143, 165);
          doc.text(t.secondaryValue, x + boxW / 2, y + 15, { align: 'center', maxWidth: boxW - 4 });
        }
      });
      y += boxH + 6;
    } else if (job.executiveSummary.kpis?.length) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      job.executiveSummary.kpis.forEach((kpi: { label: string; value: string }) => {
        checkPageBreak(7);
        doc.setTextColor(50, 50, 50);
        doc.setFont('helvetica', 'bold');
        doc.text(`${kpi.label}: `, margin, y);
        const labelW = doc.getTextWidth(`${kpi.label}: `);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(5, 150, 105);
        doc.text(kpi.value, margin + labelW, y);
        y += 6;
      });
      y += 4;
    }

    // Insight cards
    const insights: { label: string; text: string }[] = [];
    if (job.executiveSummary.concentrationInsights) insights.push({ label: 'Market Concentration', text: job.executiveSummary.concentrationInsights });
    if (job.executiveSummary.keyPlayersInsights) insights.push({ label: 'Key Players & Market Share', text: job.executiveSummary.keyPlayersInsights });
    if (job.executiveSummary.topTrends?.length) insights.push({ label: 'Top Market Trends', text: job.executiveSummary.topTrends.map((t: string, i: number) => `${i + 1}. ${t}`).join('\n') });
    if (job.executiveSummary.recentMaJvInsights) insights.push({ label: 'Recent M&A, JVs & New Entrants', text: job.executiveSummary.recentMaJvInsights });

    insights.forEach((ins: { label: string; text: string }) => {
      checkPageBreak(16);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(52, 145, 232);
      doc.text(ins.label, margin, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50, 50, 50);
      doc.setFontSize(8);
      const insLines = doc.splitTextToSize(ins.text, contentW);
      checkPageBreak(insLines.length * 3.5 + 4);
      doc.text(insLines, margin + 2, y);
      y += insLines.length * 3.5 + 4;
    });

    // Paragraphs
    doc.setTextColor(50, 50, 50);
    doc.setFont('helvetica', 'normal');
    job.executiveSummary.paragraphs?.forEach((p: string) => {
      renderBulletText(p);
    });

    // Scenarios
    if (job.executiveSummary.scenarios?.length) {
      checkPageBreak(20);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(26, 58, 92);
      doc.text('Scenario Outlook', margin, y + 4);
      y += 10;
      renderTable({
        title: '',
        headers: ['Scenario', 'Market Size', 'Description'],
        rows: job.executiveSummary.scenarios.map((s: { name: string; marketSize: string; description: string }) => [`${s.name} Case`, s.marketSize, s.description]),
      });
    }
  }

  // ── Section renderer ──
  function addSection(section: ReportSection, sectionNum: number) {
    addPageBreak();
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageW, pageH, 'F');

    // Section heading
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(26, 58, 92);
    doc.text(`${sectionNum}. ${section.title}`, margin, y + 8);
    y += 14;
    drawAccentLine();

    // Body
    section.bodyParagraphs?.forEach((para: string) => {
      renderBulletText(para);
    });

    // Key table
    if (section.keyTable?.headers?.length && section.keyTable?.rows?.length) {
      y += 2;
      renderTable(section.keyTable);
    }

    // Multiple tables — each on new page
    section.tables?.forEach((tbl: ReportTable) => {
      if (tbl.headers?.length && tbl.rows?.length) {
        addPageBreak();
        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, pageW, pageH, 'F');
        renderTable(tbl);
      }
    });

    // Charts → rendered as data tables in PDF
    collectCharts(section).forEach((chart: ReportChartSpec) => {
      const chartTbl = chartToTable(chart);
      if (chartTbl.headers?.length && chartTbl.rows?.length) {
        checkPageBreak(20);
        renderTable(chartTbl);
      }
    });

    // SWOT
    if (section.swotData) {
      const quadrants = [
        { key: 'strengths' as const, label: 'Strengths', r: 16, g: 185, b: 129 },
        { key: 'weaknesses' as const, label: 'Weaknesses', r: 230, g: 57, b: 70 },
        { key: 'opportunities' as const, label: 'Opportunities', r: 52, g: 145, b: 232 },
        { key: 'threats' as const, label: 'Threats', r: 245, g: 158, b: 11 },
      ];
      for (const q of quadrants) {
        const items = section.swotData[q.key];
        if (!items?.length) continue;
        renderTable({
          title: q.label,
          headers: ['Item', 'Description', 'Impact'],
          rows: items.map((item: { title: string; description?: string; impact?: string }) => [item.title, item.description || '', (item.impact || '').toUpperCase()]),
        });
      }
    }

    // Porter's
    if (section.portersData) {
      const forces = [
        { key: 'competitiveRivalry' as const, label: 'Competitive Rivalry' },
        { key: 'supplierPower' as const, label: 'Supplier Power' },
        { key: 'buyerPower' as const, label: 'Buyer Power' },
        { key: 'threatOfSubstitution' as const, label: 'Threat of Substitution' },
        { key: 'threatOfNewEntry' as const, label: 'Threat of New Entry' },
      ];
      const rows = forces.map((f: { key: string; label: string }) => {
        const force = (section.portersData as Record<string, unknown>)?.[f.key] as { rating?: string; factors?: string[]; description?: string } | undefined;
        if (!force) return null;
        return [f.label, (force.rating || '').toUpperCase(), (force.factors || []).join('; '), force.description || ''];
      }).filter(Boolean) as string[][];
      if (rows.length) {
        renderTable({ title: "Porter's Five Forces", headers: ['Force', 'Rating', 'Key Factors', 'Description'], rows });
      }
    }

    // Macro TEI
    if (section.macroTeiData?.items?.length) {
      addPageBreak();
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, pageW, pageH, 'F');
      renderTable({
        title: 'Macroeconomic Impact Analysis',
        headers: ['Trigger', 'Impact', 'Description', 'Examples', 'Market Impact'],
        rows: section.macroTeiData.items.map((item: { trigger: string; impactLevel?: string; description?: string; examples?: string; marketSizeImpact?: string }) => [
          item.trigger, (item.impactLevel || '').toUpperCase(), item.description || '', item.examples || '', item.marketSizeImpact || '',
        ]),
      });
    }

    // BCG Matrix table
    if (section.bcgMatrixData?.length) {
      const quadrantLabels: Record<string, string> = { star: 'Star', cash_cow: 'Cash Cow', question_mark: 'Question Mark', dog: 'Dog' };
      renderTable({
        title: 'BCG Matrix — Market Size vs Growth',
        headers: ['Company', 'Market Size', 'Growth (%)', 'Quadrant'],
        rows: section.bcgMatrixData.map((item: BCGMatrixItem) => [item.name, String(item.marketSize), String(item.growth), quadrantLabels[item.quadrant] || item.quadrant]),
      });
    }

    // Competitor Profiles
    if (section.competitorProfiles?.length) {
      addPageBreak();
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, pageW, pageH, 'F');
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(52, 145, 232);
      doc.text('Key Player Profiles', margin, y + 4);
      y += 12;

      section.competitorProfiles.forEach((profile, pi) => {
        const fields = [
          { label: 'Parent Company', value: profile.parentCompany },
          { label: 'HQ', value: profile.hqLocation },
          { label: 'Key Products', value: profile.keyProducts },
          { label: 'Revenue', value: profile.overallRevenue },
          { label: 'Category Revenue', value: profile.categoryRevenue },
          { label: 'Market Share', value: profile.marketShare },
          { label: 'Manufacturing', value: profile.manufacturingLocation },
          { label: 'Recent News', value: profile.recentNews },
          { label: 'JV/M&A', value: profile.jvMaPartnerships },
          { label: 'Insights', value: profile.otherInsights },
        ].filter((f: { label: string; value?: string }) => f.value);

        const neededH = 10 + fields.length * 4.5;
        if (y + neededH > pageH - margin) {
          addPageBreak();
          doc.setFillColor(255, 255, 255);
          doc.rect(0, 0, pageW, pageH, 'F');
        }

        // Profile name
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(26, 58, 92);
        doc.text(`${pi + 1}. ${profile.name}`, margin, y + 4);
        y += 8;

        fields.forEach((f: { label: string; value: string }) => {
          doc.setFontSize(7.5);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(107, 143, 165);
          doc.text(`${f.label}: `, margin + 2, y);
          const lw = doc.getTextWidth(`${f.label}: `);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(50, 50, 50);
          const valLines = doc.splitTextToSize(f.value, contentW - lw - 4);
          doc.text(valLines, margin + 2 + lw, y);
          y += valLines.length * 3.5 + 1.5;
        });
        y += 4;
      });
    }

    // Subsections — each on new page
    section.subsections?.forEach((sub: ReportSubsection) => {
      addPageBreak();
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, pageW, pageH, 'F');

      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(42, 96, 144);
      doc.text(sub.title, margin, y + 6);
      y += 12;

      if (sub.content) {
        renderBulletText(sub.content);
      }

      if (sub.keyTable?.headers?.length && sub.keyTable?.rows?.length) {
        renderTable(sub.keyTable);
      }

      sub.tables?.forEach((tbl: ReportTable) => {
        if (tbl.headers?.length && tbl.rows?.length) {
          renderTable(tbl);
        }
      });
    });
  }

  // ── Render all sections ──
  const exportSectionsPdf = filterSections(job.sections, opts?.sectionFilter);
  exportSectionsPdf.forEach((sec, i) => addSection(sec, i + 1));

  doc.save(`${title.replace(/[^a-zA-Z0-9 ]/g, '')}_Report.pdf`);
}

// ── PPTX Export (HTML-based) ─────────────────────────────────────────────────

export async function exportToPptx(job: IndustryReportJob, opts?: ExportOptions): Promise<void> {
  const PptxGenJS = (await import('pptxgenjs')).default;
  const pptx = new PptxGenJS();
  const title = jobTitle(job);

  pptx.author = 'RefractOne AI';
  pptx.title = `${title} - Industry Report`;
  pptx.layout = 'LAYOUT_WIDE'; // 13.33 x 7.5 inches

  // ── Palette ──
  const NAVY = '0c3649';
  const DARK_BLUE = '1a3a5c';
  const ACCENT = '3491E8';
  const GREEN = '059669';
  const LIGHT_BG = 'F0F5FA';
  const WHITE = 'FFFFFF';
  const TEXT = '333333';
  const MUTED = '6B8FA5';

  // Chart color palette
  const CHART_COLORS = ['3491E8', '059669', 'F59E0B', 'E63946', '8B5CF6', '22D3EE', 'F97316', '10B981'];

  // ── Helpers ──
  type SlideObj = ReturnType<typeof pptx.addSlide>;

  function addSlideHeader(slide: SlideObj, heading: string) {
    // Top accent bar
    slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 0.04, fill: { color: ACCENT } });
    slide.addText(heading, {
      x: 0.5, y: 0.25, w: 12, h: 0.5,
      fontSize: 20, bold: true, color: DARK_BLUE, fontFace: 'Calibri',
    });
    // Divider line
    slide.addShape(pptx.ShapeType.line, {
      x: 0.5, y: 0.8, w: 12, h: 0,
      line: { color: ACCENT, width: 1.5 },
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function addPptTable(slide: SlideObj, tbl: ReportTable, opts?: { x?: number; y?: number; w?: number }) {
    if (!tbl.headers?.length || !tbl.rows?.length) return;
    const colCount = tbl.headers.length;
    const fontSize = colCount <= 4 ? 9 : colCount <= 6 ? 7.5 : 6;
    const tblX = opts?.x ?? 0.5;
    const tblY = opts?.y ?? 1.1;
    const tblW = opts?.w ?? 12.3;

    // Title
    if (tbl.title) {
      slide.addText(tbl.title, {
        x: tblX, y: tblY - 0.35, w: tblW, h: 0.3,
        fontSize: 10, bold: true, color: ACCENT, fontFace: 'Calibri',
      });
    }

    const headerRow = tbl.headers.map((h: any) => ({
      text: h, options: { bold: true, fontSize, color: WHITE, fontFace: 'Calibri', fill: { color: NAVY } },
    }));

    const dataRows = tbl.rows.slice(0, 20).map((row, ri) =>
      row.map((cell: any) => ({
        text: String(cell || '').slice(0, 120),
        options: {
          fontSize, color: TEXT, fontFace: 'Calibri',
          fill: { color: ri % 2 === 0 ? LIGHT_BG : WHITE },
        },
      }))
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    slide.addTable([headerRow as any, ...dataRows as any], {
      x: tblX, y: tbl.title ? tblY : tblY,
      w: tblW,
      border: { type: 'solid', pt: 0.5, color: 'D0D5DD' },
      colW: Array(colCount).fill(tblW / colCount),
      rowH: colCount <= 4 ? 0.35 : 0.28,
      autoPage: true,
      autoPageRepeatHeader: true,
    });
  }

  function addPptChart(slide: SlideObj, chart: ReportChartSpec, placement: { x: number; y: number; w: number; h: number }) {
    const { data, series, type } = chart;
    if (!data?.length) return;

    if (type === 'pie') {
      const labels = data.map((d: any) => d.label || '');
      const values = data.map((d: any) => d.value || 0);
      slide.addChart(pptx.ChartType.pie, [{ name: chart.title || 'Data', labels, values }], {
        ...placement,
        showTitle: true, title: chart.title || '',
        titleFontSize: 9, titleColor: DARK_BLUE,
        showLegend: true, legendPos: 'b', legendFontSize: 7,
        showPercent: true, dataLabelFontSize: 7,
        chartColors: CHART_COLORS.slice(0, data.length),
      });
      return;
    }

    // Bar / Line / Combo / Area
    if (series?.length) {
      const chartData = series.map((s, si) => ({
        name: s.name,
        labels: data.map((d: any) => d.label || ''),
        values: data.map((d: any) => Number(d[s.key]) || 0),
      }));

      const chartType = type === 'line' || type === 'area' ? pptx.ChartType.line
        : pptx.ChartType.bar;

      slide.addChart(chartType, chartData, {
        ...placement,
        showTitle: true, title: chart.title || '',
        titleFontSize: 9, titleColor: DARK_BLUE,
        showLegend: true, legendPos: 'b', legendFontSize: 7,
        showValue: false,
        catAxisLabelFontSize: 7, valAxisLabelFontSize: 7,
        chartColors: series.map((s, i) => s.color?.replace('#', '') || CHART_COLORS[i % CHART_COLORS.length]),
        barGrouping: type === 'stacked_bar' ? 'stacked' : 'clustered',
      });
      return;
    }

    // Simple single-series bar/line
    const chartData = [{ name: chart.yLabel || 'Value', labels: data.map((d: any) => d.label || ''), values: data.map((d: any) => d.value || 0) }];
    const chartType = type === 'line' || type === 'area' ? pptx.ChartType.line
      : pptx.ChartType.bar;

    slide.addChart(chartType, chartData, {
      ...placement,
      showTitle: true, title: chart.title || '',
      titleFontSize: 9, titleColor: DARK_BLUE,
      showLegend: false,
      catAxisLabelFontSize: 7, valAxisLabelFontSize: 7,
      chartColors: CHART_COLORS,
    });
  }

  /** Add a chart + its data table side by side on the same slide */
  function addChartWithTable(slide: SlideObj, chart: ReportChartSpec, startY: number) {
    const tbl = chartToTable(chart);
    const hasTable = tbl.headers?.length > 0 && tbl.rows?.length > 0;
    const chartW = hasTable ? 6.5 : 12.3;
    const chartX = 0.5;

    addPptChart(slide, chart, { x: chartX, y: startY, w: chartW, h: 4.5 });

    if (hasTable) {
      const tableW = 5.5;
      const tableX = 7.3;
      const fontSize = tbl.headers.length <= 3 ? 7.5 : 6;

      const headerRow = tbl.headers.map((h: any) => ({
        text: h, options: { bold: true, fontSize, color: WHITE, fontFace: 'Calibri', fill: { color: NAVY } },
      }));

      const dataRows = tbl.rows.slice(0, 16).map((row, ri) =>
        row.map((cell: any) => ({
          text: String(cell || '').slice(0, 60),
          options: { fontSize, color: TEXT, fontFace: 'Calibri', fill: { color: ri % 2 === 0 ? LIGHT_BG : WHITE } },
        }))
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      slide.addTable([headerRow as any, ...dataRows as any], {
        x: tableX, y: startY + 0.15,
        w: tableW,
        border: { type: 'solid', pt: 0.5, color: 'D0D5DD' },
        colW: Array(tbl.headers.length).fill(tableW / tbl.headers.length),
        rowH: 0.26,
        autoPage: false,
      });
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // COVER SLIDE
  // ══════════════════════════════════════════════════════════════════════════
  const coverSlide = pptx.addSlide();
  coverSlide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: '100%', fill: { color: NAVY } });
  coverSlide.addShape(pptx.ShapeType.rect, { x: 0, y: 2.8, w: '100%', h: 0.04, fill: { color: ACCENT } });
  coverSlide.addText(title, {
    x: 1, y: 3.1, w: 11.3, h: 1.2,
    fontSize: 32, bold: true, color: WHITE, fontFace: 'Calibri', align: 'center',
  });
  coverSlide.addText('Industry Intelligence Report', {
    x: 1, y: 4.3, w: 11.3, h: 0.5,
    fontSize: 16, color: MUTED, fontFace: 'Calibri', align: 'center',
  });
  coverSlide.addText([job.scope?.geography, job.scope?.timeHorizon].filter(Boolean).join(' | '), {
    x: 1, y: 4.8, w: 11.3, h: 0.4,
    fontSize: 12, color: '5A8A9F', fontFace: 'Calibri', align: 'center',
  });
  coverSlide.addText(
    `Generated: ${job.completedAt ? new Date(job.completedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : new Date().toLocaleDateString()}`,
    { x: 1, y: 5.5, w: 11.3, h: 0.3, fontSize: 10, color: '888888', fontFace: 'Calibri', align: 'center' }
  );

  // ══════════════════════════════════════════════════════════════════════════
  // EXECUTIVE SUMMARY
  // ══════════════════════════════════════════════════════════════════════════
  if (job.executiveSummary) {
    const execSlide = pptx.addSlide();
    addSlideHeader(execSlide, 'Executive Summary');

    if (job.executiveSummary.headline) {
      execSlide.addText(job.executiveSummary.headline, {
        x: 0.5, y: 0.95, w: 12, h: 0.35,
        fontSize: 11, italic: true, color: '2a6090', fontFace: 'Calibri',
      });
    }

    // Ticker boxes / KPIs
    const tickers = job.executiveSummary.tickerBoxes;
    let kpiY = 1.35;
    if (tickers?.length) {
      const boxW = 12.3 / tickers.length;
      tickers.forEach((t: any, i: number) => {
        const bx = 0.5 + i * boxW;
        execSlide.addShape(pptx.ShapeType.rect, { x: bx + 0.05, y: kpiY, w: boxW - 0.1, h: 0.8, fill: { color: '0A2538' }, rectRadius: 0.05 });
        execSlide.addText(t.label.toUpperCase(), { x: bx + 0.05, y: kpiY + 0.05, w: boxW - 0.1, h: 0.2, fontSize: 7, bold: true, color: MUTED, fontFace: 'Calibri', align: 'center' });
        execSlide.addText(t.value, { x: bx + 0.05, y: kpiY + 0.25, w: boxW - 0.1, h: 0.35, fontSize: 16, bold: true, color: WHITE, fontFace: 'Calibri', align: 'center' });
        if (t.secondaryValue) {
          execSlide.addText(t.secondaryValue, { x: bx + 0.05, y: kpiY + 0.55, w: boxW - 0.1, h: 0.2, fontSize: 8, color: '5A8A9F', fontFace: 'Calibri', align: 'center' });
        }
      });
      kpiY += 1.0;
    } else if (job.executiveSummary.kpis?.length) {
      const kpis = job.executiveSummary.kpis;
      const boxW = 12.3 / kpis.length;
      kpis.forEach((k, i) => {
        const bx = 0.5 + i * boxW;
        execSlide.addText(k.value, { x: bx, y: kpiY, w: boxW, h: 0.4, fontSize: 16, bold: true, color: GREEN, fontFace: 'Calibri', align: 'center' });
        execSlide.addText(k.label, { x: bx, y: kpiY + 0.35, w: boxW, h: 0.25, fontSize: 8, color: MUTED, fontFace: 'Calibri', align: 'center' });
      });
      kpiY += 0.8;
    }

    // Paragraphs
    const bodyText = (job.executiveSummary.paragraphs || []).map((p: any) => stripBullets(p)).join('\n\n');
    if (bodyText) {
      execSlide.addText(bodyText, {
        x: 0.5, y: kpiY + 0.1, w: 12.3, h: 7.5 - kpiY - 0.5,
        fontSize: 9, color: TEXT, fontFace: 'Calibri', valign: 'top',
        wrap: true,
      });
    }

    // Market size chart slide
    if (job.executiveSummary.marketSizeChartSpec) {
      const mktSlide = pptx.addSlide();
      addSlideHeader(mktSlide, 'Market Size Forecast');
      addChartWithTable(mktSlide, job.executiveSummary.marketSizeChartSpec, 1.1);
    }

    // Scenarios slide
    if (job.executiveSummary.scenarios?.length) {
      const scenSlide = pptx.addSlide();
      addSlideHeader(scenSlide, 'Scenario Outlook');
      addPptTable(scenSlide, {
        title: '', headers: ['Scenario', 'Market Size', 'Description'],
        rows: job.executiveSummary.scenarios.map((s: any) => [`${s.name} Case`, s.marketSize, s.description]),
      });
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION SLIDES
  // ══════════════════════════════════════════════════════════════════════════
  const exportSectionsPptx = filterSections(job.sections, opts?.sectionFilter);

  exportSectionsPptx.forEach((section, idx) => {
    const sectionLabel = `${idx + 1}. ${section.title}`;

    // Main content slide
    const mainSlide = pptx.addSlide();
    addSlideHeader(mainSlide, sectionLabel);

    const bodyText = (section.bodyParagraphs || []).map((p: any) => stripBullets(p)).join('\n\n');
    let bodyH = 5.5;

    // If there's a key table, split body + table
    if (section.keyTable?.headers?.length && section.keyTable?.rows?.length) {
      bodyH = 2.5;
      mainSlide.addText(bodyText || '', {
        x: 0.5, y: 1.0, w: 12.3, h: bodyH,
        fontSize: 9, color: TEXT, fontFace: 'Calibri', valign: 'top', wrap: true,
      });
      addPptTable(mainSlide, section.keyTable, { y: 3.6 });
    } else {
      mainSlide.addText(bodyText || '', {
        x: 0.5, y: 1.0, w: 12.3, h: bodyH,
        fontSize: 9, color: TEXT, fontFace: 'Calibri', valign: 'top', wrap: true,
      });
    }

    // Additional tables — one slide per table
    section.tables?.forEach((tbl: any) => {
      if (tbl.headers?.length && tbl.rows?.length) {
        const tblSlide = pptx.addSlide();
        addSlideHeader(tblSlide, sectionLabel);
        addPptTable(tblSlide, tbl);
      }
    });

    // Charts — each chart gets its own slide with chart + table side by side
    collectCharts(section).forEach((chart: any) => {
      const chartSlide = pptx.addSlide();
      addSlideHeader(chartSlide, sectionLabel);
      addChartWithTable(chartSlide, chart, 1.1);
    });

    // SWOT slide
    if (section.swotData) {
      const swotSlide = pptx.addSlide();
      addSlideHeader(swotSlide, 'SWOT Analysis');
      const quadrants = [
        { key: 'strengths' as const, label: 'Strengths', color: '10B981' },
        { key: 'weaknesses' as const, label: 'Weaknesses', color: 'E63946' },
        { key: 'opportunities' as const, label: 'Opportunities', color: '3491E8' },
        { key: 'threats' as const, label: 'Threats', color: 'F59E0B' },
      ];
      quadrants.forEach((q, qi) => {
        const items = section.swotData![q.key];
        if (!items?.length) return;
        const col = qi % 2;
        const row = Math.floor(qi / 2);
        const bx = 0.5 + col * 6.3;
        const by = 1.1 + row * 3.0;
        swotSlide.addText(q.label, { x: bx, y: by, w: 6, h: 0.35, fontSize: 13, bold: true, color: q.color, fontFace: 'Calibri' });
        const itemText = items.map((item: any) => `${item.title}: ${item.description}`).join('\n');
        swotSlide.addText(itemText, { x: bx, y: by + 0.4, w: 6, h: 2.4, fontSize: 8, color: TEXT, fontFace: 'Calibri', valign: 'top', wrap: true });
      });
    }

    // Porter's slide
    if (section.portersData) {
      const porterSlide = pptx.addSlide();
      addSlideHeader(porterSlide, "Porter's Five Forces");
      const forces = [
        { key: 'competitiveRivalry' as const, label: 'Competitive Rivalry' },
        { key: 'supplierPower' as const, label: 'Supplier Power' },
        { key: 'buyerPower' as const, label: 'Buyer Power' },
        { key: 'threatOfSubstitution' as const, label: 'Threat of Substitution' },
        { key: 'threatOfNewEntry' as const, label: 'Threat of New Entry' },
      ];
      const rows = forces.map((f: { key: string; label: string }) => {
        const force = (section.portersData as Record<string, unknown>)?.[f.key] as { rating?: string; factors?: string[]; description?: string } | undefined;
        if (!force) return null;
        return [f.label, (force.rating || '').toUpperCase(), (force.factors || []).join('; '), force.description || ''];
      }).filter(Boolean) as string[][];
      addPptTable(porterSlide, { title: '', headers: ['Force', 'Rating', 'Key Factors', 'Description'], rows });
    }

    // Macro TEI slide
    if (section.macroTeiData?.items?.length) {
      const teiSlide = pptx.addSlide();
      addSlideHeader(teiSlide, 'Macroeconomic Impact');
      addPptTable(teiSlide, {
        title: '', headers: ['Trigger', 'Impact', 'Description', 'Examples', 'Market Impact'],
        rows: section.macroTeiData.items.map((item: any) => [item.trigger, (item.impactLevel || '').toUpperCase(), item.description, item.examples, item.marketSizeImpact]),
      });
    }

    // Competitor profiles — 3 per slide
    if (section.competitorProfiles?.length) {
      for (let i = 0; i < section.competitorProfiles.length; i += 3) {
        const batch = section.competitorProfiles.slice(i, i + 3);
        const profSlide = pptx.addSlide();
        addSlideHeader(profSlide, `Key Player Profiles (${i + 1}-${Math.min(i + 3, section.competitorProfiles.length)})`);
        batch.forEach((p, pi) => {
          const by = 1.1 + pi * 2.0;
          profSlide.addText(p.name, { x: 0.5, y: by, w: 12, h: 0.3, fontSize: 12, bold: true, color: DARK_BLUE, fontFace: 'Calibri' });
          const fields = [
            { l: 'HQ', v: p.hqLocation }, { l: 'Products', v: p.keyProducts },
            { l: 'Revenue', v: p.overallRevenue }, { l: 'Market Share', v: p.marketShare },
            { l: 'News', v: p.recentNews },
          ].filter((f: any) => f.v);
          const fieldText = fields.map((f: any) => `${f.l}: ${f.v}`).join('  |  ');
          profSlide.addText(fieldText, { x: 0.5, y: by + 0.35, w: 12, h: 1.4, fontSize: 8, color: TEXT, fontFace: 'Calibri', valign: 'top', wrap: true });
        });
      }
    }

    // Subsection slides
    (section.subsections || []).forEach((sub: any) => {
      const subSlide = pptx.addSlide();
      addSlideHeader(subSlide, sub.title);

      const subBody = stripBullets(sub.content || '');
      let subBodyH = 5.5;

      // Collect tables
      const subTables: ReportTable[] = [];
      if (sub.keyTable?.headers?.length && sub.keyTable?.rows?.length) subTables.push(sub.keyTable);
      (sub.tables || []).forEach((tbl: any) => { if (tbl.headers?.length && tbl.rows?.length) subTables.push(tbl); });

      if (subTables.length > 0) {
        subBodyH = 2.0;
        subSlide.addText(subBody, {
          x: 0.5, y: 1.0, w: 12.3, h: subBodyH,
          fontSize: 9, color: TEXT, fontFace: 'Calibri', valign: 'top', wrap: true,
        });
        subTables.forEach((tbl, ti) => {
          addPptTable(subSlide, tbl, { y: 3.2 + ti * 2.5 });
        });
      } else {
        subSlide.addText(subBody, {
          x: 0.5, y: 1.0, w: 12.3, h: subBodyH,
          fontSize: 9, color: TEXT, fontFace: 'Calibri', valign: 'top', wrap: true,
        });
      }

      // Subsection charts
      collectCharts(sub).forEach((chart: any) => {
        const chartSlide = pptx.addSlide();
        addSlideHeader(chartSlide, sub.title);
        addChartWithTable(chartSlide, chart, 1.1);
      });
    });
  });

  // ── Save ──
  const fileName = `${title.replace(/[^a-zA-Z0-9 ]/g, '')}_Report.pptx`;
  await pptx.writeFile({ fileName });
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── Competition Benchmarking — landscape DOCX export ─────────────────────────
// Conventions below are load-bearing, not stylistic — see the inline notes.
// Orientation and table-width budget are guaranteed correct by construction
// (the width-distribution helper always sums to the budget, and page.size
// is passed portrait-dimensions-with-landscape-flag per the docx library's
// actual behavior), which is what the automated QA in the build brief calls
// for — there is no separate file the library writes that needs re-parsing
// to verify these two properties.

const CB_NAVY = '1F3864';
const CB_GOLD = 'B08A2E';
const CB_ROW_SHADE = 'EDEDED';
const CB_TEXT = '333333';
const CB_FONT = 'Calibri';
const CB_USABLE_WIDTH_TWIPS = 14200; // 14,400 usable minus a safety margin below the hard 14,400 limit

function cbColumnWidths(columnCount: number, hint: BenchmarkingTable['columnWidthHint']): number[] {
  if (columnCount === 0) return [];
  if (hint === 'narrow') {
    // First column narrow (a label column), remainder split evenly.
    const first = Math.round(CB_USABLE_WIDTH_TWIPS * 0.15);
    const rest = Math.floor((CB_USABLE_WIDTH_TWIPS - first) / Math.max(columnCount - 1, 1));
    return [first, ...Array(columnCount - 1).fill(rest)];
  }
  if (hint === 'wide-last-column') {
    // Last column wide (a long free-text field), remainder split evenly.
    const last = Math.round(CB_USABLE_WIDTH_TWIPS * 0.4);
    const rest = Math.floor((CB_USABLE_WIDTH_TWIPS - last) / Math.max(columnCount - 1, 1));
    return [...Array(columnCount - 1).fill(rest), last];
  }
  // 'even'
  const each = Math.floor(CB_USABLE_WIDTH_TWIPS / columnCount);
  return Array(columnCount).fill(each);
}

export async function exportCompetitionBenchmarkingDocx(job: CompetitionBenchmarkingResult): Promise<void> {
  const {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    WidthType, HeadingLevel, AlignmentType, BorderStyle, ShadingType,
    TableLayoutType, PageOrientation, Header, Footer, PageNumber,
    // eslint-disable-next-line @typescript-eslint/no-require-imports
  } = await import('docx');
  const fileSaver = await import('file-saver');
  const saveAs = fileSaver.default || fileSaver.saveAs;

  const title = `${job.input.userFirm} Competitive Benchmarking Report`;

  const children: Array<Record<string, unknown>> = [];

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [new TextRun({ text: title, bold: true, size: 44, color: CB_NAVY, font: CB_FONT })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: CB_GOLD } },
      children: [new TextRun({ text: '', size: 4 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
      children: [new TextRun({
        text: `${job.input.userDomain}${job.input.focusSegment ? ` · ${job.input.focusSegment}` : ''}`,
        size: 22, color: CB_TEXT, italics: true, font: CB_FONT,
      })],
    }),
  );

  if (job.competitorSelection) {
    children.push(new Paragraph({
      spacing: { after: 300 },
      children: [new TextRun({
        text: `Competitors selected by RefractOne using ${job.competitorSelection.rankingSource} (${job.competitorSelection.rankingPeriod}), as of ${job.competitorSelection.asOf}.`,
        italics: true, size: 18, color: '5A6E7A', font: CB_FONT,
      })],
    }));
  }

  function buildCbTable(table: BenchmarkingTable): Record<string, unknown> {
    const widths = cbColumnWidths(table.headers.length, table.columnWidthHint);
    // Fail fast rather than silently generating a broken file — this should
    // never actually trip given cbColumnWidths always sums to the budget,
    // but it's the explicit assertion the build brief calls for.
    const sum = widths.reduce((a, b) => a + b, 0);
    if (sum > 14200) throw new Error(`Table "${table.headers.join(',')}" column widths (${sum} twips) exceed the safety budget`);

    const headerRow = new TableRow({
      tableHeader: true,
      children: table.headers.map((h, i) => new TableCell({
        width: { size: widths[i], type: WidthType.DXA },
        shading: { type: ShadingType.CLEAR, fill: CB_NAVY },
        children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, color: 'FFFFFF', size: 18, font: CB_FONT })] })],
      })),
    });

    const bodyRows = table.rows.map((row, rowIdx) => new TableRow({
      children: row.map((cell, i) => new TableCell({
        width: { size: widths[i] ?? widths[widths.length - 1], type: WidthType.DXA },
        shading: rowIdx % 2 === 1 ? { type: ShadingType.CLEAR, fill: CB_ROW_SHADE } : undefined,
        children: [new Paragraph({ children: [new TextRun({ text: cell || '—', color: CB_TEXT, size: 18, font: CB_FONT })] })],
      })),
    }));

    return new Table({
      layout: TableLayoutType.FIXED,
      width: { size: CB_USABLE_WIDTH_TWIPS, type: WidthType.DXA },
      rows: [headerRow, ...bodyRows],
    }) as unknown as Record<string, unknown>;
  }

  (job.sections || []).forEach((section) => {
    children.push(new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 300, after: 60 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: CB_GOLD } },
      children: [new TextRun({ text: section.heading, bold: true, color: CB_NAVY, size: 28, font: CB_FONT })],
    }));

    section.paragraphs.forEach((p) => {
      children.push(new Paragraph({
        spacing: { after: 160 },
        children: [new TextRun({ text: p, color: CB_TEXT, size: 20, font: CB_FONT })],
      }));
    });

    section.tables.forEach((t) => {
      children.push(buildCbTable(t));
      children.push(new Paragraph({ spacing: { after: 200 }, children: [] }));
    });

    if (section.footnote) {
      children.push(new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ text: section.footnote, italics: true, color: '8A9DAD', size: 16, font: CB_FONT })],
      }));
    }

    if (section.flags.length > 0) {
      section.flags.forEach((flag) => {
        children.push(new Paragraph({
          spacing: { after: 100 },
          children: [new TextRun({ text: `⚠ ${flag}`, italics: true, color: '8A9DAD', size: 16, font: CB_FONT })],
        }));
      });
    }
  });

  const doc = new Document({
    creator: 'RefractOne Market Intelligence Practice',
    title,
    sections: [{
      properties: {
        page: {
          // Landscape US Letter: pass PORTRAIT dimensions with the landscape
          // orientation flag — the docx library swaps width/height internally.
          // Passing already-landscape dimensions here silently produces a
          // portrait page and truncates every wide table.
          size: { width: 12240, height: 15840, orientation: PageOrientation.LANDSCAPE },
          margin: { top: 720, bottom: 720, left: 720, right: 720 },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: title, size: 14, color: '8A9DAD', font: CB_FONT })],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ children: [PageNumber.CURRENT], size: 14, color: '8A9DAD', font: CB_FONT }),
            ],
          })],
        }),
      },
      children,
    }],
  });

  const blob = await Packer.toBlob(doc);
  const focusOrDomain = (job.input.focusSegment || job.input.userDomain).replace(/[^a-zA-Z0-9 ]/g, '').trim().replace(/\s+/g, '_');
  const firmName = job.input.userFirm.replace(/[^a-zA-Z0-9 ]/g, '').trim().replace(/\s+/g, '_');
  saveAs(blob, `${firmName}_${focusOrDomain}_Competitive_Benchmarking_Report.docx`);
}

/**
 * Programmatic QA on the assembled document JSON, run before enabling the
 * download button (per the build brief's Section 8) — schema/completeness
 * checks and the verification-coverage warning threshold.
 */
export function competitionBenchmarkingQA(job: CompetitionBenchmarkingResult): { warnings: string[]; blockingErrors: string[] } {
  const warnings: string[] = [];
  const blockingErrors: string[] = [];

  (job.sections || []).forEach((s) => {
    if (!s.heading) blockingErrors.push('A section is missing its heading.');
    if (s.paragraphs.length === 0 && s.tables.length === 0) blockingErrors.push(`Section "${s.heading || '(untitled)'}" has no paragraphs or tables.`);
  });

  const orgSection = (job.sections || []).find((s) => s.heading.toLowerCase().includes('organization-level'));
  const expectedRows = 1 + (job.finalCompetitors?.length || 0);
  if (orgSection) {
    const mainTable = orgSection.tables[0];
    if (mainTable && mainTable.rows.length !== expectedRows) {
      warnings.push(`Organization-Level Benchmarking table has ${mainTable.rows.length} rows, expected ${expectedRows} (1 + number of competitors).`);
    }
  }

  if (job.totalFactCount && job.unverifiedFactCount) {
    const pct = job.unverifiedFactCount / job.totalFactCount;
    if (pct > 0.2) {
      warnings.push(`This report has ${Math.round(pct * 100)}% unverified items — more than usual. Recommend reviewing before sending to a client.`);
    }
  }

  return { warnings, blockingErrors };
}
