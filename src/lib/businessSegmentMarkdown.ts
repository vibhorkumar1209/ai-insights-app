import type { BusinessSegmentResult, Battlecard } from '@ai-insights/types';

// Cell text must not break the table row.
const cell = (v: string) => (v || '').replace(/\|/g, '/').replace(/\s*\n\s*/g, ' ').trim();

export function linkedinSearchUrl(name: string, company: string): string {
  return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(`${name} ${company}`)}`;
}

export function battlecardToMarkdown(b: Battlecard): string {
  const lines = [`### Competitive Sales Battlecard: ${b.inputs.segmentName}`, `${b.inputs.yourCompany} vs ${b.inputs.competitorName}`, ''];
  if (b.segmentContext) lines.push('**Target Segment Context**', b.segmentContext, '');
  if (b.coreWinTheme) lines.push('**Core Win Theme**', b.coreWinTheme, '');
  if (b.opportunityAreas?.length) lines.push('**Opportunity Area**', ...b.opportunityAreas.map((o) => `- ${o}`), '');
  if (b.comparison?.length) {
    lines.push('**Positioning & Differentiation vs. Competition**', '',
      `| Dimension | ${cell(b.inputs.yourCompany)} | ${cell(b.inputs.competitorName)} |`, '| --- | --- | --- |',
      ...b.comparison.map((r) => `| ${cell(r.dimension)} | ${cell(r.yourSolution)} | ${cell(r.competitor)} |`), '');
  }
  return lines.join('\n');
}

export function dossierToMarkdown(job: BusinessSegmentResult): string {
  const segs = job.segments || [];
  const out: string[] = [`# ${job.companyName}: Business Segments`, '', '## 1. Executive Summary', '',
    '| Segment / Subsidiary | Core Focus | Contribution | Webpage | LinkedIn |', '| --- | --- | --- | --- | --- |',
    ...segs.map((s) => `| ${cell(s.name)} | ${cell(s.coreFocus)} | ${cell(s.contribution)} | ${s.webpageUrl}${s.webpageRollsUp ? ' (parent)' : ''} | ${s.linkedinUrl || 'n/a'}${s.linkedinRollsUp && s.linkedinUrl ? ' (parent)' : ''} |`),
    '', '## 2. Segment Breakdown', ''];
  for (const s of segs) {
    out.push(`### ${s.name}`, `- **Overview:** ${s.overview}`, `- **Financial Baseline:** ${s.financialBaseline}`, '- **Key Products/Services:**',
      ...s.keyProducts.map((p) => `  - ${p}`), '');
  }
  out.push('## 3. Key Decision Makers', '');
  for (const s of segs) {
    out.push(`### ${s.name}`);
    if (!s.leaders.length) out.push('Not publicly identified.');
    for (const l of s.leaders) {
      out.push(`- **${l.name}, ${l.title}**${l.linkedinUrl ? ` (${l.linkedinUrl})` : ''}`, `  ${l.profile}`);
    }
    out.push('');
  }
  for (const b of job.battlecards || []) if (b.status === 'complete') out.push('', battlecardToMarkdown(b));
  return out.join('\n');
}
