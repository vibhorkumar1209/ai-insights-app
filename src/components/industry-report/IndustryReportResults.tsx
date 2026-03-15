'use client';

import { IndustryReportJob } from '@/lib/types';
import ExecutiveSummaryCard from './ExecutiveSummaryCard';
import ReportSectionCard from './ReportSectionCard';

interface IndustryReportResultsProps {
  job: IndustryReportJob;
  onNewAnalysis: () => void;
}

export default function IndustryReportResults({ job, onNewAnalysis }: IndustryReportResultsProps) {
  const scope = job.scope;
  const totalCitations = job.sections?.reduce((sum, s) => sum + (s.citations?.length || 0), 0) || 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#E8EDF5', margin: 0, lineHeight: 1.3 }}>
            {scope?.industry || job.query || 'Industry Report'}
          </h1>
          <div style={{ fontSize: 13, color: '#7eaabf', marginTop: 4, display: 'flex', gap: 10, alignItems: 'center' }}>
            {scope?.geography && <span>{scope.geography}</span>}
            {scope?.timeHorizon && (
              <>
                <span style={{ color: '#1e4a68' }}>|</span>
                <span>{scope.timeHorizon}</span>
              </>
            )}
            <span style={{ color: '#1e4a68' }}>|</span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: '#059669',
                background: 'rgba(5,150,105,0.12)',
                padding: '2px 8px',
                borderRadius: 4,
                textTransform: 'uppercase',
                letterSpacing: 0.8,
              }}
            >
              Complete
            </span>
          </div>
        </div>

        <button
          onClick={onNewAnalysis}
          style={{
            padding: '8px 18px',
            fontSize: 13,
            fontWeight: 600,
            color: '#059669',
            background: 'rgba(5,150,105,0.1)',
            border: '1px solid rgba(5,150,105,0.3)',
            borderRadius: 8,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          New Analysis
        </button>
      </div>

      {/* Executive Summary */}
      {job.executiveSummary && <ExecutiveSummaryCard summary={job.executiveSummary} />}

      {/* Report Sections */}
      {job.sections?.map((section, i) => (
        <ReportSectionCard
          key={section.id || i}
          section={section}
          index={i}
          defaultExpanded={section.id === 'market_size' || i === 0}
        />
      ))}

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 0',
          borderTop: '1px solid rgba(30,74,104,0.3)',
          fontSize: 11,
          color: '#4a7a96',
        }}
      >
        <span>
          {totalCitations > 0 ? `${totalCitations} sources cited` : ''} · {job.sections?.length || 0} sections
        </span>
        <span>
          Generated {job.completedAt ? new Date(job.completedAt).toLocaleDateString() : ''}
        </span>
      </div>
    </div>
  );
}
