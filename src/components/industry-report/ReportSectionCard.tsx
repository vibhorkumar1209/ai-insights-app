'use client';

import { useState } from 'react';
import { ReportSection } from '@/lib/types';
import BulletText from '@/components/shared/BulletText';
import ReportTableView from './ReportTableView';
import ReportChart from './ReportChart';

interface ReportSectionCardProps {
  section: ReportSection;
  index: number;
  defaultExpanded?: boolean;
}

export default function ReportSectionCard({ section, index, defaultExpanded = false }: ReportSectionCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div
      style={{
        background: 'linear-gradient(160deg, #0e324b, #0b2236)',
        border: '1px solid #1e4a68',
        borderRadius: 12,
        overflow: 'hidden',
        transition: 'border-color 0.2s',
      }}
    >
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px 18px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        {/* Section number badge */}
        <span
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'rgba(5,150,105,0.15)',
            color: '#059669',
            fontSize: 13,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {index + 1}
        </span>

        <span style={{ flex: 1, fontSize: 15, fontWeight: 600, color: '#E8EDF5', letterSpacing: 0.2 }}>
          {section.title}
        </span>

        {/* Chevron */}
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          style={{
            transition: 'transform 0.2s',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            flexShrink: 0,
          }}
        >
          <path d="M6 9L12 15L18 9" stroke="#7eaabf" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Body — collapsible */}
      {expanded && (
        <div style={{ padding: '0 18px 18px' }}>
          {/* Body paragraphs */}
          {section.bodyParagraphs?.map((para, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <BulletText text={para} color="#C4D4DE" boldColor="#E8EDF5" fontSize={13} bulletColor="#059669" />
            </div>
          ))}

          {/* Key table */}
          {section.keyTable && <ReportTableView table={section.keyTable} />}

          {/* Chart */}
          {section.chartSpec && <ReportChart chartSpec={section.chartSpec} />}

          {/* Subsections */}
          {section.subsections?.map((sub, si) => (
            <div key={si} style={{ marginTop: 18, paddingLeft: 12, borderLeft: '2px solid rgba(5,150,105,0.25)' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#22D3EE', marginBottom: 8 }}>
                {sub.title}
              </div>
              <BulletText text={sub.content} color="#C4D4DE" boldColor="#E8EDF5" fontSize={12} bulletColor="#059669" />
              {sub.keyTable && <ReportTableView table={sub.keyTable} accent="#22D3EE" />}
              {sub.chartSpec && <ReportChart chartSpec={sub.chartSpec} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
