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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: 16,
        paddingBottom: 16,
        borderBottom: '1px solid rgba(30,74,104,0.3)',
      }}>
        <div>
          <h1 style={{
            fontSize: 24,
            fontWeight: 700,
            color: '#1B2A3D',
            margin: 0,
            lineHeight: 1.3,
            letterSpacing: -0.3,
          }}>
            {scope?.industry || job.query || 'Industry Report'}
          </h1>
          <div style={{
            fontSize: 13,
            color: '#5A6E7A',
            marginTop: 6,
            display: 'flex',
            gap: 12,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}>
            {scope?.geography && <span>{scope.geography}</span>}
            {scope?.timeHorizon && (
              <>
                <span style={{ color: '#CCDFEA' }}>|</span>
                <span>{scope.timeHorizon}</span>
              </>
            )}
            <span style={{ color: '#CCDFEA' }}>|</span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: '#10B981',
                background: 'rgba(16,185,129,0.1)',
                padding: '3px 10px',
                borderRadius: 5,
                textTransform: 'uppercase',
                letterSpacing: 1,
                border: '1px solid rgba(16,185,129,0.2)',
              }}
            >
              Complete
            </span>
          </div>
        </div>

        <button
          onClick={onNewAnalysis}
          style={{
            padding: '10px 20px',
            fontSize: 13,
            fontWeight: 600,
            color: '#3491E8',
            background: 'rgba(52,145,232,0.08)',
            border: '1px solid rgba(52,145,232,0.25)',
            borderRadius: 10,
            cursor: 'pointer',
            transition: 'all 0.2s',
            letterSpacing: 0.2,
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
          defaultExpanded={section.id === 'market_overview' || i === 0}
        />
      ))}

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '14px 0',
          borderTop: '1px solid rgba(30,74,104,0.25)',
          fontSize: 11,
          color: '#4a6e82',
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
