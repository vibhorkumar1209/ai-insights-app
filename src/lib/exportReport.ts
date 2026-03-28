'use client';

import {
  IndustryReportJob,
  ReportSection,
} from './types';
import type { HistoryEntry } from './history';

// ── Types ────────────────────────────────────────────────────────────────────

export interface ExportOptions {
  /** For industry reports: IDs of sections to include. If empty/undefined, include all. */
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

  // Convert non-industry entries to a generic job with synthetic sections
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
    ShadingType,
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  } = await import('docx');
  const { saveAs } = await import('file-saver');

  const title = jobTitle(job);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const children: any[] = [];

  // Cover page
  children.push(
    new Paragraph({ spacing: { before: 3000 }, children: [] }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ text: title, bold: true, size: 56, color: '1a3a5c', font: 'Calibri' })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [new TextRun({ text: 'Industry Intelligence Report', size: 28, color: '5a8a9f', font: 'Calibri' })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({ text: [job.scope?.geography, job.scope?.timeHorizon].filter(Boolean).join(' | '), size: 22, color: '7eaabf', font: 'Calibri' }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: `Generated: ${job.completedAt ? new Date(job.completedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : new Date().toLocaleDateString()}`, size: 20, color: '999999', font: 'Calibri' })],
    }),
  );

  // Helper: build table from section keyTable
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function buildTable(headers: string[], rows: string[][]): any {
    const headerCells = headers.map(
      (h) =>
        new TableCell({
          shading: { fill: '0c3649', type: ShadingType.CLEAR, color: 'auto' },
          width: { size: Math.floor(9000 / headers.length), type: WidthType.DXA },
          children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 18, color: 'E8EDF5', font: 'Calibri' })] })],
        })
    );
    const dataRows = rows.map(
      (row) =>
        new TableRow({
          children: row.map(
            (cell) =>
              new TableCell({
                width: { size: Math.floor(9000 / headers.length), type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun({ text: cell || '', size: 18, font: 'Calibri' })] })],
              })
          ),
        })
    );
    return new Table({
      rows: [new TableRow({ children: headerCells, tableHeader: true }), ...dataRows],
      width: { size: 9000, type: WidthType.DXA },
    });
  }

  // Helper: add section content
  function addSection(section: ReportSection, sectionNum: number) {
    // Page break before each section
    children.push(new Paragraph({ children: [new PageBreak()] }));

    // Section heading
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 200, after: 200 },
        children: [new TextRun({ text: `${sectionNum}. ${section.title}`, bold: true, size: 32, color: '1a3a5c', font: 'Calibri' })],
      })
    );

    // Body paragraphs
    section.bodyParagraphs?.forEach((para) => {
      children.push(
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: stripBullets(para), size: 22, font: 'Calibri' })],
        })
      );
    });

    // Key table
    if (section.keyTable?.headers?.length && section.keyTable?.rows?.length) {
      children.push(new Paragraph({ spacing: { before: 200, after: 100 }, children: [] }));
      children.push(buildTable(section.keyTable.headers, section.keyTable.rows));
    }

    // SWOT Data
    if (section.swotData) {
      const quadrants = ['strengths', 'weaknesses', 'opportunities', 'threats'] as const;
      for (const q of quadrants) {
        const items = section.swotData[q];
        if (!items?.length) continue;
        children.push(
          new Paragraph({
            spacing: { before: 200, after: 80 },
            children: [new TextRun({ text: q.charAt(0).toUpperCase() + q.slice(1), bold: true, size: 24, color: '1a3a5c', font: 'Calibri' })],
          })
        );
        items.forEach((item) => {
          children.push(
            new Paragraph({
              spacing: { after: 60 },
              children: [
                new TextRun({ text: `${item.title}: `, bold: true, size: 20, font: 'Calibri' }),
                new TextRun({ text: item.description, size: 20, font: 'Calibri' }),
              ],
            })
          );
        });
      }
    }

    // Porter's Data
    if (section.portersData) {
      const forces = [
        ['competitiveRivalry', 'Competitive Rivalry'],
        ['supplierPower', 'Supplier Power'],
        ['buyerPower', 'Buyer Power'],
        ['threatOfSubstitution', 'Threat of Substitution'],
        ['threatOfNewEntry', 'Threat of New Entry'],
      ] as const;
      for (const [key, label] of forces) {
        const force = section.portersData[key];
        if (!force) continue;
        children.push(
          new Paragraph({
            spacing: { before: 160, after: 80 },
            children: [
              new TextRun({ text: `${label} — `, bold: true, size: 22, font: 'Calibri' }),
              new TextRun({ text: (force.rating || '').toUpperCase(), bold: true, size: 22, color: force.rating === 'high' ? 'E63946' : force.rating === 'medium' ? 'F59E0B' : '10B981', font: 'Calibri' }),
            ],
          })
        );
        children.push(
          new Paragraph({
            spacing: { after: 60 },
            children: [new TextRun({ text: force.description || '', size: 20, font: 'Calibri' })],
          })
        );
      }
    }

    // TEI Data
    if (section.teiData) {
      const teiSections = [
        ['benefits', 'Benefits'],
        ['costs', 'Costs'],
        ['risks', 'Risks'],
      ] as const;
      // Summary KPIs
      if (section.teiData.netPresentValue || section.teiData.roi || section.teiData.paybackPeriod) {
        children.push(
          new Paragraph({
            spacing: { before: 200, after: 100 },
            children: [
              new TextRun({ text: `NPV: ${section.teiData.netPresentValue || 'N/A'}  |  ROI: ${section.teiData.roi || 'N/A'}  |  Payback: ${section.teiData.paybackPeriod || 'N/A'}`, bold: true, size: 22, font: 'Calibri', color: '059669' }),
            ],
          })
        );
      }
      for (const [key, label] of teiSections) {
        const items = section.teiData[key];
        if (!items?.length) continue;
        const headers = ['Category', 'Year 1', 'Year 2', 'Year 3', 'Description'];
        const rows = items.map((item) => [item.category, item.year1, item.year2, item.year3, item.description || '']);
        children.push(
          new Paragraph({
            spacing: { before: 200, after: 80 },
            children: [new TextRun({ text: label, bold: true, size: 24, color: '1a3a5c', font: 'Calibri' })],
          })
        );
        children.push(buildTable(headers, rows));
      }
    }

    // Subsections
    section.subsections?.forEach((sub) => {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 240, after: 100 },
          children: [new TextRun({ text: sub.title, bold: true, size: 26, color: '2a6090', font: 'Calibri' })],
        })
      );
      children.push(
        new Paragraph({
          spacing: { after: 100 },
          children: [new TextRun({ text: stripBullets(sub.content || ''), size: 22, font: 'Calibri' })],
        })
      );
      if (sub.keyTable?.headers?.length && sub.keyTable?.rows?.length) {
        children.push(buildTable(sub.keyTable.headers, sub.keyTable.rows));
      }
    });
  }

  // Executive Summary
  if (job.executiveSummary) {
    children.push(new Paragraph({ children: [new PageBreak()] }));
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 200 },
        children: [new TextRun({ text: 'Executive Summary', bold: true, size: 32, color: '1a3a5c', font: 'Calibri' })],
      })
    );
    if (job.executiveSummary.headline) {
      children.push(
        new Paragraph({
          spacing: { after: 160 },
          children: [new TextRun({ text: job.executiveSummary.headline, bold: true, size: 24, italics: true, color: '2a6090', font: 'Calibri' })],
        })
      );
    }
    // KPIs
    job.executiveSummary.kpis?.forEach((kpi) => {
      children.push(
        new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({ text: `${kpi.label}: `, bold: true, size: 22, font: 'Calibri' }),
            new TextRun({ text: kpi.value, size: 22, color: '059669', font: 'Calibri' }),
          ],
        })
      );
    });
    // Paragraphs
    job.executiveSummary.paragraphs?.forEach((p) => {
      children.push(
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: stripBullets(p), size: 22, font: 'Calibri' })],
        })
      );
    });
  }

  // Sections
  const exportSections = filterSections(job.sections, opts?.sectionFilter);
  exportSections.forEach((sec, i) => addSection(sec, i + 1));

  const doc = new Document({
    creator: 'MarketIntel AI',
    title: `${title} - Industry Report`,
    sections: [{
      properties: {
        page: {
          margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
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
  const margin = 20;
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

  // Cover page
  doc.setFillColor(12, 54, 73);
  doc.rect(0, 0, pageW, pageH, 'F');
  doc.setTextColor(232, 237, 245);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  const titleLines = doc.splitTextToSize(title, contentW);
  doc.text(titleLines, pageW / 2, 90, { align: 'center' });
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(126, 170, 191);
  doc.text('Industry Intelligence Report', pageW / 2, 115, { align: 'center' });
  doc.setFontSize(11);
  doc.text([job.scope?.geography, job.scope?.timeHorizon].filter(Boolean).join(' | '), pageW / 2, 130, { align: 'center' });
  doc.setFontSize(10);
  doc.setTextColor(160, 160, 160);
  doc.text(
    `Generated: ${job.completedAt ? new Date(job.completedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : new Date().toLocaleDateString()}`,
    pageW / 2, 150, { align: 'center' }
  );

  // Helper: render table
  function renderTable(headers: string[], rows: string[][]) {
    const colW = contentW / headers.length;
    const rowH = 7;

    // Header
    checkPageBreak(rowH + 2);
    doc.setFillColor(12, 54, 73);
    doc.rect(margin, y, contentW, rowH, 'F');
    doc.setTextColor(232, 237, 245);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    headers.forEach((h, i) => {
      doc.text(h, margin + i * colW + 2, y + 5, { maxWidth: colW - 4 });
    });
    y += rowH;

    // Data rows
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 40, 40);
    rows.forEach((row, ri) => {
      checkPageBreak(rowH);
      if (ri % 2 === 0) {
        doc.setFillColor(240, 245, 250);
        doc.rect(margin, y, contentW, rowH, 'F');
      }
      row.forEach((cell, ci) => {
        doc.text(String(cell || '').substring(0, 50), margin + ci * colW + 2, y + 5, { maxWidth: colW - 4 });
      });
      y += rowH;
    });
    y += 4;
  }

  // Helper: add section
  function addSection(section: ReportSection, sectionNum: number) {
    addPageBreak();

    // White background for content pages
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageW, pageH, 'F');

    // Section heading
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(26, 58, 92);
    doc.text(`${sectionNum}. ${section.title}`, margin, y + 8);
    y += 16;

    // Accent line
    doc.setDrawColor(52, 145, 232);
    doc.setLineWidth(0.5);
    doc.line(margin, y, margin + 40, y);
    y += 8;

    // Body
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    section.bodyParagraphs?.forEach((para) => {
      const lines = doc.splitTextToSize(stripBullets(para), contentW);
      checkPageBreak(lines.length * 5 + 4);
      doc.text(lines, margin, y);
      y += lines.length * 5 + 4;
    });

    // Table
    if (section.keyTable?.headers?.length && section.keyTable?.rows?.length) {
      y += 4;
      renderTable(section.keyTable.headers, section.keyTable.rows);
    }

    // Subsections
    section.subsections?.forEach((sub) => {
      checkPageBreak(20);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(42, 96, 144);
      doc.text(sub.title, margin + 4, y + 6);
      y += 12;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50, 50, 50);
      const lines = doc.splitTextToSize(stripBullets(sub.content || ''), contentW - 8);
      checkPageBreak(lines.length * 5 + 4);
      doc.text(lines, margin + 4, y);
      y += lines.length * 5 + 4;

      if (sub.keyTable?.headers?.length && sub.keyTable?.rows?.length) {
        renderTable(sub.keyTable.headers, sub.keyTable.rows);
      }
    });
  }

  // Executive Summary
  if (job.executiveSummary) {
    addPageBreak();
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageW, pageH, 'F');

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(26, 58, 92);
    doc.text('Executive Summary', margin, y + 8);
    y += 16;

    if (job.executiveSummary.headline) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(42, 96, 144);
      const hl = doc.splitTextToSize(job.executiveSummary.headline, contentW);
      doc.text(hl, margin, y);
      y += hl.length * 5 + 6;
    }

    // KPIs
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    job.executiveSummary.kpis?.forEach((kpi) => {
      checkPageBreak(8);
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

    doc.setTextColor(50, 50, 50);
    doc.setFont('helvetica', 'normal');
    job.executiveSummary.paragraphs?.forEach((p) => {
      const lines = doc.splitTextToSize(stripBullets(p), contentW);
      checkPageBreak(lines.length * 5 + 4);
      doc.text(lines, margin, y);
      y += lines.length * 5 + 4;
    });
  }

  // Sections
  const exportSectionsPdf = filterSections(job.sections, opts?.sectionFilter);
  exportSectionsPdf.forEach((sec, i) => addSection(sec, i + 1));

  doc.save(`${title.replace(/[^a-zA-Z0-9 ]/g, '')}_Report.pdf`);
}

// ── PPTX Export (HTML-based, opens in PowerPoint) ────────────────────────────

export async function exportToPptx(job: IndustryReportJob, opts?: ExportOptions): Promise<void> {
  const title = jobTitle(job);

  // Build slide HTML — PowerPoint can import .pptx from HTML with mso- styles
  // Using a simpler approach: generate an HTML file with slide-like layout that PPT opens
  let slides = '';

  // Cover
  slides += `<div style="page-break-after:always;background:#0c3649;color:#E8EDF5;padding:120px 60px;text-align:center;min-height:700px;">
    <h1 style="font-size:36pt;margin-top:200px;">${esc(title)}</h1>
    <p style="font-size:16pt;color:#7EAABF;">Industry Intelligence Report</p>
    <p style="font-size:12pt;color:#5A8A9F;">${esc([job.scope?.geography, job.scope?.timeHorizon].filter(Boolean).join(' | '))}</p>
  </div>`;

  // Executive Summary
  if (job.executiveSummary) {
    const kpiHtml = (job.executiveSummary.kpis || []).map((k) =>
      `<td style="text-align:center;padding:10px;"><b style="color:#059669;font-size:18pt;">${esc(k.value)}</b><br/><span style="color:#5A8A9F;font-size:9pt;">${esc(k.label)}</span></td>`
    ).join('');
    const paras = (job.executiveSummary.paragraphs || []).map((p) => `<p style="font-size:10pt;color:#333;">${esc(stripBullets(p))}</p>`).join('');
    slides += `<div style="page-break-after:always;padding:40px 60px;min-height:700px;">
      <h2 style="color:#1a3a5c;font-size:22pt;border-bottom:2px solid #3491E8;padding-bottom:8px;">Executive Summary</h2>
      ${job.executiveSummary.headline ? `<p style="font-size:12pt;color:#2a6090;font-style:italic;">${esc(job.executiveSummary.headline)}</p>` : ''}
      ${kpiHtml ? `<table style="width:100%;margin:16px 0;"><tr>${kpiHtml}</tr></table>` : ''}
      ${paras}
    </div>`;
  }

  // Section slides
  const exportSectionsPptx = filterSections(job.sections, opts?.sectionFilter);
  exportSectionsPptx.forEach((section, idx) => {
    let tableHtml = '';
    if (section.keyTable?.headers?.length && section.keyTable?.rows?.length) {
      const thRow = section.keyTable.headers.map((h) => `<th style="background:#0c3649;color:#E8EDF5;padding:6px 8px;font-size:8pt;">${esc(h)}</th>`).join('');
      const tRows = section.keyTable.rows.slice(0, 10).map((row, ri) =>
        `<tr style="background:${ri % 2 === 0 ? '#f0f5fa' : '#fff'};">${row.map((c) => `<td style="padding:5px 8px;font-size:8pt;">${esc(String(c || ''))}</td>`).join('')}</tr>`
      ).join('');
      tableHtml = `<table style="width:100%;border-collapse:collapse;margin:12px 0;border:1px solid #ddd;"><tr>${thRow}</tr>${tRows}</table>`;
    }
    const bodyHtml = (section.bodyParagraphs || []).map((p) => `<p style="font-size:10pt;color:#333;">${esc(stripBullets(p))}</p>`).join('');
    const subsHtml = (section.subsections || []).map((sub) => {
      let subTable = '';
      if (sub.keyTable?.headers?.length && sub.keyTable?.rows?.length) {
        const sThRow = sub.keyTable.headers.map((h) => `<th style="background:#0c3649;color:#E8EDF5;padding:5px 6px;font-size:8pt;">${esc(h)}</th>`).join('');
        const sTRows = sub.keyTable.rows.slice(0, 8).map((row, ri) =>
          `<tr style="background:${ri % 2 === 0 ? '#f0f5fa' : '#fff'};">${row.map((c) => `<td style="padding:4px 6px;font-size:8pt;">${esc(String(c || ''))}</td>`).join('')}</tr>`
        ).join('');
        subTable = `<table style="width:100%;border-collapse:collapse;margin:8px 0;border:1px solid #ddd;"><tr>${sThRow}</tr>${sTRows}</table>`;
      }
      return `<h4 style="color:#2a6090;font-size:11pt;margin:12px 0 4px 12px;">${esc(sub.title)}</h4>
        <p style="font-size:9pt;color:#333;margin-left:12px;">${esc(stripBullets(sub.content || ''))}</p>${subTable}`;
    }).join('');

    slides += `<div style="page-break-after:always;padding:40px 60px;min-height:700px;">
      <h2 style="color:#1a3a5c;font-size:20pt;border-bottom:2px solid #3491E8;padding-bottom:6px;">${idx + 1}. ${esc(section.title)}</h2>
      ${bodyHtml}${tableHtml}${subsHtml}
    </div>`;
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
