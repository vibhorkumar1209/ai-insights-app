'use client';

import {
  IndustryReportJob,
  ReportSection,
  ReportTable,
  ReportSubsection,
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
  return sections.filter((s) => filter.includes(s.id));
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
          rows: entry.benchmarkingTable.map((d) => [
            d.dimension,
            `${d.targetCompany.value}${d.targetCompany.notes ? ' — ' + d.targetCompany.notes : ''}`,
            ...Object.values(d.peers).map((p) => `${p.value}${p.notes ? ' — ' + p.notes : ''}`),
          ]),
        },
        citations: [],
      });
    }
    if (entry.gapAnalysis?.length) {
      sections.push({
        id: 'gaps', title: 'Gap Analysis',
        bodyParagraphs: entry.gapAnalysis.map((g) => `${g.dimension} (${g.gapLevel}): ${g.peersBestPractice}`),
        citations: [],
      });
    }
  }

  if (entry.themeRows?.length) {
    const typeLabel = entry.themeType === 'business' ? 'Business' : entry.themeType === 'technology' ? 'Technology' : 'Sustainability';
    sections.push({
      id: 'themes', title: `${typeLabel} Themes`,
      bodyParagraphs: entry.themeRows.map((t) => `${t.theme}: ${t.description}`),
      keyTable: {
        title: `${typeLabel} Themes`,
        headers: ['Theme', 'Description', 'Examples', 'Strategic Impact'],
        rows: entry.themeRows.map((t) => [t.theme, t.description || '', t.examples || '', t.strategicImpact || '']),
      },
      citations: [],
    });
  }

  if (entry.challengesGrowthRows?.length) {
    sections.push({
      id: 'challenges', title: 'Challenges & Growth Prospects',
      bodyParagraphs: entry.challengesGrowthRows.map((r) => `${r.dimension}: Challenge — ${r.challenge}. Growth — ${r.growthProspect}`),
      keyTable: {
        title: 'Challenges & Growth',
        headers: ['Dimension', 'Challenge', 'Growth Prospect'],
        rows: entry.challengesGrowthRows.map((r) => [r.dimension, r.challenge, r.growthProspect]),
      },
      citations: [],
    });
  }

  if (entry.keyBuyerRows?.length) {
    sections.push({
      id: 'buyers', title: 'Key Prospective Buyers',
      bodyParagraphs: entry.keyBuyerRows.map((b) => `${b.theme}: ${b.excerpt} (Source: ${b.reference})`),
      keyTable: {
        title: 'Key Prospective Buyers',
        headers: ['Theme', 'Key Executive', 'Reference', 'Excerpt'],
        rows: entry.keyBuyerRows.map((b) => [b.theme, b.keyExecutive || '', b.reference, b.excerpt]),
      },
      citations: [],
    });
  }

  if (entry.industryBusinessTrends?.length || entry.industryTechTrends?.length) {
    const allTrends = [
      ...(entry.industryBusinessTrends || []).map((t) => ({ ...t, category: 'Business' })),
      ...(entry.industryTechTrends || []).map((t) => ({ ...t, category: 'Technology' })),
    ];
    sections.push({
      id: 'trends', title: 'Industry Trends',
      bodyParagraphs: allTrends.map((t) => `[${t.category}] ${t.trend}: ${t.impact}`),
      keyTable: {
        title: 'Industry Trends',
        headers: ['Category', 'Trend', 'Impact', 'Description'],
        rows: allTrends.map((t) => [t.category, t.trend, t.impact, t.description || '']),
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
      bodyParagraphs: entry.peerCompanies.map((p) => `${p.name}: ${p.description}`),
      keyTable: {
        title: 'Peer Companies',
        headers: ['Company', 'Description', 'Est. Revenue', 'Employees'],
        rows: entry.peerCompanies.map((p) => [p.name, p.description, p.estimatedRevenue || '', p.employees || '']),
      },
      citations: [],
    });
  }

  if (entry.salesPlayData) {
    const sp = entry.salesPlayData;
    const paras: string[] = [];
    if (sp.competitorName) paras.push(`Competitor: ${sp.competitorName}`);
    if (sp.competitiveStatement) paras.push(sp.competitiveStatement);
    sections.push({
      id: 'salesplay', title: 'Sales Play — Opportunity Map',
      bodyParagraphs: paras.length > 0 ? paras : ['Sales play analysis.'],
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
    ShadingType, TableLayoutType,
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  } = await import('docx');
  const { saveAs } = await import('file-saver');

  const title = jobTitle(job);
  const NAVY = '0c3649';
  const DARK_BLUE = '1a3a5c';
  const MED_BLUE = '2a6090';
  const ACCENT_BLUE = '3491E8';
  const GREEN = '059669';
  const LIGHT_BG = 'F0F5FA';
  const TEXT_COLOR = '333333';
  const FONT = 'Calibri';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const children: any[] = [];

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function buildTable(tbl: ReportTable): any {
    const { headers, rows, title: tblTitle } = tbl;
    if (!headers?.length || !rows?.length) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any[] = [];

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function bulletParagraph(text: string, fontSize = 22): any {
    const stripped = stripBullets(text);
    // Split on bullet markers to render each as a separate line
    const lines = stripped.split(/\n/).filter((l) => l.trim());
    return lines.map((line) =>
      new Paragraph({
        spacing: { after: 80 },
        children: [new TextRun({ text: line.trim(), size: fontSize, font: FONT, color: TEXT_COLOR })],
      })
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
      const tickerHeaders = tickers.map((t) => t.label);
      const tickerValues = tickers.map((t) => {
        let val = t.value;
        if (t.secondaryValue) val += `\n(${t.secondaryValue})`;
        return val;
      });
      const tickerTable = new Table({
        layout: TableLayoutType.FIXED,
        rows: [
          new TableRow({
            children: tickerHeaders.map((h) =>
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
            children: tickerValues.map((v) =>
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
      job.executiveSummary.kpis.forEach((kpi) => {
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
    if (job.executiveSummary.topTrends?.length) insights.push({ label: 'Top Market Trends', text: job.executiveSummary.topTrends.map((t, i) => `${i + 1}. ${t}`).join('\n') });
    if (job.executiveSummary.recentMaJvInsights) insights.push({ label: 'Recent M&A, JVs & New Entrants', text: job.executiveSummary.recentMaJvInsights });

    insights.forEach((ins) => {
      children.push(
        new Paragraph({
          spacing: { before: 160, after: 60 },
          children: [new TextRun({ text: ins.label, bold: true, size: 20, color: ACCENT_BLUE, font: FONT })],
        })
      );
      ins.text.split('\n').filter((l) => l.trim()).forEach((line) => {
        children.push(
          new Paragraph({
            spacing: { after: 40 },
            children: [new TextRun({ text: line.trim(), size: 20, font: FONT, color: TEXT_COLOR })],
          })
        );
      });
    });

    // Paragraphs
    job.executiveSummary.paragraphs?.forEach((p) => {
      children.push(...bulletParagraph(p, 21));
    });

    // Scenarios
    if (job.executiveSummary.scenarios?.length) {
      children.push(
        new Paragraph({
          spacing: { before: 300, after: 120 },
          children: [new TextRun({ text: 'Scenario Outlook', bold: true, size: 24, color: DARK_BLUE, font: FONT })],
        })
      );
      const scenHeaders = ['Scenario', 'Market Size', 'Description'];
      const scenRows = job.executiveSummary.scenarios.map((s) => [`${s.name} Case`, s.marketSize, s.description]);
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
    section.bodyParagraphs?.forEach((para) => {
      children.push(...bulletParagraph(para));
    });

    // Key table
    if (section.keyTable?.headers?.length && section.keyTable?.rows?.length) {
      const tblResult = buildTable(section.keyTable);
      if (tblResult) children.push(...tblResult);
    }

    // Multiple tables
    section.tables?.forEach((tbl) => {
      if (tbl.headers?.length && tbl.rows?.length) {
        // Page break before each multi-table to try to keep on one page
        children.push(new Paragraph({ children: [new PageBreak()] }));
        const tblResult = buildTable(tbl);
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
        const swotRows = items.map((item) => [item.title, item.description, (item.impact || '').toUpperCase()]);
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
      const porterRows = forces.map((f) => {
        const force = section.portersData![f.key];
        if (!force) return [f.label, '', '', ''];
        return [f.label, (force.rating || '').toUpperCase(), (force.factors || []).join('; '), force.description || ''];
      }).filter((r) => r[1]);
      if (porterRows.length) {
        const tblResult = buildTable({ title: '', headers: porterHeaders, rows: porterRows });
        if (tblResult) children.push(...tblResult);
      }
    }

    // Macro TEI Data
    if (section.macroTeiData?.items?.length) {
      const teiHeaders = ['Macroeconomic Trigger', 'Impact Level', 'Description', 'Examples', 'Market Size Impact'];
      const teiRows = section.macroTeiData.items.map((item) => [
        item.trigger, (item.impactLevel || '').toUpperCase(), item.description, item.examples, item.marketSizeImpact,
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
      const bcgRows = section.bcgMatrixData.map((item) => [
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
          children: [new TextRun({ text: 'Competitor Profiles', bold: true, size: 26, color: ACCENT_BLUE, font: FONT })],
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

        fields.filter((f) => f.value).forEach((f) => {
          children.push(
            new Paragraph({
              spacing: { after: 40 },
              children: [
                new TextRun({ text: `${f.label}: `, bold: true, size: 18, font: FONT, color: '6B8FA5' }),
                new TextRun({ text: f.value!, size: 18, font: FONT, color: TEXT_COLOR }),
              ],
            })
          );
        });
      });
    }

    // Subsections — each starts on new page
    section.subsections?.forEach((sub) => {
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

      sub.tables?.forEach((tbl) => {
        if (tbl.headers?.length && tbl.rows?.length) {
          const tblResult = buildTable(tbl);
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
      const maxLines = Math.max(...row.map((cell) => {
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

      tickers.forEach((t, i) => {
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
      job.executiveSummary.kpis.forEach((kpi) => {
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
    if (job.executiveSummary.topTrends?.length) insights.push({ label: 'Top Market Trends', text: job.executiveSummary.topTrends.map((t, i) => `${i + 1}. ${t}`).join('\n') });
    if (job.executiveSummary.recentMaJvInsights) insights.push({ label: 'Recent M&A, JVs & New Entrants', text: job.executiveSummary.recentMaJvInsights });

    insights.forEach((ins) => {
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
    job.executiveSummary.paragraphs?.forEach((p) => {
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
        rows: job.executiveSummary.scenarios.map((s) => [`${s.name} Case`, s.marketSize, s.description]),
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
    section.bodyParagraphs?.forEach((para) => {
      renderBulletText(para);
    });

    // Key table
    if (section.keyTable?.headers?.length && section.keyTable?.rows?.length) {
      y += 2;
      renderTable(section.keyTable);
    }

    // Multiple tables — each on new page
    section.tables?.forEach((tbl) => {
      if (tbl.headers?.length && tbl.rows?.length) {
        addPageBreak();
        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, pageW, pageH, 'F');
        renderTable(tbl);
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
          rows: items.map((item) => [item.title, item.description, (item.impact || '').toUpperCase()]),
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
      const rows = forces.map((f) => {
        const force = section.portersData![f.key];
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
        rows: section.macroTeiData.items.map((item) => [
          item.trigger, (item.impactLevel || '').toUpperCase(), item.description, item.examples, item.marketSizeImpact,
        ]),
      });
    }

    // BCG Matrix table
    if (section.bcgMatrixData?.length) {
      const quadrantLabels: Record<string, string> = { star: 'Star', cash_cow: 'Cash Cow', question_mark: 'Question Mark', dog: 'Dog' };
      renderTable({
        title: 'BCG Matrix — Market Size vs Growth',
        headers: ['Company', 'Market Size', 'Growth (%)', 'Quadrant'],
        rows: section.bcgMatrixData.map((item) => [item.name, String(item.marketSize), String(item.growth), quadrantLabels[item.quadrant] || item.quadrant]),
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
      doc.text('Competitor Profiles', margin, y + 4);
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
        ].filter((f) => f.value);

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

        fields.forEach((f) => {
          doc.setFontSize(7.5);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(107, 143, 165);
          doc.text(`${f.label}: `, margin + 2, y);
          const lw = doc.getTextWidth(`${f.label}: `);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(50, 50, 50);
          const valLines = doc.splitTextToSize(f.value!, contentW - lw - 4);
          doc.text(valLines, margin + 2 + lw, y);
          y += valLines.length * 3.5 + 1.5;
        });
        y += 4;
      });
    }

    // Subsections — each on new page
    section.subsections?.forEach((sub) => {
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

      sub.tables?.forEach((tbl) => {
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
  const title = jobTitle(job);
  let slides = '';

  function makeTable(tbl: ReportTable): string {
    if (!tbl.headers?.length || !tbl.rows?.length) return '';
    const colCount = tbl.headers.length;
    const fontSize = colCount <= 4 ? 9 : colCount <= 6 ? 7.5 : 6.5;
    const thRow = tbl.headers.map((h) => `<th style="background:#0c3649;color:#E8EDF5;padding:5px 6px;font-size:${fontSize}pt;text-align:left;">${esc(h)}</th>`).join('');
    const tRows = tbl.rows.slice(0, 12).map((row, ri) =>
      `<tr style="background:${ri % 2 === 0 ? '#f0f5fa' : '#fff'};">${row.map((c) => `<td style="padding:4px 6px;font-size:${fontSize}pt;color:#333;">${esc(String(c || ''))}</td>`).join('')}</tr>`
    ).join('');
    const titleHtml = tbl.title ? `<p style="font-size:10pt;font-weight:bold;color:#3491E8;margin:10px 0 4px;">${esc(tbl.title)}</p>` : '';
    return `${titleHtml}<table style="width:100%;border-collapse:collapse;border:1px solid #ddd;margin:6px 0;"><tr>${thRow}</tr>${tRows}</table>`;
  }

  // Cover
  slides += `<div style="page-break-after:always;background:#0c3649;color:#E8EDF5;padding:80px 60px;text-align:center;min-height:700px;">
    <div style="border-top:3px solid #3491E8;padding-top:40px;margin-top:160px;">
    <h1 style="font-size:32pt;margin:20px 0;">${esc(title)}</h1>
    <p style="font-size:16pt;color:#7EAABF;">Industry Intelligence Report</p>
    <p style="font-size:12pt;color:#5A8A9F;">${esc([job.scope?.geography, job.scope?.timeHorizon].filter(Boolean).join(' | '))}</p>
    <p style="font-size:10pt;color:#888;margin-top:30px;">Generated: ${job.completedAt ? new Date(job.completedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : new Date().toLocaleDateString()}</p>
    </div>
  </div>`;

  // Executive Summary
  if (job.executiveSummary) {
    let tickerHtml = '';
    const tickers = job.executiveSummary.tickerBoxes;
    if (tickers?.length) {
      tickerHtml = `<table style="width:100%;margin:12px 0;"><tr>${tickers.map((t) =>
        `<td style="text-align:center;padding:10px;background:#0A2538;border-radius:4px;">
          <div style="font-size:7pt;color:#7EAABF;font-weight:bold;text-transform:uppercase;">${esc(t.label)}</div>
          <div style="font-size:16pt;color:#E8EDF5;font-weight:bold;margin:4px 0;">${esc(t.value)}</div>
          ${t.secondaryValue ? `<div style="font-size:8pt;color:#6B8FA5;">${esc(t.secondaryValue)}</div>` : ''}
        </td>`
      ).join('')}</tr></table>`;
    } else if (job.executiveSummary.kpis?.length) {
      tickerHtml = `<table style="width:100%;margin:12px 0;"><tr>${job.executiveSummary.kpis.map((k) =>
        `<td style="text-align:center;padding:10px;"><b style="color:#059669;font-size:16pt;">${esc(k.value)}</b><br/><span style="color:#5A8A9F;font-size:8pt;">${esc(k.label)}</span></td>`
      ).join('')}</tr></table>`;
    }

    const paras = (job.executiveSummary.paragraphs || []).map((p) => `<p style="font-size:9pt;color:#333;">${esc(stripBullets(p))}</p>`).join('');

    slides += `<div style="page-break-after:always;padding:36px 50px;min-height:700px;">
      <h2 style="color:#1a3a5c;font-size:22pt;border-bottom:3px solid #3491E8;padding-bottom:8px;">Executive Summary</h2>
      ${job.executiveSummary.headline ? `<p style="font-size:11pt;color:#2a6090;font-style:italic;margin:10px 0;">${esc(job.executiveSummary.headline)}</p>` : ''}
      ${tickerHtml}
      ${paras}
    </div>`;

    // Scenarios slide
    if (job.executiveSummary.scenarios?.length) {
      slides += `<div style="page-break-after:always;padding:36px 50px;min-height:700px;">
        <h2 style="color:#1a3a5c;font-size:20pt;border-bottom:3px solid #3491E8;padding-bottom:6px;">Scenario Outlook</h2>
        ${makeTable({ title: '', headers: ['Scenario', 'Market Size', 'Description'], rows: job.executiveSummary.scenarios.map((s) => [`${s.name} Case`, s.marketSize, s.description]) })}
      </div>`;
    }
  }

  // Section slides
  const exportSectionsPptx = filterSections(job.sections, opts?.sectionFilter);
  exportSectionsPptx.forEach((section, idx) => {
    const bodyHtml = (section.bodyParagraphs || []).map((p) => `<p style="font-size:9pt;color:#333;">${esc(stripBullets(p))}</p>`).join('');

    // Main section slide
    slides += `<div style="page-break-after:always;padding:36px 50px;min-height:700px;">
      <h2 style="color:#1a3a5c;font-size:20pt;border-bottom:3px solid #3491E8;padding-bottom:6px;">${idx + 1}. ${esc(section.title)}</h2>
      ${bodyHtml}
      ${section.keyTable ? makeTable(section.keyTable) : ''}
    </div>`;

    // Extra tables — one slide each
    section.tables?.forEach((tbl) => {
      if (tbl.headers?.length && tbl.rows?.length) {
        slides += `<div style="page-break-after:always;padding:36px 50px;min-height:700px;">
          <h3 style="color:#2a6090;font-size:16pt;">${idx + 1}. ${esc(section.title)}</h3>
          ${makeTable(tbl)}
        </div>`;
      }
    });

    // SWOT slide
    if (section.swotData) {
      const quadrants = ['strengths', 'weaknesses', 'opportunities', 'threats'] as const;
      const colors = { strengths: '#10B981', weaknesses: '#E63946', opportunities: '#3491E8', threats: '#F59E0B' };
      let swotHtml = '<table style="width:100%;"><tr>';
      quadrants.forEach((q) => {
        const items = section.swotData![q];
        if (!items?.length) return;
        swotHtml += `<td style="vertical-align:top;padding:8px;width:25%;">
          <div style="font-size:12pt;font-weight:bold;color:${colors[q]};margin-bottom:6px;">${q.charAt(0).toUpperCase() + q.slice(1)}</div>
          ${items.map((item) => `<p style="font-size:8pt;color:#333;margin:3px 0;"><b>${esc(item.title)}</b>: ${esc(item.description)}</p>`).join('')}
        </td>`;
      });
      swotHtml += '</tr></table>';
      slides += `<div style="page-break-after:always;padding:36px 50px;min-height:700px;">
        <h2 style="color:#1a3a5c;font-size:20pt;border-bottom:3px solid #3491E8;padding-bottom:6px;">SWOT Analysis</h2>
        ${swotHtml}
      </div>`;
    }

    // Porter's slide
    if (section.portersData) {
      const forces = [
        { key: 'competitiveRivalry' as const, label: 'Competitive Rivalry' },
        { key: 'supplierPower' as const, label: 'Supplier Power' },
        { key: 'buyerPower' as const, label: 'Buyer Power' },
        { key: 'threatOfSubstitution' as const, label: 'Threat of Substitution' },
        { key: 'threatOfNewEntry' as const, label: 'Threat of New Entry' },
      ];
      const rows = forces.map((f) => {
        const force = section.portersData![f.key];
        if (!force) return null;
        return [f.label, (force.rating || '').toUpperCase(), (force.factors || []).join('; '), force.description || ''];
      }).filter(Boolean) as string[][];
      slides += `<div style="page-break-after:always;padding:36px 50px;min-height:700px;">
        <h2 style="color:#1a3a5c;font-size:20pt;border-bottom:3px solid #3491E8;padding-bottom:6px;">Porter's Five Forces</h2>
        ${makeTable({ title: '', headers: ['Force', 'Rating', 'Key Factors', 'Description'], rows })}
      </div>`;
    }

    // Macro TEI slide
    if (section.macroTeiData?.items?.length) {
      slides += `<div style="page-break-after:always;padding:36px 50px;min-height:700px;">
        <h2 style="color:#1a3a5c;font-size:20pt;border-bottom:3px solid #3491E8;padding-bottom:6px;">Macroeconomic Impact</h2>
        ${makeTable({ title: '', headers: ['Trigger', 'Impact', 'Description', 'Examples', 'Market Impact'], rows: section.macroTeiData.items.map((item) => [item.trigger, (item.impactLevel || '').toUpperCase(), item.description, item.examples, item.marketSizeImpact]) })}
      </div>`;
    }

    // Competitor profiles slide(s)
    if (section.competitorProfiles?.length) {
      // 3 profiles per slide
      for (let i = 0; i < section.competitorProfiles.length; i += 3) {
        const batch = section.competitorProfiles.slice(i, i + 3);
        const profilesHtml = batch.map((p) => {
          const fields = [
            { l: 'HQ', v: p.hqLocation }, { l: 'Products', v: p.keyProducts },
            { l: 'Revenue', v: p.overallRevenue }, { l: 'Market Share', v: p.marketShare },
            { l: 'News', v: p.recentNews },
          ].filter((f) => f.v);
          return `<div style="margin-bottom:12px;padding:8px;border:1px solid #ddd;border-radius:4px;">
            <div style="font-size:11pt;font-weight:bold;color:#1a3a5c;border-bottom:1px solid #3491E8;padding-bottom:4px;margin-bottom:4px;">${esc(p.name)}</div>
            ${fields.map((f) => `<span style="font-size:7.5pt;color:#6B8FA5;font-weight:bold;">${esc(f.l)}: </span><span style="font-size:7.5pt;color:#333;">${esc(f.v!)}</span><br/>`).join('')}
          </div>`;
        }).join('');
        slides += `<div style="page-break-after:always;padding:36px 50px;min-height:700px;">
          <h3 style="color:#2a6090;font-size:14pt;">Competitor Profiles (${i + 1}-${Math.min(i + 3, section.competitorProfiles.length)})</h3>
          ${profilesHtml}
        </div>`;
      }
    }

    // Subsection slides
    (section.subsections || []).forEach((sub) => {
      let subTableHtml = '';
      if (sub.keyTable?.headers?.length && sub.keyTable?.rows?.length) {
        subTableHtml = makeTable(sub.keyTable);
      }
      (sub.tables || []).forEach((tbl) => {
        if (tbl.headers?.length && tbl.rows?.length) subTableHtml += makeTable(tbl);
      });
      slides += `<div style="page-break-after:always;padding:36px 50px;min-height:700px;">
        <h3 style="color:#2a6090;font-size:14pt;border-bottom:2px solid #22D3EE;padding-bottom:4px;">${esc(sub.title)}</h3>
        <p style="font-size:9pt;color:#333;">${esc(stripBullets(sub.content || ''))}</p>
        ${subTableHtml}
      </div>`;
    });
  });

  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:p="urn:schemas-microsoft-com:office:powerpoint">
<head><meta charset="utf-8"/><title>${esc(title)}</title>
<style>body{font-family:Calibri,Arial,sans-serif;margin:0;}table{border-collapse:collapse;}th,td{border:1px solid #ddd;}</style>
</head><body>${slides}</body></html>`;

  const blob = new Blob([html], { type: 'application/vnd.ms-powerpoint' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.replace(/[^a-zA-Z0-9 ]/g, '')}_Report.ppt`;
  a.click();
  URL.revokeObjectURL(url);
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
