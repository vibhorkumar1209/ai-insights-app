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
        background: expanded
          ? 'linear-gradient(160deg, rgba(14,50,75,0.7), rgba(11,34,54,0.9))'
          : 'linear-gradient(160deg, rgba(14,50,75,0.5), rgba(11,34,54,0.7))',
        border: expanded ? '1px solid rgba(52,145,232,0.2)' : '1px solid rgba(30,74,104,0.4)',
        borderRadius: 14,
        overflow: 'hidden',
        transition: 'all 0.3s ease',
      }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '16px 20px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        {/* Section number */}
        <span
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: expanded ? 'rgba(52,145,232,0.15)' : 'rgba(5,150,105,0.12)',
            color: expanded ? '#3491E8' : '#059669',
            fontSize: 13,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'all 0.2s',
          }}
        >
          {index + 1}
        </span>

        <span style={{
          flex: 1,
          fontSize: 15,
          fontWeight: 600,
          color: '#E8EDF5',
          letterSpacing: 0.2,
        }}>
          {section.title}
        </span>

        {/* Chevron */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          style={{
            transition: 'transform 0.25s ease',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            flexShrink: 0,
          }}
        >
          <path d="M6 9L12 15L18 9" stroke={expanded ? '#3491E8' : '#6B8FA5'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Body */}
      {expanded && (
        <div style={{ padding: '4px 22px 24px' }}>
          {/* Divider after header */}
          <div style={{ height: 1, background: 'rgba(30,74,104,0.3)', marginBottom: 20 }} />

          {/* Body paragraphs */}
          {section.bodyParagraphs?.map((para, i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <BulletText text={para} color="#B8CCDA" boldColor="#E8EDF5" fontSize={13} bulletColor="#3491E8" />
            </div>
          ))}

          {/* Key table */}
          {section.keyTable && (
            <div style={{ marginTop: 8 }}>
              <ReportTableView table={section.keyTable} />
            </div>
          )}

          {/* Chart */}
          {section.chartSpec && <ReportChart chartSpec={section.chartSpec} />}

          {/* Subsections */}
          {section.subsections?.map((sub, si) => (
            <div
              key={si}
              style={{
                marginTop: 24,
                paddingLeft: 16,
                borderLeft: '3px solid rgba(52,145,232,0.25)',
                position: 'relative',
              }}
            >
              {/* Subsection dot */}
              <div style={{
                position: 'absolute',
                left: -5,
                top: 6,
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: '#3491E8',
              }} />
              <div style={{
                fontSize: 14,
                fontWeight: 600,
                color: '#22D3EE',
                marginBottom: 10,
                lineHeight: 1.4,
              }}>
                {sub.title}
              </div>
              <BulletText text={sub.content} color="#B8CCDA" boldColor="#E8EDF5" fontSize={13} bulletColor="#3491E8" />
              {sub.keyTable && <ReportTableView table={sub.keyTable} accent="#22D3EE" />}
              {sub.chartSpec && <ReportChart chartSpec={sub.chartSpec} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
